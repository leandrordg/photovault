import { auth } from "@/lib/auth";
import { HomeView } from "@/modules/home/views/home-view";
import { HydrateClient } from "@/trpc/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) redirect("/gallery");

  return (
    <HydrateClient>
      <HomeView />
    </HydrateClient>
  );
}
