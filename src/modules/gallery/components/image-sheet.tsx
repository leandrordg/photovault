"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  CalendarIcon,
  DownloadIcon,
  EditIcon,
  EyeIcon,
  HeartIcon,
  ImageIcon,
  LockIcon,
  TrashIcon,
} from "lucide-react";
import Image from "next/image";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";

export function ImageSheet() {
  const [selectedImageId, setSelectedImageId] = useQueryState("image");
  const [isOpen, setIsOpen] = useState(false);

  const trpc = useTRPC();

  const { data: image, isLoading } = useQuery(
    trpc.images.get.queryOptions(
      { id: selectedImageId! },
      { enabled: !!selectedImageId }
    )
  );

  useEffect(() => {
    if (selectedImageId) {
      setIsOpen(true);
    }
  }, [selectedImageId]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setIsOpen(false);
      setTimeout(() => {
        setSelectedImageId(null);
      }, 150);
    } else {
      setIsOpen(true);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "N/A";
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  };

  if (!selectedImageId) return null;

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent className="gap-0">
        <SheetHeader className="p-4">
          <SheetTitle className="flex items-center gap-4 pr-8">
            <div className="line-clamp-1">
              {isLoading ? (
                <Skeleton className="h-6 w-48" />
              ) : (
                <h2 className="truncate">
                  {image?.title || image?.filename}{" "}
                  {image?.title && (
                    <span className="text-sm text-muted-foreground">
                      {image.filename}
                    </span>
                  )}
                </h2>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              ) : (
                <>
                  {image?.isPublic ? (
                    <Badge
                      variant="secondary"
                      className="gap-1 bg-green-100 text-green-800"
                    >
                      <EyeIcon className="w-3 h-3" />
                      Público
                    </Badge>
                  ) : (
                    <Badge variant="default" className="gap-1">
                      <LockIcon className="w-3 h-3" />
                      Privado
                    </Badge>
                  )}

                  {image?.isFavorite && (
                    <Badge
                      variant="outline"
                      className="gap-1 text-yellow-600 border-yellow-200"
                    >
                      <HeartIcon className="w-3 h-3 fill-current" />
                      Favorito
                    </Badge>
                  )}
                </>
              )}
            </div>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex max-h-full flex-col overflow-hidden">
          <div className="bg-muted border-y">
            {isLoading ? (
              <Skeleton className="w-full h-96" />
            ) : (
              <Image
                src={image?.url!}
                alt={image?.title || image?.filename!}
                blurDataURL={image?.blur || ""}
                width={image?.width || 512}
                height={image?.height || 512}
                className="w-full h-auto max-h-96 object-contain"
                placeholder="blur"
                loading="eager"
              />
            )}
          </div>

          {isLoading ? (
            <div className="p-4">
              <Skeleton className="h-5 w-full mb-2" />
              <Skeleton className="h-5 w-3/4" />
            </div>
          ) : (
            image?.description && (
              <div className="p-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {image.description}
                </p>
              </div>
            )
          )}

          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="size-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">Informações técnicas</h4>
            </div>

            <div className="grid grid-cols-1 border rounded-lg divide-y">
              {isLoading ? (
                <>
                  <div className="flex justify-between items-center py-2 px-3">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <div className="flex justify-between items-center py-2 px-3">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <div className="flex justify-between items-center py-2 px-3">
                    <Skeleton className="h-5 w-18" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </>
              ) : (
                <>
                  {image?.width && image?.height && (
                    <div className="flex justify-between items-center py-2 px-3">
                      <span className="text-sm text-muted-foreground">
                        Dimensões
                      </span>
                      <span className="text-sm font-medium">
                        {image.width} × {image.height} px
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center py-2 px-3">
                    <span className="text-sm text-muted-foreground">
                      Tamanho
                    </span>
                    <span className="text-sm font-medium">
                      {formatFileSize(image?.fileSize || null)}
                    </span>
                  </div>

                  {image?.mimeType && (
                    <div className="flex justify-between items-center py-2 px-3">
                      <span className="text-sm text-muted-foreground">
                        Formato
                      </span>
                      <span className="text-sm font-medium uppercase">
                        {image.mimeType.split("/")[1]}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="size-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">Informações adicionais</h4>
            </div>

            <div className="grid grid-cols-1 border rounded-lg divide-y">
              {isLoading ? (
                <>
                  <div className="flex justify-between items-center py-2 px-3">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                  <div className="flex justify-between items-center py-2 px-3">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center py-2 px-3">
                    <span className="text-sm text-muted-foreground">
                      Upload
                    </span>
                    <span className="text-sm font-medium">
                      {format(image!.uploadedAt, "dd/MM/yyyy HH:mm")}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 px-3">
                    <span className="text-sm text-muted-foreground">
                      Última atualização
                    </span>
                    <span className="text-sm font-medium">
                      {format(image!.updatedAt, "dd/MM/yyyy HH:mm")}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="flex-row p-4 border-t">
          <Button
            variant="outline"
            className="flex-1"
            disabled={!image}
            onClick={() => {}}
          >
            <DownloadIcon />
            <span className="sr-only">Baixar</span>
          </Button>

          <Button variant="outline" className="flex-1" disabled={!image}>
            <EditIcon />
            <span className="sr-only">Editar</span>
          </Button>

          <Button className="flex-1" disabled={!image}>
            <TrashIcon />
            <span className="sr-only">Excluir</span>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
