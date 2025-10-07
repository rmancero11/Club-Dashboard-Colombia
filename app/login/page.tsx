import prisma from "@/app/lib/prisma";
import LoginPageClient from "@/app/login/LoginPageClient";

export default async function LoginPage() {
  const biz = await prisma.business.findFirst({
    select: { IconoWhite: true, Cover: true },
    orderBy: { createdAt: "desc" }, 
  });

  const icon = biz?.IconoWhite ?? "/favicon/logofile.png";
  const cover = biz?.Cover ?? "/loginbanner.jpg";

  return <LoginPageClient icon={icon} cover={cover} />;
}
