import Constants from 'expo-constants';

// URL base del servidor de correo (viene de `extra.apiUrl` -> EXPO_PUBLIC_API_URL).
// Se le quita la barra final para poder concatenar rutas como `/auth/send-reset-code`.
const configuredApiUrl = Constants.expoConfig?.extra?.apiUrl;
const API_URL =
  typeof configuredApiUrl === 'string'
    ? configuredApiUrl.replace(/\/$/, '')
    : undefined;

/**
 * Devuelve la URL base del backend de correo configurada en Expo.
 * @returns URL sin barra final, o `undefined` si falta EXPO_PUBLIC_API_URL.
 */
export function getApiUrl(): string | undefined {
  return API_URL;
}

/**
 * Pide al backend (`POST /auth/send-reset-code`) que envíe por SMTP el
 * código de recuperación de 6 dígitos al correo indicado.
 * Incluye timeout de 25 s con AbortController para no dejar la UI colgada
 * si el servidor o Gmail tardan demasiado.
 * @param email Correo destino del usuario.
 * @param code Código de 6 dígitos generado con `createCode()`.
 * @returns `{ ok, message }`: mensaje listo para mostrar en pantalla/toast.
 */
export async function sendResetEmail(
  email: string,
  code: string,
): Promise<{ ok: boolean; message: string }> {
  if (!API_URL) {
    console.warn('[email] Falta EXPO_PUBLIC_API_URL (extra.apiUrl vacío).');
    return {
      ok: false,
      message: 'Configura EXPO_PUBLIC_API_URL para enviar correos.',
    };
  }

  // El envío SMTP legítimo puede tardar varios segundos; el timeout solo
  // protege contra conexiones colgadas (antes: 10 s, muy justo).
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  try {
    const response = await fetch(`${API_URL}/auth/send-reset-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
      signal: controller.signal,
    });
    const data = (await response.json()) as { message?: string };
    if (!response.ok) {
      console.warn(
        `[email] Servidor respondió ${response.status} para ${API_URL}:`,
        data.message,
      );
      return { ok: false, message: data.message ?? 'No se pudo enviar el correo.' };
    }
    return { ok: true, message: 'Código enviado. Revisa tu correo.' };
  } catch (error) {
    console.warn(`[email] No se pudo alcanzar ${API_URL}/auth/send-reset-code:`, error);
    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        ok: false,
        message: 'El servidor tardó demasiado en responder. Revisa tu conexión.',
      };
    }
    return {
      ok: false,
      message: 'No se pudo conectar con el servicio de correo.',
    };
  } finally {
    clearTimeout(timeout);
  }
}
