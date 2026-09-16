import os
import json
import smtplib
from email.message import EmailMessage
from pathlib import Path

import toga
from toga.style import Pack
from toga.style.pack import COLUMN

from .database import (
    autenticar, cambiar_password_con_codigo, crear_bd, crear_usuario, obtener_nombre,
    preparar_recuperacion,
)

# Datos de prueba para comprobar el login sin registrar nada manualmente.
USUARIO_PRUEBA = {
    "nombre": "Usuario Prueba",
    "correo": "prueba@example.com",
    "password": "Prueba123456",
}


def asegurar_usuario_prueba(app):
    """Crea el usuario demo si no existe. Idempotente."""
    crear_usuario(app, USUARIO_PRUEBA["nombre"], USUARIO_PRUEBA["correo"], USUARIO_PRUEBA["password"])


def enviar_codigo_por_correo(destinatario, codigo):
    """Envía el código mediante SMTP; las credenciales se leen del entorno, no del código."""
    host = os.environ.get("SMTP_HOST")
    usuario = os.environ.get("SMTP_USER")
    password = os.environ.get("SMTP_PASSWORD")
    remitente = os.environ.get("SMTP_FROM", usuario)
    if not all((host, usuario, password, remitente)):
        return False
    mensaje = EmailMessage()
    mensaje["Subject"] = "Código para restablecer tu contraseña"
    mensaje["From"] = remitente
    mensaje["To"] = destinatario
    mensaje.set_content(f"Tu código es {codigo}. Caduca en 10 minutos.")
    try:
        with smtplib.SMTP_SSL(host, int(os.environ.get("SMTP_PORT", "465"))) as servidor:
            servidor.login(usuario, password)
            servidor.send_message(mensaje)
        return True
    except (OSError, smtplib.SMTPException):
        return False


def smtp_configurado():
    return all(os.environ.get(nombre) for nombre in ("SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD"))


