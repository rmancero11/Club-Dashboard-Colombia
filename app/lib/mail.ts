import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const brandName = "Club de Viajeros Solteros";
  const logoUrl =
    "https://clubdeviajerossolteros.com/wp-content/uploads/2024/01/logo-1000-viajeros-w.png";
  const supportEmail = "no-reply@clubdeviajerossolteros.com";

  const fromEmail =
    process.env.EMAIL_FROM || "no-reply@clubdeviajerossolteros.com";

  const subject = Solicitud para restablecer tu contraseña | ${brandName};

  const html = `
  <div style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
    <div style="padding:40px 16px;">
      <div style="max-width:560px;margin:auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
        
        <div style="background:#111827;padding:30px;text-align:center;">
          <img src="${logoUrl}" alt="${brandName}" style="max-width:200px;margin-bottom:12px;">
          <h1 style="color:#ffffff;font-size:22px;margin:0;">Restablecer tu contraseña</h1>
        </div>

        <div style="padding:30px;">
          <p style="font-size:15px;color:#374151;margin-bottom:16px;">
            Hola,
          </p>

          <p style="font-size:15px;color:#374151;margin-bottom:16px;">
            Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>${brandName}</strong>.
          </p>

          <p style="font-size:15px;color:#374151;margin-bottom:24px;">
            Haz clic en el siguiente botón para crear una nueva contraseña:
          </p>

          <div style="text-align:center;margin:30px 0;">
            <a href="${resetUrl}" style="background:#2563eb;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">
              Restablecer contraseña
            </a>
          </div>

          <p style="font-size:13px;color:#6b7280;margin-top:20px;">
            Este enlace expirará en 30 minutos.
          </p>

          <p style="font-size:13px;color:#6b7280;">
            Si el botón no funciona, copia y pega este enlace en tu navegador:
          </p>

          <p style="font-size:13px;color:#2563eb;word-break:break-word;">
            <a href="${resetUrl}" style="color:#2563eb;text-decoration:none;">${resetUrl}</a>
          </p>

          <hr style="margin:25px 0;border:none;border-top:1px solid #e5e7eb;">

          <p style="font-size:12px;color:#6b7280;">
            Si no solicitaste este cambio puedes ignorar este correo.
          </p>

          <p style="font-size:12px;color:#9ca3af;margin-top:10px;">
            © ${new Date().getFullYear()} ${brandName}
          </p>
        </div>
      </div>
    </div>
  </div>
  `;

  const text = `
${brandName}

Recibimos una solicitud para restablecer tu contraseña.

Usa este enlace para crear una nueva contraseña:
${resetUrl}

Este enlace expirará en 30 minutos.

Si no solicitaste este cambio, ignora este correo.

${supportEmail}
  `.trim();

  const { data, error } = await resend.emails.send({
    from: Club de Viajeros Solteros <${fromEmail}>,
    to,
    subject,
    html,
    text,
  });

  if (error) {
    console.error("ERROR:", error);
    throw new Error(error.message);
  }

  return data;
}
