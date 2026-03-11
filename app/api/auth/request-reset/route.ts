import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { issuePasswordResetToken } from "@/app/lib/reset";
import { sendPasswordResetEmail } from "@/app/lib/mail";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    console.log("REQUEST RESET HIT");

    const { email } = await req.json();

    if (!email) {
      console.log("NO EMAIL RECIBIDO");
      return NextResponse.json({ ok: true });
    }

    console.log("EMAIL RECIBIDO:", email);

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log("USUARIO NO EXISTE");
      return NextResponse.json({ ok: true });
    }

    console.log("USER ID:", user.id);

    const ua = req.headers.get("user-agent") ?? undefined;

    const ip =
      (req.headers.get("x-forwarded-for") ?? "")
        .split(",")[0]
        .trim() || (req as any).ip;

    const { plain } = await issuePasswordResetToken(user.id, ip, ua);

    const base = process.env.APP_URL!;
    const resetUrl = `${base}/reset-password?token=${plain}`;

    console.log("RESET URL:", resetUrl);

    await sendPasswordResetEmail(email, resetUrl);

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error("ERROR EN REQUEST RESET:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}