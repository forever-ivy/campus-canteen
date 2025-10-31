/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pool = await getPool();
    const result = await pool.request().query("SELECT 1 AS ok");
    return NextResponse.json({ ok: result.recordset[0]?.ok === 1 });
  } catch (err: any) {
    console.error("DB test error:", err);
    return NextResponse.json(
      { error: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
