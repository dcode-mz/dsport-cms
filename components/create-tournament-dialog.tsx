"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createTournament } from "@/app/actions/tournaments";
import { toast } from "sonner";
import { TournamentCharacteristics } from "@/app/types/tournament";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const createTournamentFormSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  logo: z.instanceof(File).optional(),
  country: z.string(),
  organizer: z.string(),
  gender: z.string(),
  type: z.string(),
  level: z.string(),
  format: z.string(),
  category: z.string(),
  tiebreakerCriteria: z.string(),
  sport: z.string(),
  description: z
    .string()
    .min(10, "A descrição deve ter pelo menos 10 caracteres"),
});

export default function CreateTournamentDialog({
  characteristicsResponse,
}: {
  characteristicsResponse: TournamentCharacteristics;
}) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

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
      format: "",
      category: "",
      tiebreakerCriteria: "",
      sport: "",
    },
  });

  function onSubmit(values: z.infer<typeof createTournamentFormSchema>) {
    startTransition(async () => {
      console.log(values);
      await createTournament(values);
      toast.success("Torneio criado com sucesso!");
      setOpen(false);
      form.reset();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen} modal={true}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer">Criar Torneio</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Torneio</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do torneio" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="logo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => field.onChange(e.target.files?.[0])}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="organizer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organizador</FormLabel>
                  <FormControl>
                    <Input placeholder="Organizador" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {Object.entries({
              country: characteristicsResponse.countries,
              gender: characteristicsResponse.genders,
              type: characteristicsResponse.types,
              level: characteristicsResponse.levels,
              format: characteristicsResponse.formats,
              category: characteristicsResponse.categories,
              tiebreakerCriteria: characteristicsResponse.tiebreakerCriteria,
              sport: characteristicsResponse.sports,
            }).map(([key, options]) => (
              <FormField
                key={key}
                control={form.control}
                name={key as keyof z.infer<typeof createTournamentFormSchema>}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={typeof field.value === "string" ? field.value : undefined}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Selecione um(a) ${key}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {options.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descrição do torneio" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending}>
              {isPending ? "Criando..." : "Criar Torneio"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
