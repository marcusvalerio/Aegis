import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { cuid } from "@/lib/cuid";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);
const MAX_SIZE = 8 * 1024 * 1024;

const S3_BUCKET = process.env.S3_BUCKET;
const S3_ENDPOINT = process.env.S3_ENDPOINT;
const S3_REGION = process.env.S3_REGION ?? "auto";
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;
const S3_PUBLIC_URL_BASE = process.env.S3_PUBLIC_URL_BASE;

const s3IsConfigured = Boolean(
  S3_BUCKET && S3_ENDPOINT && S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY && S3_PUBLIC_URL_BASE,
);

const s3Client = s3IsConfigured
  ? new S3Client({
      region: S3_REGION,
      endpoint: S3_ENDPOINT,
      credentials: { accessKeyId: S3_ACCESS_KEY_ID!, secretAccessKey: S3_SECRET_ACCESS_KEY! },
    })
  : null;

function extensionFor(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/heic") return "heic";
  return "jpg";
}

/**
 * Confirms the file's actual bytes match a known image format instead of
 * trusting the browser-reported MIME type or the filename extension, both
 * of which are trivially spoofable.
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

async function persistImage(buffer: Buffer, type: string, keyPrefix: string): Promise<string> {
  const filename = `${cuid()}.${extensionFor(type)}`;
  const key = `${keyPrefix}/${filename}`;

  if (s3Client) {
    await s3Client.send(
      new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, Body: buffer, ContentType: type }),
    );
    return `${S3_PUBLIC_URL_BASE!.replace(/\/$/, "")}/${key}`;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Armazenamento de imagens não configurado. Defina S3_BUCKET, S3_ENDPOINT, S3_ACCESS_KEY_ID, " +
        "S3_SECRET_ACCESS_KEY e S3_PUBLIC_URL_BASE antes de operar em produção — sem isso as imagens " +
        "seriam perdidas a cada reinício/deploy.",
    );
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", keyPrefix);
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);
  return `/uploads/${key}`;
}

/**
 * Persists a non-conformity photo and returns its public URL.
 *
 * Backed by S3-compatible object storage (R2, S3, etc.) when S3_* env vars
 * are set — required in production, since local disk in a container is
 * ephemeral and wiped on every redeploy/restart. Falls back to writing into
 * public/uploads only for local development without cloud credentials.
 */
export async function saveUploadedPhoto(file: File): Promise<string> {
  const buffer = await readAndValidateImage(file);
  return persistImage(buffer, file.type, "nc-photos");
}

/**
 * Persists a forklift's identification photo, namespaced under the owning
 * organization's id so objects from different tenants never share a path.
 * Same storage backend and production guarantees as saveUploadedPhoto.
 */
export async function saveForkliftImage(file: File, organizationId: string): Promise<string> {
  const buffer = await readAndValidateImage(file);
  return persistImage(buffer, file.type, `forklift-photos/${organizationId}`);
}
