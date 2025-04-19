import { Player, Team, EventType } from "./game-types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PlayerSelectionPanelProps {
  selectedEvent: EventType | null;
  selectedPlayer: Player | null;
  secondaryPlayer: Player | null;
  foulPlayer: Player | null;
  currentTeam: Team;
  opponentTeam: Team;
  currentStep: "main" | "assist" | "foul" | "rebound" | "substitution";
  onSelectPlayer: (player: Player) => void;
  onSelectSecondaryPlayer: (player: Player) => void;
  onSkipStep: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  hasFoul: boolean;
  onSelectFoulPlayer: (player: Player) => void;
  onFoulSelection: (hasFoul: boolean) => void;
}

const PlayerList = ({
  players,
  selectedId,
  onSelect,
}: {
  players: Player[];
  selectedId: string | null;
  onSelect: (player: Player) => void;
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[40vh] overflow-y-auto p-1">
    {players.map((player) => (
      <button
        key={player.id}
        onClick={() => onSelect(player)}
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border",
          "text-left transition-colors",
          selectedId === player.id
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
        )}
      >
        {player.photo ? (
          <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
            <img
              src={player.photo}
              alt={player.name}
              className="object-cover w-full h-full"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex-shrink-0">
            <span className="text-lg font-bold">#{player.number}</span>
          </div>
        )}
        <div>
          <p className="font-medium">
            #{player.number} {player.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {player.position}
          </p>
        </div>
      </button>
    ))}
  </div>
);

export function PlayerSelectionPanel({
  selectedEvent,
  selectedPlayer,
  secondaryPlayer,
  foulPlayer,
  currentTeam,
  opponentTeam,
  currentStep,
  onSelectPlayer,
  onSelectSecondaryPlayer,
  onFoulSelection,
  onSkipStep,
  onConfirm,
  onCancel,
  hasFoul,
  onSelectFoulPlayer,
}: PlayerSelectionPanelProps) {
  const getMainSelectionLabel = () => {
    if (!selectedEvent) return "Selecione um jogador";

    switch (selectedEvent) {
      case "2POINTS_MADE":
      case "3POINTS_MADE":
        return "Quem marcou a cesta?";
      case "2POINTS_MISSED":
      case "3POINTS_MISSED":
      case "FREE_THROW_MISSED":
        return "Quem arremessou?";
      case "TURNOVER":
        return "Quem cometeu o turnover?";
      case "SUBSTITUTION":
        return "Quem sai do jogo?";
      default:
        return "Selecione o jogador";
    }
  };

  if (!selectedEvent) {
    return (
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-6 shadow border border-gray-200 dark:border-gray-700 flex items-center justify-center">
        <p className="text-gray-500">Selecione um tipo de evento</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Passo 1: Seleção principal */}
      {currentStep === "main" && (
        <div className="mb-4">
          <h3 className="font-bold mb-2">{getMainSelectionLabel()}</h3>
          <PlayerList
            players={
              selectedEvent === "SUBSTITUTION"
                ? currentTeam.players
                : currentTeam.players
            }
            selectedId={selectedPlayer?.id || null}
            onSelect={onSelectPlayer}
          />
        </div>
      )}

      {/* Passo 2: Assistência */}
      {currentStep === "assist" && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">Quem deu a assistência? (Opcional)</h3>
            <Button variant="ghost" size="sm" onClick={onSkipStep}>
              Pular (sem assistência)
            </Button>
          </div>
          <PlayerList
            players={currentTeam.players.filter(
              (p) => p.id !== selectedPlayer?.id
            )}
            selectedId={secondaryPlayer?.id || null}
            onSelect={onSelectSecondaryPlayer}
          />
        </div>
      )}

      {/* Passo 3: Falta */}
      {currentStep === "foul" && (
        <div className="space-y-4">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <h3 className="font-bold mb-2">Houve falta durante a cesta?</h3>
            <div className="flex gap-2">
              <Button
                variant={hasFoul ? "default" : "outline"}
                onClick={() => onFoulSelection(true)}
              >
                Sim
              </Button>
              <Button
                variant={!hasFoul ? "default" : "outline"}
                onClick={() => onFoulSelection(false)}
              >
                Não
              </Button>
            </div>
          </div>

          {hasFoul && (
            <div>
              <h3 className="font-bold mb-2">Quem cometeu a falta?</h3>
              <PlayerList
                players={opponentTeam.players}
                selectedId={foulPlayer?.id || null}
                onSelect={(p) => onSelectFoulPlayer(p)}
              />
            </div>
          )}
        </div>
      )}

      {/* Passo: Rebote */}
      {currentStep === "rebound" && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">Quem pegou o rebote? (Opcional)</h3>
            <Button variant="ghost" size="sm" onClick={onSkipStep}>
              Pular (sem rebote)
            </Button>
          </div>
          <PlayerList
            players={[...currentTeam.players, ...opponentTeam.players].filter(
              (p) => p.id !== selectedPlayer?.id
            )}
            selectedId={secondaryPlayer?.id || null}
            onSelect={onSelectSecondaryPlayer}
          />
        </div>
      )}

      {/* Passo: Substituição */}
      {currentStep === "substitution" && (
        <div className="mb-4">
          <h3 className="font-bold mb-2">Quem entra no jogo?</h3>
          <PlayerList
            players={currentTeam.players.filter(
              (p) => p.id !== selectedPlayer?.id
            )}
            selectedId={secondaryPlayer?.id || null}
            onSelect={onSelectSecondaryPlayer}
          />
        </div>
      )}

      {/* Botão de confirmar sempre visível quando há jogador selecionado */}
      {selectedPlayer && (
        <div className="mt-4 flex gap-2">
          <Button onClick={onConfirm} className="flex-1">
            Confirmar (Enter)
          </Button>
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
        </div>
      )}
    </div>
  );
}
