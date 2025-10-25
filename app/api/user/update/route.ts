import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { promises as fs } from "fs";
import path from "path";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET no está definido en las variables de entorno");
}
const enc = new TextEncoder();

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

    const birthday = birthdayRaw ? new Date(birthdayRaw) : null;

    // 🔑 Archivos
    const dniFile = formData.get("dniFile") as File | null;
    const passportFile = formData.get("passportFile") as File | null;
    const visaFile = formData.get("visaFile") as File | null;

    // 3️⃣ Crear carpeta uploads si no existe
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    // 4️⃣ Guardar archivos si existen
    const saveFile = async (file: File | null, field: string) => {
      if (!file) return null;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const ext = path.extname(file.name) || ".jpg";
      const fileName = `${field}-${userId}-${Date.now()}${ext}`;
      const filePath = path.join(uploadsDir, fileName);

      await fs.writeFile(filePath, buffer);
      return `/uploads/${fileName}`; // ruta accesible públicamente
    };

    const [dniFileUrl, passportFileUrl, visaFileUrl] = await Promise.all([
      saveFile(dniFile, "dni"),
      saveFile(passportFile, "passport"),
      saveFile(visaFile, "visa"),
    ]);

    // 5️⃣ Construir objeto de actualización dinámico
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

    if (dniFileUrl) dataToUpdate.dniFile = dniFileUrl;
if (passportFileUrl) dataToUpdate.passport = passportFileUrl;
if (visaFileUrl) dataToUpdate.visa = visaFileUrl;


    // 6️⃣ Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
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
