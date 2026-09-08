import { Pool } from "pg";

let pool: Pool | undefined;
let ready: Promise<void> | undefined;

export function postgres() {
  const connectionString = process.env.DATABASE_URL;
  return connectionString ? (pool ??= new Pool({ connectionString })) : null;
}

export async function ensureForecastCache() {
  const db = postgres();
  if (!db) return null;
  ready ??= db
    .query(
      "create table if not exists forecast_cache (area_id uuid not null, date date not null, payload jsonb not null, fetched_at timestamptz not null, primary key (area_id, date))",
    )
    .then(() => undefined);
  await ready;
  return db;
}
