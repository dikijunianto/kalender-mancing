import { test, expect } from "@playwright/test";
test("homepage, area switching, month navigation and day detail", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByText("Mode demo.")).toBeVisible();
  if (testInfo.project.name === "mobile") {
    await page
      .getByRole("navigation", { name: "Navigasi seluler" })
      .getByRole("link", { name: "Area", exact: true })
      .click();
    await expect(page.getByRole("heading", { name: "Temukan perairanmu." })).toBeVisible();
    await page
      .getByRole("navigation", { name: "Navigasi seluler" })
      .getByRole("link", { name: "Beranda", exact: true })
      .click();
  }
  await page.screenshot({ path: testInfo.outputPath("homepage.png"), fullPage: true });
  await page.getByLabel("Pilih area mancing").selectOption("bekasi-karawang");
  await expect(page).toHaveURL(/area=bekasi-karawang/);
  await expect(page.locator(".hero-location")).toContainText("Bekasi–Karawang");
  await page.getByRole("link", { name: "Buka kalender", exact: true }).click();
  await expect(page.locator(".calendar-grid")).toBeVisible();
  const initial = await page.locator(".calendar-toolbar h2").textContent();
  await page.getByRole("link", { name: "Bulan berikutnya" }).click();
  await expect(page.locator(".calendar-toolbar h2")).not.toHaveText(initial!);
  await page.locator("a.calendar-cell").nth(9).click();
  await expect(page.locator(".daily-summary")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pasang surut", exact: true })).toBeVisible();
  await expect(page.locator(".marine-canvas canvas")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("daily-detail.png"), fullPage: true });
  await page.getByLabel("Kurangi efek (2D)").check();
  await expect(page.locator(".marine-fallback")).toBeVisible();
  await page.locator("#marine-hour").fill("20");
  await expect(page.locator(".time-scrubber output")).toHaveText("20:00 WIB");
  await expect(page.locator(".marine-fallback")).toHaveClass(/night/);
  await page.getByRole("tab", { name: "Bulan", exact: true }).click();
  await expect(page.locator(".marine-caption h3")).toContainText("iluminasi");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
test("species filtering, species detail, area pages and account setup state", async ({ page }) => {
  await page.goto("/ikan");
  await page.getByLabel("Cari ikan atau teknik mancing").fill("tenggiri");
  await expect(page.locator(".fish-card")).toHaveCount(1);
  await page.locator(".fish-card").click();
  await expect(page.getByRole("heading", { name: "Tenggiri", exact: true })).toBeVisible();
  await expect(page.locator(".season-month")).toHaveCount(12);
  await page.goto("/area/kepulauan-seribu");
  await expect(page.getByRole("heading", { name: "Tujuh hari ke depan" })).toBeVisible();
  await expect(page.locator(".forecast-day")).toHaveCount(7);
  await page.goto("/logs");
  await expect(page.getByText("Log pribadi menunggu koneksi akun.")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test("reduced motion and unsupported WebGL retain all core information", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/calendar/2026-09-08?area=kepulauan-seribu");
  await expect(page.getByLabel("Kurangi efek (2D)")).toBeChecked();
  await expect(page.locator(".marine-fallback")).toBeVisible();
  await expect(page.locator(".condition-card")).toHaveCount(6);
});
test("WebGL context loss and unavailable WebGL preserve the 2D view", async ({ page }) => {
  await page.goto("/calendar/2026-09-08");
  const canvas = page.locator(".marine-canvas canvas");
  await expect(canvas).toBeVisible();
  await canvas.dispatchEvent("webglcontextlost");
  await expect(page.locator(".marine-fallback")).toBeVisible();
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      ...args: Parameters<typeof original>
    ) {
      if (String(args[0]).includes("webgl")) return null;
      return original.apply(this, args);
    } as typeof original;
  });
  await page.reload();
  await expect(page.locator(".marine-fallback")).toBeVisible();
  await expect(page.locator(".condition-card")).toHaveCount(6);
});
test("all 3D weather modes remain usable at night", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/calendar/2026-09-26");
  await expect(page.locator(".marine-canvas canvas")).toBeVisible();
  await page.locator("#marine-hour").fill("23");
  for (const label of ["Angin", "Hujan", "Gelombang", "Bulan", "Ringkasan"]) {
    await page.getByRole("tab", { name: label, exact: true }).click();
    await expect(page.getByRole("tab", { name: label, exact: true })).toHaveAttribute(
      "data-state",
      "active",
    );
  }
  await page.getByRole("tab", { name: "Bulan", exact: true }).click();
  await expect(page.locator(".marine-caption h3")).toContainText("iluminasi");
  await page.screenshot({ path: testInfo.outputPath("moon-night.png") });
  expect(errors).toEqual([]);
});
test("APIs validate requests and expose deterministic provenance", async ({ request }) => {
  expect((await request.get("/api/forecast?area=invalid&date=2026-09-08")).status()).toBe(400);
  expect((await request.get("/api/calendar?month=2026-13")).status()).toBe(400);
  expect((await request.get("/api/forecast?date=2026-02-30")).status()).toBe(400);
  const response = await request.get("/api/calendar?month=2026-09&area=kepulauan-seribu"),
    data = await response.json();
  expect(data).toHaveLength(30);
  expect(data[0].source).toBe("DEMO");
  expect(
    data.some((d: { safety: { status: string } }) => d.safety.status === "NOT_RECOMMENDED"),
  ).toBe(true);
  expect((await request.post("/api/logs", { data: {} })).status()).toBe(403);
  expect((await request.get("/api/logs")).status()).toBe(503);
});
