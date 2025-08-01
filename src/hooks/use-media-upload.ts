"use client";

import {
  ACCEPTED_MEDIA_TYPES,
  getMaxFileSize,
  getMediaType,
  isImageType,
  isVideoType,
} from "@/config/media";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UseMediaUploadOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: UploadProgress) => void;
  title?: string;
  description?: string;
}

interface UploadState {
  isUploading: boolean;
  progress: UploadProgress | null;
  error: string | null;
}

export const useMediaUpload = (options?: UseMediaUploadOptions) => {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: null,
    error: null,
  });

  const trpc = useTRPC();

  const { mutateAsync: getPreSignedUrl } = useMutation(
    trpc.media.getPreSignedUrl.mutationOptions()
  );

  const { mutateAsync: saveMedia } = useMutation(
    trpc.media.save.mutationOptions()
  );

  const { mutateAsync: getPreSignedUrlCustom } = useMutation(
    trpc.media.getPreSignedUrlWithCustomKey.mutationOptions()
  );

  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    if (
      !ACCEPTED_MEDIA_TYPES.includes(
        file.type as (typeof ACCEPTED_MEDIA_TYPES)[number]
      )
    ) {
      return {
        isValid: false,
        error: `Tipo de arquivo não suportado: ${file.type}`,
      };
    }

    const mediaType = getMediaType(file.type);
    if (!mediaType) {
      return {
        isValid: false,
        error: "Não foi possível determinar o tipo de mídia",
      };
    }

    const maxSize = getMaxFileSize(mediaType);
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      return {
        isValid: false,
        error: `Arquivo muito grande. Máximo ${maxSizeMB}MB para ${
          mediaType === "image" ? "imagens" : "vídeos"
        }`,
      };
    }

    return { isValid: true };
  };

  const getImageDimensions = (
    file: File
  ): Promise<{ width: number; height: number } | null> => {
    return new Promise((resolve) => {
      if (!isImageType(file.type)) {
        resolve(null);
        return;
      }

      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };

      img.src = url;
    });
  };

  const getVideoMetadata = (
    file: File
  ): Promise<{
    width?: number;
    height?: number;
    duration?: number;
  } | null> => {
    return new Promise((resolve) => {
      if (!isVideoType(file.type)) {
        resolve(null);
        return;
      }

      const video = document.createElement("video");
      const url = URL.createObjectURL(file);

      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve({
          width: video.videoWidth,
          height: video.videoHeight,
          duration: Math.round(video.duration),
        });
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };

      video.src = url;
    });
  };

  const generateVideoThumbnail = (file: File): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!isVideoType(file.type)) {
        resolve(null);
        return;
      }

      const video = document.createElement("video");
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const url = URL.createObjectURL(file);

      video.onloadeddata = () => {
        video.currentTime = Math.min(1, video.duration * 0.1);
      };

      video.onseeked = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        ctx?.drawImage(video, 0, 0);

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            resolve(blob);
          },
          "image/jpeg",
          0.8
        );
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };

      video.src = url;
    });
  };

  const uploadFile = async (file: File) => {
    try {
      const validation = validateFile(file);

      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const mediaType = getMediaType(file.type)!;

      setUploadState({
        isUploading: true,
        progress: { loaded: 0, total: file.size, percentage: 0 },
        error: null,
      });

      const { url, key } = await getPreSignedUrl({
        fileName: file.name,
        contentType: file.type,
      });

      await uploadToS3(url, file, (progress) => {
        setUploadState((prev) => ({
          ...prev,
          progress,
        }));
        options?.onProgress?.(progress);
      });

      let width, height, duration, blur, thumbnailS3Key, thumbnailBlur;

      if (mediaType === "image") {
        const dimensions = await getImageDimensions(file);
        width = dimensions?.width;
        height = dimensions?.height;
        blur = await generateBlurDataURL(file);
      } else if (mediaType === "video") {
        const metadata = await getVideoMetadata(file);
        width = metadata?.width;
        height = metadata?.height;
        duration = metadata?.duration;

        const thumbnailBlob = await generateVideoThumbnail(file);

        if (thumbnailBlob) {
          const thumbnailKey = key.replace(/\.[^/.]+$/, ".jpg");

          const { url: thumbnailUrl } = await getPreSignedUrlCustom({
            key: thumbnailKey,
            contentType: "image/jpeg",
          });

          await uploadToS3(thumbnailUrl, thumbnailBlob, () => {});

          thumbnailS3Key = thumbnailKey;
          thumbnailBlur = await generateBlurFromBlob(thumbnailBlob);
        }
      }

      const savedMedia = await saveMedia({
        s3Key: key,
        filename: file.name,
        mimeType: file.type,
        fileSize: file.size,
        mediaType,
        width,
        height,
        duration,
        blur,
        thumbnailS3Key,
        thumbnailBlur,
        title: options?.title,
        description: options?.description,
      });

      setUploadState({
        isUploading: false,
        progress: null,
        error: null,
      });

      const result = { key, url, media: savedMedia };

      options?.onSuccess?.();

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro no upload";

      setUploadState({
        isUploading: false,
        progress: null,
        error: errorMessage,
      });

      options?.onError?.(
        error instanceof Error ? error : new Error(errorMessage)
      );
      throw error;
    }
  };

  const uploadToS3 = async (
    url: string,
    file: File | Blob,
    onProgress: (progress: UploadProgress) => void
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress: UploadProgress = {
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100),
          };
          onProgress(progress);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload falhou com status: ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Erro de rede durante o upload"));
      });

      xhr.addEventListener("abort", () => {
        reject(new Error("Upload cancelado"));
      });

      xhr.open("PUT", url);
      if (file instanceof File) {
        xhr.setRequestHeader("Content-Type", file.type);
      } else {
        xhr.setRequestHeader("Content-Type", "image/jpeg");
      }
      xhr.send(file);
    });
  };

  const reset = () => {
    setUploadState({
      isUploading: false,
      progress: null,
      error: null,
    });
  };

  return {
    uploadFile,
    reset,
    validateFile,
    ...uploadState,
  };
};

const generateBlurDataURL = (file: File): Promise<string | undefined> => {
  return new Promise((resolve) => {
    if (!isImageType(file.type)) return resolve(undefined);

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const targetWidth = 10;
        const targetHeight = Math.round((img.height / img.width) * targetWidth);
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        ctx?.drawImage(img, 0, 0, targetWidth, targetHeight);
        const base64 = canvas.toDataURL("image/jpeg", 0.5);
        resolve(base64);
      };
      img.onerror = () => resolve(undefined);
      if (typeof reader.result === "string") {
        img.src = reader.result;
      }
    };
    reader.onerror = () => resolve(undefined);
    reader.readAsDataURL(file);
  });
};

const generateBlurFromBlob = (blob: Blob): Promise<string | undefined> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const targetWidth = 10;
        const targetHeight = Math.round((img.height / img.width) * targetWidth);
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        ctx?.drawImage(img, 0, 0, targetWidth, targetHeight);
        const base64 = canvas.toDataURL("image/jpeg", 0.5);
        resolve(base64);
      };
      img.onerror = () => resolve(undefined);
      if (typeof reader.result === "string") {
        img.src = reader.result;
      }
    };
    reader.onerror = () => resolve(undefined);
    reader.readAsDataURL(blob);
  });
};
