// components/tournament/TournamentHeader.tsx
import { Tournament } from "@/app/types/tournament";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { format } from "date-fns";
import Image from "next/image";

export function TournamentHeader({ tournament }: { tournament: Tournament }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-4">
          <Image
            width={64}
            height={64}
            src={tournament.logo}
            alt={tournament.name}
            className="h-16 w-16"
          />
          <div>
            <CardTitle>{tournament.name}</CardTitle>
            <CardDescription>{tournament.description} model</CardDescription>
          </div>
        </div>
        <Button variant="outline">Editar Torneio</Button>
      </CardHeader>
      <CardContent className="grid grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Formato</p>
          <p>{tournament.type.name}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Organizador</p>
          <p>{tournament.organizer}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Período</p>
          <p>
            {format(
              new Date(
                tournament.seasons[0].startDate as string | number | Date
              ),
              "dd-MM-yyyy"
            )}{" "}
            -{" "}
            {format(
              new Date(tournament.seasons[0].endDate as string | number | Date),
              "dd-MM-yyyy"
            )}
          </p>
        </div>
        {tournament.type.name == "LIGA" ? (
          <div>
            <p className="text-sm text-muted-foreground">
              Critério de Desempate
            </p>
            <p>
              {tournament.tieBreakerRule
                .sort((a, b) => a.priority - b.priority)
                .map((rule) => rule.tieBreakerRuleType.name)
                .join(" > ")}
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-muted-foreground">
              Disputa para terceiro lugar
            </p>
            <p>{tournament.thirdPlaceMatch ? "Sim" : "Não"}</p>
          </div>
        )}

        <div>
          <p className="text-sm text-muted-foreground">País</p>
          <p>{tournament.country.name}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Género</p>
          <p>{tournament.gender.name}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Nível</p>
          <p>{tournament.level.name}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Categoria</p>
          <p>{tournament.category.name}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Desporto</p>
          <p>{tournament.sport.name}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Número de equipas</p>
          <p>{tournament.seasons[0]._count.teams}</p>
        </div>
      </CardContent>
    </Card>
  );
}
