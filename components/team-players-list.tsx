import { Player, TeamInGame } from "@/app/types/match-live";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { UserMinus, UserPlus, ShieldBan } from "lucide-react"; // Para indicar ejeção

interface TeamPlayersListProps {
  team: TeamInGame;
  onPlayerSelect: (player: Player, isOnCourt: boolean) => void;
  selectedPlayerForEventId?: string | null; // Qual jogador está selecionado para o evento atual
  title: string;
  disabledInteraction: boolean; // Se a lista está desabilitada para seleção de evento
  showSubOutIconPlayerId?: string | null; // Jogador selecionado para sair (mostra ícone)
  showSubInIconPlayerId?: string | null; // Jogador selecionado para entrar (mostra ícone)
}

const PlayerItem = ({
  player,
  onSelect,
  isSelectedForEvent,
  isOnCourt,
  isSubOutCandidate,
  isSubInCandidate,
  isDisabled,
}: {
  player: Player;
  onSelect: () => void;
  isSelectedForEvent: boolean;
  isOnCourt: boolean;
  isSubOutCandidate?: boolean;
  isSubInCandidate?: boolean;
  isDisabled: boolean;
}) => (
  <Button
    variant="ghost"
    onClick={onSelect}
    disabled={isDisabled || player.isEjected}
    className={cn(
      "w-full justify-start h-auto p-1.5 mb-1 text-left relative",
      isSelectedForEvent && "bg-primary/30 border border-primary",
      player.isEjected && "opacity-50 cursor-not-allowed bg-red-900/50",
      !isOnCourt && !player.isEjected && "opacity-80"
    )}
    title={player.isEjected ? `${player.name} (Ejetado)` : player.name}
  >
    <div className="flex items-center gap-2 w-full">
      {player.photo ? (
        <Image
          src={player.photo}
          alt={player.name}
          width={28}
          height={28}
          className="rounded-full object-cover w-7 h-7 flex-shrink-0"
        />
      ) : (
        <div className="w-7 h-7 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
          {player.number}
        </div>
      )}
      <div className="flex-1 min-w-0">
        {" "}
        {/* Para ellipsis funcionar */}
        <p className="text-xs font-medium truncate">
          <span className="text-muted-foreground">#{player.number}</span>{" "}
          {player.name}
        </p>
        <p className="text-[10px] text-muted-foreground truncate">
          {player.position} | P: {player.stats.points} | F:{" "}
          {player.stats.personalFouls}
          {player.stats.technicalFouls > 0
            ? `+${player.stats.technicalFouls}T`
            : ""}
        </p>
      </div>
      {isSubOutCandidate && (
        <UserMinus className="absolute right-1 top-1 text-red-500" size={14} />
      )}
      {isSubInCandidate && (
        <UserPlus className="absolute right-1 top-1 text-green-500" size={14} />
      )}
      {player.isEjected && (
        <ShieldBan className="absolute right-1 top-1 text-red-400" size={14} />
      )}
    </div>
  </Button>
);

export function TeamPlayersList({
  team,
  onPlayerSelect,
  selectedPlayerForEventId,
  title,
  disabledInteraction,
  showSubOutIconPlayerId,
  showSubInIconPlayerId,
}: TeamPlayersListProps) {
  const getPlayerById = (id: string) => team.players.find((p) => p.id === id);

  return (
    <Card className="flex-1 flex flex-col h-full max-h-[calc(100vh-240px)]">
      {" "}
      {/* Ajustar altura max */}
      <CardHeader className="py-2 px-3">
        <CardTitle className="text-sm md:text-md flex items-center gap-2">
          <Image src={team.logo} alt={team.shortName} width={20} height={20} />
          {title} ({team.shortName})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-1.5 flex-1 overflow-y-auto">
        <div>
          <h4 className="text-[10px] font-semibold uppercase text-muted-foreground px-1 mb-0.5">
            Em Campo ({team.onCourt.length})
          </h4>
          {team.onCourt.length === 0 && (
            <p className="text-xs text-muted-foreground p-2">
              Nenhum jogador em campo.
            </p>
          )}
          {team.onCourt
            .map((playerId) => getPlayerById(playerId))
            .filter(Boolean)
            .map((player) => (
              <PlayerItem
                key={player!.id}
                player={player!}
                onSelect={() =>
                  !disabledInteraction && onPlayerSelect(player!, true)
                }
                isSelectedForEvent={selectedPlayerForEventId === player!.id}
                isOnCourt={true}
                isSubOutCandidate={showSubOutIconPlayerId === player!.id}
                isDisabled={disabledInteraction}
              />
            ))}
        </div>
        <div className="mt-2">
          <h4 className="text-[10px] font-semibold uppercase text-muted-foreground px-1 mb-0.5">
            Banco ({team.bench.length})
          </h4>
          {team.bench.length === 0 && (
            <p className="text-xs text-muted-foreground p-2">Banco vazio.</p>
          )}
          {team.bench
            .map((playerId) => getPlayerById(playerId))
            .filter(Boolean)
            .map((player) => (
              <PlayerItem
                key={player!.id}
                player={player!}
                onSelect={() =>
                  !disabledInteraction && onPlayerSelect(player!, false)
                }
                isSelectedForEvent={selectedPlayerForEventId === player!.id}
                isOnCourt={false}
                isSubInCandidate={showSubInIconPlayerId === player!.id}
                isDisabled={disabledInteraction}
              />
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
