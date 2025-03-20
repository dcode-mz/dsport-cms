import { deleteTeam } from "@/app/actions/teams";
import { Team } from "@/app/types/team";
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

export function AlertDialogTeam({
  open,
  onOpenChange,
  team,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team;
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      await deleteTeam({ id: team.id });
      onOpenChange(false);
      toast.success("Equipa deletado com sucesso!");
    });
  };
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger asChild>Deletar</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Isso excluirá permanentemente a
            Equipa {team.name}.
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
