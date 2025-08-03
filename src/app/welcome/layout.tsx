import { GalleryHeader } from "@/modules/gallery/components/gallery-header";

export default function WelcomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-4xl mx-auto min-h-dvh">
      <GalleryHeader />
      {children}
    </div>
  );
}
