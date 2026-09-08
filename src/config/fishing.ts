export const fishingConfig = {
  weights: { wind: 20, waves: 20, current: 20, tide: 15, moon: 10, season: 10, temperature: 5 },
  safety: {
    cautionWind: 12,
    maxWind: 20,
    cautionWave: 1,
    maxWave: 1.5,
    cautionVisibility: 5000,
    minVisibility: 1000,
    thunderstorms: [95, 96, 99],
  },
  forecastDays: 7,
  cacheSeconds: 1800,
  staleCacheHours: 6,
  disclaimer:
    "Kalender Mancing memberikan estimasi berdasarkan data cuaca, model laut, dan aturan rekomendasi aplikasi. Informasi ini bukan pengganti prakiraan resmi BMKG atau panduan keselamatan pelayaran. Selalu periksa kondisi aktual sebelum melaut.",
};
