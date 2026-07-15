import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "turfs");
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function saveUploadedImages(files: File[]): Promise<{ paths: string[]; error?: string }> {
  const validFiles = files.filter((file) => file.size > 0);
  if (validFiles.length === 0) return { paths: [] };

  for (const file of validFiles) {
    if (!file.type.startsWith("image/")) {
      return { paths: [], error: `"${file.name}" is not an image file.` };
    }
    if (file.size > MAX_FILE_SIZE) {
      return { paths: [], error: `"${file.name}" is larger than 5MB.` };
    }
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const paths: string[] = [];
  for (const file of validFiles) {
    const ext = path.extname(file.name) || ".jpg";
    const filename = `${randomUUID()}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(UPLOAD_DIR, filename), buffer);
    paths.push(`/uploads/turfs/${filename}`);
  }
  return { paths };
}
