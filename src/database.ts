// Barrel de compatibilidad: la API pública sigue importándose desde './database'.
// La implementación vive en src/auth, src/db y src/services.

export { validateEmail, validatePassword } from './auth/validators';
export { initializeDatabase } from './db/initialize';
export type { User } from './db/users';
export {
  authenticate,
  createUser,
  requestResetCode,
  resetPassword,
  verifyResetCode,
} from './db/users';
