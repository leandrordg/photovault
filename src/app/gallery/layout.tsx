import { GalleryHeader } from "@/modules/gallery/components/gallery-header";

export default function MediaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GalleryHeader />
      {children}
    </>
  );
}
