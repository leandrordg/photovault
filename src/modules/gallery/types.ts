import { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";

export type Media = inferRouterOutputs<AppRouter>["media"]["list"][number];
