"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Media } from "@/modules/gallery/types";
import { Loader2Icon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  item: Media;
  children: React.ReactNode;
  onDelete: (item: Media) => Promise<void> | void;
}

export function GalleryDeleteModal({ item, children, onDelete }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(item);
      setIsOpen(false);
    } catch {
      toast.error("Erro ao excluir a mídia. Tente novamente mais tarde.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Excluir {item.mediaType === "image" ? "Imagem" : "Vídeo"}
          </DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir essa mídia? Essa ação não pode ser
            revertida e todos os dados associados a ela serão perdidos.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isDeleting}>
              Cancelar
            </Button>
          </DialogClose>

          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2Icon className="animate-spin" />
                Excluindo
              </>
            ) : (
              <>
                <Trash2Icon />
                Excluir
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
