import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { cuid } from "@/lib/cuid";
import { deleteForkliftObject, uploadForkliftObject } from "@/lib/supabase-storage";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);
const MAX_SIZE = 8 * 1024 * 1024;

function extensionFor(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/heic") return "heic";
  return "jpg";
}

/**
 * Confirms the file's actual bytes match a known image format instead of
 * trusting the browser-reported MIME type or the filename extension.
 */
function matchesImageSignature(type: string, bytes: Buffer): boolean {
  if (bytes.length < 12) return false;
  switch (type) {
    case "image/jpeg":
      return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case "image/png":
      return (
        bytes[0] === 0x89 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x4e &&
        bytes[3] === 0x47 &&
        bytes[4] === 0x0d &&
        bytes[5] === 0x0a &&
        bytes[6] === 0x1a &&
        bytes[7] === 0x0a
      );
    case "image/webp":
      return bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
    case "image/heic":
      return bytes.toString("ascii", 4, 8) === "ftyp";
    default:
      return false;
  }
}

async function readAndValidateImage(file: File): Promise<Buffer> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Formato de imagem não suportado.");
  }
  if (file.size > MAX_SIZE) {
    throw new Error("Imagem excede o tamanho máximo de 8MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!matchesImageSignature(file.type, buffer)) {
    throw new Error("O arquivo enviado não é uma imagem válida.");
  }

  return buffer;
}

async function persistImage(
  buffer: Buffer,
  type: string,
  keyPrefix: string,
  localFallbackPrefix: string,
): Promise<string> {
  const filename = `${cuid()}.${extensionFor(type)}`;
  const key = `${keyPrefix}/${filename}`;

  if (process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)) {
    return uploadForkliftObject(key, buffer, type);
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Armazenamento de imagens não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_SECRET_KEY) antes de operar em produção.",
    );
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", localFallbackPrefix);
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);
  return `/uploads/${localFallbackPrefix}/${filename}`;
}

/**
 * Persists a non-conformity photo. In production this uses the same private
 * Supabase bucket as forklift photos, with a separate organization namespace.
 */
export async function saveUploadedPhoto(file: File, organizationId: string): Promise<string> {
  const buffer = await readAndValidateImage(file);
  return persistImage(buffer, file.type, `nc-photos/${organizationId}`, `nc-photos/${organizationId}`);
}

/**
 * Persists a forklift identification photo under the owning organization.
 * The returned value is an object path, not a public URL.
 */
export async function saveForkliftImage(file: File, organizationId: string): Promise<string> {
  const buffer = await readAndValidateImage(file);
  return persistImage(buffer, file.type, organizationId, `forklift-photos/${organizationId}`);
}

/**
 * Removes a Supabase forklift object after the database reference is no
 * longer needed. Local development files are left alone because they are
 * disposable and are outside the cloud bucket.
 */
export async function removeForkliftImage(imagePath: string | null | undefined, organizationId: string) {
  if (!imagePath || !imagePath.startsWith(`${organizationId}/`)) return;
  if (!process.env.SUPABASE_URL || !(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)) return;

  await deleteForkliftObject(imagePath);
}