class LoginLocal(toga.App):
    def startup(self):
        crear_bd(self)
        asegurar_usuario_prueba(self)
        self.main_window = toga.MainWindow(title=self.formal_name)
        self.mostrar_login()
        self.main_window.show()

    # La interfaz reproduce el carácter limpio, fresco y redondeado del HTML de
    # referencia usando únicamente widgets nativos, para que funcione también
    # en Android, Windows, macOS, Linux y web.
    COLOR_FONDO = "#e9faff"
    COLOR_TEXTO = "#164e63"
    COLOR_SECUNDARIO = "#64748b"
    COLOR_ACCION = "#0891b2"
    COLOR_MENTA = "#2dd4bf"

    def _campo(self, placeholder, password=False):
        """Crea un campo amplio y consistente con el diseño del login."""
        control = (
            toga.PasswordInput(placeholder=placeholder)
            if password
            else toga.TextInput(placeholder=placeholder)
        )
        control.style = Pack(
            color=self.COLOR_TEXTO,
            background_color="#ffffff",
            height=54,
            padding_left=16,
            padding_right=16,
        )
        return control

    def _etiqueta(self, texto):
        return toga.Label(
            texto,
            style=Pack(
                color=self.COLOR_TEXTO,
                font_size=14,
                font_weight="bold",
                padding_bottom=7,
            ),
        )

    def _boton_principal(self, texto, accion):
        return toga.Button(
            texto,
            on_press=accion,
            style=Pack(
                color="#ffffff",
                background_color=self.COLOR_MENTA,
                font_size=16,
                font_weight="bold",
                height=54,
                padding_top=14,
                padding_bottom=14,
            ),
        )

    def _boton_enlace(self, texto, accion, alineacion="center"):
        return toga.Button(
            texto,
            on_press=accion,
            style=Pack(
                color=self.COLOR_ACCION,
                background_color=self.COLOR_FONDO,
                font_size=14,
                font_weight="bold",
                text_align=alineacion,
                padding_top=6,
                padding_bottom=6,
            ),
        )

    def _pantalla(self, titulo, subtitulo, controles):
        """Construye una tarjeta centrada con la identidad visual del HTML."""
        self.mensaje = toga.Label(
            "",
            style=Pack(color=self.COLOR_ACCION, font_size=14, padding_top=12, text_align="center"),
        )

        encabezado = toga.Box(
            style=Pack(direction=COLUMN, alignment="center", padding_bottom=28),
            children=[
                toga.Box(
                    style=Pack(
                        width=72,
                        height=72,
                        alignment="center",
                        background_color="#38bdf8",
                        padding=12,
                    ),
                    children=[
                        toga.Label("🌡", style=Pack(font_size=30, text_align="center")),
                    ],
                ),
                toga.Label(
                    titulo,
                    style=Pack(
                        color=self.COLOR_TEXTO,
                        font_size=30,
                        font_weight="bold",
                        text_align="center",
                        padding_bottom=8,
                    ),
                ),
                toga.Label(
                    subtitulo,
                    style=Pack(color=self.COLOR_SECUNDARIO, font_size=15, text_align="center"),
                ),
            ],
        )

        tarjeta = toga.Box(
            style=Pack(
                direction=COLUMN,
                flex=1,
                background_color="#ffffff",
                padding_top=42,
                padding_right=30,
                padding_bottom=38,
                padding_left=30,
            ),
            children=[encabezado, *controles, self.mensaje],
        )
        contenedor = toga.Box(
            style=Pack(
                direction=COLUMN,
                flex=1,
                alignment="center",
                background_color=self.COLOR_FONDO,
                padding=24,
            ),
            children=[tarjeta],
        )
        self.main_window.content = contenedor

    def mostrar_login(self, widget=None):
        self.mostrar_login_webview()
        return

    def mostrar_login_webview(self):
        html = self._leer_html("login.html")
        self.login_html = html
        self.login_webview = toga.WebView(
            style=Pack(flex=1),
            content=html,
            on_navigation_starting=self._webview_navegacion,
        )
        self.main_window.content = self.login_webview

    def _leer_html(self, nombre):
        return Path(__file__).with_name(nombre).read_text(encoding="utf-8")

    def _mostrar_webview(self, html, nombre):
        self.webview_html = html
        self.webview_nombre = nombre
        self.login_webview = toga.WebView(
            style=Pack(flex=1),
            content=html,
            on_navigation_starting=self._webview_navegacion,
        )
        self.main_window.content = self.login_webview

    def mostrar_recuperar_webview(self):
        self._mostrar_webview(self._leer_html("recuperar.html"), "recuperar.html")

    def _webview_aviso(self, mensaje):
        aviso = json.dumps(mensaje)
        self.login_webview.content = self.webview_html.replace(
            "</body>",
            f"<script>alert({aviso});</script></body>",
        )

    def _webview_navegacion(self, url):
        url = str(url)
        if not url.startswith("joan://"):
            return True

        from urllib.parse import parse_qs, urlparse

        datos = parse_qs(urlparse(url).query)
        accion = urlparse(url).netloc
        if accion == "login":
            correo = datos.get("usuario", [""])[0].strip()
            password = datos.get("password", [""])[0]
            correcto, mensaje = autenticar(self, correo, password)
            if correcto:
                self.mostrar_bienvenida(correo)
            else:
                aviso = json.dumps(mensaje)
                self.login_webview.content = self.login_html.replace(
                    "</body>",
                    f"<script>alert({aviso});</script></body>",
                )
            return False
        if accion == "forgot":
            self.mostrar_recuperar_webview()
            return False
        if accion == "back":
            self.mostrar_login_webview()
            return False
        if accion == "send-code":
            if not smtp_configurado():
                self._webview_aviso(
                    "La recuperación no está configurada. Define SMTP_HOST, SMTP_USER y SMTP_PASSWORD."
                )
                return False
            correo = datos.get("correo", [""])[0].strip()
            preparado, codigo, mensaje = preparar_recuperacion(self, correo)
            if preparado and not enviar_codigo_por_correo(correo, codigo):
                mensaje = "No se pudo enviar el código. Configura SMTP e inténtalo de nuevo."
            self._webview_aviso(mensaje)
            return False
        if accion == "reset-password":
            correo = datos.get("correo", [""])[0].strip()
            codigo = datos.get("codigo", [""])[0].strip()
            password = datos.get("password", [""])[0]
            correcto, mensaje = cambiar_password_con_codigo(
                self, correo, codigo, password
            )
            if correcto:
                self.mostrar_login_webview()
            else:
                self._webview_aviso(mensaje)
            return False
        return False

    def iniciar_sesion_webview(self, usuario, password):
        correcto, mensaje = autenticar(self, usuario, password)
        if correcto:
            self.mostrar_bienvenida(usuario)
        return mensaje

    def mostrar_login_nativo(self):
        self.correo = self._campo("Ingresa tu usuario")
        self.contrasena = self._campo("Ingresa tu contraseña", password=True)
        self._pantalla("Bienvenido", "Ingresa para continuar", [
            self._etiqueta("Usuario"), self.correo,
            self._etiqueta("Contraseña"), self.contrasena,
            self._boton_enlace("¿Olvidaste tu contraseña?", self.mostrar_recuperar, "right"),
            self._boton_principal("INGRESAR", self.iniciar_sesion),
            self._boton_enlace("Crear cuenta", self.mostrar_registro),
            toga.Label(
                "Una experiencia fresca y sencilla",
                style=Pack(color="#94a3b8", font_size=13, text_align="center", padding_top=22),
            ),
        ])

    def iniciar_sesion(self, widget):
        correo = (self.correo.value or "").strip()
        correcto, mensaje = autenticar(self, correo, self.contrasena.value or "")
        self.mensaje.text = mensaje
        if correcto:
            self.contrasena.value = ""
            self.mostrar_bienvenida(correo)

    def mostrar_bienvenida(self, correo):
        nombre = obtener_nombre(self, correo) or correo
        self._pantalla("Bienvenido", "Has iniciado sesión correctamente", [
            toga.Label(
                f"Hola, {nombre}",
                style=Pack(color=self.COLOR_TEXTO, font_size=18, text_align="center", padding_bottom=22),
            ),
            self._boton_principal("CERRAR SESIÓN", self.mostrar_login),
        ])

    def mostrar_registro(self, widget):
        self.nombre = self._campo("Ingresa tu nombre")
        self.correo_registro = self._campo("Ingresa tu correo electrónico")
        self.password_registro = self._campo("Crea una contraseña segura", password=True)
        self._pantalla("Crear cuenta", "Completa tus datos para registrarte", [
            self._etiqueta("Nombre"), self.nombre,
            self._etiqueta("Correo electrónico"), self.correo_registro,
            self._etiqueta("Contraseña"), self.password_registro,
            self._boton_principal("CREAR CUENTA", self.registrar),
            self._boton_enlace("Volver al inicio de sesión", self.mostrar_login),
        ])

    def registrar(self, widget):
        _, mensaje = crear_usuario(self, self.nombre.value or "", self.correo_registro.value or "", self.password_registro.value or "")
        self.mensaje.text = mensaje

    def mostrar_recuperar(self, widget=None):
        self.correo_recuperacion = self._campo("Ingresa tu correo electrónico")
        self.codigo_recuperacion = self._campo("Código de 6 dígitos", password=True)
        self.nueva_contrasena = self._campo("Nueva contraseña segura", password=True)
        self._pantalla("Recuperar contraseña", "Te ayudaremos a volver a entrar", [
            self._etiqueta("Correo electrónico"), self.correo_recuperacion,
            self._boton_principal("ENVIAR CÓDIGO", self.solicitar_codigo),
            self._etiqueta("Código de recuperación"), self.codigo_recuperacion,
            self._etiqueta("Nueva contraseña"), self.nueva_contrasena,
            self._boton_principal("GUARDAR CONTRASEÑA", self.cambiar_contrasena),
            self._boton_enlace("Volver al inicio de sesión", self.mostrar_login),
        ])

    def solicitar_codigo(self, widget):
        if not smtp_configurado():
            self.mensaje.text = "La recuperación no está configurada. Define SMTP_HOST, SMTP_USER y SMTP_PASSWORD."
            return
        preparado, codigo, mensaje = preparar_recuperacion(self, self.correo_recuperacion.value or "")
        if preparado and not enviar_codigo_por_correo(self.correo_recuperacion.value.strip(), codigo):
            self.mensaje.text = "No se pudo enviar el código. Configura SMTP e inténtalo de nuevo."
            return
        self.mensaje.text = mensaje

    def cambiar_contrasena(self, widget):
        _, mensaje = cambiar_password_con_codigo(self, self.correo_recuperacion.value or "", self.codigo_recuperacion.value or "", self.nueva_contrasena.value or "")
        self.mensaje.text = mensaje


def main():
    return LoginLocal()
