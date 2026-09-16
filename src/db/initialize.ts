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
}
