"use client";

import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 8 * 1024 * 1024;

export function ForkliftImageField({ initialImageUrl }: { initialImageUrl?: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImageUrl ?? null);
  const [isLocalPreview, setIsLocalPreview] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFiles(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Selecione uma imagem JPG, PNG ou WEBP.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("A imagem deve ter no máximo 8MB.");
      return;
    }

    setError(null);
    setRemoved(false);
    setIsLocalPreview(true);
    setPreviewUrl((old) => {
      if (old && isLocalPreview) URL.revokeObjectURL(old);
      return URL.createObjectURL(file);
    });
  }

  function handleRemove() {
    setPreviewUrl((old) => {
      if (old && isLocalPreview) URL.revokeObjectURL(old);
      return null;
    });
    setIsLocalPreview(false);
    setRemoved(true);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <label className="font-aux text-xs font-medium uppercase tracking-wide text-black/60">
        Imagem da empilhadeira
      </label>

      <input
        ref={inputRef}
        type="file"
        name="photo"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input type="hidden" name="removeImage" value={removed ? "true" : "false"} />

      <div className="mt-1">
        {previewUrl ? (
          <div className="border border-black/10 bg-white">
            {/* Local preview / already-persisted photo — not a next/image
                asset, since a blob: object URL can't go through it. */}
            <div className="flex h-48 w-full items-center justify-center bg-tan p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Pré-visualização da empilhadeira" className="max-h-full max-w-full object-contain" />
            </div>
            <div className="flex divide-x divide-black/10 border-t border-black/10">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex-1 py-2.5 font-aux text-xs font-semibold uppercase tracking-wide text-black/70 hover:bg-tan/40"
              >
                Alterar imagem
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="flex-1 py-2.5 font-aux text-xs font-semibold uppercase tracking-wide text-red hover:bg-red/5"
              >
                Remover
              </button>
            </div>
            {isLocalPreview && (
              <p className="border-t border-black/10 px-3 py-1.5 font-aux text-[10px] uppercase tracking-wide text-black/40">
                Pré-visualização local — será enviada ao salvar
              </p>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-1.5 border border-dashed border-black/25 bg-white py-10 text-black/60 transition-colors hover:border-black/50 hover:text-black"
          >
            <ImagePlus size={20} aria-hidden="true" />
            <span className="font-sans text-sm font-semibold">+ Adicionar imagem</span>
            <span className="font-aux text-[11px] uppercase tracking-wide text-black/40">JPG, PNG ou WEBP · até 8MB</span>
          </button>
        )}
      </div>

      {error && <p className="mt-1.5 font-aux text-xs text-red">{error}</p>}
    </div>
  );
}
