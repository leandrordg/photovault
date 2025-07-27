"use server";

import { db } from "@/db";
import { images } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function saveImage(key: string, filename: string) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) throw new Error("Usuário não autenticado");

  await db.insert(images).values({
    userId: session.user.id,
    s3Key: key,
    filename,
    uploadedAt: new Date(),
  });
}
