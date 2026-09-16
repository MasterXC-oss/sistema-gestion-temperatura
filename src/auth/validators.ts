/** Longitud mínima exigida a las contraseñas de la app. */
export const PASSWORD_MIN_LENGTH = 12;

/**
 * Valida la política de contraseñas: longitud mínima, mayúsculas +
 * minúsculas y al menos un número.
 * @param password Contraseña a evaluar.
 * @returns Mensaje de error en español, o `null` si es válida.
 */
export function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
    return 'La contraseña debe incluir mayúsculas y minúsculas.';
  }
  if (!/[0-9]/.test(password)) {
    return 'La contraseña debe incluir al menos un número.';
  }
  return null;
}

/**
 * Comprueba con una expresión regular básica que el texto tenga forma
 * de correo (`algo@dominio.ext`). Se usa antes de registrar o recuperar.
 * @param email Correo introducido por el usuario (se ignoran espacios).
 * @returns `true` si parece un email válido.
 */
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
