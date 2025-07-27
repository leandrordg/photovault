"use client";

import { useImageUpload, useMultipleImageUpload } from "@/hooks/use-upload";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";

export function SingleImageUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  const { uploadFile, isUploading, progress, error, reset } = useImageUpload({
    onSuccess: (data) => {
      console.log("Upload concluído:", data);
      // Invalidar cache para atualizar lista de imagens
      queryClient.invalidateQueries({ queryKey: ["images", "list"] });
      reset();
    },
    onError: (error) => {
      console.error("Erro no upload:", error);
    },
    onProgress: (progress) => {
      console.log(`Progresso: ${progress.percentage}%`);
    },
  });

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validações
    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione apenas arquivos de imagem");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB
      alert("Arquivo muito grande. Máximo 10MB");
      return;
    }

    try {
      await uploadFile(file);
    } catch (error) {
      console.error("Falha no upload:", error);
    }
  };

  return (
    <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        disabled={isUploading}
        className="hidden"
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {isUploading ? "Enviando..." : "Selecionar Imagem"}
      </button>

      {progress && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {progress.percentage}% -{" "}
            {(progress.loaded / 1024 / 1024).toFixed(1)}MB de{" "}
            {(progress.total / 1024 / 1024).toFixed(1)}MB
          </p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
    </div>
  );
}

export function MultipleImageUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  const { uploadFiles, getTotalProgress, isAnyUploading, uploads, reset } =
    useMultipleImageUpload({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["images", "list"] });
      },
    });

  const handleFilesSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Validações
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        alert(`${file.name} não é uma imagem válida`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} é muito grande (máximo 10MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    try {
      await uploadFiles(validFiles);
      reset();
    } catch (error) {
      console.error("Falha no upload:", error);
    }
  };

  const totalProgress = getTotalProgress();

  return (
    <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFilesSelect}
        accept="image/*"
        multiple
        disabled={isAnyUploading()}
        className="hidden"
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isAnyUploading()}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {isAnyUploading() ? "Enviando..." : "Selecionar Múltiplas Imagens"}
      </button>

      {totalProgress && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${totalProgress.percentage}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Progresso Total: {totalProgress.percentage}%
          </p>
        </div>
      )}

      {Object.keys(uploads).length > 0 && (
        <div className="mt-4 space-y-2">
          {Object.entries(uploads).map(([fileId, state]) => (
            <div key={fileId} className="flex items-center space-x-2">
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div
                    className="bg-green-600 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${state.progress?.percentage || 0}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-gray-600">
                {state.progress?.percentage || 0}%
              </span>
              {state.error && (
                <span className="text-xs text-red-600">Erro</span>
              )}
            </div>
          ))}
        </div>
      )}

      {Object.values(uploads).some((state) => state.error) && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          Alguns arquivos falharam no upload. Verifique os erros acima.
        </div>
      )}
    </div>
  );
}

// Hook para drag and drop (bônus)
export const useDragAndDrop = (
  onFilesDropped: (files: File[]) => void,
  acceptedTypes: string[] = ["image/*"]
) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      acceptedTypes.some(
        (type) => type === "*/*" || file.type.match(type.replace("*", ".*"))
      )
    );

    if (files.length > 0) {
      onFilesDropped(files);
    }
  };

  return {
    isDragging,
    dragProps: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    },
  };
};
