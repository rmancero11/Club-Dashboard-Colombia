import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await resend.emails.send({
    from: process.env.EMAIL_FROM!, // p.ej. "onboarding@resend.dev" o tu dominio verificado
    to,
    subject: "Recupera tu contraseña",
    html: `
      <div style="font-family:Arial, sans-serif; line-height:1.5">
        <p>Solicitaste recuperar tu contraseña.</p>
        <p><a href="${resetUrl}" target="_blank" rel="noopener">Haz clic aquí para crear una nueva contraseña</a></p>
        <p>Este enlace expira en ${Number(
          process.env.RESET_TOKEN_TTL_MINUTES ?? 30
        )} minutos.</p>
        <hr />
        <p style="font-size:12px;color:#666">
          Si no fuiste tú, ignora este correo.
        </p>
      </div>
    `,
    text: `Solicitaste recuperar tu contraseña. Abre este enlace: ${resetUrl}`,
  });
}
