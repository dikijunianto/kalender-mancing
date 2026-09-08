import type { Metadata } from "next";
import { Suspense } from "react";
import { Anchor, ArrowUpRight } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { ForecastTools } from "@/components/forecast-tools";
import { fishingConfig } from "@/config/fishing";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Kalender Mancing — Prediksi Waktu Mancing Kepulauan Seribu & Karawang",
    template: "%s | Kalender Mancing",
  },
  description:
    "Lihat kalender mancing, kondisi laut, fase bulan, pasang surut, target ikan, dan rekomendasi waktu mancing untuk Kepulauan Seribu dan Karawang.",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <a href="#main" className="skip-link">
          Lewati ke konten
        </a>
        <Suspense>
          <Navigation />
        </Suspense>
        <ForecastTools />
        <main id="main">{children}</main>
        <footer className="site-footer">
          <div>
            <Anchor size={19} />
            <strong>Kenali laut. Nikmati perjalanan.</strong>
          </div>
          <p>{fishingConfig.disclaimer}</p>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} Kalender Mancing</span>
            <a href="https://maritim.bmkg.go.id/" target="_blank" rel="noreferrer">
              Prakiraan resmi BMKG <ArrowUpRight size={13} />
            </a>
            <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
              Data oleh Open-Meteo
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
