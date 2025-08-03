"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Media } from "@/modules/gallery/types";
import { formatDuration } from "@/utils/format-duration";
import { formatFileSize } from "@/utils/format-file-size";
import {
  CalendarIcon,
  DownloadIcon,
  ExternalLinkIcon,
  EyeIcon,
  HeartIcon,
  ImageIcon,
  LockIcon,
  PlayIcon,
  Trash2Icon,
  VideoIcon,
  XIcon,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { GalleryDeleteModal } from "./gallery-delete-modal";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  media: Media | null;
  onToggleFavorite?: (media: Media) => void;
  onDownload?: (media: Media) => void;
  onDelete?: (media: Media) => void;
}

export function MediaSheet({
  open,
  onOpenChange,
  media,
  onToggleFavorite,
  onDownload,
  onDelete,
}: Props) {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  if (!media) return null;

  const handleToggleFavorite = () => {
    if (onToggleFavorite) onToggleFavorite(media);
  };

  const handleDownload = () => {
    if (onDownload) onDownload(media);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(media);
      onOpenChange(false);
    }
  };

  const handleOpenInNewTab = () => {
    window.open(media.url, "_blank", "noopener,noreferrer");
  };

  const handlePlayVideo = () => {
    setIsVideoPlaying(true);
  };

  const handleStopVideo = () => {
    setIsVideoPlaying(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent showCloseButton={false} className="gap-0 p-0">
        <ResizablePanelGroup direction="vertical" className="h-full">
          <ResizablePanel
            defaultSize={50}
            minSize={20}
            maxSize={80}
            className="flex flex-col"
          >
            <div className="relative bg-muted h-full flex items-center justify-center overflow-hidden">
              {media.mediaType === "image" ? (
                <Image
                  src={media.url}
                  alt={media.filename}
                  width={media.width || 512}
                  height={media.height || 512}
                  className="w-full h-full object-contain"
                  priority
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                  }}
                />
              ) : (
                <div className="relative w-full h-full bg-black/50 flex items-center justify-center">
                  {isVideoPlaying ? (
                    <div className="relative w-full h-full">
                      <video
                        src={media.url}
                        controls
                        autoPlay
                        className="w-full h-full object-contain"
                        onEnded={handleStopVideo}
                        onError={handleStopVideo}
                      >
                        Seu navegador não suporta a reprodução de vídeo.
                      </video>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleStopVideo}
                        className="absolute top-3 right-3 bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm"
                      >
                        <XIcon />
                      </Button>
                    </div>
                  ) : (
                    <>
                      {media.thumbnailUrl ? (
                        <Image
                          src={media.thumbnailUrl}
                          alt={`Thumbnail de ${media.filename}`}
                          width={media.width || 512}
                          height={media.height || 512}
                          className="w-full h-full object-contain opacity-75"
                          style={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                          }}
                        />
                      ) : (
                        <VideoIcon className="size-16 text-muted-foreground" />
                      )}

                      <div className="absolute inset-0 flex items-center justify-center">
                        <Button
                          size="lg"
                          onClick={handlePlayVideo}
                          className="bg-black/60 backdrop-blur-sm rounded-full size-12 hover:bg-black/80 transition-all duration-300 hover:scale-110"
                        >
                          <PlayIcon className="size-6 text-white fill-white" />
                        </Button>
                      </div>

                      {media.duration && (
                        <div className="absolute bottom-3 right-3 bg-black/80 text-white text-xs px-2 py-1 rounded">
                          {formatDuration(media.duration)}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel
            defaultSize={50}
            minSize={20}
            className="flex flex-col"
          >
            <div className="flex flex-col h-full">
              <SheetHeader className="space-y-3 p-4 border-b">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="w-fit">
                    {media.mediaType === "image" ? (
                      <>
                        <ImageIcon className="size-3 mr-1" />
                        IMG
                      </>
                    ) : (
                      <>
                        <VideoIcon className="size-3 mr-1" />
                        VID
                      </>
                    )}
                  </Badge>

                  {media.isPublic !== undefined && (
                    <Badge variant={media.isPublic ? "secondary" : "default"}>
                      {media.isPublic ? (
                        <>
                          <EyeIcon className="size-3 mr-1" />
                          Público
                        </>
                      ) : (
                        <>
                          <LockIcon className="size-3 mr-1" />
                          Privado
                        </>
                      )}
                    </Badge>
                  )}

                  {media.isFavorite && (
                    <Badge
                      variant="outline"
                      className="text-red-600 border-red-200"
                    >
                      <HeartIcon className="size-3 mr-1 fill-current" />
                      Favorito
                    </Badge>
                  )}
                </div>

                <SheetTitle className="text-left text-sm sm:text-base">
                  {media.title || media.filename}
                </SheetTitle>

                {media.description && (
                  <SheetDescription className="text-left">
                    {media.description}
                  </SheetDescription>
                )}
              </SheetHeader>

              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  <div>
                    <h3 className="font-semibold text-sm mb-3">
                      Detalhes do arquivo
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Nome:</span>
                        <span className="font-mono text-right break-all max-w-[250px]">
                          {media.filename}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tamanho:</span>
                        <span>{formatFileSize(media.fileSize)}</span>
                      </div>

                      {media.width && media.height && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Dimensões:
                          </span>
                          <span>
                            {media.width} × {media.height} px
                          </span>
                        </div>
                      )}

                      {media.duration && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Duração:
                          </span>
                          <span>{formatDuration(media.duration)}</span>
                        </div>
                      )}

                      {media.uploadedAt && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Enviado em:
                          </span>
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="size-3" />
                            {new Date(media.uploadedAt).toLocaleString("pt-BR")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {media.metadata && Object.keys(media.metadata).length > 0 && (
                    <div>
                      <h3 className="font-semibold text-sm mb-2">Metadados</h3>
                      <div className="space-y-1">
                        {Object.entries(media.metadata).map(([key, value]) => (
                          <div
                            key={key}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-muted-foreground capitalize">
                              {key.replace(/([A-Z])/g, " $1").toLowerCase()}:
                            </span>
                            <span className="text-right break-all max-w-[200px]">
                              {String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <DialogFooter className="p-4 border-t bg-background">
                <div className="grid grid-cols-4 gap-2 w-full">
                  <Button
                    variant="outline"
                    onClick={handleToggleFavorite}
                    size="sm"
                    className="flex flex-col items-center gap-1 h-auto py-2"
                  >
                    <HeartIcon
                      className={`size-4 ${
                        media.isFavorite ? "fill-red-500 text-red-500" : ""
                      }`}
                    />
                    <span className="text-xs">
                      {media.isFavorite ? "Favorito" : "Favoritar"}
                    </span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleDownload}
                    size="sm"
                    className="flex flex-col items-center gap-1 h-auto py-2"
                  >
                    <DownloadIcon className="size-4" />
                    <span className="text-xs">Baixar</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={
                      media.mediaType === "video" && !isVideoPlaying
                        ? handlePlayVideo
                        : handleOpenInNewTab
                    }
                    size="sm"
                    className="flex flex-col items-center gap-1 h-auto py-2"
                  >
                    {media.mediaType === "video" && !isVideoPlaying ? (
                      <>
                        <PlayIcon className="size-4" />
                        <span className="text-xs">Reproduzir</span>
                      </>
                    ) : (
                      <>
                        <ExternalLinkIcon className="size-4" />
                        <span className="text-xs">Abrir</span>
                      </>
                    )}
                  </Button>

                  <GalleryDeleteModal item={media} onDelete={handleDelete}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex flex-col items-center gap-1 h-auto py-2 text-red-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                    >
                      <Trash2Icon className="size-4" />
                      <span className="text-xs">Excluir</span>
                    </Button>
                  </GalleryDeleteModal>
                </div>
              </DialogFooter>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </SheetContent>
    </Sheet>
  );
}
