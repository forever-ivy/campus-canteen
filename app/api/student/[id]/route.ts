import { NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 获取学生基本信息
 * 包含：学号、姓名、性别、专业、账户余额、消费积分
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params;

    if (!studentId || !studentId.trim()) {
      return NextResponse.json(
        { error: "学号不能为空" },
        { status: 400 }
      );
    }

    const pool = await getPool();
    const result = await pool
      .request()
      .input("studentId", studentId.trim())
      .query<{
        StudentID: string;
        SName: string;
        Sex: string;
        Major: string;
        Balance: number | string;
        Points: number | string;
      }>(`
        -- 查询学生基本信息
        SELECT
          StudentID,
          SName,
          Sex,
          Major,
          Balance,
          Points
        FROM Student
        WHERE StudentID = @studentId
      `);

    if (result.recordset.length === 0) {
      return NextResponse.json(
        { error: "学生不存在" },
        { status: 404 }
      );
    }

    const student = result.recordset[0];

    return NextResponse.json({
      student: {
        studentId: student.StudentID.trim(),
        name: student.SName.trim(),
        sex: student.Sex.trim(),
        major: student.Major.trim(),
        balance: typeof student.Balance === "number"
          ? student.Balance
          : Number(student.Balance),
        points: typeof student.Points === "number"
          ? student.Points
          : Number(student.Points),
      },
    });
  } catch (err) {
    console.error("获取学生信息失败:", err);
    const message =
      err instanceof Error ? err.message : `未知错误: ${String(err)}`;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
