import { NextResponse } from "next/server";

import { getPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .query(
        `
        SELECT DISTINCT Location
        FROM Merchant
        WHERE Location IS NOT NULL AND LTRIM(RTRIM(Location)) <> ''
        ORDER BY Location
      `
      );

    const locations = Array.from(
      new Set(
        result.recordset
          .map((row) => row.Location as string | null)
          .filter((value): value is string => Boolean(value))
          .map((value) => value.trim())
      )
    );

    return NextResponse.json({ locations });
  } catch (err) {
    console.error("获取地点列表失败:", err);
    const message =
      err instanceof Error ? err.message : `未知错误: ${String(err)}`;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
