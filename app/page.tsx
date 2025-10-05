import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ROUTES } from "@/app/lib/routes";

export default function Home() {
  const role = cookies().get("role")?.value as "ADMIN" | "SELLER" | "USER" | undefined;

  if (!role) redirect(ROUTES.login);
  if (role === "ADMIN") redirect(ROUTES.admin.home);
  if (role === "SELLER") redirect(ROUTES.seller.home);
  redirect(ROUTES.user.home);
}

