# Servicio de correo

Este servicio mantiene las credenciales SMTP fuera de la aplicación móvil.

1. Copia `server/.env.example` como `server/.env`.
2. Reemplaza `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` y `SMTP_REPLY_TO` con los datos de la empresa.
3. Si usas Gmail, configura una contraseña de aplicación; no uses la contraseña normal.
4. Para Microsoft 365 normalmente se usa `SMTP_HOST=smtp.office365.com`, `SMTP_PORT=587` y `SMTP_SECURE=false`.
5. Instala y ejecuta:

```powershell
cd "sistema de gestion\server"
npm install
npm run dev
```

La aplicación Expo necesita la URL accesible desde el teléfono en el `.env` de la raiz:

```text
EXPO_PUBLIC_API_URL=http://IP-DE-TU-PC:3000
```

En Android físico no uses `localhost`: usa la IP local de la computadora o una URL HTTPS pública.
