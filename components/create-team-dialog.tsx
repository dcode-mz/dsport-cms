"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { TeamCharacteristics } from "@/app/types/team";
import { createTeam } from "@/app/actions/teams";

const createTeamFormSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  club: z.string().optional().nullable(),
  gender: z.string(),
  teamType: z.string(),
  venue: z.string(),
  contact: z.string(),
  location: z.string(),
  sport: z.string(),
  category: z.string(),
  formatsTeam: z.string(),
});

export default function CreateTeamDialog({
  characteristicsResponse,
}: {
  characteristicsResponse: TeamCharacteristics;
}) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof createTeamFormSchema>>({
    resolver: zodResolver(createTeamFormSchema),
  });

  function onSubmit(values: z.infer<typeof createTeamFormSchema>) {
    startTransition(async () => {
      console.log(values);
      await createTeam(values);
      toast.success("Equipa criado com sucesso!");
      setOpen(false);
      form.reset();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen} modal={true}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer">Criar Equipa</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Nova Equipa</DialogTitle>
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
              name="contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contacto</FormLabel>
                  <FormControl>
                    <Input placeholder="Contacto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Location" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {Object.entries({
              club: characteristicsResponse.clubs,
              gender: characteristicsResponse.genders,
              sport: characteristicsResponse.sports,
              teamType: characteristicsResponse.teamTypes,
              venue: characteristicsResponse.venues,
              category: characteristicsResponse.categories,
              formatsTeam: characteristicsResponse.formatsTeam,
            }).map(([key, options]) => (
              <FormField
                key={key}
                control={form.control}
                name={key as keyof z.infer<typeof createTeamFormSchema>}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={
                          typeof field.value === "string"
                            ? field.value
                            : undefined
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Selecione um(a)`} />
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
            <Button type="submit" disabled={isPending}>
              {isPending ? "Criando..." : "Criar Torneio"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
