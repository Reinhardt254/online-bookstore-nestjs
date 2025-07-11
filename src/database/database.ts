import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export const createDatabaseConnection = (databaseUrl: string) => {
  const client = postgres(databaseUrl);
  return drizzle(client, { schema });
};

export type Database = ReturnType<typeof createDatabaseConnection>;
