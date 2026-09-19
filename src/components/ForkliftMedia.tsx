import Image from "next/image";
import clsx from "clsx";
import { ForkliftGraphic } from "@/components/ForkliftGraphic";

/**
 * Single entry point for equipment imagery across the product. Server pages
 * resolve private Supabase object paths into short-lived signed URLs before
 * passing them here. Until a photo exists it falls back to the vector
 * illustration so every screen remains asset-ready.
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
    // Signed Supabase URLs are external to the Next.js origin, so skip the
    // optimizer and avoid coupling deployment config to an image hostname.
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
