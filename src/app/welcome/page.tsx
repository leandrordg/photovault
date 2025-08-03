"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTrigger,
} from "@/components/ui/stepper";
import { authClient } from "@/lib/auth-client";
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloudUploadIcon,
  EyeIcon,
  HeartIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function WelcomePage() {
  const { data, isPending } = authClient.useSession();
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    {
      step: 1,
      title: "Faça upload de suas mídias",
      description:
        "Envie suas fotos e vídeos arrastando para a área de upload ou clicando para selecionar arquivos do seu dispositivo. Suporte para múltiplos formatos e envio em lote, de forma rápida e segura.",
      icon: CloudUploadIcon,
    },
    {
      step: 2,
      title: "Visualize e organize com facilidade",
      description:
        "Navegue pela galeria e clique em qualquer mídia para abrir uma visualização detalhada em uma interface lateral. Renomeie, adicione descrições ou organize por pastas e categorias personalizadas.",
      icon: EyeIcon,
    },
    {
      step: 3,
      title: "Gerencie de forma inteligente",
      description:
        "Utilize filtros avançados para encontrar mídias específicas, marque como favoritas para acesso rápido e faça download em diferentes resoluções. Tenha total controle da sua biblioteca com poucos cliques.",
      icon: HeartIcon,
    },
  ];

  const currentStepData = steps.find((s) => s.step === currentStep);

  return (
    <div className="space-y-12 p-4">
      <Badge>photovault</Badge>

      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight lowercase break-words">
          bem vindo(a),{" "}
          {isPending ? (
            <Skeleton className="w-32 h-7 inline-block" />
          ) : (
            data?.user.name.split(" ")[0]
          )}
          !
        </h1>
        <p className="text-lg text-muted-foreground">
          Comece a explorar suas mídias com nosso guia passo a passo.
        </p>
      </div>

      <div className="space-y-8">
        <Stepper value={currentStep} onValueChange={setCurrentStep}>
          {steps.map((step) => (
            <StepperItem
              key={step.step}
              step={step.step}
              className="not-last:flex-1"
            >
              <StepperTrigger asChild>
                <StepperIndicator />
              </StepperTrigger>
              {step.step < steps.length && <StepperSeparator />}
            </StepperItem>
          ))}
        </Stepper>

        {currentStepData && (
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="p-3 bg-muted rounded-full">
                <currentStepData.icon className="size-6 text-muted-foreground" />
              </div>
            </div>
            <h3 className="text-xl font-semibold">{currentStepData.title}</h3>
            <p className="text-muted-foreground leading-relaxed">
              {currentStepData.description}
            </p>
          </div>
        )}

        <div className="flex items-center gap-4 flex-wrap">
          <Button
            variant="outline"
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
          >
            <ChevronLeftIcon />
            Anterior
          </Button>
          {currentStep === steps.length ? (
            <Button asChild>
              <Link href="/gallery">
                Ir para a galeria
                <CheckIcon />
              </Link>
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() =>
                setCurrentStep((prev) => Math.min(steps.length, prev + 1))
              }
            >
              Próximo
              <ChevronRightIcon />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
