"use client";

import { ACCEPTED_MEDIA_TYPES, AllowedMediaTypes } from "@/config/media";
import { useMediaUpload } from "@/hooks/use-media-upload";
import { useTRPC } from "@/trpc/client";
import { useQueryClient } from "@tanstack/react-query";
import { ImageIcon, UploadIcon, VideoIcon } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

interface MediaUploadProps {
  allowedTypes?: AllowedMediaTypes;
}

export function MediaUpload({ allowedTypes = "all" }: MediaUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { uploadFile, isUploading, progress, validateFile, reset } =
    useMediaUpload({
      onSuccess: async (data) => {
        queryClient.invalidateQueries(
          trpc.media.list.queryOptions({ mediaType: "all", limit: 50 })
        );

        toast.success(
          data.media.mediaType === "image"
            ? "Imagem enviada com sucesso!"
            : "Vídeo enviado com sucesso!"
        );

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
          title: "Enviar imagem",
          description: "Clique aqui para enviar uma imagem",
        }
      : allowedTypes === "videos"
      ? {
          title: "Enviar vídeo",
          description: "Clique aqui para enviar um vídeo",
        }
      : {
          title: "Enviar mídia",
          description: "Clique aqui para enviar uma foto ou vídeo",
        };

  return (
    <div className="border-input hover:bg-accent/50 has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 rounded-xl border border-dashed transition-colors has-disabled:pointer-events-none has-disabled:opacity-50 has-[input:focus]:ring-[3px]">
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

  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { uploadFile, isUploading, progress, validateFile, reset } =
    useMediaUpload({
      onSuccess: async (data) => {
        queryClient.invalidateQueries(
          trpc.media.list.queryOptions({ mediaType: "all", limit: 50 })
        );
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

  const handleFilesSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    let successCount = 0;
    let errorCount = 0;

    for (const file of files) {
      // Validar cada arquivo
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

  const displayText =
    allowedTypes === "images"
      ? {
          title: "Enviar imagens",
          description: "Clique aqui para enviar múltiplas imagens",
        }
      : allowedTypes === "videos"
      ? {
          title: "Enviar vídeos",
          description: "Clique aqui para enviar múltiplos vídeos",
        }
      : {
          title: "Enviar mídias",
          description: "Clique aqui para enviar múltiplas fotos ou vídeos",
        };

  return (
    <div className="border-input hover:bg-accent/50 has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 rounded-xl border border-dashed transition-colors has-disabled:pointer-events-none has-disabled:opacity-50 has-[input:focus]:ring-[3px]">
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
        <UploadIcon className="size-6 opacity-60" />

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
