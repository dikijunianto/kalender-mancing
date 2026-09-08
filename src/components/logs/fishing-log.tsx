"use client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { BookOpen, LogOut, Mail, Plus, LockKeyhole } from "lucide-react";
import { browserSupabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { areas, species } from "@/config/data";
import { dateLabel, today } from "@/lib/date";
import { logSchema } from "@/lib/validation";
type Log = {
  id: string;
  date: string;
  spot_name: string | null;
  catch_count: number;
  weight: number | null;
  technique: string;
  notes: string | null;
  areas: { name: string } | null;
  species: { name: string } | null;
};
export function FishingLog({
  configured,
  callbackError,
}: {
  configured: boolean;
  callbackError: boolean;
}) {
  const [user, setUser] = useState<User | null>(null),
    [loading, setLoading] = useState(configured),
    [busy, setBusy] = useState(false),
    [email, setEmail] = useState(""),
    [message, setMessage] = useState(
      callbackError ? "Tautan masuk tidak valid atau kedaluwarsa. Minta tautan baru." : "",
    ),
    [error, setError] = useState(callbackError),
    [logs, setLogs] = useState<Log[]>([]),
    [showForm, setShowForm] = useState(false);
  const notify = (message: string, error = false) => {
    setMessage(message);
    setError(error);
  };
  async function loadLogs() {
    try {
      const response = await fetch("/api/logs", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setLogs(body);
    } catch (e) {
      notify(e instanceof Error ? e.message : "Log belum dapat dimuat", true);
    }
  }
  useEffect(() => {
    const db = browserSupabase();
    if (!db) return;
    let alive = true;
    db.auth
      .getUser()
      .then(({ data }) => {
        if (alive) {
          setUser(data.user);
          setLoading(false);
          if (data.user) void loadLogs();
        }
      })
      .catch(() => {
        if (alive) {
          setLoading(false);
          notify("Koneksi akun belum tersedia.", true);
        }
      });
    const {
      data: { subscription },
    } = db.auth.onAuthStateChange((_event, session) => {
      if (alive) {
        setUser(session?.user ?? null);
        if (!session) setLogs([]);
      }
    });
    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);
  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    const db = browserSupabase();
    if (!db) return;
    setBusy(true);
    notify("");
    try {
      const { error } = await db.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${location.origin}/auth/callback` },
      });
      if (error) throw error;
      notify("Tautan masuk dikirim. Periksa email, lalu buka tautan di browser ini.");
    } catch {
      notify("Tautan belum dapat dikirim. Periksa alamat email atau coba lagi nanti.", true);
    } finally {
      setBusy(false);
    }
  }
  async function signOut() {
    const db = browserSupabase();
    setBusy(true);
    try {
      const result = await db?.auth.signOut();
      if (result?.error) throw result.error;
      setUser(null);
      setLogs([]);
      setShowForm(false);
      notify("");
    } catch {
      notify("Belum berhasil keluar. Coba kembali.", true);
    } finally {
      setBusy(false);
    }
  }
  async function saveLog(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget,
      data = new FormData(form),
      numeric = (key: string) => (data.get(key) ? Number(data.get(key)) : null);
    const value = {
      date: data.get("date"),
      area_id: data.get("area_id"),
      species_id: data.get("species_id"),
      spot_name: data.get("spot_name"),
      catch_count: Number(data.get("catch_count")),
      weight: numeric("weight"),
      strike_time: data.get("strike_time") || null,
      technique: data.get("technique"),
      bait: data.get("bait"),
      depth: numeric("depth"),
      notes: data.get("notes"),
    };
    const parsed = logSchema.safeParse(value);
    if (!parsed.success) {
      notify("Periksa kembali data trip. Jumlah, berat, dan kedalaman tidak boleh negatif.", true);
      return;
    }
    setBusy(true);
    notify("");
    try {
      const response = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      form.reset();
      setShowForm(false);
      await loadLogs();
      notify("Trip berhasil disimpan.");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Log gagal disimpan; isian tetap tersedia.", true);
    } finally {
      setBusy(false);
    }
  }
  const feedback = message ? (
    <div role={error ? "alert" : "status"} className={`form-message ${error ? "form-error" : ""}`}>
      {message}
    </div>
  ) : null;
  if (!configured)
    return (
      <section className="panel auth-panel">
        <LockKeyhole size={30} />
        <h2>Log pribadi menunggu koneksi akun.</h2>
        <p className="muted">
          Penyimpanan trip belum diaktifkan. Setelah layanan akun terhubung, kamu bisa masuk lewat
          email dan menyimpan catatan secara pribadi.
        </p>
        <div className="form-message">
          Prakiraan, kalender, dan panduan ikan tetap dapat dijelajahi tanpa akun.
        </div>
      </section>
    );
  if (loading) return <div className="skeleton" style={{ height: 240 }} aria-label="Memuat akun" />;
  if (!user)
    return (
      <section className="panel auth-panel">
        <Mail size={30} />
        <h2>Cerita trip, tersimpan rapi.</h2>
        <p className="muted">
          Masuk dengan tautan email untuk menyimpan hasil mancing. Tanpa kata sandi.
        </p>
        <form onSubmit={signIn}>
          <label className="field">
            Alamat email
            <input
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <Button type="submit" disabled={busy} style={{ marginTop: 17, width: "100%" }}>
            {busy ? "Mengirim…" : "Kirim tautan masuk"}
          </Button>
        </form>
        {feedback}
      </section>
    );
  return (
    <div className="logs-layout">
      <div className="logs-topbar">
        <span className="muted small">{user.email}</span>
        <Button variant="ghost" size="sm" onClick={signOut} disabled={busy}>
          <LogOut size={14} />
          Keluar
        </Button>
      </div>
      <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "outline" : "default"}>
        <Plus size={17} />
        {showForm ? "Tutup formulir" : "Catat trip baru"}
      </Button>
      {feedback}
      {showForm && (
        <form className="panel" style={{ marginTop: 20 }} onSubmit={saveLog}>
          <h2>Catat perjalananmu</h2>
          <div className="form-grid">
            <label className="field">
              Tanggal
              <input name="date" type="date" defaultValue={today()} required />
            </label>
            <label className="field">
              Area
              <select name="area_id" required>
                {areas.map((a) => (
                  <option value={a.id} key={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Nama spot (opsional)
              <input name="spot_name" maxLength={120} placeholder="Nama lokasi mancing" />
            </label>
            <label className="field">
              Ikan
              <select name="species_id" required>
                {species.map((s) => (
                  <option value={s.id} key={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Jumlah tangkapan
              <input
                name="catch_count"
                type="number"
                required
                min={0}
                max={10000}
                step={1}
                defaultValue={0}
              />
            </label>
            <label className="field">
              Berat total (kg, opsional)
              <input name="weight" type="number" min={0} max={10000} step="0.01" />
            </label>
            <label className="field">
              Waktu strike (opsional)
              <input name="strike_time" type="time" />
            </label>
            <label className="field">
              Kedalaman (m, opsional)
              <input name="depth" type="number" min={0} max={2000} step="0.1" />
            </label>
            <label className="field">
              Teknik
              <input
                name="technique"
                required
                maxLength={100}
                placeholder="Casting, jigging, trolling…"
              />
            </label>
            <label className="field">
              Umpan / lure
              <input name="bait" maxLength={100} placeholder="Umpan yang digunakan" />
            </label>
            <label className="field field-wide">
              Catatan
              <textarea
                name="notes"
                maxLength={2000}
                placeholder="Apa yang berhasil? Apa yang akan kamu coba lagi?"
              />
            </label>
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? "Menyimpan…" : "Simpan trip"}
          </Button>
        </form>
      )}
      {logs.length
        ? logs.map((log) => (
            <article className="panel trip-card" key={log.id}>
              <span className="eyebrow">
                {dateLabel(log.date)} · {log.areas?.name}
              </span>
              <h3>
                {log.species?.name} · {log.catch_count} ekor
              </h3>
              {log.spot_name && <span className="muted small">{log.spot_name}</span>}
              <div className="trip-meta">
                <span>{log.technique}</span>
                {log.weight !== null && <span>{log.weight} kg</span>}
              </div>
              {log.notes && <p>{log.notes}</p>}
            </article>
          ))
        : !showForm && (
            <div className="empty-inline" style={{ marginTop: 25 }}>
              <BookOpen size={30} />
              <p>Belum ada cerita. Catat trip pertamamu dan bangun jurnal mancing pribadi.</p>
            </div>
          )}
    </div>
  );
}
