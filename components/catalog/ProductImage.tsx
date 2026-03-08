"use client";

import { useState } from "react";
import Image from "next/image";

type ProductImageProps = {
  src: string | null;
  alt: string;
};

export function ProductImage({ src, alt }: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center rounded-[1.5rem] bg-placeholder text-center text-sm font-medium text-muted">
        Sem imagem
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-placeholder">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        className="object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
