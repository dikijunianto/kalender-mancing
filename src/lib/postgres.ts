import { Pool } from "pg";

let pool: Pool | undefined;

export function postgres() {
  const connectionString = process.env.DATABASE_URL;
  return connectionString ? (pool ??= new Pool({ connectionString })) : null;
}
