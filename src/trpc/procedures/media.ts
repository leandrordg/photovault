import { ACCEPTED_MEDIA_TYPES, getMediaType } from "@/config/media";
import { db } from "@/db";
import { media } from "@/db/schema";
import { s3 } from "@/lib/s3";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
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

export const mediaRouter = createTRPCRouter({
  getPreSignedUrl: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        contentType: z
          .string()
          .refine((type) => ACCEPTED_MEDIA_TYPES.includes(type as any), {
            message: "Tipo de arquivo não suportado",
          }),
      })
    )
    .mutation(async ({ input }) => {
      const { fileName, contentType } = input;

      const mediaType = getMediaType(contentType);
      if (!mediaType) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tipo de arquivo não suportado",
        });
      }

      const folder = mediaType === "image" ? "images" : "videos";
      const key = `uploads/${folder}/${nanoid()}-${fileName}`;

      const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        ContentType: contentType,
      });

      const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

      return { url, key, mediaType };
    }),

  getPreSignedUrlWithCustomKey: protectedProcedure
    .input(
      z.object({
        key: z.string(),
        contentType: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { key, contentType } = input;

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
        mediaType: z.enum(["image", "video"]),

        width: z.number().optional(),
        height: z.number().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        metadata: z.string().optional(),
        takenAt: z.date().optional(),

        blur: z.string().optional(),

        duration: z.number().optional(),
        thumbnailS3Key: z.string().optional(),
        thumbnailBlur: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const {
        s3Key,
        filename,
        mimeType,
        fileSize,
        mediaType,
        width,
        height,
        title,
        description,
        blur,
        duration,
        thumbnailS3Key,
        thumbnailBlur,
        metadata,
        takenAt,
      } = input;

      const [savedMedia] = await db
        .insert(media)
        .values({
          userId: ctx.session.user.id,
          s3Key,
          filename,
          mimeType,
          fileSize,
          mediaType,
          width,
          height,
          title,
          description,
          blur,
          duration,
          thumbnailS3Key,
          thumbnailBlur,
          metadata,
          takenAt,
        })
        .returning();

      return savedMedia;
    }),

  getMediaUrl: protectedProcedure
    .input(z.object({ s3Key: z.string() }))
    .query(async ({ input }) => {
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: input.s3Key,
      });

      const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

      return { url };
    }),

  download: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [mediaItem] = await db
        .select()
        .from(media)
        .where(
          and(eq(media.id, input.id), eq(media.userId, ctx.session.user.id))
        );

      if (!mediaItem) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Mídia não encontrada",
        });
      }

      const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: mediaItem.s3Key,
        ResponseContentDisposition: `attachment; filename="${encodeURIComponent(
          mediaItem.filename
        )}"`,
        ResponseContentType: mediaItem.mimeType,
      });

      const url = await getSignedUrl(s3, command, { expiresIn: 300 });

      return { url, filename: mediaItem.filename };
    }),

  list: protectedProcedure
    .input(
      z.object({
        mediaType: z.enum(["all", "image", "video"]).default("all"),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        showFavorites: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      let whereConditions = [eq(media.userId, ctx.session.user.id)];

      if (input.mediaType !== "all") {
        whereConditions.push(eq(media.mediaType, input.mediaType));
      }

      if (input.showFavorites) {
        whereConditions.push(eq(media.isFavorite, true));
      }

      const whereCondition = and(...whereConditions);

      const userMedia = await db
        .select()
        .from(media)
        .where(whereCondition)
        .orderBy(desc(media.uploadedAt))
        .limit(input.limit)
        .offset(input.offset);

      const mediaWithUrls = await Promise.all(
        userMedia.map(async (mediaItem) => {
          const command = new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: mediaItem.s3Key,
          });

          const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

          let thumbnailUrl = null;

          if (mediaItem.mediaType === "video" && mediaItem.thumbnailS3Key) {
            const thumbnailCommand = new GetObjectCommand({
              Bucket: process.env.AWS_S3_BUCKET,
              Key: mediaItem.thumbnailS3Key,
            });

            thumbnailUrl = await getSignedUrl(s3, thumbnailCommand, {
              expiresIn: 3600,
            });
          }

          return {
            ...mediaItem,
            url,
            thumbnailUrl,
          };
        })
      );

      return mediaWithUrls;
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string().nullable() }))
    .query(async ({ input, ctx }) => {
      if (!input.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "ID da mídia não fornecido",
        });
      }

      const [mediaItem] = await db
        .select()
        .from(media)
        .where(
          and(eq(media.id, input.id), eq(media.userId, ctx.session.user.id))
        );

      if (!mediaItem) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Mídia não encontrada ou sem permissão",
        });
      }

      const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: mediaItem.s3Key,
      });

      const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

      let thumbnailUrl = null;

      if (mediaItem.mediaType === "video" && mediaItem.thumbnailS3Key) {
        const thumbnailCommand = new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: mediaItem.thumbnailS3Key,
        });

        thumbnailUrl = await getSignedUrl(s3, thumbnailCommand, {
          expiresIn: 3600,
        });
      }

      return {
        ...mediaItem,
        url,
        thumbnailUrl,
      };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [mediaItem] = await db
        .select()
        .from(media)
        .where(eq(media.id, input.id));

      if (!mediaItem || mediaItem.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Mídia não encontrada ou sem permissão",
        });
      }

      await s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: mediaItem.s3Key,
        })
      );

      if (mediaItem.mediaType === "video" && mediaItem.thumbnailS3Key) {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: mediaItem.thumbnailS3Key,
          })
        );
      }

      const [deletedMedia] = await db
        .delete(media)
        .where(eq(media.id, input.id))
        .returning();

      return deletedMedia;
    }),

  toggleFavorite: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [mediaItem] = await db
        .select()
        .from(media)
        .where(
          and(eq(media.id, input.id), eq(media.userId, ctx.session.user.id))
        );

      if (!mediaItem) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Mídia não encontrada",
        });
      }

      const [updatedMedia] = await db
        .update(media)
        .set({
          isFavorite: !mediaItem.isFavorite,
          updatedAt: new Date(),
        })
        .where(eq(media.id, input.id))
        .returning();

      return updatedMedia;
    }),
});
