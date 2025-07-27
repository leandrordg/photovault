import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UseImageUploadOptions {
  onSuccess?: (data: { key: string; url: string }) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: UploadProgress) => void;
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

  const uploadFile = async (file: File) => {
    try {
      setUploadState({
        isUploading: true,
        progress: { loaded: 0, total: file.size, percentage: 0 },
        error: null,
      });

      // Obter URL pré-assinada
      const { url, key } = await getPreSignedUrl({
        fileName: file.name,
        contentType: file.type,
      });

      // Upload do arquivo para S3
      await uploadToS3(url, file, (progress) => {
        setUploadState((prev) => ({
          ...prev,
          progress,
        }));
        options?.onProgress?.(progress);
      });

      setUploadState({
        isUploading: false,
        progress: null,
        error: null,
      });

      const result = { key, url };
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

  const uploadFiles = async (files: File[]) => {
    const results: Array<{ key: string; url: string; file: File }> = [];

    for (const file of files) {
      const fileId = `${file.name}-${Date.now()}`;

      try {
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

        results.push({ key, url, file });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erro no upload";

        setUploads(
          (prev) =>
            new Map(
              prev.set(fileId, {
                isUploading: false,
                progress: null,
                error: errorMessage,
              })
            )
        );

        throw error;
      }
    }

    return results;
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
