# Fishing Calendar / Kalender Mancing

A working Indonesian fishing planner for Kepulauan Seribu and Bekasi–Karawang: monthly calendar, deterministic fishing scores, independent safety checks, hourly marine visualization, tide chart, moon calculations, and species guides.

Repository: [dikijunianto/kalender-mancing](https://github.com/dikijunianto/kalender-mancing). The local `origin` points here. No push or deployment is performed automatically.

## Run locally

Requires Node.js 22.12+ (Node 24 recommended), npm, and a modern browser. Dependencies are pinned and the lockfile is included with the source.

```sh
npm install
npm run dev
```

Open [localhost:3000](http://localhost:3000). Without environment configuration, the app uses demo data. For live forecasts and persistent cache, use Docker below. This MVP has no account or personal-log feature.

## Docker

Copy `.env.docker.example` to `.env`, choose a database password, then run:

```sh
docker compose up --build -d
```

The app runs at [localhost:3000](http://localhost:3000); PostgreSQL stays private to the Docker network. Stop it with `docker compose down`. Add `-v` only when intentionally deleting database data.

This starts live Open-Meteo forecasts. PostgreSQL stores the forecast cache; refresh it on demand:

```sh
curl -X POST http://localhost:3000/api/sync -H "Authorization: Bearer $SYNC_SECRET"
```

Create `.env.local` from `.env.example` only when running outside Docker. Never commit it.

```dotenv
DATABASE_URL=
DEMO_MODE=false
OPEN_METEO_API_KEY=
SYNC_SECRET=
```

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection for persistent forecast cache. |
| `DEMO_MODE` | `true` for simulation; `false` for live forecasts. |
| `OPEN_METEO_API_KEY` | Optional commercial Open-Meteo key. |
| `SYNC_SECRET` | Secret bearer token protecting manual `POST /api/sync`. |
| `CRON_SECRET` | Vercel Cron secret protecting daily `GET /api/sync`. |

## PostgreSQL cache

Docker creates `forecast_cache` automatically. `POST /api/sync` stores both areas' next seven forecast days, so normal page visits read PostgreSQL before calling Open-Meteo. Schedule it every few hours on a VPS. Keep `SYNC_SECRET` server-only.

## Architecture

```text
src/app/                     App Router pages, metadata, errors, loading, APIs
src/components/              Shared UI, calendar, charts
src/components/ui/           shadcn-style Button and Tabs with Radix primitives
src/components/three/        Lazy-loaded React Three Fiber components
src/config/                  Area/species seed catalog, score/safety/quality settings
src/providers/marine/        Provider interface, Open-Meteo and demo adapters
src/services/                Forecast orchestration, score, safety, moon, tides, time, species
src/lib/postgres.ts          PostgreSQL connection for forecast cache
src/types/                   Normalized forecast and visualization models
docker/init.sql              Forecast-cache schema
scripts/                     Provider diagnostic
tests/                       Engine/provider/SQL and desktop/mobile browser checks
```

Next.js 16 App Router, React 19, strict TypeScript, Tailwind CSS 4, Radix/shadcn component conventions, Lucide, Recharts, Zod, PostgreSQL, SunCalc, Three.js, React Three Fiber, and Drei. Area and species catalogs live in code, so no database seed is needed for this MVP.

Provider responses are normalized on the server. Services calculate business results before React and WebGL receive them. 3D never owns scores or safety. No LLM is called. No forecast uses `Math.random()`.

## Actual forecast mode and caching

Set `DEMO_MODE=false` and restart. `OpenMeteoMarineProvider` combines [marine](https://open-meteo.com/en/docs/marine-weather-api) and [weather](https://open-meteo.com/en/docs) endpoints using each configured area's coordinates and Asia/Jakarta timezone. Wind is requested in knots; ocean current speed is converted from km/h to knots. Unknown measurements remain `null`.

The app shows seven forecast days. Past dates and dates outside that horizon show unavailable states; they never silently become demo forecasts. The provider has a ten-second request timeout and no aggressive retry loop. Server caching lasts 30 minutes and concurrent cold requests share one provider operation. PostgreSQL persists normalized reports. On provider failure, cache no older than six hours is labeled `CACHED`, with caution instead of a fresh-safe status. Older/missing cache yields `UNAVAILABLE`.

Vercel calls `GET /api/sync` daily at 00:00 UTC (07:00 Jakarta) and refreshes both areas' seven-day PostgreSQL cache. Set `CRON_SECRET` in Vercel Production; Vercel sends it automatically. For manual syncing, call `POST /api/sync` with `Authorization: Bearer <SYNC_SECRET>`.

Use `npm run provider:check` to make a real request and report field coverage for both areas. The public Open-Meteo service is intended for non-commercial use; choose an appropriate commercial subscription/key before commercial operation. See the provider's current terms.

`MarineWeatherProvider.getForecast(area, startDate, endDate)` is the adapter boundary. A future `BMKGMarineProvider` should implement it and return the same normalized types; do not bind components to BMKG response shapes. The official [BMKG maritime forecast](https://maritim.bmkg.go.id/) remains linked throughout the application.

## Scoring and safety

All thresholds and weights live in `src/config/fishing.ts`:

- Wind 20%, waves 20%, current 20%, tide 15%, moon 10%, seasonal fit 10%, sea temperature 5%.
- Scores are deterministic heuristic weighted sums, **not catch probabilities** or scientifically validated predictions. The breakdown exposes each contribution. Missing factors leave the total unavailable; weights are not silently redistributed.
- Scores: 85–100 Sangat Bagus; 70–84 Bagus; 55–69 Lumayan; 40–54 Kurang Bagus; 0–39 Buruk.
- Safety inspects every hourly sample, including the day's worst conditions. Default caution thresholds are 12 kt wind, 1 m waves, and 5 km visibility. Default stop thresholds are 20 kt wind, 1.5 m waves, visibility below 1 km, or WMO thunderstorm codes 95/96/99. Threshold equality counts as exceeding the wind/wave boundary. These are conservative application heuristics, not an official classification or vessel-specific clearance.
- A dangerous day overrides all fishing recommendations. Missing required safety measurements or an incomplete day prevents a safe status. Recommended windows are withheld on dangerous/incomplete days and otherwise derive from sunrise/sunset plus the relevant hourly wind/wave/rain checks.

SunCalc calculates actual astronomical illumination, phase, sunrise/sunset, and moonrise/moonset for the Jakarta civil date even if the host runs in another timezone. Daily moon summaries use local noon. The 3D moon uses the selected hour. The moon's scene placement is schematic, not an azimuth/elevation navigation tool.

Tides in actual mode use modeled sea-level height relative to mean sea level, including non-tidal components. This is **not a chart datum** and must not be used for safe-depth or coastal-navigation decisions. Extrema use hourly local maxima/minima, not minute-accurate event predictions. The chart explicitly identifies model versus demo and marks the selected hour. Shaded windows are light/weather recommendations, not proven favorable tide windows. Seasonal and species preferences are starter guidance, not local catch surveys.

## Marine visualization

The scene loads only on daily detail pages after core content is available. `MarineSceneState` carries the selected hourly weather and computed solar/lunar values.

- `OceanSurface3D`: lightweight GPU vertex waves, with amplitude and period from the forecast and day/night reflection coloring.
- `Moon3D`: sphere with procedural surface variation and directional shader lighting. New/full/quarter phases use the phase angle, not swapped images. Moon mode focuses the camera; limited orbit controls permit inspection.
- `WindField3D`: bounded line particles. Meteorological wind direction means where the wind comes **from**; particle travel is toward the opposite bearing. Speed drives movement.
- `RainSystem3D`: batched line geometry whose density and fall speed follow precipitation intensity. Zero precipitation produces no particles, regardless of probability.
- `CloudSystem3D`: lightweight instanced geometry driven by cloud cover and precipitation state.
- Solar altitude changes sky lighting; all five modes, time scrubbing, and three quality levels are usable on mobile.

Quality limits geometry, particle counts, antialiasing, and pixel ratio. The low tier uses 24 ocean segments, 16 wind streaks, and at most 70 raindrops. The high tier caps DPR at 1.5. Animation pauses when the document is hidden or the scene leaves the viewport. Reduced motion and save-data preference default to the accessible 2D view. Users can select reduced effects. Unsupported WebGL2, context loss, and rendering errors preserve a 2D information surface. Marine numbers and safety information never depend on WebGL. Mobile smoothness must still be checked on the actual target hardware; browser emulation is not a device benchmark.

## Routes and APIs

Pages: `/`, `/calendar?month=YYYY-MM&area=...`, `/calendar/YYYY-MM-DD?area=...`, `/area`, `/area/[slug]`, `/ikan`, `/ikan/[slug]`.

| Method / path                                | Result                                                                     |
| -------------------------------------------- | -------------------------------------------------------------------------- |
| `GET /api/areas`                             | Supported areas                                                            |
| `GET /api/forecast?area=...&date=YYYY-MM-DD` | Full normalized daily report, score, safety, provenance, windows, and fish |
| `GET /api/calendar?area=...&month=YYYY-MM`   | Daily computed scores, safety, source, and weather                         |
| `GET /api/species?area=...&date=YYYY-MM-DD`  | Starter species recommendations                                            |
| `GET /api/tides?area=...&date=YYYY-MM-DD`    | Tide/model level samples, extrema, source                                  |
| `GET /api/moon?area=...&date=YYYY-MM-DD`     | Astronomical moon and solar times                                          |
| `POST /api/sync`                             | Protected provider/database synchronization                                |

Bad query/input data returns 400; invalid sync secret returns 401; unavailable services return 503. Public forecast responses have a five-minute client cache.

An optional feature-detected `read_fishing_forecast` WebMCP tool exposes the same read API without saving records or changing page state. Unsupported browsers ignore it. Its native browser registry is not required to use the product and has not been verified in a native WebMCP environment.

## Checks and production build

```sh
npm run test
npm run typecheck
npm run build
npm start
```

`npm run test` covers demo generation, score math/missing data, exact safety boundaries, hourly risks, local date and moon calculations, scene inputs, and provider normalization/failure. No external service credentials are needed.

With the development server running:

```sh
npm run test:browser
```

Browser tests use an installed Google Chrome and desktop/iPhone-sized viewports. Set `TEST_BASE_URL` to test another local server. They check public routes, area/month/date changes, species filtering, hourly controls, fallback behavior, API validation, and horizontal overflow.

If a restricted build environment reports a Turbopack subprocess/port permission error, permit the build's local compiler processes. Do not disable type validation to work around it. Build and development outputs are kept separately by Next.js.

## Deployment and later GitHub push

The app needs a Next.js-compatible Node hosting environment; it is not a static export. Docker Compose is ready for a VPS.

1. Copy `.env.docker.example` to `.env`, set strong values, then run `docker compose up --build -d`.
2. Verify `npm run provider:check` and `POST /api/sync`.
3. Set `CRON_SECRET` in Vercel Production for the daily sync.
4. When ready to publish source, review the diff and push. Environment files, `.next`, `node_modules`, and test artifacts are ignored.

Ocean imagery attribution is recorded in `public/ASSETS.md`. Fish symbols are generic Lucide icons, not scientific species illustrations.

## Safety notice

Kalender Mancing memberikan estimasi berdasarkan data cuaca, model laut, dan aturan rekomendasi aplikasi. Informasi ini bukan pengganti prakiraan resmi BMKG atau panduan keselamatan pelayaran. Selalu periksa kondisi aktual sebelum melaut.
