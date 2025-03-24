"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Season } from "@/app/types/season";
import { AlertDialogSeason } from "@/components/alert-dialog-season";
import { format } from "date-fns";

const SeasonActions = ({ season }: { season: Season }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuItem>Editar</DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-500"
            onSelect={(e) => {
              e.preventDefault(); // Evita fechar o menu imediatamente
              setOpen(true);
            }}
          >
            Deletar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialogSeason open={open} onOpenChange={setOpen} season={season} />
    </>
  );
};

export const columns: ColumnDef<Season>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Nome
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "startDate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Data de início
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ cell }) =>
      format(new Date(cell.getValue() as string | number | Date), "dd-MM-yyyy"),
  },
  {
    accessorKey: "endDate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Data do fim
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ cell }) =>
      format(new Date(cell.getValue() as string | number | Date), "dd-MM-yyyy"),
  },
  {
    id: "actions",
    cell: ({ row }) => <SeasonActions season={row.original} />,
  },
];
