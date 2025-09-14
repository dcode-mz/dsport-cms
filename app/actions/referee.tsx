"use server";

import { z } from "zod";
import { revalidateTag } from "next/cache";

const createRefereeFormSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  nationalityId: z.string(),
  dateOfBirth: z.string(),
});

export async function createReferee(data: z.infer<typeof createRefereeFormSchema>) {
  try {
    createRefereeFormSchema.parse(data);

    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/referee/`, {
      method: "POST",
      body: JSON.stringify({
        name: data.name,
        dateOfBirth: data.dateOfBirth,
        nationalityId: data.nationalityId,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

  } catch (error) {
    console.error("Erro de validação no servidor:", error);
    throw new Error("Dados inválidos");
  }

  revalidateTag("get-referees");
}

export async function deleteReferee(data: { id: string }) {
  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/referee/${data.id}`, {
    method: "DELETE",
  });

  revalidateTag("get-referees");
}