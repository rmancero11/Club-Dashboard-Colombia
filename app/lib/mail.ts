import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject: "Recupera tu contraseña",
    html: `<a href="${resetUrl}">Reset password</a>`
  });

  console.log("DATA:", data);
  console.log("ERROR:", error);
}
