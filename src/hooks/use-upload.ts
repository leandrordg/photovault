import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UseImageUploadOptions {
  onSuccess?: (data: { key: string; url: string; image: any }) => void;
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

export const useImageUpload = (options?: UseImageUploadOptions) => {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: null,
    error: null,
  });

  const trpc = useTRPC();

  const { mutateAsync: getPreSignedUrl } = useMutation(
    trpc.images.getPreSignedUrl.mutationOptions()
  );

  const { mutateAsync: saveImage } = useMutation(
    trpc.images.save.mutationOptions()
  );

  const getImageDimensions = (
    file: File
  ): Promise<{ width: number; height: number } | null> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith("image/")) {
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

  const uploadFile = async (file: File) => {
    try {
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

      const dimensions = await getImageDimensions(file);

      const blurDataURL = await generateBlurDataURL(file);

      const savedImage = await saveImage({
        s3Key: key,
        blur: blurDataURL,
        filename: file.name,
        mimeType: file.type,
        fileSize: file.size,
        width: dimensions?.width,
        height: dimensions?.height,
        title: options?.title,
        description: options?.description,
      });

      setUploadState({
        isUploading: false,
        progress: null,
        error: null,
      });

      const result = { key, url, image: savedImage };

      options?.onSuccess?.(result);

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
    file: File,
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
      xhr.setRequestHeader("Content-Type", file.type);
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
    ...uploadState,
  };
};

export const useMultipleImageUpload = (options?: UseImageUploadOptions) => {
  const [uploads, setUploads] = useState<Map<string, UploadState>>(new Map());

  const trpc = useTRPC();

  const { mutateAsync: getPreSignedUrl } = useMutation(
    trpc.images.getPreSignedUrl.mutationOptions()
  );

  const { mutateAsync: saveImage } = useMutation(
    trpc.images.save.mutationOptions()
  );

  const getImageDimensions = (
    file: File
  ): Promise<{ width: number; height: number } | null> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith("image/")) {
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

  const uploadFiles = async (files: File[]) => {
    const results: Array<{ key: string; url: string; file: File; image: any }> =
      [];

    try {
      for (const file of files) {
        const fileId = `${file.name}-${Date.now()}`;

        setUploads(
          (prev) =>
            new Map(
              prev.set(fileId, {
                isUploading: true,
                progress: { loaded: 0, total: file.size, percentage: 0 },
                error: null,
              })
            )
        );

        const { url, key } = await getPreSignedUrl({
          fileName: file.name,
          contentType: file.type,
        });

        await uploadToS3(url, file, (progress) => {
          setUploads((prev) => {
            const newMap = new Map(prev);
            const currentState = newMap.get(fileId);
            if (currentState) {
              newMap.set(fileId, { ...currentState, progress });
            }
            return newMap;
          });
        });

        const dimensions = await getImageDimensions(file);

        const blurDataURL = await generateBlurDataURL(file);

        const savedImage = await saveImage({
          s3Key: key,
          filename: file.name,
          mimeType: file.type,
          fileSize: file.size,
          width: dimensions?.width,
          height: dimensions?.height,
          title: options?.title,
          description: options?.description,
          blur: blurDataURL,
        });

        setUploads(
          (prev) =>
            new Map(
              prev.set(fileId, {
                isUploading: false,
                progress: null,
                error: null,
              })
            )
        );

        results.push({ key, url, file, image: savedImage });
      }

      if (results.length > 0) options?.onSuccess?.(results[0]);

      return results;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro no upload";

      options?.onError?.(
        error instanceof Error ? error : new Error(errorMessage)
      );
      throw error;
    }
  };

  const uploadToS3 = async (
    url: string,
    file: File,
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

      xhr.open("PUT", url);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.send(file);
    });
  };

  const getUploadState = (fileId: string) => {
    return (
      uploads.get(fileId) || {
        isUploading: false,
        progress: null,
        error: null,
      }
    );
  };

  const getTotalProgress = () => {
    const states = Array.from(uploads.values());
    if (states.length === 0) return null;

    const totalLoaded = states.reduce(
      (sum, state) => sum + (state.progress?.loaded || 0),
      0
    );
    const totalSize = states.reduce(
      (sum, state) => sum + (state.progress?.total || 0),
      0
    );

    return {
      loaded: totalLoaded,
      total: totalSize,
      percentage:
        totalSize > 0 ? Math.round((totalLoaded / totalSize) * 100) : 0,
    };
  };

  const isAnyUploading = () => {
    return Array.from(uploads.values()).some((state) => state.isUploading);
  };

  const reset = () => {
    setUploads(new Map());
  };

  return {
    uploadFiles,
    getUploadState,
    getTotalProgress,
    isAnyUploading,
    reset,
    uploads: Object.fromEntries(uploads),
  };
};

const generateBlurDataURL = (file: File): Promise<string | undefined> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) return resolve(undefined);

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
