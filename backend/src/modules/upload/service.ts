import cloudinary from "../../config/cloudinary";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

export async function upload(
  file: File,
  folder: string
) {
  const buffer = Buffer.from(
    await file.arrayBuffer()
  );

  try {
    const res = await new Promise<{
      url: string;
      publicId: string;
    }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
        },
        (error, result) => {
          if (error || !result) {
            return reject(error);
          }

          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      );

      stream.end(buffer);
    });
    return res;
  } catch (err) {
    // Development local storage fallback
    const uploadsDir = join(process.cwd(), "public", "uploads", folder);
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }
    const ext = file.name?.split(".").pop() || "jpg";
    const filename = `${Date.now()}-${randomUUID()}.${ext}`;
    const filePath = join(uploadsDir, filename);
    writeFileSync(filePath, buffer);

    const publicUrl = `http://localhost:3000/uploads/${folder}/${filename}`;
    return {
      url: publicUrl,
      publicId: `local_${folder}_${filename}`,
    };
  }
}

