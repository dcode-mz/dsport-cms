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
import Image from "next/image";
import { Club } from "@/app/types/club";
import { AlertDialogClub } from "@/components/alert-dialog-club";
import { format } from "date-fns";

const ClubActions = ({ club }: { club: Club }) => {
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

      <AlertDialogClub open={open} onOpenChange={setOpen} club={club} />
    </>
  );
};

export const columns: ColumnDef<Club>[] = [
  {
    accessorKey: "logo",
    header: () => "Logotipo",
    cell: ({ row }) => (
      <Image
        width={32}
        height={32}
        src={row.original.logo}
        alt="Logo"
        className="h-8 w-8 rounded-full"
      />
    ),
  },
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
    accessorKey: "description",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Descrição
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "shortName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Sigla
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "foundingDate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Data de fundação
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ cell }) =>
      format(new Date(cell.getValue() as string | number | Date), "dd-MM-yyyy"),
  },
  {
    accessorKey: "website",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Website
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "_count.teams",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Nº de Equipas
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => row.original._count.teams,
  },
  {
    id: "actions",
    cell: ({ row }) => <ClubActions club={row.original} />,
  },
];
