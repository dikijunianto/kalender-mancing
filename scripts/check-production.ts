import assert from "node:assert/strict";
import { today, addDays } from "../src/lib/date";
import { areas } from "../src/config/data";
const base = process.env.CHECK_BASE_URL ?? "http://localhost:3001";
async function json(path: string) {
  const response = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(30000) });
  assert.equal(response.status, 200, path);
  return response.json();
}
async function main() {
  for (const area of areas) {
    const report = await json(`/api/forecast?area=${area.slug}&date=${today()}`);
    assert.equal(report.forecast.source, "LIVE");
    assert.equal(report.forecast.hours.length, 24);
    assert.ok(
      typeof report.score.total === "number" &&
        report.score.total >= 0 &&
        report.score.total <= 100,
    );
    const future = await json(`/api/forecast?area=${area.slug}&date=${addDays(today(), 30)}`);
    assert.equal(future.forecast.source, "UNAVAILABLE");
    assert.equal(future.score.total, null);
    assert.notEqual(future.safety.status, "SAFE");
    assert.deepEqual(future.windows, []);
    console.log(
      `${area.slug}: production LIVE forecast and out-of-horizon UNAVAILABLE handling passed`,
    );
  }
  for (const path of [
    "/",
    "/calendar",
    "/area",
    "/area/bekasi-karawang",
    "/ikan",
    "/ikan/tenggiri",
    "/logs",
    `/calendar/${today()}`,
  ]) {
    const response = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(30000) });
    assert.equal(response.status, 200, path);
    await response.text();
  }
  console.log("All eight public/account-setup production routes responded successfully.");
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
