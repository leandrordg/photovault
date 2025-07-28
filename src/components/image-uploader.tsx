"use client";

import { useImageUpload, useMultipleImageUpload } from "@/hooks/use-upload";
import { useTRPC } from "@/trpc/client";
import { useQueryClient } from "@tanstack/react-query";
import { UploadIcon } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

export function SingleImageUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { uploadFile, isUploading, reset } = useImageUpload({
    onSuccess: () => {
      queryClient.invalidateQueries(trpc.images.list.queryOptions());
      reset();
    },
    onError: (error) => toast.error(error.message),
  });

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione apenas arquivos de imagem");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
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
    <div className="border-input hover:bg-accent/50 has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 rounded-xl border border-dashed transition-colors has-disabled:pointer-events-none has-disabled:opacity-50 has-[input:focus]:ring-[3px]">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        disabled={isUploading}
        className="hidden"
      />

      <div
        className="flex flex-col items-center justify-center text-center p-4 gap-4 cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <UploadIcon className="size-4 opacity-60" />
        <p className="text-sm font-medium">Enviar imagem</p>
        <p className="text-muted-foreground text-xs">
          Clique aqui para enviar uma imagem
        </p>
      </div>
    </div>
  );
}

export function MultipleImageUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { uploadFiles, isAnyUploading, reset } = useMultipleImageUpload({
    onSuccess: () => {
      queryClient.invalidateQueries(trpc.images.list.queryOptions());
      reset();
    },
    onError: (error) => toast.error(error.message),
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

  return (
    <div className="border-input hover:bg-accent/50 has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 rounded-xl border border-dashed transition-colors has-disabled:pointer-events-none has-disabled:opacity-50 has-[input:focus]:ring-[3px]">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFilesSelect}
        accept="image/*"
        multiple
        disabled={isAnyUploading()}
        className="hidden"
      />

      <div
        className="flex flex-col items-center justify-center text-center p-4 gap-4 cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <UploadIcon className="size-4 opacity-60" />
        <p className="text-sm font-medium">Enviar imagem</p>
        <p className="text-muted-foreground text-xs">
          Clique aqui para enviar uma ou mais imagens
        </p>
      </div>
    </div>
  );
}
