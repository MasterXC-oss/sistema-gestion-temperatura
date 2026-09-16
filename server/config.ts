/**
 * Configuración central del servidor de correo.
 * Lee puerto, credenciales SMTP y timeouts desde variables de entorno
 * (`server/.env`) con valores por defecto para Gmail. Lanza error al
 * arrancar si faltan SMTP_USER, SMTP_PASSWORD o SMTP_FROM.
 */
const port = Number(process.env.PORT ?? 3000);
const smtpHost = process.env.SMTP_HOST ?? 'smtp.gmail.com';
const smtpPort = Number(process.env.SMTP_PORT ?? 465);
const smtpSecure =
  (process.env.SMTP_SECURE ?? String(smtpPort === 465)).toLowerCase() === 'true';
const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASSWORD?.replace(/\s+/g, '');
const smtpFrom = process.env.SMTP_FROM ?? smtpUser;
const smtpReplyTo = process.env.SMTP_REPLY_TO;

// Timeouts SMTP (ms): evitan que una conexión colgada a Gmail deje
// esperando al cliente hasta su propio abort. Sobreescribibles por entorno.
const smtpConnectionTimeout = Number(process.env.SMTP_CONNECTION_TIMEOUT ?? 10_000);
const smtpGreetingTimeout = Number(process.env.SMTP_GREETING_TIMEOUT ?? 10_000);
const smtpSocketTimeout = Number(process.env.SMTP_SOCKET_TIMEOUT ?? 15_000);

if (!smtpUser || !smtpPassword || !smtpFrom) {
  throw new Error('Faltan SMTP_USER, SMTP_PASSWORD o SMTP_FROM en el entorno.');
}

export const config = {
  port,
  smtpHost,
  smtpPort,
  smtpSecure,
  smtpUser,
  smtpPassword,
  smtpFrom,
  smtpReplyTo,
  smtpConnectionTimeout,
  smtpGreetingTimeout,
  smtpSocketTimeout,
};
