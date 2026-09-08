import { NextRequest, NextResponse } from "next/server";
import { serverSupabase } from "@/lib/supabase/server";
import { logSchema } from "@/lib/validation";
export async function GET() {
  const db = await serverSupabase();
  if (!db) return NextResponse.json({ error: "Supabase belum dikonfigurasi" }, { status: 503 });
  const {
    data: { user },
    error: authError,
  } = await db.auth.getUser();
  if (authError || !user)
    return NextResponse.json({ error: "Masuk untuk melihat log" }, { status: 401 });
  const { data, error } = await db
    .from("fishing_logs")
    .select("*, areas(name), species(name)")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(100);
  return error
    ? NextResponse.json({ error: "Log belum dapat dimuat" }, { status: 503 })
    : NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
}
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin)
    return NextResponse.json({ error: "Origin tidak valid" }, { status: 403 });
  if (Number(request.headers.get("content-length") ?? 0) > 16384)
    return NextResponse.json({ error: "Data terlalu besar" }, { status: 413 });
  const db = await serverSupabase();
  if (!db) return NextResponse.json({ error: "Supabase belum dikonfigurasi" }, { status: 503 });
  const {
    data: { user },
    error: authError,
  } = await db.auth.getUser();
  if (authError || !user)
    return NextResponse.json({ error: "Masuk untuk menyimpan log" }, { status: 401 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON tidak valid" }, { status: 400 });
  }
  const parsed = logSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Periksa kembali data trip", details: parsed.error.flatten() },
      { status: 400 },
    );
  const { data, error } = await db
    .from("fishing_logs")
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single();
  return error
    ? NextResponse.json(
        { error: "Log gagal disimpan. Periksa koneksi dan konfigurasi database." },
        { status: 503 },
      )
    : NextResponse.json(data, { status: 201, headers: { "Cache-Control": "private, no-store" } });
}
