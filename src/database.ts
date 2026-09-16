import * as Crypto from 'expo-crypto';
import * as SQLite from 'expo-sqlite';
import { sendResetEmail } from './email';

const PASSWORD_MIN_LENGTH = 12;
const RESET_CODE_LIFETIME_MS = 10 * 60 * 1000;

export type User = {
  id: number;
  name: string;
  email: string;
};

type StoredUser = User & {
  password_hash: string;
  password_salt: string;
  reset_code_hash: string | null;
  reset_code_expires: number | null;
};

let database: SQLite.SQLiteDatabase | null = null;

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

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

async function hashPassword(password: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${password}`,
  );
}

function createCode(): string {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
}

async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!database) {
    database = await SQLite.openDatabaseAsync('sistema-gestion.db');
    await database.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE COLLATE NOCASE,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        reset_code_hash TEXT,
        reset_code_expires INTEGER
      );
    `);
  }
  return database;
}

export async function initializeDatabase(): Promise<void> {
  const db = await getDatabase();
  const count = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM users',
  );
  if (!count?.count) {
    await createUser('Usuario Prueba', 'prueba@example.com', 'Prueba123456');
  }
}

export async function createUser(
  name: string,
  email: string,
  password: string,
): Promise<{ ok: boolean; message: string }> {
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();
  if (cleanName.length < 2) {
    return { ok: false, message: 'Escribe un nombre válido.' };
  }
  if (!validateEmail(cleanEmail)) {
    return { ok: false, message: 'Escribe un correo válido.' };
  }
  const passwordError = validatePassword(password);
  if (passwordError) {
    return { ok: false, message: passwordError };
  }

  const db = await getDatabase();
  const salt = Crypto.getRandomBytes(16).join('');
  const passwordHash = await hashPassword(password, salt);
  try {
    await db.runAsync(
      'INSERT INTO users (name, email, password_hash, password_salt) VALUES (?, ?, ?, ?)',
      cleanName,
      cleanEmail,
      passwordHash,
      salt,
    );
    return { ok: true, message: 'Cuenta creada. Ya puedes iniciar sesión.' };
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes('unique')) {
      return { ok: false, message: 'Ese correo ya está registrado.' };
    }
    throw error;
  }
}

export async function authenticate(
  emailOrName: string,
  password: string,
): Promise<{ ok: boolean; message: string; user?: User }> {
  const db = await getDatabase();
  const identifier = emailOrName.trim().toLowerCase();
  const user = await db.getFirstAsync<StoredUser>(
    'SELECT * FROM users WHERE lower(email) = ? OR lower(name) = ?',
    identifier,
    identifier,
  );
  if (!user) {
    return { ok: false, message: 'Correo o contraseña incorrectos.' };
  }
  const hash = await hashPassword(password, user.password_salt);
  if (hash !== user.password_hash) {
    return { ok: false, message: 'Correo o contraseña incorrectos.' };
  }
  return {
    ok: true,
    message: 'Inicio de sesión correcto.',
    user: { id: user.id, name: user.name, email: user.email },
  };
}

export async function requestResetCode(
  email: string,
): Promise<{ ok: boolean; message: string; code?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const db = await getDatabase();
  const user = await db.getFirstAsync<StoredUser>(
    'SELECT * FROM users WHERE email = ?',
    cleanEmail,
  );
  if (!user) {
    return { ok: false, message: 'No existe una cuenta con ese correo.' };
  }
  const code = createCode();
  const emailResult = await sendResetEmail(cleanEmail, code);
  if (!emailResult.ok) {
    return emailResult;
  }
  const codeHash = await hashPassword(code, user.password_salt);
  await db.runAsync(
    'UPDATE users SET reset_code_hash = ?, reset_code_expires = ? WHERE id = ?',
    codeHash,
    Date.now() + RESET_CODE_LIFETIME_MS,
    user.id,
  );
  return {
    ok: true,
    code,
    message: emailResult.message,
  };
}

export async function resetPassword(
  email: string,
  code: string,
  newPassword: string,
): Promise<{ ok: boolean; message: string }> {
  const passwordError = validatePassword(newPassword);
  if (passwordError) {
    return { ok: false, message: passwordError };
  }
  const db = await getDatabase();
  const user = await db.getFirstAsync<StoredUser>(
    'SELECT * FROM users WHERE email = ?',
    email.trim().toLowerCase(),
  );
  if (
    !user ||
    !user.reset_code_hash ||
    !user.reset_code_expires ||
    user.reset_code_expires < Date.now()
  ) {
    return { ok: false, message: 'El código es inválido o ha caducado.' };
  }
  const codeHash = await hashPassword(code.trim(), user.password_salt);
  if (codeHash !== user.reset_code_hash) {
    return { ok: false, message: 'El código es inválido.' };
  }
  const salt = Crypto.getRandomBytes(16).join('');
  const passwordHash = await hashPassword(newPassword, salt);
  await db.runAsync(
    'UPDATE users SET password_hash = ?, password_salt = ?, reset_code_hash = NULL, reset_code_expires = NULL WHERE id = ?',
    passwordHash,
    salt,
    user.id,
  );
  return { ok: true, message: 'Contraseña actualizada. Ya puedes iniciar sesión.' };
}

export async function verifyResetCode(
  email: string,
  code: string,
): Promise<{ ok: boolean; message: string }> {
  const db = await getDatabase();
  const user = await db.getFirstAsync<StoredUser>(
    'SELECT * FROM users WHERE email = ?',
    email.trim().toLowerCase(),
  );
  if (
    !user ||
    !user.reset_code_hash ||
    !user.reset_code_expires ||
    user.reset_code_expires < Date.now()
  ) {
    return { ok: false, message: 'El código es inválido o ha caducado.' };
  }
  const codeHash = await hashPassword(code.trim(), user.password_salt);
  return codeHash === user.reset_code_hash
    ? { ok: true, message: 'Código correcto.' }
    : { ok: false, message: 'El código es inválido.' };
}
