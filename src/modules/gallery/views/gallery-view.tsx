"use client";

import { MultipleMediaUpload } from "@/components/media-uploader";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { GalleryCard } from "@/modules/gallery/components/gallery-card";
import { useGalleryFilters } from "@/modules/gallery/hooks/use-gallery-filter";
import { Media } from "@/modules/gallery/types";
import { useTRPC } from "@/trpc/client";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  Grid3X3Icon,
  HeartIcon,
  ImageIcon,
  LayoutGridIcon,
  VideoIcon,
} from "lucide-react";
import { useState } from "react";

export function GalleryView() {
  const [filters, setFilters] = useGalleryFilters();
  const [viewMode, setViewMode] = useState<"masonry" | "grid">("masonry");
  const [selectedItem, setSelectedItem] = useState<Media | null>(null);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: mediaItems } = useSuspenseQuery(
    trpc.media.list.queryOptions({ ...filters })
  );

  const { mutate: toggleFavorite } = useMutation(
    trpc.media.toggleFavorite.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.media.list.queryOptions({ ...filters })
        );
      },
    })
  );

  const { mutate: downloadMedia } = useMutation(
    trpc.media.download.mutationOptions()
  );

  const { mutate: deleteMedia } = useMutation(
    trpc.media.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.media.list.queryOptions({ ...filters })
        );
      },
    })
  );

  const handleDownloadMedia = (item: Media) => {
    downloadMedia({ id: item.id });
  };

  const handleToggleFavorite = (item: Media) => {
    toggleFavorite({ id: item.id });
  };

  const handleDeleteMedia = (item: Media) => {
    deleteMedia({ id: item.id });
  };

  const handleMediaSelect = (item: Media) => {
    setSelectedItem(item);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-4">
      <MultipleMediaUpload allowedTypes="all" />

      <ScrollArea className="pb-3">
        <ScrollBar orientation="horizontal" />
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <Button
              variant={filters.mediaType === "all" ? "default" : "secondary"}
              onClick={() => setFilters({ ...filters, mediaType: "all" })}
            >
              Todos
            </Button>
            <Button
              variant={filters.mediaType === "image" ? "default" : "secondary"}
              onClick={() => setFilters({ ...filters, mediaType: "image" })}
            >
              <ImageIcon className="size-4" />
              Imagens
            </Button>
            <Button
              variant={filters.mediaType === "video" ? "default" : "secondary"}
              onClick={() => setFilters({ ...filters, mediaType: "video" })}
            >
              <VideoIcon className="size-4" />
              Vídeos
            </Button>
            <Button
              variant={filters.showFavorites ? "default" : "secondary"}
              onClick={() =>
                setFilters({
                  ...filters,
                  showFavorites: !filters.showFavorites,
                })
              }
            >
              <HeartIcon
                className={cn(
                  "size-4",
                  filters.showFavorites && "fill-current"
                )}
              />
              Favoritos
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant={viewMode === "masonry" ? "default" : "secondary"}
              onClick={() => setViewMode("masonry")}
              aria-label="Masonry View"
            >
              <Grid3X3Icon />
              <span className="sr-only">Mosaico</span>
            </Button>
            <Button
              size="sm"
              variant={viewMode === "grid" ? "default" : "secondary"}
              onClick={() => setViewMode("grid")}
              aria-label="Grid View"
            >
              <LayoutGridIcon />
              <span className="sr-only">Grade</span>
            </Button>
          </div>
        </div>
      </ScrollArea>

      {mediaItems && mediaItems.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {mediaItems.length} {mediaItems.length === 1 ? "item" : "itens"}{" "}
          encontrado{mediaItems.length === 1 ? "" : "s"}
        </div>
      )}

      {mediaItems?.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground space-y-2">
          <div className="flex justify-center">
            <div className="p-3 bg-muted rounded-full">
              <ImageIcon className="size-6" />
            </div>
          </div>
          <p className="font-medium">Nenhuma mídia encontrada</p>
          <p className="text-sm">
            {filters.showFavorites
              ? "Você ainda não tem mídias favoritadas."
              : "Faça upload de algumas fotos ou vídeos para começar!"}
          </p>
        </div>
      ) : (
        <div
          className={cn(
            "gap-4 space-y-4",
            viewMode === "masonry"
              ? "columns-1 xs:columns-2 md:columns-3 lg:columns-4"
              : "grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 space-y-0"
          )}
        >
          {mediaItems.map((item) => (
            <GalleryCard
              item={item}
              key={item.id}
              viewMode={viewMode}
              onSelect={handleMediaSelect}
              onToggleFavorite={handleToggleFavorite}
              onDelete={handleDeleteMedia}
              onDownload={handleDownloadMedia}
            />
          ))}
        </div>
      )}
    </div>
  );
}
