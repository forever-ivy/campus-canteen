import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 商家登录接口
 * 密码格式：ysu + MerchantID（5位档口编号）
 * 例如：档口编号 01101，密码为 ysu01101
 */
export async function POST(request: Request) {
  try {
    let payload: unknown;
    try {
      payload = await request.json();
    } catch (err) {
      console.error("解析登录请求失败:", err);
      return NextResponse.json(
        { error: "请求体格式错误" },
        { status: 400 }
      );
    }

    if (typeof payload !== "object" || payload === null) {
      return NextResponse.json(
        { error: "请求体格式错误" },
        { status: 400 }
      );
    }

    const { merchantId, password } = payload as {
      merchantId?: unknown;
      password?: unknown;
    };

    // 验证必填字段
    if (typeof merchantId !== "string" || !merchantId.trim()) {
      return NextResponse.json(
        { error: "档口编号不能为空" },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || !password.trim()) {
      return NextResponse.json(
        { error: "密码不能为空" },
        { status: 400 }
      );
    }

    const trimmedMerchantId = merchantId.trim();
    const trimmedPassword = password.trim();

    // 验证密码格式：ysu + 档口编号
    const expectedPassword = `ysu${trimmedMerchantId}`;

    if (trimmedPassword !== expectedPassword) {
      return NextResponse.json(
        { error: "档口编号或密码错误" },
        { status: 401 }
      );
    }

    // 查询功能：验证商家登录并获取档口信息
    // 涉及表：Merchant（档口表）
    // 作用：通过档口编号查询档口的基本信息（名称、位置、负责人、联系电话）
    // 验证规则：密码为 ysu + 档口编号（5位）
    const pool = await getPool();
    const result = await pool
      .request()
      .input("merchantId", trimmedMerchantId)
      .query<{
        MerchantID: string;
        MName: string;
        Location: string | null;
        Manager: string | null;
        Phone: string | null;
      }>(`
        -- 查询商家（档口）基本信息用于登录验证
        SELECT
          MerchantID,     -- 档口编号
          MName,          -- 档口名称
          Location,       -- 档口位置
          Manager,        -- 负责人姓名
          Phone           -- 联系电话
        FROM Merchant
        WHERE MerchantID = @merchantId  -- 根据档口编号精确匹配
      `);

    if (result.recordset.length === 0) {
      return NextResponse.json(
        { error: "档口编号或密码错误" },
        { status: 401 }
      );
    }

    const merchant = result.recordset[0];

    return NextResponse.json({
      success: true,
      merchant: {
        merchantId: merchant.MerchantID.trim(),
        name: merchant.MName.trim(),
        location: merchant.Location ? merchant.Location.trim() : null,
        manager: merchant.Manager ? merchant.Manager.trim() : null,
        phone: merchant.Phone ? merchant.Phone.trim() : null,
      },
    });
  } catch (err) {
    console.error("登录失败:", err);
    const message =
      err instanceof Error ? err.message : `未知错误: ${String(err)}`;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
