import toga
from toga.style import Pack
from toga.style.pack import COLUMN
from .database import crear_bd


class LoginLocal(toga.App):
    
    def startup(self):
        
        crear_bd(self)
        self.password_actual = "123456"

        self.main_window = toga.MainWindow(title=self.formal_name)
        self.mostrar_login()
        self.main_window.show()

    def mostrar_login(self, widget=None):
        self.correo = toga.TextInput(
            placeholder="Correo electrónico",
            style=Pack(padding_bottom=10),
        )
        self.contrasena = toga.PasswordInput(
            placeholder="Contraseña",
            style=Pack(padding_bottom=10),
        )
        self.mensaje_login = toga.Label("", style=Pack(padding_top=10))

        contenido = toga.Box(
            style=Pack(direction=COLUMN, padding=30),
            children=[
                toga.Label("Iniciar sesión", style=Pack(padding_bottom=20)),
                self.correo,
                self.contrasena,
                toga.Button(
                    "Ingresar",
                    on_press=self.iniciar_sesion,
                    style=Pack(padding_bottom=10),
                ),
                toga.Button(
                    "Olvidé mi contraseña",
                    on_press=self.mostrar_recuperar,
                ),
                self.mensaje_login,
            ],
        )

        self.main_window.content = contenido

    def iniciar_sesion(self, widget):
        if (
            self.correo.value == "demo@correo.com"
            and self.contrasena.value == self.password_actual
        ):
            self.mensaje_login.text = "Inicio de sesión correcto."
        else:
            self.mensaje_login.text = "Correo o contraseña incorrectos."

    def mostrar_recuperar(self, widget):
        self.correo_recuperacion = toga.TextInput(
            placeholder="Correo electrónico",
            style=Pack(padding_bottom=10),
        )
        self.nueva_contrasena = toga.PasswordInput(
            placeholder="Nueva contraseña",
            style=Pack(padding_bottom=10),
        )
        self.mensaje_recuperacion = toga.Label("", style=Pack(padding_top=10))

        contenido = toga.Box(
            style=Pack(direction=COLUMN, padding=30),
            children=[
                toga.Label("Recuperar contraseña", style=Pack(padding_bottom=20)),
                self.correo_recuperacion,
                self.nueva_contrasena,
                toga.Button(
                    "Guardar nueva contraseña",
                    on_press=self.cambiar_contrasena,
                    style=Pack(padding_bottom=10),
                ),
                toga.Button("Volver", on_press=self.mostrar_login),
                self.mensaje_recuperacion,
            ],
        )

        self.main_window.content = contenido

    def cambiar_contrasena(self, widget):
        if self.correo_recuperacion.value != "demo@correo.com":
            self.mensaje_recuperacion.text = "Ese correo no está registrado."
        elif not self.nueva_contrasena.value:
            self.mensaje_recuperacion.text = "Escribe una contraseña nueva."
        else:
            self.password_actual = self.nueva_contrasena.value
            self.mensaje_recuperacion.text = "Contraseña actualizada correctamente."


def main():
    return LoginLocal()