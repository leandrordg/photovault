"use client";

import { SingleImageUpload } from "@/components/image-uploader";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { LogOutIcon } from "lucide-react";

export function HomeView() {
  const { data: auth, isPending } = authClient.useSession();

  const handleSignIn = async () => {
    await authClient.signIn.social({
      provider: "github",
      callbackURL: "/gallery",
      newUserCallbackURL: "/welcome",
    });
  };

  const handleSignOut = async () => {
    await authClient.signOut();
  };

  const isSignedIn = !isPending && auth?.user;

  if (isSignedIn) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Button onClick={handleSignOut} disabled={isPending}>
          Sair <LogOutIcon />
        </Button>

        <SingleImageUpload />
      </div>
    );
  }

  return (
    <Button onClick={handleSignIn} disabled={isPending}>
      Entrar com GitHub
    </Button>
  );
}
