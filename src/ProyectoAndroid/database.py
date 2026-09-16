"""Persistencia y autenticación local para la aplicación."""
import base64
import hashlib
import hmac
import secrets
import sqlite3
import time
from pathlib import Path


PASSWORD_MIN_LENGTH = 12
MAX_LOGIN_ATTEMPTS = 5
LOGIN_LOCK_SECONDS = 15 * 60
RESET_CODE_LIFETIME_SECONDS = 10 * 60
RESET_REQUEST_COOLDOWN_SECONDS = 60
MAX_RESET_ATTEMPTS = 5


def obtener_bd(app):
    return Path(app.paths.data) / "usuarios.db"


def _conexion(app):
    conexion = sqlite3.connect(obtener_bd(app))
    conexion.row_factory = sqlite3.Row
    return conexion


def _hash_password(password, salt=None):
    """Devuelve un hash scrypt autocontenido; nunca almacena la contraseña."""
    salt = salt or secrets.token_bytes(16)
    derived = hashlib.scrypt(
        password.encode("utf-8"), salt=salt, n=2**14, r=8, p=1, dklen=32
    )
    return "scrypt$16384$8$1${}${}".format(
        base64.b64encode(salt).decode("ascii"),
        base64.b64encode(derived).decode("ascii"),
    )


def _password_valida(password):
    if len(password) < PASSWORD_MIN_LENGTH:
        return False, f"La contraseña debe tener al menos {PASSWORD_MIN_LENGTH} caracteres."
    if not any(char.islower() for char in password) or not any(char.isupper() for char in password):
        return False, "La contraseña debe incluir mayúsculas y minúsculas."
    if not any(char.isdigit() for char in password):
        return False, "La contraseña debe incluir al menos un número."
    return True, ""


def crear_bd(app):
    with _conexion(app) as conexion:
        conexion.execute("""
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                correo TEXT UNIQUE NOT NULL COLLATE NOCASE,
                password_hash TEXT NOT NULL,
                codigo_recuperacion_hash TEXT,
                codigo_expiracion INTEGER,
                intentos_fallidos INTEGER NOT NULL DEFAULT 0,
                bloqueado_hasta INTEGER NOT NULL DEFAULT 0,
                intentos_recuperacion INTEGER NOT NULL DEFAULT 0,
                recuperacion_solicitada_en INTEGER NOT NULL DEFAULT 0
            )
        """)
        # Compatibilidad con la BD creada por la versión anterior de la app.
        columnas = {fila[1] for fila in conexion.execute("PRAGMA table_info(usuarios)")}
        migraciones = {
            "password_hash": "TEXT",
            "codigo_recuperacion_hash": "TEXT",
            "codigo_expiracion": "INTEGER",
            "intentos_fallidos": "INTEGER NOT NULL DEFAULT 0",
            "bloqueado_hasta": "INTEGER NOT NULL DEFAULT 0",
            "intentos_recuperacion": "INTEGER NOT NULL DEFAULT 0",
            "recuperacion_solicitada_en": "INTEGER NOT NULL DEFAULT 0",
        }
        for columna, definicion in migraciones.items():
            if columna not in columnas:
                conexion.execute(f"ALTER TABLE usuarios ADD COLUMN {columna} {definicion}")


def crear_usuario(app, nombre, correo, password):
    nombre, correo = nombre.strip(), correo.strip().lower()
    if not nombre or "@" not in correo or correo.startswith("@"):
        return False, "Introduce un nombre y correo válidos."
    valida, mensaje = _password_valida(password)
    if not valida:
        return False, mensaje
    try:
        with _conexion(app) as conexion:
            conexion.execute(
                "INSERT INTO usuarios (nombre, correo, password_hash) VALUES (?, ?, ?)",
                (nombre, correo, _hash_password(password)),
            )
    except sqlite3.IntegrityError:
        return False, "No fue posible crear la cuenta."
    return True, "Cuenta creada. Ya puedes iniciar sesión."


