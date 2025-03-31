import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { TournamentCharacteristics } from "@/app/types/tournament";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "./ui/calendar";

export default function TournamentBasicInfoFormTab({
  characteristicsResponse,
  form,
  nextStep,
}: {
  characteristicsResponse: TournamentCharacteristics;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
  nextStep: () => void;
}) {
  return (
    <div className="space-y-4">
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
      <div className="grid lg:grid-cols-3 grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>País</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={
                    typeof field.value === "string" ? field.value : undefined
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um país" />
                  </SelectTrigger>
                  <SelectContent>
                    {characteristicsResponse.countries.map((option) => (
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
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gênero</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={
                    typeof field.value === "string" ? field.value : undefined
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um gênero" />
                  </SelectTrigger>
                  <SelectContent>
                    {characteristicsResponse.genders.map((option) => (
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
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={
                    typeof field.value === "string" ? field.value : undefined
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {characteristicsResponse.types.map((option) => (
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
        <FormField
          control={form.control}
          name="level"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nível</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={
                    typeof field.value === "string" ? field.value : undefined
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um nível" />
                  </SelectTrigger>
                  <SelectContent>
                    {characteristicsResponse.levels.map((option) => (
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
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={
                    typeof field.value === "string" ? field.value : undefined
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {characteristicsResponse.categories.map((option) => (
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
                    typeof field.value === "string" ? field.value : undefined
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um esporte" />
                  </SelectTrigger>
                  <SelectContent>
                    {characteristicsResponse.sports.map((option) => (
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
        <FormField
          control={form.control}
          name="season"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Temporada</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={
                    typeof field.value === "string" ? field.value : undefined
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um esporte" />
                  </SelectTrigger>
                  <SelectContent>
                    {characteristicsResponse.seasons.map((option) => (
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
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data de início</FormLabel>
              <Popover modal={true}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value
                        ? format(field.value, "dd/MM/yyyy")
                        : "Selecione uma data"}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent align="start" className="p-0">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) =>
                      field.onChange(date ? date.toISOString() : "")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data de Fim</FormLabel>
              <Popover modal={true}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value
                        ? format(field.value, "dd/MM/yyyy")
                        : "Selecione uma data"}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent align="start" className="p-0" forceMount>
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) =>
                      field.onChange(date ? date.toISOString() : "")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

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

      <div className="flex justify-end">
        <Button type="button" onClick={nextStep}>
          Próximo
        </Button>
      </div>
    </div>
  );
}
