import { media } from "@/db/schema";

export type MediaType = "image" | "video";

export type MediaItem = typeof media.$inferSelect;
export type NewMediaItem = typeof media.$inferInsert;

export type AllowedMediaTypes = "all" | "images" | "videos";

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
] as const;

export const ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/mov",
  "video/quicktime",
  "video/avi",
  "video/mkv",
  "video/webm",
] as const;

export const ACCEPTED_MEDIA_TYPES = [
  ...ACCEPTED_IMAGE_TYPES,
  ...ACCEPTED_VIDEO_TYPES,
] as const;

export const isImageType = (mimeType: string): boolean => {
  return ACCEPTED_IMAGE_TYPES.includes(mimeType as any);
};

export const isVideoType = (mimeType: string): boolean => {
  return ACCEPTED_VIDEO_TYPES.includes(mimeType as any);
};

export const getMediaType = (mimeType: string): MediaType | null => {
  if (isImageType(mimeType)) return "image";
  if (isVideoType(mimeType)) return "video";
  return null;
};

export const MAX_IMAGE_SIZE = 50 * 1024 * 1024;
export const MAX_VIDEO_SIZE = 500 * 1024 * 1024;

export const getMaxFileSize = (mediaType: MediaType): number => {
  return mediaType === "image" ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
};
