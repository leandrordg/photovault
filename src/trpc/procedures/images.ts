import { db } from "@/db";
import { images } from "@/db/schema";
import { s3Client } from "@/lib/aws";
import { env } from "@/utils/env";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod/v4-mini";
import { createTRPCRouter, protectedProcedure } from "../init";

export const imagesRouter = createTRPCRouter({
  getPreSignedUrl: protectedProcedure
    .input(z.object({ fileName: z.string(), contentType: z.string() }))
    .mutation(async ({ input }) => {
      const { fileName, contentType } = input;

      const key = `uploads/${nanoid()}-${fileName}`;

      const command = new PutObjectCommand({
        Bucket: env.AWS_S3_BUCKET,
        Key: key,
        ContentType: contentType,
      });

      const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

      return { url, key };
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const userImages = await db
      .select()
      .from(images)
      .where(eq(images.userId, ctx.session.user.id))
      .orderBy(desc(images.uploadedAt));

    return userImages;
  }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const [image] = await db
        .select()
        .from(images)
        .where(
          and(eq(images.id, input.id), eq(images.userId, ctx.session.user.id))
        );

      if (!image) {
        throw new Error("Imagem não encontrada ou sem permissão");
      }

      return image;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [image] = await db
        .select()
        .from(images)
        .where(eq(images.id, input.id));

      if (!image || image.userId !== ctx.session.user.id) {
        throw new Error("Imagem não encontrada ou sem permissão");
      }

      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: env.AWS_S3_BUCKET,
          Key: image.s3Key,
        })
      );

      const [deletedImage] = await db
        .delete(images)
        .where(eq(images.id, input.id))
        .returning();

      return deletedImage;
    }),
});