def autenticar(app, correo, password):
    ahora = int(time.time())
    with _conexion(app) as conexion:
        identificador = correo.strip()
        usuario = conexion.execute(
            "SELECT * FROM usuarios WHERE lower(correo) = lower(?) OR lower(nombre) = lower(?)",
            (identificador, identificador),
        ).fetchone()
        if usuario is None:
            # Mismo mensaje que una contraseña errónea: evita enumerar cuentas.
            return False, "Correo o contraseña incorrectos."
        if usuario["bloqueado_hasta"] > ahora:
            return False, "Demasiados intentos. Inténtalo más tarde."

        esperado = usuario["password_hash"]
        try:
            _, n, r, p, salt, digest = esperado.split("$")
            calculado = _hash_password(password, base64.b64decode(salt))
            correcto = hmac.compare_digest(calculado, esperado)
        except (AttributeError, ValueError, TypeError):
            correcto = False

        if correcto:
            conexion.execute(
                "UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = 0 WHERE id = ?",
                (usuario["id"],),
            )
            return True, "Inicio de sesión correcto."

        intentos = usuario["intentos_fallidos"] + 1
        bloqueo = ahora + LOGIN_LOCK_SECONDS if intentos >= MAX_LOGIN_ATTEMPTS else 0
        conexion.execute(
            "UPDATE usuarios SET intentos_fallidos = ?, bloqueado_hasta = ? WHERE id = ?",
            (0 if bloqueo else intentos, bloqueo, usuario["id"]),
        )
    return False, "Correo o contraseña incorrectos."


def obtener_nombre(app, correo):
    """Devuelve el nombre del usuario para la pantalla de bienvenida."""
    with _conexion(app) as conexion:
        fila = conexion.execute(
            "SELECT nombre FROM usuarios WHERE correo = ?", (correo.strip().lower(),)
        ).fetchone()
        return fila["nombre"] if fila else None


def preparar_recuperacion(app, correo):
    """Genera un código de un único uso. El llamador debe enviarlo por un canal seguro."""
    ahora = int(time.time())
    correo = correo.strip().lower()
    with _conexion(app) as conexion:
        usuario = conexion.execute("SELECT * FROM usuarios WHERE correo = ?", (correo,)).fetchone()
        if usuario is None:
            return False, None, "Si el correo existe, recibirás un código."
        if ahora - usuario["recuperacion_solicitada_en"] < RESET_REQUEST_COOLDOWN_SECONDS:
            return False, None, "Espera un minuto antes de solicitar otro código."
        codigo = f"{secrets.randbelow(1_000_000):06d}"
        codigo_hash = hashlib.sha256(codigo.encode("utf-8")).hexdigest()
        conexion.execute("""
            UPDATE usuarios SET codigo_recuperacion_hash = ?, codigo_expiracion = ?,
            intentos_recuperacion = 0, recuperacion_solicitada_en = ? WHERE id = ?
        """, (codigo_hash, ahora + RESET_CODE_LIFETIME_SECONDS, ahora, usuario["id"]))
    return True, codigo, "Si el correo existe, recibirás un código."


def cambiar_password_con_codigo(app, correo, codigo, nueva_password):
    valida, mensaje = _password_valida(nueva_password)
    if not valida:
        return False, mensaje
    ahora = int(time.time())
    with _conexion(app) as conexion:
        usuario = conexion.execute(
            "SELECT * FROM usuarios WHERE correo = ?", (correo.strip().lower(),)
        ).fetchone()
        if usuario is None or usuario["codigo_expiracion"] < ahora:
            return False, "El código es inválido o ha caducado."
        recibido = hashlib.sha256(codigo.strip().encode("utf-8")).hexdigest()
        if usuario["intentos_recuperacion"] >= MAX_RESET_ATTEMPTS or not hmac.compare_digest(
            recibido, usuario["codigo_recuperacion_hash"] or ""
        ):
            conexion.execute("""
                UPDATE usuarios SET intentos_recuperacion = intentos_recuperacion + 1
                WHERE id = ?
            """, (usuario["id"],))
            return False, "El código es inválido o ha caducado."
        conexion.execute("""
            UPDATE usuarios SET password_hash = ?, codigo_recuperacion_hash = NULL,
            codigo_expiracion = NULL, intentos_recuperacion = 0, intentos_fallidos = 0,
            bloqueado_hasta = 0 WHERE id = ?
        """, (_hash_password(nueva_password), usuario["id"]))
    return True, "Contraseña actualizada. Ya puedes iniciar sesión."
