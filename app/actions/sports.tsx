"use server";

import { z } from "zod";
import { revalidateTag } from "next/cache";

const createSportFormSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  icon: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  description: z
    .string()
    .min(10, "A descrição deve ter pelo menos 10 caracteres"),
});

export async function createSport(data: {
  name: string;
  icon: string;
  description: string;
}) {
  try {
    createSportFormSchema.parse(data);
  } catch (error) {
    console.error("Erro de validação no servidor:", error);
    throw new Error("Dados inválidos");
  }

  await fetch("http://localhost:4000/sports/", {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  });

  revalidateTag("get-sports");
}

export async function deleteSport(data: { id: string }) {
  await fetch(`http://localhost:4000/sports/${data.id}`, {
    method: "DELETE",
  });

  revalidateTag("get-sports");
}
