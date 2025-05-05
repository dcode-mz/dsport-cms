import { Button } from "@/components/ui/button";
import { EventType, GameEvent, Team, Player } from "@/app/types/match-live";
import Image from "next/image";

interface ConfirmationPanelProps {
  selectedEvent: EventType | null;
  selectedPlayer: Player | null;
  secondaryPlayer: Player | null;
  foulPlayer: Player | null;
  hasFoul: boolean;
  homeTeam: Team;
  awayTeam: Team;
  onConfirm: () => void;
  lastEvents: GameEvent[];
  onUndo: () => void;
  gameTime: string;
  currentQuarter: number;
}

const getEventLabel = (type: EventType) => {
  const labels = {
    "2POINTS_MADE": "2 Pontos (Cesta)",
    "2POINTS_MISSED": "2 Pontos (Erro)",
    "3POINTS_MADE": "3 Pontos (Cesta)",
    "3POINTS_MISSED": "3 Pontos (Erro)",
    FREE_THROW_MADE: "Lance Livre (Cesta)",
    FREE_THROW_MISSED: "Lance Livre (Erro)",
    FOUL_PERSONAL: "Falta Pessoal",
    TURNOVER: "Turnover",
    STEAL: "Roubo de Bola",
    BLOCK: "Bloqueio",
    OFFENSIVE_REBOUND: "Rebote Ofensivo",
    DEFENSIVE_REBOUND: "Rebote Defensivo",
    SUBSTITUTION: "Substituição",
    ASSIST: "Assistência",
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
  const team = homeTeam.players.some((p) => p.id === event.playerId)
    ? homeTeam
    : awayTeam;

  const quarterLabel =
    event.quarter <= 4 ? `Q${event.quarter}` : `OT${event.quarter - 4}`;

  const renderRelatedEvents = () => {
    if (!event.relatedEvents) return null;

    return (
      <div className="ml-4 pl-4 border-l-2 border-gray-200 mt-2">
        {event.relatedEvents.map((relEvent, idx) => {
          const player = relEvent.playerId
            ? findPlayer(relEvent.playerId)
            : null;
          return (
            <div key={idx} className="text-sm text-gray-600 mb-1">
              {relEvent.type === "ASSIST" &&
                `Assistência: #${player?.number} ${player?.name}`}
              {relEvent.type === "FOUL_PERSONAL" &&
                `Falta cometida por: #${player?.number} ${player?.name}`}
              {relEvent.type.includes("REBOUND") &&
                `Rebote: #${player?.number} ${player?.name}`}
              {relEvent.type === "STEAL" &&
                `Roubo por: #${player?.number} ${player?.name}`}
              {relEvent.type === "SUBSTITUTION" &&
                `Entrou: #${player?.number} ${player?.name}`}
            </div>
          );
        })}
      </div>
    );
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
          {mainPlayer && (
            <span className="text-gray-600">
              #{mainPlayer.number} {mainPlayer.name}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500">
          {quarterLabel} {event.gameTime.split(" ")[1]}
        </span>
      </div>
      {renderRelatedEvents()}
    </div>
  );
};

export function ConfirmationPanel({
  selectedEvent,
  selectedPlayer,
  secondaryPlayer,
  foulPlayer,
  hasFoul,
  homeTeam,
  awayTeam,
  onConfirm,
  lastEvents,
  onUndo,
  gameTime,
  currentQuarter,
}: ConfirmationPanelProps) {
  const getPlayerTeam = (playerId: string) => {
    return homeTeam.players.some((p) => p.id === playerId)
      ? homeTeam
      : awayTeam;
  };

  const quarterLabel =
    currentQuarter <= 4 ? `Q${currentQuarter}` : `OT${currentQuarter - 4}`;

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
          {selectedPlayer.photo ? (
            <div className="relative w-10 h-10 rounded-full overflow-hidden">
              <Image
                src={selectedPlayer.photo}
                alt={selectedPlayer.name}
                width={40}
                height={40}
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200">
              <span className="font-bold">#{selectedPlayer.number}</span>
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
              {selectedEvent === "2POINTS_MADE" ||
              selectedEvent === "3POINTS_MADE"
                ? "Assistência:"
                : selectedEvent === "SUBSTITUTION"
                ? "Entrou:"
                : selectedEvent === "TURNOVER"
                ? "Roubo por:"
                : "Contra:"}
            </div>
            <div className="flex items-center gap-2">
              {secondaryPlayer.photo ? (
                <div className="relative w-8 h-8 rounded-full overflow-hidden">
                  <Image
                    src={secondaryPlayer.photo}
                    alt={secondaryPlayer.name}
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200">
                  <span className="text-sm font-bold">
                    #{secondaryPlayer.number}
                  </span>
                </div>
              )}
              <span>
                #{secondaryPlayer.number} {secondaryPlayer.name}
              </span>
            </div>
          </div>
        )}

        {hasFoul && foulPlayer && (
          <div className="flex items-center gap-3 ml-8">
            <div className="text-gray-500">Falta cometida por:</div>
            <div className="flex items-center gap-2">
              {foulPlayer.photo ? (
                <div className="relative w-8 h-8 rounded-full overflow-hidden">
                  <Image
                    src={foulPlayer.photo}
                    alt={foulPlayer.name}
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200">
                  <span className="text-sm font-bold">
                    #{foulPlayer.number}
                  </span>
                </div>
              )}
              <span>
                #{foulPlayer.number} {foulPlayer.name}
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

      {selectedPlayer && (
        <Button
          onClick={onConfirm}
          className="w-full py-4 text-lg font-bold mb-6"
        >
          CONFIRMAR • {quarterLabel} {gameTime}
        </Button>
      )}

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
