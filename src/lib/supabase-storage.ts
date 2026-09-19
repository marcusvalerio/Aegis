const BUCKET = "forklift-images";

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error(
      "Armazenamento de imagens não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_SECRET_KEY) antes de operar com imagens.",
    );
  }

  return { url, key };
}

function objectUrl(baseUrl: string, path: string) {
  return `${baseUrl}/storage/v1/object/${BUCKET}/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

function headers(key: string, extra?: HeadersInit) {
  return {
    Authorization: `Bearer ${key}`,
    apikey: key,
    ...extra,
  };
}

async function assertResponse(response: Response, operation: string) {
  if (response.ok) return;

  const body = await response.text().catch(() => "");
  throw new Error(
    `Falha ao ${operation} no Supabase Storage (${response.status}).${body ? ` ${body}` : ""}`,
  );
}

export async function uploadForkliftObject(
  path: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  const { url, key } = config();

  const response = await fetch(objectUrl(url, path), {
    method: "POST",
    headers: headers(key, {
      "Content-Type": contentType,
      "Cache-Control": "3600",
      "x-upsert": "false",
    }),
    body,
  });

  await assertResponse(response, "enviar a imagem");
  return path;
}

export async function deleteForkliftObject(path: string): Promise<void> {
  const { url, key } = config();

  const response = await fetch(objectUrl(url, path), {
    method: "DELETE",
    headers: headers(key),
  });

  await assertResponse(response, "remover a imagem");
}

export async function createForkliftSignedUrl(path: string, expiresIn = 60 * 60): Promise<string> {
  const { url, key } = config();
  const endpoint = `${url}/storage/v1/object/sign/${BUCKET}/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: headers(key, { "Content-Type": "application/json" }),
    body: JSON.stringify({ expiresIn }),
  });

  await assertResponse(response, "gerar a URL assinada");

  const data = (await response.json()) as { signedURL?: string };
  if (!data.signedURL) {
    throw new Error("Supabase não retornou uma URL assinada para a imagem.");
  }

  return data.signedURL.startsWith("http")
    ? data.signedURL
    : `${url}/storage/v1${data.signedURL}`;
}

/**
 * Resolves a stored forklift image reference into a browser-safe URL.
 *
 * New records store only a Supabase Storage object path, namespaced by the
 * owning organization. Legacy absolute/local URLs are preserved temporarily
 * so existing records do not break during the migration.
 */
export async function resolveForkliftImageUrl(
  imagePath: string | null | undefined,
  organizationId: string,
): Promise<string | null> {
  if (!imagePath) return null;

  if (/^https?:\\/\\//.test(imagePath) || imagePath.startsWith("/")) {
    return imagePath;
  }

  const expectedPrefix = `${organizationId}/`;
  if (!imagePath.startsWith(expectedPrefix)) {
    return null;
  }

  return createForkliftSignedUrl(imagePath);
}

export function isSupabaseForkliftPath(
  imagePath: string | null | undefined,
  organizationId: string,
): imagePath is string {
  return Boolean(imagePath?.startsWith(`${organizationId}/`));
}
