import { getDatabase } from './client';
import { createUser } from './users';

export async function initializeDatabase(): Promise<void> {
  const db = await getDatabase();

  const count = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM users',
  );

  if (!count?.count) {
    await createUser('Usuario Prueba', 'prueba@example.com', 'Prueba123456');
  }

  // Consulta y muestra todos los usuarios en la base de datos
  const users = await db.getAllAsync<{
    id: number;
    name: string;
    email: string;
    password_hash: string;
    password_salt: string;
    reset_code_hash: string | null;
    reset_code_expires: number | null;
  }>('SELECT * FROM users');

  console.log('\n========== BASE DE DATOS ==========');
  console.log(`Total de usuarios: ${users.length}`);

  users.forEach((user) => {
    console.log('-----------------------------------');
    console.log(`ID:       ${user.id}`);
    console.log(`Nombre:   ${user.name}`);
    console.log(`Correo:   ${user.email}`);
    console.log(`Password: ${user.password_hash}`);
    console.log(`Salt:     ${user.password_salt}`);
    console.log(`Código:   ${user.reset_code_hash ?? 'NULL'}`);
    console.log(`Expira:   ${user.reset_code_expires ?? 'NULL'}`);
  });

  console.log('===================================\n');
}