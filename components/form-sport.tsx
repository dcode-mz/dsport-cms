"use client";

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
import { createSport } from "@/app/actions/sports";
import { useTransition } from "react";
import { toast } from "sonner";

const createSportFormSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  icon: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  description: z
    .string()
    .min(10, "A descrição deve ter pelo menos 10 caracteres"),
});

export default function FormSports() {
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof createSportFormSchema>>({
    resolver: zodResolver(createSportFormSchema),
  });

  function onSubmit(values: z.infer<typeof createSportFormSchema>) {
    startTransition(async () => {
      await createSport({
        name: values.name,
        icon: values.icon,
        description: values.description,
      });
      console.log(values);
      toast.success("Desporto criado com sucesso.");
    });
  }
  return (
    <>
      <div>
        <h1 className="text-3xl font-bold">Criar Desporto</h1>
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 max-w-3xl"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input placeholder="Nome" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="icon"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ícone</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: football.svg" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Textarea placeholder="Descrição" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="cursor-pointer" disabled={isPending}>
            {isPending ? "Enviando..." : "Criar Desporto"}
          </Button>
        </form>
      </Form>
    </>
  );
}
