"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { authClient } from "@/lib/auth-client";
import {
  BoltIcon,
  CalendarDaysIcon,
  Loader2Icon,
  LogInIcon,
  LogOutIcon,
  User2Icon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaGithub } from "react-icons/fa";

export function AuthModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { data, isPending } = authClient.useSession();
  const [loading, setLoading] = useState(false);

  const isAuthenticated = !!data?.user;

  const handleSignIn = async () => {
    setLoading(true);

    await authClient.signIn.social({
      provider: "github",
      callbackURL: "/gallery",
      newUserCallbackURL: "/welcome",
      fetchOptions: {
        onSuccess: () => {
          setLoading(false);
          setIsOpen(false);
        },
      },
    });
  };

  const handleSignOut = async () => {
    setLoading(true);

    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          setLoading(false);
          setIsOpen(false);
          router.push("/");
        },
      },
    });
  };

  if (isPending) {
    return (
      <Button size="sm">
        <Loader2Icon className="animate-spin" />
      </Button>
    );
  }

  if (isAuthenticated) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button size="sm" aria-label={data.user.name || "Perfil do usuário"}>
            <User2Icon />
            <span className="sr-only">
              {data.user.name || "Perfil do usuário"}
            </span>
          </Button>
        </DialogTrigger>

        <DialogContent showCloseButton={false}>
          <DialogHeader className="text-start">
            <DialogTitle>{data.user.name}</DialogTitle>
            <DialogDescription>{data.user.email}</DialogDescription>
            <div className="flex items-center gap-1 text-muted-foreground">
              <CalendarDaysIcon className="size-4" />
              <span className="text-sm">
                {data.user.createdAt.toLocaleDateString("pt-BR", {
                  dateStyle: "long",
                })}
              </span>
            </div>
          </DialogHeader>

          <DialogFooter className="flex-row justify-end">
            <Button variant="outline">
              <BoltIcon />
              <span className="sr-only">Configurações</span>
            </Button>
            <Button variant="outline">
              <User2Icon />
              <span className="sr-only">Perfil</span>
            </Button>
            <Button type="button" onClick={handleSignOut} disabled={loading}>
              Sair
              <LogOutIcon />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" aria-label="Fazer login">
          <LogInIcon />
          <span className="sr-only">Fazer login</span>
        </Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Acessar minha conta</DialogTitle>
          <DialogDescription>
            Faça login para acessar suas fotos e vídeos.
          </DialogDescription>
        </DialogHeader>

        <Button onClick={handleSignIn} disabled={loading}>
          <FaGithub />
          Continuar com o GitHub
        </Button>

        <DialogFooter>
          <p className="text-xs text-muted-foreground">
            Ao continuar, você concorda com nossos{" "}
            <Link
              href="https://photovaultbr.vercel.app/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Termos de Serviço
            </Link>{" "}
            e{" "}
            <Link
              href="https://photovaultbr.vercel.app/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Política de Privacidade
            </Link>
            .
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
