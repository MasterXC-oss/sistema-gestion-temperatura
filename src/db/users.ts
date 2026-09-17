import { createCode, generateSalt, hashPassword } from '../auth/crypto';
import { validateEmail, validatePassword } from '../auth/validators';
import { sendResetEmail } from '../services/email';
import { getDatabase } from './client';

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

type Result = { ok: boolean; message: string };

async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const db = await getDatabase();
  return db.getFirstAsync<StoredUser>(
    'SELECT * FROM users WHERE email = ?',
    email.trim().toLowerCase(),
  );
}

function isResetCodeValid(user: StoredUser | null): user is StoredUser {
  return Boolean(
    user?.reset_code_hash &&
      user.reset_code_expires &&
      user.reset_code_expires >= Date.now(),
  );
}

export async function createUser(
  name: string,
  email: string,
  password: string,
): Promise<Result> {
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

  const salt = generateSalt();
  const passwordHash = await hashPassword(password, salt);

  try {
    // Crear usuario
    await db.runAsync(
      'INSERT INTO users (name, email, password_hash, password_salt) VALUES (?, ?, ?, ?)',
      cleanName,
      cleanEmail,
      passwordHash,
      salt,
    );

    // Consultar TODOS los datos del usuario recién creado
    const user = await db.getFirstAsync<{
      id: number;
      name: string;
      email: string;
      password_hash: string;
      password_salt: string;
      reset_code_hash: string | null;
      reset_code_expires: number | null;
    }>(
      'SELECT * FROM users WHERE email = ?',
      cleanEmail,
    );

    console.log('\n========== USUARIO CREADO ==========');

    if (user) {
      console.log(`ID:             ${user.id}`);
      console.log(`Nombre:         ${user.name}`);
      console.log(`Correo:         ${user.email}`);
      console.log(`Password hash:  ${user.password_hash}`);
      console.log(`Password salt:  ${user.password_salt}`);
      console.log(`Reset code:     ${user.reset_code_hash ?? 'NULL'}`);
      console.log(`Reset expires:  ${user.reset_code_expires ?? 'NULL'}`);
    }

    console.log('====================================\n');

    return {
      ok: true,
      message: 'Cuenta creada. Ya puedes iniciar sesión.',
    };

  } catch (error) {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes('unique')
    ) {
      return {
        ok: false,
        message: 'Ese correo ya está registrado.',
      };
    }

    throw error;
  }
}

export async function authenticate(
  emailOrName: string,
  password: string,
): Promise<Result & { user?: User }> {
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
): Promise<Result & { code?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const user = await findUserByEmail(cleanEmail);
  if (!user) {
    return { ok: false, message: 'No existe una cuenta con ese correo.' };
  }
  const code = createCode();
  const emailResult = await sendResetEmail(cleanEmail, code);
  if (!emailResult.ok) {
    return emailResult;
  }
  const db = await getDatabase();
  const codeHash = await hashPassword(code, user.password_salt);
  await db.runAsync(
    'UPDATE users SET reset_code_hash = ?, reset_code_expires = ? WHERE id = ?',
    codeHash,
    Date.now() + RESET_CODE_LIFETIME_MS,
    user.id,
  );
  return { ok: true, code, message: emailResult.message };
}

export async function verifyResetCode(email: string, code: string): Promise<Result> {
  const user = await findUserByEmail(email);
  if (!isResetCodeValid(user)) {
    return { ok: false, message: 'El código es inválido o ha caducado.' };
  }
  const codeHash = await hashPassword(code.trim(), user.password_salt);
  return codeHash === user.reset_code_hash
    ? { ok: true, message: 'Código correcto.' }
    : { ok: false, message: 'El código es inválido.' };
}

export async function resetPassword(
  email: string,
  code: string,
  newPassword: string,
): Promise<Result> {
  const passwordError = validatePassword(newPassword);
  if (passwordError) {
    return { ok: false, message: passwordError };
  }
  const user = await findUserByEmail(email);
  if (!isResetCodeValid(user)) {
    return { ok: false, message: 'El código es inválido o ha caducado.' };
  }
  const codeHash = await hashPassword(code.trim(), user.password_salt);
  if (codeHash !== user.reset_code_hash) {
    return { ok: false, message: 'El código es inválido.' };
  }
  const db = await getDatabase();
  const salt = generateSalt();
  const passwordHash = await hashPassword(newPassword, salt);
  await db.runAsync(
    'UPDATE users SET password_hash = ?, password_salt = ?, reset_code_hash = NULL, reset_code_expires = NULL WHERE id = ?',
    passwordHash,
    salt,
    user.id,
  );
  return { ok: true, message: 'Contraseña actualizada. Ya puedes iniciar sesión.' };
}
