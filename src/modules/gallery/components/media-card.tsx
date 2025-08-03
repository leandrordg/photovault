"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GalleryDeleteModal } from "@/modules/gallery/components/gallery-delete-modal";
import { Media } from "@/modules/gallery/types";
import { formatDuration } from "@/utils/format-duration";
import { formatFileSize } from "@/utils/format-file-size";
import {
  DownloadIcon,
  EyeIcon,
  HeartIcon,
  ImageIcon,
  LockIcon,
  PlayIcon,
  Trash2Icon,
  VideoIcon,
} from "lucide-react";
import Image from "next/image";
import { memo, useCallback } from "react";

interface Props {
  item: Media;
  isSelected?: boolean;
  showActions?: boolean;
  viewMode?: "masonry" | "grid";
  onSelect?: (item: Media) => void;
  onToggleFavorite: (item: Media) => void;
  onDelete: (item: Media) => void;
  onDownload: (item: Media) => void;
}

const CardActions = memo(function CardActions({
  item,
  onToggleFavorite,
  onDownload,
  onDelete,
}: {
  item: Media;
  onToggleFavorite: (item: Media) => void;
  onDownload: (item: Media) => void;
  onDelete: (item: Media) => void;
}) {
  const handleToggleFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleFavorite(item);
    },
    [item, onToggleFavorite]
  );

  const handleDownload = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDownload(item);
    },
    [item, onDownload]
  );

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <div className="flex gap-1">
      <Button
        size="sm"
        variant="ghost"
        className="size-7 p-0 hover:bg-white/20"
        onClick={handleToggleFavorite}
        aria-label="Toggle Favorite"
      >
        <HeartIcon
          className={cn(
            "size-4",
            item.isFavorite ? "fill-red-500 text-red-500" : "text-white"
          )}
        />
        <span className="sr-only">
          {item.isFavorite
            ? "Remover dos favoritos"
            : "Adicionar aos favoritos"}
        </span>
      </Button>

      <Button
        size="sm"
        variant="ghost"
        className="size-7 p-0 hover:bg-white/20"
        onClick={handleDownload}
        aria-label="Download"
      >
        <DownloadIcon className="size-4 text-white" />
        <span className="sr-only">Baixar</span>
      </Button>

      <div onClick={(e) => e.stopPropagation()}>
        <GalleryDeleteModal item={item} onDelete={onDelete}>
          <Button
            size="sm"
            variant="ghost"
            className="size-7 p-0 hover:bg-red-500/20"
            onClick={handleDeleteClick}
            aria-label="Delete"
          >
            <Trash2Icon className="size-4 text-white" />
            <span className="sr-only">Excluir</span>
          </Button>
        </GalleryDeleteModal>
      </div>
    </div>
  );
});

export const MediaCard = memo(function GalleryCard({
  item,
  isSelected = false,
  showActions = true,
  viewMode = "masonry",
  onToggleFavorite,
  onDelete,
  onSelect,
  onDownload,
}: Props) {
  const handleCardClick = useCallback(() => {
    onSelect?.(item);
  }, [onSelect, item]);

  return (
    <div
      className={cn(
        "relative group cursor-pointer rounded-lg transition-all duration-200 min-h-32",
        viewMode === "masonry" ? "break-inside-avoid" : "aspect-square",
        isSelected && "ring-2 ring-offset-2 ring-primary"
      )}
      onClick={handleCardClick}
    >
      <div
        className={cn(
          "relative w-full rounded-lg overflow-hidden",
          viewMode === "grid" && "h-full"
        )}
      >
        {item.mediaType === "image" ? (
          <div className="relative w-full h-full min-h-32 flex items-center justify-center bg-muted">
            <Image
              src={item.url}
              alt={item.filename}
              blurDataURL={item.blur || ""}
              width={item.width || 512}
              height={item.height || 512}
              className={cn(
                "relative z-10 transition-all duration-200 max-w-full max-h-full object-contain",
                viewMode === "masonry" ? "h-auto" : "h-full"
              )}
              placeholder="blur"
              loading="lazy"
              priority={false}
              unoptimized={false}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        ) : (
          <div
            className={cn("relative w-full", viewMode === "grid" && "h-full")}
          >
            {item.thumbnailUrl ? (
              <div className="relative w-full h-full min-h-32 flex items-center justify-center bg-muted">
                <Image
                  src={item.thumbnailUrl}
                  alt={`Thumbnail de ${item.filename}`}
                  blurDataURL={item.thumbnailBlur || ""}
                  width={item.width || 512}
                  height={item.height || 512}
                  className={cn(
                    "relative z-10 transition-all duration-200 max-w-full max-h-full object-contain",
                    viewMode === "masonry" ? "h-auto" : "h-full"
                  )}
                  placeholder="blur"
                  loading="lazy"
                />
              </div>
            ) : (
              <div
                className={cn(
                  "w-full bg-muted flex items-center justify-center",
                  viewMode === "masonry" ? "aspect-video" : "h-full"
                )}
              >
                <VideoIcon className="size-12 text-muted-foreground" />
              </div>
            )}

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/60 backdrop-blur-sm rounded-full p-3 transition-all duration-300 group-hover:bg-black/60 group-hover:backdrop-blur-lg z-20">
                <PlayIcon className="size-4 text-white fill-white" />
              </div>
            </div>

            {item.duration && (
              <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-md z-20">
                {formatDuration(item.duration)}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="absolute top-2 left-2 flex gap-2 z-20">
        <Badge
          variant="secondary"
          className="text-[10px] backdrop-blur-sm bg-black/60 text-white border-0"
          aria-label={item.mediaType === "image" ? "Imagem" : "Vídeo"}
        >
          {item.mediaType === "image" ? (
            <>
              <ImageIcon className="size-3" />
              IMG
              <span className="sr-only">Imagem</span>
            </>
          ) : (
            <>
              <VideoIcon className="size-3" />
              VID
              <span className="sr-only">Vídeo</span>
            </>
          )}
        </Badge>

        {item.isPublic !== undefined && (
          <Badge
            variant={item.isPublic ? "secondary" : "default"}
            aria-label={item.isPublic ? "Público" : "Privado"}
            className="text-[10px] backdrop-blur-sm bg-black/60 text-white border-0"
          >
            {item.isPublic ? (
              <EyeIcon className="size-3" />
            ) : (
              <LockIcon className="size-3" />
            )}
            <span className="sr-only">
              {item.isPublic ? "Público" : "Privado"}
            </span>
          </Badge>
        )}
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg flex items-end z-10">
        <div className="p-3 w-full">
          {item.title && (
            <h3 className="font-semibold text-sm text-white truncate">
              {item.title}
            </h3>
          )}

          <div className="flex items-center justify-between flex-wrap-reverse">
            <div className="flex gap-2 text-[10px] text-muted">
              <span className="bg-black/60 px-2 py-1 rounded">
                {formatFileSize(item.fileSize)}
              </span>

              {item.width && item.height && (
                <span className="bg-black/60 px-2 py-1 rounded">
                  {item.width}×{item.height}
                </span>
              )}
            </div>

            {showActions && (
              <CardActions
                item={item}
                onToggleFavorite={onToggleFavorite}
                onDownload={onDownload}
                onDelete={onDelete}
              />
            )}
          </div>
        </div>
      </div>

      {item.isFavorite && (
        <div className="absolute top-2 right-2 text-red-500 z-20">
          <HeartIcon className="size-5 fill-current" />
        </div>
      )}
    </div>
  );
});
