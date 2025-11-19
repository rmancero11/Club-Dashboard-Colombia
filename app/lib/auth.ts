import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET no está definido en las variables de entorno");
}
const enc = new TextEncoder();

export type AuthContext = {
  userId: string;
  role: "ADMIN" | "SELLER" | "USER";
};

export async function getAuth(): Promise<AuthContext | null> {
  const token = cookies().get("token")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, enc.encode(JWT_SECRET));
    const userId =
      (payload.sub as string | undefined) ||
      ((payload as any)?.id as string | undefined);
    const role = (payload as any)?.role as AuthContext["role"] | undefined;

    if (!userId || !role) return null;
    return { userId, role };
  } catch {
    return null;
  }
}

// Función para verificar un token que se le pasa directamente (ej: desde el header Authorization)
export async function verifyJWT(token:string): Promise<AuthContext | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, enc.encode(JWT_SECRET));

    const userId =
    (payload.sub as string | undefined) ||
    ((payload as any)?.id as string | undefined);
    
    const role = (payload as any)?.role as AuthContext["role"] | undefined;

    if (!userId || !role) return null;
    return { userId, role };

  } catch {
    return null;
  }
}
