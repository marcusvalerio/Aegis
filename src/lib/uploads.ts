import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { cuid } from "@/lib/cuid";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);

export async function saveUploadedPhoto(file: File): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Formato de imagem não suportado.");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Imagem excede o tamanho máximo de 8MB.");
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const filename = `${cuid()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return `/uploads/${filename}`;
}
