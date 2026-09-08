"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Anchor, House, CalendarDays, MapPin, Fish, BookOpen, ArrowUpRight } from "lucide-react";
const items = [
  { href: "/", label: "Beranda", icon: House },
  { href: "/calendar", label: "Kalender", icon: CalendarDays },
  { href: "/area", label: "Area", icon: MapPin },
  { href: "/ikan", label: "Ikan", icon: Fish },
  { href: "/logs", label: "Log Mancing", icon: BookOpen },
];
export function Navigation() {
  const path = usePathname(),
    params = useSearchParams();
  const area = params.get("area") ?? "kepulauan-seribu";
  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <Link href="/" className="brand" aria-label="Kalender Mancing beranda">
            <span className="brand-mark">
              <Anchor size={22} />
            </span>
            <span>
              kalender<span className="brand-light">mancing</span>
              <span className="brand-dot">.</span>
            </span>
          </Link>
          <nav aria-label="Navigasi utama" className="desktop-nav">
            {items.map((item) => (
              <Link
                className={
                  (item.href === "/" ? path === "/" : path.startsWith(item.href)) ? "active" : ""
                }
                href={`${item.href}?area=${area}`}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link href="/logs" className="header-cta">
            Catat trip <ArrowUpRight size={15} />
          </Link>
        </div>
      </header>
      <nav className="mobile-nav" aria-label="Navigasi seluler">
        {items.map((item) => (
          <Link
            className={
              (item.href === "/" ? path === "/" : path.startsWith(item.href)) ? "active" : ""
            }
            href={`${item.href}?area=${area}`}
            key={item.href}
          >
            <item.icon size={20} />
            <span>{item.href === "/logs" ? "Log" : item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
