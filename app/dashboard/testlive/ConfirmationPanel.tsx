import { Button } from "@/components/ui/button";
import { EventType, GameEvent, Team, Player } from "./game-types";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ConfirmationPanelProps {
  selectedEvent: EventType | null;
  selectedPlayer: Player | null;
  secondaryPlayer: Player | null;
  homeTeam: Team;
  awayTeam: Team;
  onConfirm: () => void;
  lastEvents: GameEvent[];
  onUndo: () => void;
  gameTime: string;
  currentQuarter: number;
  needsSecondaryPlayer: boolean;
  isSecondaryPlayerOptional: boolean;
}

const getEventLabel = (type: EventType) => {
  const labels = {
    "2POINTS": "2 Pontos",
    "3POINTS": "3 Pontos",
    FREE_THROW: "Lance Livre",
    FOUL: "Falta",
    TURNOVER: "Turnover",
    STEAL: "Roubo",
    BLOCK: "Bloqueio",
    SUBSTITUTION: "Substituição",
  };
  return labels[type] || type;
};

const EventHistoryItem = ({
  event,
  homeTeam,
  awayTeam,
}: {
  event: GameEvent;
  homeTeam: Team;
  awayTeam: Team;
}) => {
  const findPlayer = (playerId: string) => {
    const allPlayers = [...homeTeam.players, ...awayTeam.players];
    return allPlayers.find((p) => p.id === playerId);
  };

  const mainPlayer = findPlayer(event.playerId);
  const secondaryPlayer = event.secondaryPlayerId
    ? findPlayer(event.secondaryPlayerId)
    : null;
  const assister = event.assistedBy ? findPlayer(event.assistedBy) : null;
  const team = homeTeam.players.some((p) => p.id === event.playerId)
    ? homeTeam
    : awayTeam;

  const quarterLabel =
    event.quarter <= 4 ? `Q${event.quarter}` : `OT${event.quarter - 4}`;

  const renderEventDetails = () => {
    switch (event.type) {
      case "2POINTS":
      case "3POINTS":
        return (
          <div className="flex flex-col">
            <span>
              #{mainPlayer?.number} {mainPlayer?.name}
            </span>
            {assister && (
              <span className="text-sm text-gray-500">
                Assistência: #{assister.number}
              </span>
            )}
          </div>
        );
      case "FOUL":
        return (
          <div className="flex flex-col">
            <span>Cometida por: #{mainPlayer?.number}</span>
            <span className="text-sm text-gray-500">
              Sofrida por: #{secondaryPlayer?.number}
            </span>
          </div>
        );
      case "STEAL":
        return (
          <div className="flex flex-col">
            <span>Roubo por: #{mainPlayer?.number}</span>
            <span className="text-sm text-gray-500">
              Perdida por: #{secondaryPlayer?.number}
            </span>
          </div>
        );
      case "BLOCK":
        return (
          <div className="flex flex-col">
            <span>Bloqueio por: #{mainPlayer?.number}</span>
            <span className="text-sm text-gray-500">
              Arremesso de: #{secondaryPlayer?.number}
            </span>
          </div>
        );
      case "SUBSTITUTION":
        return (
          <div className="flex flex-col">
            <span>Sai: #{mainPlayer?.number}</span>
            <span className="text-sm text-gray-500">
              Entra: #{secondaryPlayer?.number}
            </span>
          </div>
        );
      default:
        return (
          <span>
            #{mainPlayer?.number} {mainPlayer?.name}
          </span>
        );
    }
  };

  return (
    <div className="text-sm p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 mb-2">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: team.primaryColor }}
          />
          <span className="font-medium">{getEventLabel(event.type)}</span>
        </div>
        <span className="text-xs text-gray-500">
          {quarterLabel} {event.gameTime.split(" ")[1]}
        </span>
      </div>
      {renderEventDetails()}
    </div>
  );
};

export function ConfirmationPanel({
  selectedEvent,
  selectedPlayer,
  secondaryPlayer,
  homeTeam,
  awayTeam,
  onConfirm,
  lastEvents,
  onUndo,
  gameTime,
  currentQuarter,
  needsSecondaryPlayer,
  isSecondaryPlayerOptional,
}: ConfirmationPanelProps) {
  const getPlayerTeam = (playerId: string) => {
    return homeTeam.players.some((p) => p.id === playerId)
      ? homeTeam
      : awayTeam;
  };

  const quarterLabel =
    currentQuarter <= 4 ? `Q${currentQuarter}` : `OT${currentQuarter - 4}`;

  const canConfirm =
    selectedEvent &&
    selectedPlayer &&
    (!needsSecondaryPlayer ||
      (isSecondaryPlayerOptional ? true : secondaryPlayer));

  const renderEventSummary = () => {
    if (!selectedEvent || !selectedPlayer) return null;

    const team = getPlayerTeam(selectedPlayer.id);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: team.primaryColor }}
          />
          <span className="font-bold">{getEventLabel(selectedEvent)}</span>
        </div>

        <div className="flex items-center gap-3 ml-4">
          {selectedPlayer.photo && (
            <div className="relative w-10 h-10 rounded-full overflow-hidden">
              <Image
                src={selectedPlayer.photo}
                alt={selectedPlayer.name}
                width={40}
                height={40}
                className="object-cover"
              />
            </div>
          )}
          <div>
            <p className="font-medium">
              #{selectedPlayer.number} {selectedPlayer.name}
            </p>
            <p className="text-xs text-gray-500">{team.shortName}</p>
          </div>
        </div>

        {secondaryPlayer && (
          <div className="flex items-center gap-3 ml-8">
            <div className="text-gray-500">
              {selectedEvent === "2POINTS" || selectedEvent === "3POINTS"
                ? "Assistência:"
                : selectedEvent === "FOUL"
                ? "Contra:"
                : selectedEvent === "STEAL"
                ? "De:"
                : selectedEvent === "BLOCK"
                ? "Bloqueou:"
                : "Entra:"}
            </div>
            <div className="flex items-center gap-2">
              {secondaryPlayer.photo && (
                <div className="relative w-8 h-8 rounded-full overflow-hidden">
                  <Image
                    src={secondaryPlayer.photo}
                    alt={secondaryPlayer.name}
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                </div>
              )}
              <span>
                #{secondaryPlayer.number} {secondaryPlayer.name}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-gray-200 dark:border-gray-700 flex flex-col h-full">
      <h3 className="font-bold text-lg mb-4 text-center">Confirmação</h3>

      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 mb-4">
        {renderEventSummary() || (
          <p className="text-gray-500 text-center py-4">
            Selecione um evento e jogador
          </p>
        )}
      </div>

      <Button
        onClick={onConfirm}
        disabled={!canConfirm}
        className={cn(
          "w-full py-4 text-lg font-bold mb-6",
          !canConfirm && "opacity-50 cursor-not-allowed"
        )}
      >
        CONFIRMAR • {quarterLabel} {gameTime}
      </Button>

      <div className="mt-auto">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-bold">Histórico</h4>
          {lastEvents.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onUndo}
              className="text-red-500 hover:text-red-600"
            >
              Desfazer
            </Button>
          )}
        </div>

        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {lastEvents.length > 0 ? (
            lastEvents.map((event) => (
              <EventHistoryItem
                key={event.id}
                event={event}
                homeTeam={homeTeam}
                awayTeam={awayTeam}
              />
            ))
          ) : (
            <p className="text-gray-500 text-sm text-center p-4">
              Nenhum evento registrado
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
