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
 * Persists a non-conformity photo and returns its public URL.
 *
 * Backed by S3-compatible object storage (R2, S3, etc.) when S3_* env vars
 * are set — required in production, since local disk in a container is
 * ephemeral and wiped on every redeploy/restart. Falls back to writing into
 * public/uploads only for local development without cloud credentials.
 */
export async function saveUploadedPhoto(file: File): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Formato de imagem não suportado.");
  }
  if (file.size > MAX_SIZE) {
    throw new Error("Imagem excede o tamanho máximo de 8MB.");
  }

  const filename = `${cuid()}.${extensionFor(file.type)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (s3Client) {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: `nc-photos/${filename}`,
        Body: buffer,
        ContentType: file.type,
      }),
    );
    return `${S3_PUBLIC_URL_BASE!.replace(/\/$/, "")}/nc-photos/${filename}`;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Armazenamento de fotos não configurado. Defina S3_BUCKET, S3_ENDPOINT, S3_ACCESS_KEY_ID, " +
        "S3_SECRET_ACCESS_KEY e S3_PUBLIC_URL_BASE antes de operar em produção — sem isso as fotos " +
        "seriam perdidas a cada reinício/deploy.",
    );
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);
  return `/uploads/${filename}`;
}
