import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { uploadToCloudinary } from "@/app/lib/cloudinary";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET no está definido en las variables de entorno");
}
const enc = new TextEncoder();

// ✅ función helper definida FUERA del bloque
async function uploadIfPresent(file: File | null, folder: string) {
  if (!file || typeof file !== "object" || (file as any).size <= 0) return null;
  const result: any = await uploadToCloudinary(file, {
    access: "public",
    folder,
    filename: file.name,
  });
  return result.secure_url;
}

export async function POST(req: Request) {
  try {
    // 1️⃣ Verificar JWT desde cookies
    const token = cookies().get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, enc.encode(JWT_SECRET));
    const userId = (payload?.sub as string) || (payload as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // 2️⃣ Leer el formulario
    const formData = await req.formData();

    const name = (formData.get("name") as string)?.trim() || null;
    const phone = (formData.get("phone") as string)?.trim() || null;
    const country = (formData.get("country") as string)?.trim() || null;
    const birthdayRaw = formData.get("birthday") as string | null;
    const gender = (formData.get("gender") as string)?.trim() || null;
    const lookingFor = (formData.get("lookingFor") as string)?.trim() || null;
    const singleStatus = (formData.get("singleStatus") as string)?.trim() || null;
    const affirmation = (formData.get("affirmation") as string)?.trim() || null;
    const security = (formData.get("security") as string)?.trim() || null;
    const comment = (formData.get("comment") as string)?.trim() || null;
    const birthday = birthdayRaw ? new Date(birthdayRaw) : null;

    // 🔑 Archivos (vía Cloudinary)
    const dniFile = formData.get("dniFile") as File | null;
    const passportFile = formData.get("passportFile") as File | null;
    const visaFile = formData.get("visaFile") as File | null;

    // 3️⃣ Obtener datos actuales del usuario para conservar archivos antiguos
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { dniFile: true, passport: true, visa: true },
    });

    // 4️⃣ Subir archivos nuevos a Cloudinary si existen
    const [dniFileUrl, passportFileUrl, visaFileUrl] = await Promise.all([
      uploadIfPresent(dniFile, "docs"),
      uploadIfPresent(passportFile, "docs"),
      uploadIfPresent(visaFile, "docs"),
    ]);

    // 5️⃣ Construir objeto de actualización
    const dataToUpdate: any = {};

    if (name) dataToUpdate.name = name;
    if (phone) dataToUpdate.phone = phone;
    if (country) dataToUpdate.country = country;
    if (gender) dataToUpdate.gender = gender;
    if (lookingFor) dataToUpdate.lookingFor = lookingFor;
    if (singleStatus) dataToUpdate.singleStatus = singleStatus;
    if (affirmation) dataToUpdate.affirmation = affirmation;
    if (security) dataToUpdate.security = security;
    if (birthday) dataToUpdate.birthday = birthday;
    if (comment !== null) dataToUpdate.comment = comment;
    // ✅ Mantener los archivos anteriores si no se subieron nuevos
    dataToUpdate.dniFile = dniFileUrl || existingUser?.dniFile || null;
    dataToUpdate.passport = passportFileUrl || existingUser?.passport || null;
    dataToUpdate.visa = visaFileUrl || existingUser?.visa || null;

    // 6️⃣ Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        phone: true,
        country: true,
        gender: true,
        lookingFor: true,
        singleStatus: true,
        affirmation: true,
        birthday: true,
        dniFile: true,
        passport: true,
        visa: true,
        comment: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Error actualizando usuario:", error);
    return NextResponse.json(
      { error: "Error al actualizar el usuario" },
      { status: 500 }
    );
  }
}
