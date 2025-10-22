import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { uploadToCloudinary } from "@/app/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const fileBlob = formData.get("image") as Blob | null;
    const userId = formData.get("userId") as string | null;

    if (!fileBlob || !userId) {
      return NextResponse.json({ error: "Missing file or userId" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Seguridad: si no tiene galleryImages inicializamos como array vacío
    const galleryImages = user.galleryImages || [];

    if (galleryImages.length >= 3) {
      return NextResponse.json({
        error: "Máximo 3 imágenes permitidas. Elimine alguna antes de subir otra.",
      }, { status: 400 });
    }

    // Convertimos Blob a Buffer para subir a Cloudinary
    const blob = formData.get("image") as Blob;
const file = new File([blob], "upload.jpg", { type: blob.type });

    const cloudinaryRes = await uploadToCloudinary(file, {
  folder: `users/${userId}/gallery`,
  resource_type: "image",
  access: "public",
});

    const fileUrl = cloudinaryRes.secure_url;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { galleryImages: { push: fileUrl } },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId, imageUrl } = await req.json();

    if (!userId || !imageUrl) {
      return NextResponse.json({ error: "Missing userId or imageUrl" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updatedGallery = (user.galleryImages || []).filter((img) => img !== imageUrl);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { galleryImages: updatedGallery },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
