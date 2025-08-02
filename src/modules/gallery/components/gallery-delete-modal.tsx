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
import { Trash2Icon } from "lucide-react";

interface Props {
  item: Media;
  children: React.ReactNode;
  onDelete: (item: Media) => void;
}

export function GalleryDeleteModal({ item, children, onDelete }: Props) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir essa mídia</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir essa mídia? Essa ação não pode ser
            desfeita.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>

          <Button variant="destructive" onClick={() => onDelete(item)}>
            <Trash2Icon />
            Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
