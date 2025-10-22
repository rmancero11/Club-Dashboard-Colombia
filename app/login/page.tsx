import LoginPageClient from "@/app/login/LoginPageClient";

export default function LoginPage() {
  const icon = process.env.NEXT_PUBLIC_LOGIN_ICON ?? "/favicon/logofile.png";
  const cover = process.env.NEXT_PUBLIC_LOGIN_COVER ?? "/loginbanner.jpg";

  return <LoginPageClient icon={icon} cover={cover} />;
}
