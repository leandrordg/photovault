"use client";

import { ACCEPTED_MEDIA_TYPES, AllowedMediaTypes } from "@/config/media";
import { useMediaUpload } from "@/hooks/use-media-upload";
import { cn } from "@/lib/utils";
import { useGalleryFilters } from "@/modules/gallery/hooks/use-gallery-filter";
import { useTRPC } from "@/trpc/client";
import { useQueryClient } from "@tanstack/react-query";
import { ImageIcon, UploadIcon, VideoIcon } from "lucide-react";
import { DragEvent, useRef, useState } from "react";
import { toast } from "sonner";

interface MediaUploadProps {
  allowedTypes?: AllowedMediaTypes;
}

export function MediaUpload({ allowedTypes = "all" }: MediaUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filters] = useGalleryFilters();
  const [isDragOver, setIsDragOver] = useState(false);

  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { uploadFile, isUploading, progress, validateFile, reset } =
    useMediaUpload({
      onSuccess: async () => {
        queryClient.invalidateQueries(
          trpc.media.list.queryOptions({ ...filters })
        );

        toast.success("Arquivo enviado com sucesso! Você pode ver na galeria.");

        reset();
      },
      onError: (error) => {
        toast.error(error.message);
        reset();
      },
    });

  const getAcceptedTypes = () => {
    if (allowedTypes === "images") {
      return "image/*";
    } else if (allowedTypes === "videos") {
      return "video/*";
    }
    return ACCEPTED_MEDIA_TYPES.join(",");
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const validation = validateFile(file);

    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    try {
      await uploadFile(file);
    } catch {
      toast.error(`Falha ao enviar ${file.name}. Tente novamente.`);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (isUploading) return;

    const files = Array.from(e.dataTransfer.files);
    const file = files[0];

    if (!file) return;

    const validation = validateFile(file);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    try {
      await uploadFile(file);
    } catch {
      toast.error(`Falha ao enviar ${file.name}. Tente novamente.`);
    }
  };

  const getIcon = () => {
    if (allowedTypes === "images") {
      return <ImageIcon className="size-6 opacity-60" />;
    } else if (allowedTypes === "videos") {
      return <VideoIcon className="size-6 opacity-60" />;
    }
    return <UploadIcon className="size-6 opacity-60" />;
  };

  const displayText =
    allowedTypes === "images"
      ? {
          title: "Arraste e solte ou envie uma imagem",
          description: "Tamanho máximo: 50MB por imagem",
        }
      : allowedTypes === "videos"
      ? {
          title: "Arraste e solte ou envie um vídeo",
          description: "Tamanho máximo: 500MB por vídeo",
        }
      : {
          title: "Arraste e solte ou clique para enviar",
          description: "Tamanho máximo: 50MB por imagem, 500MB por vídeo",
        };

  return (
    <div
      className={cn(
        "border-input hover:bg-accent/50 has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 rounded-xl border border-dashed transition-colors has-disabled:pointer-events-none has-disabled:opacity-50 has-[input:focus]:ring-[3px]",
        isDragOver && "border-blue-200 bg-blue-50"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept={getAcceptedTypes()}
        disabled={isUploading}
        className="hidden"
      />

      <div
        className="flex flex-col items-center justify-center text-center p-6 gap-4 cursor-pointer min-h-[120px]"
        onClick={() => fileInputRef.current?.click()}
      >
        {getIcon()}

        <div className="space-y-2">
          <p className="text-sm font-medium">
            {isUploading ? "Enviando..." : displayText.title}
          </p>

          {progress && isUploading ? (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {progress.percentage}% -{" "}
                {Math.round(progress.loaded / 1024 / 1024)}MB de{" "}
                {Math.round(progress.total / 1024 / 1024)}MB
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">
              {displayText.description}
            </p>
          )}
        </div>

        {/* Informações sobre tipos aceitos */}
        <div className="text-xs text-muted-foreground space-y-1">
          {allowedTypes === "all" && (
            <>
              <p>Imagens: JPG, PNG, WebP, GIF, HEIC (até 50MB)</p>
              <p>Vídeos: MP4, MOV, AVI, MKV, WebM (até 500MB)</p>
            </>
          )}
          {allowedTypes === "images" && (
            <p>Formatos: JPG, PNG, WebP, GIF, HEIC (até 50MB)</p>
          )}
          {allowedTypes === "videos" && (
            <p>Formatos: MP4, MOV, AVI, MKV, WebM (até 500MB)</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function MultipleMediaUpload({
  allowedTypes = "all",
}: MediaUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filters] = useGalleryFilters();
  const [isDragOver, setIsDragOver] = useState(false);

  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { uploadFile, isUploading, progress, validateFile, reset } =
    useMediaUpload({
      onSuccess: async () => {
        queryClient.invalidateQueries(
          trpc.media.list.queryOptions({ ...filters })
        );
        toast.success(
          "Arquivos enviados com sucesso! Você pode ver na galeria."
        );
        reset();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  const getAcceptedTypes = () => {
    if (allowedTypes === "images") {
      return "image/*";
    } else if (allowedTypes === "videos") {
      return "video/*";
    }
    return ACCEPTED_MEDIA_TYPES.join(",");
  };

  const processFiles = async (files: File[]) => {
    if (files.length === 0) return;

    let successCount = 0;
    let errorCount = 0;

    for (const file of files) {
      const validation = validateFile(file);

      if (!validation.isValid) {
        toast.error(`${file.name}: ${validation.error}`);
        errorCount++;
        continue;
      }

      try {
        await uploadFile(file);
        successCount++;
      } catch {
        toast.error(`Falha ao enviar ${file.name}. Tente novamente.`);
        errorCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} arquivo(s) enviado(s) com sucesso!`);
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} arquivo(s) falharam no upload`);
    }

    reset();
  };

  const handleFilesSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);
    await processFiles(files);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (isUploading) return;

    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  };

  const displayText =
    allowedTypes === "images"
      ? {
          title: "Arraste e solte ou envie imagens",
          description: "Tamanho máximo: 50MB por imagem",
        }
      : allowedTypes === "videos"
      ? {
          title: "Arraste e solte ou envie vídeos",
          description: "Tamanho máximo: 500MB por vídeo",
        }
      : {
          title: "Arraste e solte ou envie clique para enviar",
          description: "Tamanho máximo: 50MB por imagem, 500MB por vídeo",
        };

  return (
    <div
      className={cn(
        "border-input hover:bg-accent/50 has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 rounded-xl border border-dashed transition-colors has-disabled:pointer-events-none has-disabled:opacity-50 has-[input:focus]:ring-[3px]",
        isDragOver && "border-blue-200 bg-blue-50"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFilesSelect}
        accept={getAcceptedTypes()}
        multiple
        disabled={isUploading}
        className="hidden"
      />

      <div
        className="flex flex-col items-center justify-center text-center p-6 gap-4 cursor-pointer min-h-[120px]"
        onClick={() => fileInputRef.current?.click()}
      >
        <UploadIcon className="size-4 opacity-60" />

        <div className="space-y-2">
          <p className="text-sm font-medium">
            {isUploading ? "Enviando..." : displayText.title}
          </p>

          {progress && isUploading ? (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {progress.percentage}%
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">
              {displayText.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
