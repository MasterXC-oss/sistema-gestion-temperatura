/**
 * Escapa caracteres HTML peligrosos (`& < > " '`) para evitar inyección
 * al interpolar el email del usuario dentro de la plantilla.
 */
function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[
        character
      ] ?? character),
  );
}

/**
 * Construye el cuerpo HTML del correo de recuperación (diseño con tabla,
 * código grande y aviso de caducidad de 10 minutos).
 */
export function resetEmailHtml(email: string, code: string): string {
  const escapedEmail = escapeHtml(email);
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

/**
 * Versión en texto plano del correo (fallback para clientes sin HTML).
 */
export function resetEmailText(code: string): string {
  return `Tu código de recuperación es ${code}. Caduca en 10 minutos.`;
}
