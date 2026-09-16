# Sistema de gestion

Aplicacion Expo con React Native y TypeScript. Incluye:

- Inicio de sesion local con SQLite.
- Registro de usuarios.
- Recuperacion y cambio de contrasena.
- Validacion de correo y contrasena.
- Pantalla principal y cierre de sesion.
- El mismo estilo visual de la aplicacion original.

## Ejecutar

```powershell
cd "sistema de gestion"
npm install
npx expo start
```

Para Android:

```powershell
npm run android
```

## Usuario de prueba

- Usuario: `prueba@example.com`
- Contrasena: `Prueba123456`

La base de datos `sistema-gestion.db` se crea automaticamente en el almacenamiento local de la aplicacion. El codigo de recuperacion se envia por correo mediante el servicio backend.

## Envio real de correo

El flujo de recuperacion usa el servicio TypeScript de [server/server.ts](./server/server.ts).

1. Copia `server/.env.example` a `server/.env`.
2. Configura una contraseña de aplicacion SMTP, nunca la contraseña normal de tu cuenta.
3. Ejecuta `npm install` dentro de `server`.
4. Ejecuta `npm run dev` dentro de `server`.
5. Copia `.env.example` como `.env` en la raiz y cambia `EXPO_PUBLIC_API_URL` por la IP de tu computadora.
6. Reinicia Expo limpiando la caché para que tome la variable de entorno:

```powershell
npx expo start -c
```

El teléfono debe poder acceder a esa IP. En un dispositivo físico no uses `localhost`.

La URL se embebe en la configuración de Expo al iniciar o compilar la aplicación.
Si estás usando una APK instalada o una build de `dist`, debes generar una nueva
build después de cambiar `.env`; esas aplicaciones no pueden leer cambios del
`.env` en tiempo de ejecución.
