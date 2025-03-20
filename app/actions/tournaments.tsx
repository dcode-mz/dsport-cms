"use server";

import { z } from "zod";
import { revalidateTag } from "next/cache";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const createTournamentFormSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  logo: z.instanceof(File).optional(),
  country: z.string(),
  organizer: z.string(),
  gender: z.string(),
  type: z.string(),
  level: z.string(),
  format: z.string(),
  category: z.string(),
  tiebreakerCriteria: z.string(),
  sport: z.string(),
  description: z
    .string()
    .min(10, "A descrição deve ter pelo menos 10 caracteres"),
});

export async function createTournament(
  data: z.infer<typeof createTournamentFormSchema>
) {
  try {
    createTournamentFormSchema.parse(data);

    const logoURL = data.logo ? await uploadImage(data.logo) : undefined;

    const response = await fetch("http://localhost:4000/tournament/", {
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
        formatId: data.format,
        categoryId: data.category,
        tiebreakerCriteriaId: data.tiebreakerCriteria,
        sportId: data.sport,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log(response);
  } catch (error) {
    console.error("Erro de validação no servidor:", error);
    throw new Error("Dados inválidos");
  }

  revalidateTag("get-tournaments");
}

export async function deleteTournament(data: { id: string }) {
  await fetch(`http://localhost:4000/tournament/${data.id}`, {
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
