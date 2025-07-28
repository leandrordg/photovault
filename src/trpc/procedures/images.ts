import { db } from "@/db";
import { images } from "@/db/schema";
import { s3 } from "@/lib/s3";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod/v4";
import { createTRPCRouter, protectedProcedure } from "../init";

export const imagesRouter = createTRPCRouter({
  getPreSignedUrl: protectedProcedure
    .input(z.object({ fileName: z.string(), contentType: z.string() }))
    .mutation(async ({ input }) => {
      const { fileName, contentType } = input;

      const key = `uploads/${nanoid()}-${fileName}`;

      const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        ContentType: contentType,
      });

      const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

      return { url, key };
    }),

  save: protectedProcedure
    .input(
      z.object({
        s3Key: z.string(),
        filename: z.string(),
        mimeType: z.string(),
        fileSize: z.number(),
        width: z.number().optional(),
        height: z.number().optional(),
        blur: z.string().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const {
        s3Key,
        filename,
        mimeType,
        fileSize,
        width,
        height,
        title,
        description,
        blur,
      } = input;

      const [savedImage] = await db
        .insert(images)
        .values({
          userId: ctx.session.user.id,
          s3Key,
          filename,
          mimeType,
          fileSize,
          width,
          height,
          title,
          description,
          blur,
        })
        .returning();

      return savedImage;
    }),

  getImageUrl: protectedProcedure
    .input(z.object({ s3Key: z.string() }))
    .query(async ({ input }) => {
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: input.s3Key,
      });

      const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
      return { url };
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const userImages = await db
      .select()
      .from(images)
      .where(eq(images.userId, ctx.session.user.id))
      .orderBy(desc(images.uploadedAt));

    // Gerar URLs assinadas para todas as imagens
    const imagesWithUrls = await Promise.all(
      userImages.map(async (image) => {
        const command = new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: image.s3Key,
        });

        const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

        return {
          ...image,
          url,
        };
      })
    );

    return imagesWithUrls;
  }),

  get: protectedProcedure
    .input(z.object({ id: z.string().nullable() }))
    .query(async ({ input, ctx }) => {
      if (!input.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "ID da imagem não fornecido",
        });
      }

      const [image] = await db
        .select()
        .from(images)
        .where(
          and(eq(images.id, input.id), eq(images.userId, ctx.session.user.id))
        );

      if (!image) {
        throw new Error("Imagem não encontrada ou sem permissão");
      }

      // Gerar URL assinada para a imagem
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: image.s3Key,
      });

      const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

      return {
        ...image,
        url,
      };
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

      await s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET,
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
