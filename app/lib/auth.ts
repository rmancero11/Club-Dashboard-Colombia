import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "";
const enc = new TextEncoder();

export type AuthContext = {
  userId: string;
  businessId: string | null;
  role: "ADMIN" | "SELLER" | "USER";
};

export async function getAuth(): Promise<AuthContext | null> {
  const token = cookies().get("token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, enc.encode(JWT_SECRET));
    const userId = (payload as any)?.id as string | undefined;
    const role = (payload as any)?.role as AuthContext["role"] | undefined;
    const businessId = ((payload as any)?.businessId ?? null) as string | null;
    if (!userId || !role) return null;
    return { userId, role, businessId };
  } catch {
    return null;
  }
}
