import crypto from "crypto";
import { prisma } from "@/app/lib/prisma";
import { hash as bcryptHash } from "bcryptjs";

const TTL_MIN = Number(process.env.RESET_TOKEN_TTL_MINUTES ?? 30);

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function generatePlainToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function issuePasswordResetToken(
  userId: string,
  ip?: string,
  ua?: string
) {
  const plain = generatePlainToken();
  const tokenHash = sha256(plain);
  const expiresAt = new Date(Date.now() + TTL_MIN * 60_000);

  await prisma.passwordResetToken.create({
    data: { userId, tokenHash, expiresAt, ip, userAgent: ua },
  });

  return { plain, expiresAt };
}

export type ResetErrorReason = "invalid" | "used" | "expired";

export type ConsumeResult =
  | { ok: false; reason: "invalid" | "used" | "expired" }
  | { ok: true; userId: string };

export async function consumePasswordResetToken(
  tokenPlain: string
): Promise<ConsumeResult> {
  const tokenHash = sha256(tokenPlain);

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!record) return { ok: false, reason: "invalid" };
  if (record.usedAt) return { ok: false, reason: "used" };
  if (record.expiresAt < new Date()) return { ok: false, reason: "expired" };

  await prisma.passwordResetToken.update({
    where: { tokenHash },
    data: { usedAt: new Date() },
  });

  return { ok: true, userId: record.userId };
}

export async function setUserPassword(userId: string, newPassword: string) {
  const passwordHash = await bcryptHash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { password: passwordHash },
  });
}
