"""Prueba opcional del SMTP usando variables de entorno.

El envío de la aplicación se realiza mediante server/server.ts.
Nunca pongas credenciales SMTP directamente en este archivo.
"""
import os
import smtplib
from email.message import EmailMessage


def enviar_prueba(destinatario: str, codigo: str) -> None:
    usuario = os.environ["SMTP_USER"]
    password = os.environ["SMTP_PASSWORD"]
    remitente = os.environ.get("SMTP_FROM", usuario)
    host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    port = int(os.environ.get("SMTP_PORT", "465"))

    mensaje = EmailMessage()
    mensaje["From"] = remitente
    mensaje["To"] = destinatario
    mensaje["Subject"] = "Código de recuperación"
    mensaje.set_content(f"Tu código es {codigo}. Caduca en 10 minutos.")

    with smtplib.SMTP_SSL(host, port) as servidor:
        servidor.login(usuario, password)
        servidor.send_message(mensaje)


if __name__ == "__main__":
    enviar_prueba(
        os.environ["TEST_EMAIL"],
        os.environ.get("TEST_CODE", "123456"),
    )
