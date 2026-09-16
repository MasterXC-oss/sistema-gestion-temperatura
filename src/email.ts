
import Constants from 'expo-constants';

const configuredApiUrl = Constants.expoConfig?.extra?.apiUrl;
const API_URL =
  typeof configuredApiUrl === 'string'
    ? configuredApiUrl.replace(/\/$/, '')
    : undefined;

export async function sendResetEmail(
  email: string,
  code: string,
): Promise<{ ok: boolean; message: string }> {
  if (!API_URL) {
    return {
      ok: false,
      message: 'Configura EXPO_PUBLIC_API_URL para enviar correos.',
    };
  }

  try {
    const response = await fetch(`${API_URL}/auth/send-reset-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    const data = (await response.json()) as { message?: string };
    if (!response.ok) {
      return { ok: false, message: data.message ?? 'No se pudo enviar el correo.' };
    }
    return { ok: true, message: 'Código enviado. Revisa tu correo.' };
  } catch {
    return {
      ok: false,
      message: 'No se pudo conectar con el servicio de correo.',
    };
  }
}
