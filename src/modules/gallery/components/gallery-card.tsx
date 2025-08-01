"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Media } from "@/modules/gallery/types";
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

interface Props {
  item: Media;
  isSelected?: boolean;
  showActions?: boolean;
  viewMode?: "masonry" | "grid";
  onSelect: (item: Media) => void;
  onToggleFavorite: (item: Media) => void;
  onDelete: (item: Media) => void;
  onDownload: (item: Media) => void;
}

export function GalleryCard({
  item,
  isSelected = false,
  showActions = true,
  viewMode = "masonry",
  onSelect,
  onToggleFavorite,
  onDelete,
  onDownload,
}: Props) {
  const handleClick = () => {
    onSelect(item);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(item);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Tem certeza que deseja deletar este arquivo?")) {
      onDelete(item);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    onDownload(item);
  };

  return (
    <div
      className={cn(
        "relative group cursor-pointer rounded-lg transition-all duration-200",
        viewMode === "masonry" ? "break-inside-avoid" : "aspect-square",
        isSelected && "ring-2 ring-offset-2 ring-primary"
      )}
      onClick={handleClick}
    >
      <div
        className={cn(
          "relative w-full rounded-lg overflow-hidden bg-muted",
          viewMode === "grid" && "h-full"
        )}
      >
        {item.mediaType === "image" ? (
          <Image
            src={item.url}
            alt={item.title || item.filename}
            blurDataURL={item.blur || ""}
            width={item.width || 512}
            height={item.height || 512}
            className={cn(
              "w-full transition-all duration-200",
              viewMode === "masonry" ? "h-auto" : "h-full object-cover"
            )}
            placeholder="blur"
            loading="lazy"
          />
        ) : (
          <div
            className={cn("relative w-full", viewMode === "grid" && "h-full")}
          >
            {item.thumbnailUrl ? (
              <Image
                src={item.thumbnailUrl}
                alt={`Thumbnail de ${item.filename}`}
                blurDataURL={item.thumbnailBlur || ""}
                width={item.width || 512}
                height={item.height || 512}
                className={cn(
                  "w-full transition-all duration-200",
                  viewMode === "masonry" ? "h-auto" : "h-full object-cover"
                )}
                placeholder="blur"
                loading="lazy"
              />
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
              <div className="bg-black/60 backdrop-blur-sm rounded-full p-4 transition-all duration-200 group-hover:bg-black/80 group-hover:scale-110">
                <PlayIcon className="size-4 text-white fill-white" />
              </div>
            </div>

            {item.duration && (
              <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md">
                {formatDuration(item.duration)}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg flex items-end">
        <div className="p-3 w-full">
          {item.title && (
            <h3 className="font-semibold text-sm mb-1 text-white truncate">
              {item.title}
            </h3>
          )}

          <div className="flex justify-between items-end">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-300 truncate mb-1">
                {item.filename}
              </p>
              <div className="flex gap-2 text-xs text-gray-300">
                <span className="bg-black/40 px-2 py-1 rounded">
                  {formatFileSize(item.fileSize)}
                </span>
                {item.width && item.height && (
                  <span className="bg-black/40 px-2 py-1 rounded">
                    {item.width}×{item.height}
                  </span>
                )}
              </div>
            </div>

            {showActions && (
              <div className="flex gap-1 ml-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="size-8 p-0 hover:bg-white/20"
                  onClick={handleToggleFavorite}
                  aria-label="Toggle Favorite"
                >
                  <HeartIcon
                    className={cn(
                      "size-4",
                      item.isFavorite
                        ? "fill-red-500 text-red-500"
                        : "text-white"
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
                  className="size-8 p-0 hover:bg-white/20"
                  onClick={handleDownload}
                  aria-label="Download"
                >
                  <DownloadIcon className="size-4 text-white" />
                  <span className="sr-only">Baixar</span>
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  className="size-8 p-0 hover:bg-red-500/20"
                  onClick={handleDelete}
                  aria-label="Delete"
                >
                  <Trash2Icon className="size-4 text-white" />
                  <span className="sr-only">Excluir</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="absolute top-2 left-2 flex gap-2">
        <Badge
          variant="secondary"
          className="backdrop-blur-sm bg-black/60 text-white border-0"
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
            className="backdrop-blur-sm bg-black/60 text-white border-0"
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

      {item.isFavorite && (
        <div className="absolute top-2 right-2 text-red-500">
          <HeartIcon className="size-5 fill-current" />
        </div>
      )}
    </div>
  );
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function formatFileSize(bytes: number): string {
  const sizes = ["B", "KB", "MB", "GB"];
  if (bytes === 0) return "0 B";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
}
