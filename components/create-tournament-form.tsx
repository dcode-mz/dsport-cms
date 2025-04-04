"use client";

import { useState, useTransition } from "react";
import TournamentBasicInfoFormTab from "./tournament-basic-form-tab";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "./ui/form";
import { TournamentCharacteristics } from "@/app/types/tournament";
import { createTournament } from "@/app/actions/tournaments";
import { toast } from "sonner";
import TournamentCupFormTab from "./tournament-cup-form-tab";
import TournamentLeagueFormTab from "./tournament-league-form-tab";
import { useRouter } from "next/navigation";

const ruleSchema = z.object({
  id: z.string().uuid(),
  priority: z.number().int().min(1, {
    message: "A prioridade deve ser um número inteiro e maior que 0",
  }),
});

const createTournamentFormSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  logo: z.instanceof(File).optional(),
  country: z.string().uuid(),
  organizer: z.string(),
  gender: z.string().uuid(),
  type: z.string().uuid(),
  level: z.string().uuid(),
  category: z.string().uuid(),
  tieBreakerRuleTypes: z.array(ruleSchema).optional(),
  sport: z.string().uuid(),
  season: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  description: z.string().optional(),
  third_place: z.boolean().optional(),
});

export default function CreateTournamentForm({
  characteristicsResponse,
}: {
  characteristicsResponse: TournamentCharacteristics;
}) {
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  

  const form = useForm<z.infer<typeof createTournamentFormSchema>>({
    resolver: zodResolver(createTournamentFormSchema),
    defaultValues: {
      name: "",
      logo: undefined,
      country: "",
      description: "",
      organizer: "",
      gender: "",
      type: "",
      level: "",
      category: "",
      tieBreakerRuleTypes: [],
      sport: "",
      season: "",
      startDate: "",
      endDate: "",
      third_place: false,
    },
  });

  const nextStep = async () => {
    // Validar campos antes de avançar
    if (step === 1) {
      const isValid = await form.trigger([
        "name",
        "type",
        "logo",
        "description",
        "country",
        "organizer",
        "gender",
        "type",
        "level",
        "category",
        "sport",
        "season",
        "startDate",
        "endDate",
      ]);

      if (isValid) setStep(step + 1);
    } else {
      setStep(step + 1);
    }
  };

  const prevStep = () => setStep(step - 1);

  function onSubmit(values: z.infer<typeof createTournamentFormSchema>) {
    startTransition(async () => {
      await createTournament(values);
      toast.success("Torneio criado com sucesso!");
      router.push("/dashboard/tournaments");
      form.reset();
    });
  }

  return (
    <div className="max-w-4xl p-6">
      <div className="flex mb-6">
        <div
          className={`flex-1 border-b-2 ${
            step >= 1 ? "border-primary" : "border-gray-300"
          } pb-2`}
        >
          <span
            className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step >= 1 ? "bg-primary text-white" : "bg-gray-300"
            }`}
          >
            1
          </span>
          <p className="text-center mt-2">Informações Básicas</p>
        </div>
        <div
          className={`flex-1 border-b-2 ${
            step >= 2 ? "border-primary" : "border-gray-300"
          } pb-2`}
        >
          <span
            className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step >= 2 ? "bg-primary text-white" : "bg-gray-300"
            }`}
          >
            2
          </span>
          <p className="text-center mt-2">Mais Informações</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {step === 1 && (
            <TournamentBasicInfoFormTab
              characteristicsResponse={characteristicsResponse}
              form={form}
              nextStep={nextStep}
            />
          )}

          {step === 2 &&
            form.getValues("type") ===
              characteristicsResponse.types.find((item) => item.name === "TAÇA")
                ?.id && (
              <TournamentCupFormTab
                isPending={isPending}
                form={form}
                prevStep={prevStep}
              />
            )}

          {step === 2 &&
            form.getValues("type") ===
              characteristicsResponse.types.find((item) => item.name === "LIGA")
                ?.id && (
              <TournamentLeagueFormTab
                isPending={isPending}
                characteristicsResponse={characteristicsResponse}
                form={form}
                prevStep={prevStep}
              />
            )}
        </form>
      </Form>
    </div>
  );
}
