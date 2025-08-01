import { auth } from "@/lib/auth";
import { loadSearchParams } from "@/modules/gallery/params";
import { GalleryView } from "@/modules/gallery/views/gallery-view";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SearchParams } from "nuqs";

interface Props {
  searchParams: Promise<SearchParams>;
}

export default async function GalleryPage({ searchParams }: Props) {
  const filters = await loadSearchParams(searchParams);

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/");

  prefetch(trpc.media.list.queryOptions({ ...filters }));

  return (
    <HydrateClient>
      <GalleryView />
    </HydrateClient>
  );
}
