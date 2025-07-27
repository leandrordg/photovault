import { z } from "zod";
import { baseProcedure, createTRPCRouter } from "../init";

export const appRouter = createTRPCRouter({
  // example procedure
  example: baseProcedure
    .input(z.object({ text: z.string().min(1) }))
    .query(({ input }) => {
      return `Hello ${input.text}`;
    }),
});

export type AppRouter = typeof appRouter;
