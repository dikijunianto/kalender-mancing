export function today() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export function addDays(date: string, count: number) {
  const d = new Date(`${date}T12:00:00+07:00`);
  d.setUTCDate(d.getUTCDate() + count);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(d);
}
export function dateLabel(
  date: string,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" },
) {
  return new Intl.DateTimeFormat("id-ID", { ...options, timeZone: "Asia/Jakarta" }).format(
    new Date(`${date}T12:00:00+07:00`),
  );
}
export function timeLabel(date: string | null) {
  return date
    ? new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      })
        .format(new Date(date))
        .replace(".", ":")
    : "Belum tersedia";
}
export function direction(deg: number | null) {
  return deg === null
    ? "—"
    : ["Utara", "Timur Laut", "Timur", "Tenggara", "Selatan", "Barat Daya", "Barat", "Barat Laut"][
        Math.round(deg / 45) % 8
      ];
}
export function weatherLabel(code: number | null) {
  return code === null
    ? "Belum tersedia"
    : code >= 95
      ? "Badai petir"
      : code >= 51
        ? "Hujan"
        : code >= 45
          ? "Berkabut"
          : code >= 2
            ? "Berawan"
            : "Cerah berawan";
}
