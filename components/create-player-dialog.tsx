"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { PlayerCharacteristics } from "@/app/types/player";
import { createPlayer } from "@/app/actions/player";
import Image from "next/image";

const playerFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  nickname: z.string().optional(),
  preferredNumber: z
    .coerce
    .number().optional(),
  preferredPosition: z.string().uuid("Posição inválida"),
  sport: z.string().uuid("Desporto inválido"),
  gender: z.string().uuid("Género inválida"),
  preferredFoot: z.string().optional(),
  dateOfBirth: z.string(),
  primaryNationality: z.string().uuid("Nacionalidade inválida"),
  height: z.coerce.number().min(1, "Altura inválida"),
  weight: z.coerce.number().min(1, "Peso inválido"),
  photo: z.instanceof(File).optional(),
  team: z.string().optional(),
});

export default function CreatePlayerDialog({
  playerCharacteristics,
}: {
  playerCharacteristics: PlayerCharacteristics;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof playerFormSchema>>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: {
      name: "",
      nickname: "",
      sport: "",
      gender: "",
      preferredPosition: "",
      preferredFoot: "",
      dateOfBirth: "",
      primaryNationality: "",
      height: 0,
      weight: 0,
      photo: undefined,
      team: "",
    },
  });

  const onSubmit = (data: z.infer<typeof playerFormSchema>) => {
    startTransition(async () => {
      await createPlayer(data);
      toast.success("Jogador criado com sucesso!");
      form.reset();
      setOpen(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Criar Jogador</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Jogador</DialogTitle>
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
                    <Input placeholder="Nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nickname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nickname</FormLabel>
                  <FormControl>
                    <Input placeholder="Nickname" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preferredNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número preferido</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Número preferido"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sport"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Desporto</FormLabel>
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
                        <SelectValue placeholder="Selecione uma" />
                      </SelectTrigger>
                      <SelectContent>
                        {playerCharacteristics.sports.map((sport) => (
                          <SelectItem key={sport.id} value={sport.id}>
                            {sport.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Género</FormLabel>
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
                        <SelectValue placeholder="Selecione uma" />
                      </SelectTrigger>
                      <SelectContent>
                        {playerCharacteristics.genders.map((gender) => (
                          <SelectItem key={gender.id} value={gender.id}>
                            {gender.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preferredPosition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Posição</FormLabel>
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
                        <SelectValue placeholder="Selecione uma" />
                      </SelectTrigger>
                      <SelectContent>
                        {playerCharacteristics.preferredPositions
                          .filter(
                            (position) =>
                              position.sport.id === form.watch("sport")
                          )
                          .map((position) => (
                            <SelectItem key={position.id} value={position.id}>
                              {position.name} - {position.code}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preferredFoot"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pé Favorito</FormLabel>
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
                        <SelectValue placeholder="Selecione uma" />
                      </SelectTrigger>
                      <SelectContent>
                        {playerCharacteristics.preferredFoots.map((foot) => (
                          <SelectItem key={foot.id} value={foot.id}>
                            {foot.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Nascimento</FormLabel>
                  <Popover modal={true}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? format(new Date(field.value), "dd/MM/yyyy")
                            : "Selecionar data"}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="p-0" forceMount>
                      <Calendar
                        mode="single"
                        selected={
                          field.value ? new Date(field.value) : undefined
                        }
                        onSelect={(date) =>
                          field.onChange(date ? date.toISOString() : "")
                        }
                        initialFocus
                        captionLayout="dropdown-buttons"
                        fromYear={1900}
                        toDate={new Date()}
                        classNames={{
                          caption:
                            "flex justify-between pt-1 relative items-center gap-2 px-2",
                          caption_label: "text-sm font-medium capitalize",
                          caption_dropdowns: "flex justify-center gap-2",
                          nav_button_previous: "relative left-1",
                          nav_button_next: "relative right-1",
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="primaryNationality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nacionalidade</FormLabel>
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
                        <SelectValue placeholder="Selecione uma" />
                      </SelectTrigger>
                      <SelectContent>
                        {playerCharacteristics.countries.map((country) => (
                          <SelectItem key={country.id} value={country.id}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="height"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Altura (m)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="1.75"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Peso (kg)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="70"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="photo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Foto</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => field.onChange(e.target.files?.[0])}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="team"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time</FormLabel>
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
                        <SelectValue placeholder="Selecione uma" />
                      </SelectTrigger>
                      <SelectContent>
                        {playerCharacteristics.teams
                          .filter(
                            (team) =>
                              team.gender.id === form.watch("gender") &&
                              team.sport.id === form.watch("sport")
                          )
                          .map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              <div className="flex items-center gap-2">
                                <Image
                                  width={16}
                                  height={16}
                                  src={
                                    team.club.logo ||
                                    "/default-club-picture.png"
                                  }
                                  alt={team.name}
                                  className="h-4 w-4"
                                />
                                {team.name}
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    As equipas que são listadas dependem do Desporto e Género
                    selecionados.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isPending}>
              {isPending ? "Criando..." : "Criar Jogador"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
