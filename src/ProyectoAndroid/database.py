import sqlite3
from pathlib import Path


def obtener_bd(app):
    return Path(app.paths.data) / "usuarios.db"


def crear_bd(app):
    conexion = sqlite3.connect(obtener_bd(app))

    cursor = conexion.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            correo TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            codigo_recuperacion TEXT,
            codigo_expiracion TEXT
        )
    """)

    conexion.commit()
    conexion.close()