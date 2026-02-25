import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadFile(
  file: Buffer,
  fileName: string,
  folder: string
) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `landlord-management/${folder}`,
        resource_type: "auto",
        public_id: fileName,
        overwrite: true,
      },
      (error, result) => {
        if (error) {
          console.error("[v0] Cloudinary upload error:", error);
          reject(error);
        } else {
          console.log("[v0] File uploaded to Cloudinary:", result?.secure_url);
          resolve(result?.secure_url);
        }
      }
    );

    uploadStream.end(file);
  });
}

export async function deleteFile(publicId: string) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("[v0] File deleted from Cloudinary:", publicId);
    return result;
  } catch (error) {
    console.error("[v0] Error deleting file from Cloudinary:", error);
    throw error;
  }
}

export function extractPublicIdFromUrl(url: string): string {
  // Extract public ID from Cloudinary URL
  // Format: https://res.cloudinary.com/{cloud}/image/upload/v{version}/{public_id}
  const parts = url.split("/");
  const lastPart = parts[parts.length - 1];
  return lastPart.split(".")[0];
}
