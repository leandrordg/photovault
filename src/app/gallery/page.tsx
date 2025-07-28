import { auth } from "@/lib/auth";
import { GalleryView } from "@/modules/gallery/views/gallery-view";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function GalleryPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/");

  prefetch(trpc.images.list.queryOptions());

  return (
    <HydrateClient>
      <GalleryView />
    </HydrateClient>
  );
}
