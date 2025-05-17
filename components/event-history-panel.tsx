import { GameEvent, TeamInGame } from "@/app/types/match-live";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Undo2 } from "lucide-react";

interface EventHistoryPanelProps {
  lastEvents: GameEvent[];
  onUndo: () => void;
  teams: TeamInGame[]; // Para buscar nomes de jogadores/equipas
}

export function EventHistoryPanel({
  lastEvents,
  onUndo,
  teams,
}: EventHistoryPanelProps) {
  const getPlayerName = (playerId?: string): string => {
    if (!playerId) return "";
    for (const team of teams) {
      const player = team.players.find((p) => p.id === playerId);
      if (player) return `#${player.number} ${player.name}`;
    }
    return "ID: " + playerId.substring(0, 4);
  };

  const getTeamShortName = (teamId?: string): string => {
    if (!teamId) return "";
    const team = teams.find((t) => t.id === teamId);
    return team ? team.shortName : "";
  };

  const formatEventDescription = (event: GameEvent): string => {
    // Gerar uma descrição concisa do evento
    let desc = `${event.type}`;
    if (event.primaryPlayerId)
      desc += ` por ${getPlayerName(event.primaryPlayerId)}`;
    if (event.primaryTeamId && !event.primaryPlayerId)
      desc += ` (Equipa: ${getTeamShortName(event.primaryTeamId)})`;

    if (event.shotDetails) {
      desc += ` (${event.shotDetails.type}, ${event.shotDetails.points}pts)`;
      if (event.shotDetails.isAssisted)
        desc += ` Assist: ${getPlayerName(event.shotDetails.assistPlayerId)}`;
    }
    if (event.foulDetails) {
      desc += ` Falta ${
        event.foulDetails.personalFoulType ||
        event.foulDetails.technicalFoulType
      }`;
      if (event.foulDetails.committedByPlayerId)
        desc += ` em ${getPlayerName(event.foulDetails.committedByPlayerId)}`;
      else if (event.foulDetails.committedBy)
        desc += ` (${event.foulDetails.committedBy} ${getTeamShortName(
          event.foulDetails.committedByTeamId
        )})`;
      if (event.foulDetails.drawnByPlayerId)
        desc += ` sofrida por ${getPlayerName(
          event.foulDetails.drawnByPlayerId
        )}`;
    }
    if (event.freeThrowDetails) {
      desc = `LL de ${getPlayerName(event.freeThrowDetails.shooterPlayerId)}: ${
        event.freeThrowDetails.isMade ? "CONV." : "FALH."
      } (${event.freeThrowDetails.attemptNumberInSequence}/${
        event.freeThrowDetails.totalAwarded
      })`;
    }
    if (event.substitutionDetails) {
      desc = `Sub: Entra ${getPlayerName(
        event.substitutionDetails.playerInId
      )}, Sai ${getPlayerName(
        event.substitutionDetails.playerOutId
      )} (${getTeamShortName(event.substitutionDetails.teamId)})`;
    }
    // Adicionar mais formatações para outros tipos de evento...
    return event.description || desc;
  };

  return (
    <Card className="w-full">
      <CardHeader className="py-1.5 px-2 md:py-2 md:px-3 flex flex-row items-center justify-between">
        <CardTitle className="text-xs md:text-sm">Últimos Eventos</CardTitle>
        {lastEvents.length > 0 && (
          <Button
            variant="ghost"
            size="xs"
            onClick={onUndo}
            className="text-red-500 hover:text-red-600 gap-1"
          >
            <Undo2 size={14} /> Desfazer
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {lastEvents.length === 0 && (
          <p className="text-xs text-muted-foreground text-center p-4">
            Nenhum evento registado.
          </p>
        )}
        {lastEvents.length > 0 && (
          <ScrollArea className="h-32 md:h-40">
            {" "}
            {/* Altura fixa para scroll */}
            <ul className="space-y-0.5 p-1.5 md:p-2">
              {
                lastEvents
                  .map((event) => (
                    <li
                      key={event.id}
                      className="text-[10px] md:text-xs p-1 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 leading-tight"
                    >
                      <span className="font-semibold text-blue-500 dark:text-blue-400">
                        {event.gameClock}
                      </span>{" "}
                      - {formatEventDescription(event)}
                    </li>
                  ))
                  .reverse() /* Mostrar mais recente no topo */
              }
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
