import { createTRPCRouter } from "../init";
import { imagesRouter } from "../procedures/images";

export const appRouter = createTRPCRouter({
  images: imagesRouter,
});

export type AppRouter = typeof appRouter;
