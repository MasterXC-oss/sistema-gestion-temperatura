import * as Crypto from 'expo-crypto';

/**
 * Genera el hash SHA-256 de una contraseña combinada con su salt.
 * Formato interno: `salt:password`. El salt evita que dos usuarios con
 * la misma contraseña tengan el mismo hash (ataques por rainbow tables).
 * @param password Contraseña en texto plano (nunca se guarda tal cual).
 * @param salt Valor aleatorio generado con `generateSalt()`.
 * @returns Hash hexadecimal SHA-256 listo para guardar en SQLite.
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${password}`,
  );
}

/**
 * Genera un salt aleatorio de 16 bytes para un nuevo usuario.
 * Debe guardarse junto al hash para poder verificar el login después.
 * @returns Salt como cadena (bytes aleatorios concatenados).
 */
export function generateSalt(): string {
  return Crypto.getRandomBytes(16).join('');
}

/**
 * Crea un código numérico de recuperación de 6 dígitos (ej. "042913").
 * Se envía por correo y caduca en 10 minutos (ver pantalla de recuperación).
 * @returns Código de 6 cifras con ceros a la izquierda si hace falta.
 */
export function createCode(): string {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
}
