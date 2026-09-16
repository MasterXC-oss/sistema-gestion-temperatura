import 'dotenv/config';
import cors from 'cors';
import express from 'express';36
import nodemailer from 'nodemailer';

import { config } from './config.js';
import { resetEmailHtml, resetEmailText } from './emailTemplate.js';
import { isValidCode, isValidEmail } from './validation.js';

const app = express();

// Transporter SMTP (nodemailer): canal reutilizable hacia Gmail u otro
// proveedor definido en `config.ts`. Los timeouts evitan conexiones colgadas.
const transporter = nodemailer.createTransport({
  host: config.smtpHost,
  port: config.smtpPort,
  secure: config.smtpSecure,
  auth: { user: config.smtpUser, pass: config.smtpPassword },
  connectionTimeout: config.smtpConnectionTimeout,
  greetingTimeout: config.smtpGreetingTimeout,
  socketTimeout: config.smtpSocketTimeout,
});

// Verifica la conexión SMTP al arrancar (no bloquea el listen).
transporter
  .verify()
  .then(() => console.log('SMTP listo para enviar correos.'))
  .catch((error) => {
    console.error('SMTP no disponible al arrancar (el server sigue escuchando):', error);
  });

app.use(cors());
app.use(express.json({ limit: '10kb' }));

/**
 * POST /auth/send-reset-code — Envía el código de recuperación por correo.
 * Body esperado: `{ email: string, code: "123456" }`.
 * 1. Valida formato con `isValidEmail` / `isValidCode` (400 si falla).
 * 2. Envía el email en HTML + texto plano vía `transporter.sendMail`.
 * 3. Responde 200 si OK, 502 si SMTP falló.
 */
app.post('/auth/send-reset-code', async (request, response) => {
  const { email, code } = request.body as { email?: unknown; code?: unknown };
  if (!isValidEmail(email) || !isValidCode(code)) {
    response.status(400).json({ message: 'Correo o código inválido.' });
    return;
  }

  try {
    await transporter.sendMail({
      from: config.smtpFrom,
      to: email,
      replyTo: config.smtpReplyTo,
      subject: 'Código para restablecer tu contraseña',
      text: resetEmailText(code),
      html: resetEmailHtml(email, code),
    });
    response.json({ message: 'Código enviado. Revisa tu correo.' });
  } catch (error) {
    console.error('Error enviando correo de recuperación:', error);
    response.status(502).json({ message: 'No se pudo enviar el correo.' });
  }
});

/**
 * GET /health — Comprobación rápida de que el servidor sigue vivo.
 * La app y herramientas de despliegue la usan para verificar conexión.
 */
app.get('/health', (_request, response) => {
  response.json({ ok: true });
});

/** Arranca el servidor Express en `config.port`, accesible en LAN (0.0.0.0). */
app.listen(config.port, '0.0.0.0', () => {
  console.log(`Servidor de correo escuchando en http://localhost:${config.port}`);
  console.log(`Accesible en LAN en http://<tu-ip-local>:${config.port}`);
});
