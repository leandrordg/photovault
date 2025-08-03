import { Header } from "@/components/header";

export default function WelcomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-4xl mx-auto min-h-dvh">
      <Header />
      {children}
    </div>
  );
}
