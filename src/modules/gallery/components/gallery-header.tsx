import { AuthModal } from "@/modules/auth/components/auth-modal";

export function GalleryHeader() {
  return (
    <header className="h-14">
      <div className="px-4 h-full flex items-center gap-4">
        <div className="ml-auto">
          <AuthModal />
        </div>
      </div>
    </header>
  );
}
