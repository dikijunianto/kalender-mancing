import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { seedData } from "../scripts/seed-data";
test("PostgreSQL migration, complete seed, constraints and cross-user row isolation", async () => {
  const db = new PGlite();
  try {
    // Reproduce Supabase's identity boundary in a real embedded PostgreSQL engine.
    await db.exec(
      `create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$; grant usage on schema public,auth to anon,authenticated,service_role; grant execute on function auth.uid() to authenticated;`,
    );
    await db.exec(
      await readFile(
        new URL("../supabase/migrations/202609080001_initial.sql", import.meta.url),
        "utf8",
      ),
    );
    const data = await seedData("2026-09-01");
    for (const [table, rows] of Object.entries(data)) {
      if (!rows.length) continue;
      const keys = Object.keys(rows[0]);
      await db.query(
        `insert into public.${table} (${keys.join(",")}) select ${keys.join(",")} from jsonb_populate_recordset(null::public.${table}, $1::jsonb)`,
        [JSON.stringify(rows)],
      );
    }
    const counts = await db.query<{
      areas: number;
      species: number;
      marine: number;
      tides: number;
      moon: number;
      seasons: number;
    }>(
      "select (select count(*)::int from areas) areas,(select count(*)::int from species) species,(select count(*)::int from marine_forecasts) marine,(select count(*)::int from tide_forecasts) tides,(select count(*)::int from moon_data) moon,(select count(*)::int from species_seasonality) seasons",
    );
    assert.deepEqual(counts.rows[0], {
      areas: 2,
      species: 10,
      marine: 1440,
      tides: 1440,
      moon: 60,
      seasons: 228,
    });
    const userA = "30000000-0000-4000-8000-000000000001",
      userB = "30000000-0000-4000-8000-000000000002";
    await db.query("insert into auth.users(id) values ($1),($2)", [userA, userB]);
    await db.exec("set role authenticated");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [userA]);
    const log = [userA, data.areas[0].id, data.species[0].id, "2026-09-08", 2, "Casting"];
    await db.query(
      "insert into fishing_logs(user_id,area_id,species_id,date,catch_count,technique) values($1,$2,$3,$4,$5,$6)",
      log,
    );
    assert.equal((await db.query("select * from fishing_logs")).rows.length, 1);
    await assert.rejects(() =>
      db.query(
        "insert into fishing_logs(user_id,area_id,species_id,date,catch_count,technique) values($1,$2,$3,$4,$5,$6)",
        [userB, ...log.slice(1)],
      ),
    );
    await assert.rejects(() =>
      db.query(
        "insert into fishing_logs(user_id,area_id,species_id,date,catch_count,technique) values($1,$2,$3,$4,$5,$6)",
        [userA, log[1], log[2], log[3], -1, log[5]],
      ),
    );
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [userB]);
    assert.equal((await db.query("select * from fishing_logs")).rows.length, 0);
    assert.equal(
      (await db.query("update fishing_logs set notes='forged' returning id")).rows.length,
      0,
    );
    await db.exec("reset role; set role anon;");
    await assert.rejects(() => db.query("select * from fishing_logs"));
    assert.equal((await db.query("select * from areas")).rows.length, 2);
  } finally {
    await db.close();
  }
});
