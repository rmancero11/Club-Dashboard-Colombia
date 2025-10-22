import {
  v2 as cloudinary,
  type UploadApiResponse,
  type UploadApiErrorResponse,
  type UploadApiOptions,
} from "cloudinary";

const PRIVATE_CDN =
  String(process.env.CLOUDINARY_PRIVATE_CDN || "").toLowerCase() === "true";
const SECURE_DISTRIBUTION = process.env.CLOUDINARY_SECURE_DISTRIBUTION || undefined;
const CNAME = process.env.CLOUDINARY_CNAME || undefined;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
  private_cdn: PRIVATE_CDN || undefined,
  secure_distribution: SECURE_DISTRIBUTION,
  cname: CNAME,
});

export default cloudinary;

// ---------- Helpers ----------
function inferExt(name?: string | null) {
  const m = (name || "").toLowerCase().match(/\.([a-z0-9]+)$/i);
  return m ? m[1] : "";
}
function inferMimeFromExt(ext: string) {
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "bmp":
      return "image/bmp";
    case "avif":
      return "image/avif";
    case "pdf":
      return "application/pdf";
    case "mp4":
      return "video/mp4";
    case "webm":
      return "video/webm";
    case "ogg":
      return "video/ogg";
    default:
      return "application/octet-stream";
  }
}
function pickResourceType(mime: string): "image" | "video" | "raw" {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return "raw";
}
function mapAccessToType(access?: "public" | "authenticated" | "private") {
  switch (access) {
    case "authenticated":
      return "authenticated";
    case "private":
      return "private";
    default:
      return "upload";
  }
}

export type SmartUploadOptions = {
  resource_type?: "image" | "video" | "raw";
  access?: "public" | "authenticated" | "private";
  folder?: string;
  filename?: string;
  cloudinary?: UploadApiOptions;
};

export async function uploadToCloudinary(
  file: File | Blob,
  opts: SmartUploadOptions = {}
): Promise<UploadApiResponse> {
  const asFile = file as File;
  const name = typeof asFile?.name === "string" ? asFile.name : opts.filename || undefined;
  const ext = inferExt(name);
  const mime = (file as any).type || inferMimeFromExt(ext);

  const resource_type = opts.resource_type || pickResourceType(mime);
  const type = mapAccessToType(opts.access);
  const folder = opts.folder ?? (resource_type === "raw" ? "docs" : "uploads");

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const baseOptions: UploadApiOptions = {
    resource_type,
    type,
    folder,
    use_filename: Boolean(name),
    unique_filename: true,
    filename_override: name,
  };
  const options: UploadApiOptions = { ...baseOptions, ...(opts.cloudinary || {}) };

  return new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      options,
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error || !result) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

// 👉 Dejamos de reescribir PDFs a raw
export function toRawPdfUrl(originalUrl: string) {
  return originalUrl;
}
