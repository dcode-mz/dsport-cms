"use server";

import { z } from "zod";
import { revalidateTag } from "next/cache";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ruleSchema = z.object({
  id: z.string().uuid(),
  priority: z.number().int().min(1, {
    message: "A prioridade deve ser um número inteiro e maior que 0",
  }),
});

const createTournamentFormSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  logo: z.instanceof(File).optional(),
  country: z.string().uuid(),
  organizer: z.string(),
  gender: z.string().uuid(),
  type: z.string().uuid(),
  level: z.string().uuid(),
  category: z.string().uuid(),
  tieBreakerRuleTypes: z.array(ruleSchema).optional(),
  sport: z.string().uuid(),
  season: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  description: z.string().optional(),
  third_place: z.boolean().optional(),
  round_trip: z.boolean().optional(),
});

export async function createTournament(
  data: z.infer<typeof createTournamentFormSchema>
) {
  try {
    createTournamentFormSchema.parse(data);

    const logoURL = data.logo ? await uploadImage(data.logo) : undefined;

    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/tournament/`, {
      method: "POST",
      body: JSON.stringify({
        name: data.name,
        description: data.description,
        logo: logoURL,
        countryId: data.country,
        organizer: data.organizer,
        genderId: data.gender,
        typeId: data.type,
        levelId: data.level,
        categoryId: data.category,
        tieBreakerRule: data.tieBreakerRuleTypes,
        round_trip: data.round_trip,
        sportId: data.sport,
        seasonId: data.season,
        startDate: data.startDate,
        endDate: data.endDate,
        third_place: data.third_place,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log(response);

    const responseBody = await response.json();

    return responseBody;
  } catch (error) {
    console.error("Erro de validação no servidor:", error);
    throw new Error("Dados inválidos");
  }

  revalidateTag("get-tournaments");
}

export async function deleteTournament(data: { id: string }) {
  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/tournament/${data.id}`, {
    method: "DELETE",
  });

  revalidateTag("get-tournaments");
}

export async function uploadImage(file: File) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Fazer upload para o Cloudinary
    const result: UploadApiResponse | undefined = await new Promise(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: "dsport/tournaments" }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          })
          .end(buffer);
      }
    );

    return result?.secure_url;
  } catch (error) {
    console.error("Erro ao fazer upload da imagem:", error);
    throw new Error("Falha ao carregar imagem");
  }
}
