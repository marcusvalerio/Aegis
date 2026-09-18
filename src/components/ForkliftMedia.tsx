import Image from "next/image";
import clsx from "clsx";
import { ForkliftGraphic } from "@/components/ForkliftGraphic";

/**
 * Single entry point for equipment imagery across the product. Once a real
 * photo is registered on `forklift.imageUrl` it takes over automatically —
 * nothing else in the UI needs to change. Until then it falls back to the
 * vector illustration so every screen is already asset-ready.
 */
export function ForkliftMedia({
  imageUrl,
  typeKey,
  alt,
  className,
  fit = "cover",
}: {
  imageUrl?: string | null;
  typeKey: string;
  alt: string;
  className?: string;
  fit?: "cover" | "contain";
}) {
  if (imageUrl) {
    // External URLs (S3/R2 photos, admin-supplied links) skip Next's image
    // optimizer — its domain allowlist can't be pre-configured for an
    // S3_PUBLIC_URL_BASE the deployer sets after the fact.
    const isExternal = /^https?:\/\//.test(imageUrl);
    return (
      <div className={clsx("relative overflow-hidden", className)}>
        <Image
          src={imageUrl}
          alt={alt}
          fill
          unoptimized={isExternal}
          sizes="(min-width: 1024px) 400px, 90vw"
          className={fit === "cover" ? "object-cover" : "object-contain"}
        />
      </div>
    );
  }

  return (
    <div className={clsx("flex items-center justify-center", className)}>
      <ForkliftGraphic typeKey={typeKey} className="h-full w-full" />
    </div>
  );
}
