import { Header } from "@/components/header";

export default function MediaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-7xl mx-auto min-h-dvh">
      <Header />
      {children}
    </div>
  );
}
