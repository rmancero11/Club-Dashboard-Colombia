import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { issuePasswordResetToken } from "@/app/lib/reset";
import { sendPasswordResetEmail } from "@/app/lib/mail";

export const runtime = "nodejs";

export async function POST(req: Request) {
  console.log("REQUEST RESET HIT");

  const { email } = await req.json();

  if (!email) return NextResponse.json({ ok: true });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ ok: true });

  const ua = req.headers.get("user-agent") ?? undefined;
  const ip =
    (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
    (req as any).ip;
console.log("USER ID:", user.id);
  const { plain } = await issuePasswordResetToken(user.id, ip, ua);
  const base = process.env.APP_URL!;
  const resetUrl = `${base}/reset-password?token=${plain}`;

  try {
  await sendPasswordResetEmail(email, resetUrl);
  console.log("MAIL ENVIADO A:", email);
} catch (err) {
  console.error("ERROR ENVIANDO MAIL:", err);
}


  return NextResponse.json({ ok: true });
}
