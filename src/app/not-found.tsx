import Link from "next/link";
export default function NotFound() {
  return (
    <div className="page-shell empty-page">
      <span className="eyebrow">404 · DI LUAR PETA</span>
      <h1>Halaman tidak ditemukan.</h1>
      <Link href="/" className="button button-primary">
        Kembali ke beranda
      </Link>
    </div>
  );
}
