import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 学生登录接口
 * 验证规则：密码为 ysu + 学号后6位
 */
export async function POST(request: Request) {
  try {
    let payload: unknown;
    try {
      payload = await request.json();
    } catch (err) {
      console.error("解析登录请求失败:", err);
      return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
    }

    if (typeof payload !== "object" || payload === null) {
      return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
    }

    const { studentId, password } = payload as {
      studentId?: unknown;
      password?: unknown;
    };

    // 验证学号
    if (typeof studentId !== "string" || !studentId.trim()) {
      return NextResponse.json({ error: "学号不能为空" }, { status: 400 });
    }

    // 验证密码
    if (typeof password !== "string" || !password.trim()) {
      return NextResponse.json({ error: "密码不能为空" }, { status: 400 });
    }

    const trimmedStudentId = studentId.trim();
    const trimmedPassword = password.trim();

    // 验证学号长度（假设学号为12位）
    if (trimmedStudentId.length < 6) {
      return NextResponse.json({ error: "学号格式错误" }, { status: 400 });
    }

    // 计算期望的密码：ysu + 学号后6位
    const last6Digits = trimmedStudentId.slice(-6);
    const expectedPassword = `ysu${last6Digits}`;

    // 验证密码
    if (trimmedPassword !== expectedPassword) {
      return NextResponse.json({ error: "学号或密码错误" }, { status: 401 });
    }

    // 查询功能：验证学生登录并获取学生信息
    // 涉及表：Student（学生表）
    // 作用：通过学号查询学生的基本信息（姓名、性别、专业、余额、积分）
    // 验证规则：密码为 ysu + 学号后6位
    const pool = await getPool();
    const result = await pool.request().input("studentId", trimmedStudentId)
      .query<{
      StudentID: string;
      SName: string;
      Sex: string;
      Major: string;
      Balance: number | string;
      Points: number | string;
    }>(`
        -- 查询学生基本信息用于登录验证
        SELECT
          StudentID,      -- 学号
          SName,          -- 姓名
          Sex,            -- 性别
          Major,          -- 专业
          Balance,        -- 账户余额
          Points          -- 消费积分
        FROM Student
        WHERE StudentID = @studentId  -- 根据学号精确匹配
      `);

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: "学号或密码错误" }, { status: 401 });
    }

    const student = result.recordset[0];

    return NextResponse.json({
      success: true,
      student: {
        studentId: student.StudentID.trim(),
        name: student.SName.trim(),
        sex: student.Sex.trim(),
        major: student.Major.trim(),
        balance:
          typeof student.Balance === "number"
            ? student.Balance
            : Number(student.Balance),
        points:
          typeof student.Points === "number"
            ? student.Points
            : Number(student.Points),
      },
    });
  } catch (err) {
    console.error("登录失败:", err);
    const message =
      err instanceof Error ? err.message : `未知错误: ${String(err)}`;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
