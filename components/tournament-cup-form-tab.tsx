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

export default function TournamentCupFormTab({
  isPending,
  form,
  prevStep,
}: {
  isPending: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
  prevStep: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-3 grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="third_place"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Disputa para terceiro lugar</FormLabel>
              <FormControl>
                <Select
                  onValueChange={(value) => field.onChange(value === "true")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Sim</SelectItem>
                    <SelectItem value="false">Não</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={prevStep}>
          Voltar
        </Button>
        <div className="flex justify-end space-x-2">
          <Button type="submit" className="cursor-pointer" disabled={isPending}>
            {isPending ? "Criando..." : "Criar Torneio"}
          </Button>
        </div>
      </div>
    </div>
  );
}
