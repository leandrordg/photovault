"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";
import { EyeIcon, HeartIcon, LockIcon } from "lucide-react";
import Image from "next/image";
import { useQueryState } from "nuqs";

interface Props {
  images: inferRouterOutputs<AppRouter>["images"]["list"];
}

export function ImageGallery({ images }: Props) {
  const [selectedImages, setSelectedImages] = useQueryState("selected");
  const [selectedImage, setSelectedImage] = useQueryState("image");

  const handleImageClick = (img: Props["images"][number]) => {
    setSelectedImage((prev) => (prev === img.id ? null : img.id));
  };

  return (
    <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
      {images.map((image) => (
        <div
          key={image.id}
          className={cn(
            "relative group break-inside-avoid cursor-pointer rounded-md transition-all duration-200",
            "hover:shadow-xl",
            selectedImage === image.id &&
              "ring-2 ring-offset-2 ring-muted-foreground"
          )}
          onClick={() => handleImageClick(image)}
        >
          <Image
            src={image.url}
            alt={image.title || image.filename}
            blurDataURL={image.blur || ""}
            width={image.width || 512}
            height={image.height || 512}
            className="w-full h-auto rounded-lg transition-all duration-200"
            placeholder="blur"
            loading="lazy"
          />

          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg flex items-end">
            <div className="p-2 w-full">
              {image.title && (
                <h3 className="font-semibold text-sm mb-1 text-white truncate">
                  {image.title}
                </h3>
              )}
              {image.description && (
                <p className="text-xs text-gray-200 line-clamp-2 mb-2">
                  {image.description}
                </p>
              )}
              <div className="flex justify-between items-center text-xs text-white/90">
                <div>
                  {image.width && image.height && (
                    <span className="bg-black/20 px-2 py-1 rounded">
                      {image.width} × {image.height}
                    </span>
                  )}
                </div>
                {image.fileSize && (
                  <span className="bg-black/20 px-2 py-1 rounded">
                    {(image.fileSize / 1024 / 1024).toFixed(1)} MB
                  </span>
                )}
              </div>
            </div>
          </div>

          {image.isFavorite && (
            <div className="absolute top-2 right-2 bg-yellow-500/90 backdrop-blur-sm text-white p-1.5 rounded-full shadow-lg">
              <HeartIcon className="fill-current" />
            </div>
          )}

          <div className="absolute top-2 left-2">
            {image.isPublic ? (
              <Badge variant="secondary">
                <EyeIcon />
                Público
              </Badge>
            ) : (
              <Badge variant="default">
                <LockIcon />
                Privado
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
