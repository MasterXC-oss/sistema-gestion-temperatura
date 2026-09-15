import os
import smtplib
from email.message import EmailMessage

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

    def _pantalla(self, titulo, controles):
        self.mensaje = toga.Label("", style=Pack(padding_top=10))
        self.main_window.content = toga.Box(
            style=Pack(direction=COLUMN, padding=30),
            children=[toga.Label(titulo, style=Pack(padding_bottom=20)), *controles, self.mensaje],
        )

    def mostrar_login(self, widget=None):
        self.correo = toga.TextInput(placeholder="Correo electrónico", style=Pack(padding_bottom=10))
        self.contrasena = toga.PasswordInput(placeholder="Contraseña", style=Pack(padding_bottom=10))
        self._pantalla("Iniciar sesión", [
            self.correo, self.contrasena,
            toga.Button("Ingresar", on_press=self.iniciar_sesion, style=Pack(padding_bottom=10)),
            toga.Button("Crear cuenta", on_press=self.mostrar_registro),
            toga.Button("Olvidé mi contraseña", on_press=self.mostrar_recuperar),
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
        self._pantalla("Bienvenido", [
            toga.Label(f"Bienvenido, {nombre}"),
            toga.Button("Cerrar sesión", on_press=self.mostrar_login,
                        style=Pack(padding_top=10)),
        ])

    def mostrar_registro(self, widget):
        self.nombre = toga.TextInput(placeholder="Nombre", style=Pack(padding_bottom=10))
        self.correo_registro = toga.TextInput(placeholder="Correo electrónico", style=Pack(padding_bottom=10))
        self.password_registro = toga.PasswordInput(placeholder="Contraseña segura", style=Pack(padding_bottom=10))
        self._pantalla("Crear cuenta", [self.nombre, self.correo_registro, self.password_registro,
            toga.Button("Crear cuenta", on_press=self.registrar), toga.Button("Volver", on_press=self.mostrar_login)])

    def registrar(self, widget):
        _, mensaje = crear_usuario(self, self.nombre.value or "", self.correo_registro.value or "", self.password_registro.value or "")
        self.mensaje.text = mensaje

    def mostrar_recuperar(self, widget):
        self.correo_recuperacion = toga.TextInput(placeholder="Correo electrónico", style=Pack(padding_bottom=10))
        self.codigo_recuperacion = toga.PasswordInput(placeholder="Código de 6 dígitos", style=Pack(padding_bottom=10))
        self.nueva_contrasena = toga.PasswordInput(placeholder="Nueva contraseña segura", style=Pack(padding_bottom=10))
        self._pantalla("Recuperar contraseña", [self.correo_recuperacion, self.codigo_recuperacion,
            self.nueva_contrasena, toga.Button("Enviar código", on_press=self.solicitar_codigo),
            toga.Button("Guardar nueva contraseña", on_press=self.cambiar_contrasena),
            toga.Button("Volver", on_press=self.mostrar_login)])

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
