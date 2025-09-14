"use server";

import { z } from "zod";
import { revalidateTag } from "next/cache";

const createTeamFormSchema = z.object({
  customName: z.string().optional(),
  club: z.string().optional().nullable(),
  gender: z.string(),
  teamType: z.string(),
  venue: z.string(),
  contact: z.string(),
  location: z.string(),
  sport: z.string(),
  category: z.string(),
  formatsTeam: z.string(),
});

export async function createTeam(data: z.infer<typeof createTeamFormSchema>) {
  try {
    createTeamFormSchema.parse(data);
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/team/`, {
      method: "POST",
      body: JSON.stringify({
        customName: data.customName,
        genderId: data.gender,
        teamTypeId: data.teamType,
        venueId: data.venue,
        contact: data.contact,
        location: data.location,
        clubId: data.club == "" ? null : data.club,
        sportId: data.sport,
        ageCategoryId: data.category,
        formatId: data.formatsTeam,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.log(error);
    console.error("Erro de validação no servidor:", error);
    throw new Error("Dados inválidos");
  }

  revalidateTag("get-teams");
}

export async function deleteTeam(data: { id: string }) {
  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/team/${data.id}`, {
    method: "DELETE",
  });

  revalidateTag("get-teams");
}
