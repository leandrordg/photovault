"use client";

import { MultipleImageUpload } from "@/components/image-uploader";
import { ImageGallery } from "@/modules/gallery/components/image-gallery";
import { ImageSheet } from "@/modules/gallery/components/image-sheet";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";

export function GalleryView() {
  const trpc = useTRPC();

  const { data: images } = useSuspenseQuery(trpc.images.list.queryOptions());

  return (
    <div className="relative p-4 max-w-4xl mx-auto space-y-8">
      <MultipleImageUpload />

      <ImageGallery images={images} />

      <ImageSheet />
    </div>
  );
}
