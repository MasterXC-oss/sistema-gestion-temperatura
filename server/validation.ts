/**
 * Valida que `email` tenga forma de correo antes de intentar enviar nada.
 * Protege al endpoint de peticiones malformadas.
 */
export function isValidEmail(email: unknown): email is string {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Valida que `code` sea exactamente 6 dígitos (formato de `createCode()`).
 * Evita inyecciones o códigos con formato inesperado hacia la plantilla HTML.
 */
export function isValidCode(code: unknown): code is string {
  return typeof code === 'string' && /^\d{6}$/.test(code);
}
