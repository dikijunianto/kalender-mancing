"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="page-shell empty-page">
      <h1>Data belum bisa dimuat.</h1>
      <p>Koneksi mungkin terputus. Coba beberapa saat lagi.</p>
      <Button onClick={reset}>Coba lagi</Button>
    </div>
  );
}
