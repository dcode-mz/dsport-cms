import { deleteClub } from "@/app/actions/club";
import { Club } from "@/app/types/club";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTransition } from "react";
import { toast } from "sonner";

export function AlertDialogClub({
  open,
  onOpenChange,
  club,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  club: Club;
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      await deleteClub({ id: club.id });
      onOpenChange(false);
      toast.success("Clube deletado com sucesso!");
    });
  };
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger asChild>Deletar</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Isso excluirá permanentemente o
            Clube {club.name}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-500 hover:bg-red-600"
            disabled={isPending}
          >
            Confirmar
          </AlertDialogAction>{" "}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
