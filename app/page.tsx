import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function Home() {
  const role = cookies().get("role")?.value;

  switch (role) {
    case "ADMIN":
      redirect("/dashboard-admin");
      break;
    case "SELLER":
      redirect("/dashboard-seller");
      break;
    case "USER":
      redirect("/dashboard-user");
      break;
    default:
      redirect("/login");
  }
}
