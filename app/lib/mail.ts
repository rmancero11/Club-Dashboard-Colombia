import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject: "Restablecer tu contraseña",
    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; background:#f5f5f5; padding:40px 20px;">
        <div style="max-width:500px; margin:auto; background:white; border-radius:8px; padding:30px; text-align:center;">
          
          <h2 style="margin-bottom:10px;">Restablecer contraseña</h2>
          
          <p style="color:#555; font-size:14px;">
            Recibimos una solicitud para restablecer tu contraseña.
          </p>

          <p style="color:#555; font-size:14px;">
            Haz clic en el botón de abajo para crear una nueva contraseña.
          </p>

          <a 
            href="${resetUrl}" 
            style="
              display:inline-block;
              margin-top:20px;
              padding:12px 20px;
              background:#2563eb;
              color:white;
              text-decoration:none;
              border-radius:6px;
              font-weight:600;
            "
          >
            Restablecer contraseña
          </a>

          <p style="margin-top:25px; font-size:12px; color:#777;">
            Este enlace expirará en 30 minutos.
          </p>

          <hr style="margin:25px 0;" />

          <p style="font-size:12px; color:#888;">
            Si no solicitaste este cambio, puedes ignorar este correo.
          </p>

          <p style="font-size:12px; color:#aaa;">
            © Club de Viajeros Solteros
          </p>

        </div>
      </div>
    `,
    text: `Restablece tu contraseña visitando este enlace: ${resetUrl}`,
  });

  console.log("DATA:", data);
  console.log("ERROR:", error);
}