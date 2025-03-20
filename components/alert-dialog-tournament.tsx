import { deleteTournament } from "@/app/actions/tournaments";
import { Tournament } from "@/app/types/tournament";
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

export function AlertDialogTournament({
  open,
  onOpenChange,
  tournament,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournament: Tournament;
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      await deleteTournament({ id: tournament.id });
      onOpenChange(false);
      toast.success("Torneio deletado com sucesso!");
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
            Torneio {tournament.name}.
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
