import { createTRPCRouter } from "../init";
import { mediaRouter } from "../procedures/media";

export const appRouter = createTRPCRouter({
  media: mediaRouter,
});

export type AppRouter = typeof appRouter;
