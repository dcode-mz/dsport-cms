"use server";

import { z } from "zod";
import { revalidateTag } from "next/cache";

const createSeasonFormSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  startDate: z.string(),
  endDate: z.string(),
});

export async function createSeason(data: {
  name: string;
  startDate: string;
  endDate: string;
}) {
  try {
    createSeasonFormSchema.parse(data);
  } catch (error) {
    console.error("Erro de validação no servidor:", error);
    throw new Error("Dados inválidos");
  }

  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/season/`, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  });

  revalidateTag("get-season");
}

export async function deleteStage(data: { id: string }) {
  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/stage/${data.id}`, {
    method: "DELETE",
  });

  revalidateTag("get-stage");
}
