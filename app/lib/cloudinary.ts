import {
  v2 as cloudinary,
  type UploadApiResponse,
  type UploadApiErrorResponse,
  type UploadApiOptions,
} from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
});

export default cloudinary;


export async function uploadToCloudinary(
  file: File | Blob,
  options?: UploadApiOptions
): Promise<UploadApiResponse> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      options ?? {},
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error || !result) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}
