"use server";

import { z } from "zod";
import { revalidateTag } from "next/cache";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const createClubFormSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  logo: z.instanceof(File).optional(),
  shortName: z.string(),
  foundingDate: z.string(),
  website: z.string().url().optional(),
  description: z.string().optional(),
});

export async function createClub(data: z.infer<typeof createClubFormSchema>) {
  try {
    createClubFormSchema.parse(data);

    const logoURL = data.logo ? await uploadImage(data.logo) : undefined;

    await fetch("http://localhost:4000/club/", {
      method: "POST",
      body: JSON.stringify({
        name: data.name,
        description: data.description,
        logo: logoURL,
        shortName: data.shortName,
        foundingDate: data.foundingDate,
        website: data.website,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Erro de validação no servidor:", error);
    throw new Error("Dados inválidos");
  }

  revalidateTag("get-tournaments");
}

export async function deleteClub(data: { id: string }) {
  await fetch(`http://localhost:4000/club/${data.id}`, {
    method: "DELETE",
  });

  revalidateTag("get-clubs");
}

export async function uploadImage(file: File) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Fazer upload para o Cloudinary
    const result: UploadApiResponse | undefined = await new Promise(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: "dsport/clubs/logo" }, (error, result) => {
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
