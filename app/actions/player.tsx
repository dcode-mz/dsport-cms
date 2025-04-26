"use server";

import { z } from "zod";
import { revalidateTag } from "next/cache";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const playerFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  nickname: z.string().optional(),
  preferredPosition: z.string().uuid("Posição inválida"),
  sport: z.string().uuid("Desporto inválido"),
  gender: z.string().uuid("Género inválida"),
  preferredFoot: z.string().optional(),
  dateOfBirth: z.string(),
  primaryNationality: z.string().uuid("Nacionalidade inválida"),
  height: z.coerce.number().min(1, "Altura inválida"),
  weight: z.coerce.number().min(1, "Peso inválido"),
  photo: z.instanceof(File).optional(),
  team: z.string().optional(),
});

export async function createPlayer(data: z.infer<typeof playerFormSchema>) {
  try {
    playerFormSchema.parse(data);

    const photoUrl = data.photo ? await uploadImage(data.photo) : undefined;

    await fetch("http://localhost:4000/player/", {
      method: "POST",
      body: JSON.stringify({
        name: data.name,
        nickname: data.nickname,
        preferredPositionId: data.preferredPosition,
        preferredFootId: data.preferredFoot,
        genderId: data.gender,
        dateOfBirth: data.dateOfBirth,
        primaryNationalityId: data.primaryNationality,
        height: data.height,
        weight: data.weight,
        photoUrl,
        teamId: data.team,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Erro de validação no servidor:", error);
    throw new Error("Dados inválidos");
  }

  revalidateTag("get-players");
}

export async function deletePlayer(data: { id: string }) {
  await fetch(`http://localhost:4000/player/${data.id}`, {
    method: "DELETE",
  });

  revalidateTag("get-players");
}

export async function uploadImage(file: File) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Fazer upload para o Cloudinary
    const result: UploadApiResponse | undefined = await new Promise(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: "dsport/players" }, (error, result) => {
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
