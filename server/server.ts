import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import nodemailer from 'nodemailer';

const app = express();
const port = Number(process.env.PORT ?? 3000);
const smtpHost = process.env.SMTP_HOST ?? 'smtp.gmail.com';
const smtpPort = Number(process.env.SMTP_PORT ?? 465);
const smtpSecure = (process.env.SMTP_SECURE ?? String(smtpPort === 465)).toLowerCase() === 'true';
const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASSWORD;
const smtpFrom = process.env.SMTP_FROM ?? smtpUser;
const smtpReplyTo = process.env.SMTP_REPLY_TO;

if (!smtpUser || !smtpPassword || !smtpFrom) {
  throw new Error('Faltan SMTP_USER, SMTP_PASSWORD o SMTP_FROM en el entorno.');
}

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: { user: smtpUser, pass: smtpPassword },
});

app.use(cors());
app.use(express.json({ limit: '10kb' }));

function isValidEmail(email: unknown): email is string {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function resetEmailHtml(email: string, code: string): string {
  const escapedEmail = email.replace(/[&<>"']/g, (character) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character] ?? character
  ));
  return `<!doctype html>
<html lang="es">
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 15px">
      <table width="600" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden">
        <tr><td style="background:#2563eb;padding:25px;text-align:center;color:#fff">
          <h1 style="margin:0;font-size:25px">🔒 Recuperación de contraseña</h1>
          <p style="margin:8px 0 0;font-size:14px">Sistema de gestión de cuentas</p>
        </td></tr>
        <tr><td style="padding:30px">
          <h2 style="color:#1d4ed8">Solicitud de cambio de contraseña</h2>
          <p style="color:#444">Usa este código para continuar con la recuperación de tu cuenta:</p>
          <p style="text-align:center;font-size:32px;font-weight:bold;letter-spacing:8px;color:#2563eb">${code}</p>
          <p style="color:#64748b;font-size:13px">Cuenta: ${escapedEmail}</p>
          <p style="color:#94a3b8;font-size:12px;text-align:center">El código caduca en 10 minutos.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

app.post('/auth/send-reset-code', async (request, response) => {
  const { email, code } = request.body as { email?: unknown; code?: unknown };
  if (!isValidEmail(email) || typeof code !== 'string' || !/^\d{6}$/.test(code)) {
    response.status(400).json({ message: 'Correo o código inválido.' });
    return;
  }

  try {
    await transporter.sendMail({
      from: smtpFrom,
      to: email,
      replyTo: smtpReplyTo,
      subject: 'Código para restablecer tu contraseña',
      text: `Tu código de recuperación es ${code}. Caduca en 10 minutos.`,
      html: resetEmailHtml(email, code),
    });
    response.json({ message: 'Código enviado. Revisa tu correo.' });
  } catch (error) {
    console.error('Error enviando correo de recuperación:', error);
    response.status(502).json({ message: 'No se pudo enviar el correo.' });
  }
});

app.get('/health', (_request, response) => {
  response.json({ ok: true });
});

app.listen(port, () => {
  console.log(`Servidor de correo escuchando en http://localhost:${port}`);
});
