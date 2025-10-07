import { NextResponse } from "next/server";
import {
  consumePasswordResetToken,
  setUserPassword,
  type ConsumeResult,
  type ResetErrorReason,   
} from "@/app/lib/reset";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { token, password } = await req.json();

  if (!token || !password || password.length < 8) {
    return NextResponse.json({ ok: false, error: "Datos inválidos" }, { status: 400 });
  }

  const result: ConsumeResult = await consumePasswordResetToken(token);

  if (!result.ok) {
    const statusMap = {
      invalid: 400,
      used: 400,
      expired: 400,
    } as const satisfies Record<ResetErrorReason, number>; 
    return NextResponse.json(
      { ok: false, error: result.reason },
      { status: statusMap[result.reason] }
    );
  }

  await setUserPassword(result.userId, password);
  return NextResponse.json({ ok: true });
}
