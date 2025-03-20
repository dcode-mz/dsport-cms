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
import { createSport } from "@/app/actions/sports";
import { toast } from "sonner";

const createSportFormSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  icon: z.string().min(3, "O ícone deve ter pelo menos 3 caracteres"),
  description: z
    .string()
    .min(10, "A descrição deve ter pelo menos 10 caracteres"),
});

export default function CreateSportDialog() {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof createSportFormSchema>>({
    resolver: zodResolver(createSportFormSchema),
    defaultValues: {
      name: "",
      icon: "",
      description: "",
    },
  });

  function onSubmit(values: z.infer<typeof createSportFormSchema>) {
    startTransition(async () => {
      await createSport(values);
      toast.success("Desporto criado com sucesso!");
      setOpen(false);
      form.reset();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen} modal={true}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer">Criar Desporto</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Novo Desporto</DialogTitle>
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
                    <Input placeholder="Nome do desporto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
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
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descrição do desporto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending}>
              {isPending ? "Criando..." : "Criar Desporto"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
