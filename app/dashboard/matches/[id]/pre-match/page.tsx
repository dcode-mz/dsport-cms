"use client";

// app/game/[id]/page.tsx
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Check,
  X,
  Shirt,
  Users,
  Settings,
  List,
  ArrowRight,
  Edit,
  AlertTriangle,
  Megaphone,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import Image from "next/image";

interface Game {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  date: string;
  competition: string;
  status: "scheduled" | "live" | "finished";
  venue: string;
  referees: string[];
}

interface Team {
  id: string;
  name: string;
  logo: string;
  players: Player[];
}

interface Player {
  id: string;
  name: string;
  number: number;
  position: "PG" | "SG" | "SF" | "PF" | "C";
  height: string;
  avatar?: string;
  status?: "available" | "injured" | "absent";
  selected?: boolean;
  absenceReason?: string;
  injuryDetails?: string;
  lineupStatus?: "starter" | "substitute" | "absent";
}

export default function GamePage({ params }: { params: { id: string } }) {
  const [game, setGame] = useState<Game>({
    id: params.id,
    homeTeam: {
      id: "1",
      name: "Costa do Sol",
      logo: "https://res.cloudinary.com/ds1lnrvnq/image/upload/v1742420456/dsport/clubs/logo/gljqlouvtgb9r215j9vt.png",
      players: Array.from({ length: 12 }, (_, i) => ({
        id: `p${i + 1}`,
        name: i === 0 ? "Miguel Queiroz" : `Jogador ${i + 1}`,
        number: i + 1,
        position:
          i === 0
            ? "PG"
            : i === 1
            ? "SG"
            : i === 2
            ? "SF"
            : i === 3
            ? "PF"
            : "C",
        height: `${Math.floor(Math.random() * 10) + 190}cm`,
        avatar: i === 0 ? "/default-player-picture.png" : undefined,
        status: i === 10 ? "injured" : i === 11 ? "absent" : "available",
        selected: i < 10,
        injuryDetails: i === 10 ? "Lesão no joelho - 2 semanas" : undefined,
        absenceReason: i === 11 ? "Problemas pessoais" : undefined,
        lineupStatus: i < 5 ? "starter" : i < 10 ? "substitute" : undefined,
      })),
    },
    awayTeam: {
      id: "2",
      name: "Black Bulls",
      logo: "https://res.cloudinary.com/ds1lnrvnq/image/upload/v1742851303/dsport/clubs/logo/nrldhsluaji6gxu0teeu.png",
      players: Array.from({ length: 12 }, (_, i) => ({
        id: `b${i + 1}`,
        name: i === 0 ? "Toney Douglas" : `Jogador ${i + 12}`,
        number: i + 1,
        position:
          i === 0
            ? "PG"
            : i === 1
            ? "SG"
            : i === 2
            ? "SF"
            : i === 3
            ? "PF"
            : "C",
        height: `${Math.floor(Math.random() * 10) + 190}cm`,
        avatar: i === 0 ? "/default-player-picture.png" : undefined,
        status: i === 10 ? "injured" : i === 11 ? "absent" : "available",
        selected: i < 10,
        injuryDetails: i === 10 ? "Entorse no tornozelo" : undefined,
        absenceReason: i === 11 ? "Suspensão" : undefined,
        lineupStatus: i < 5 ? "starter" : i < 10 ? "substitute" : undefined,
      })),
    },
    date: "2023-11-15T20:30:00",
    competition: "Liga Betclic",
    status: "scheduled",
    venue: "Pavilhão Dragão Arena",
    referees: [
      "António Silva (Árbitro Principal)",
      "Carlos Santos (Árbitro Auxiliar)",
      "Miguel Pereira (Árbitro de Mesa)",
    ],
  });

  const [activeTab, setActiveTab] = useState("squad");
  const [editingSquad, setEditingSquad] = useState(false);
  const [absenceReason, setAbsenceReason] = useState("");
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [currentAction, setCurrentAction] = useState<"absence" | "injury">(
    "absence"
  );

  const handlePlayerSelection = (teamId: string, playerId: string) => {
    setGame((prev) => ({
      ...prev,
      homeTeam:
        teamId === prev.homeTeam.id
          ? {
              ...prev.homeTeam,
              players: prev.homeTeam.players.map((p) =>
                p.id === playerId
                  ? {
                      ...p,
                      selected: !p.selected,
                      lineupStatus: !p.selected ? undefined : p.lineupStatus,
                    }
                  : p
              ),
            }
          : prev.homeTeam,
      awayTeam:
        teamId === prev.awayTeam.id
          ? {
              ...prev.awayTeam,
              players: prev.awayTeam.players.map((p) =>
                p.id === playerId
                  ? {
                      ...p,
                      selected: !p.selected,
                      lineupStatus: !p.selected ? undefined : p.lineupStatus,
                    }
                  : p
              ),
            }
          : prev.awayTeam,
    }));
  };

  const updatePlayerStatus = (
    teamId: string,
    playerId: string,
    status: Player["lineupStatus"]
  ) => {
    setGame((prev) => ({
      ...prev,
      homeTeam:
        teamId === prev.homeTeam.id
          ? {
              ...prev.homeTeam,
              players: prev.homeTeam.players.map((p) =>
                p.id === playerId ? { ...p, lineupStatus: status } : p
              ),
            }
          : prev.homeTeam,
      awayTeam:
        teamId === prev.awayTeam.id
          ? {
              ...prev.awayTeam,
              players: prev.awayTeam.players.map((p) =>
                p.id === playerId ? { ...p, lineupStatus: status } : p
              ),
            }
          : prev.awayTeam,
    }));
  };

  const markPlayerAsAbsent = (
    teamId: string,
    playerId: string,
    reason: string,
    isInjury: boolean
  ) => {
    setGame((prev) => ({
      ...prev,
      homeTeam:
        teamId === prev.homeTeam.id
          ? {
              ...prev.homeTeam,
              players: prev.homeTeam.players.map((p) =>
                p.id === playerId
                  ? {
                      ...p,
                      status: isInjury ? "injured" : "absent",
                      [isInjury ? "injuryDetails" : "absenceReason"]: reason,
                      selected: false,
                      lineupStatus: undefined,
                    }
                  : p
              ),
            }
          : prev.homeTeam,
      awayTeam:
        teamId === prev.awayTeam.id
          ? {
              ...prev.awayTeam,
              players: prev.awayTeam.players.map((p) =>
                p.id === playerId
                  ? {
                      ...p,
                      status: isInjury ? "injured" : "absent",
                      [isInjury ? "injuryDetails" : "absenceReason"]: reason,
                      selected: false,
                      lineupStatus: undefined,
                    }
                  : p
              ),
            }
          : prev.awayTeam,
    }));

    setAbsenceReason("");
    setCurrentPlayer(null);
    toast(
      `${
        isInjury ? "Lesão registrada" : "Ausência registrada"
      }\nO jogador foi marcado como ${isInjury ? "lesionado" : "ausente"}.`
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Cabeçalho do Jogo Aprimorado */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6 border">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {/* <Avatar className="h-14 w-14 border-2 border-white shadow">
                <AvatarImage src={game.homeTeam.logo} />
                <AvatarFallback>{game.homeTeam.name[0]}</AvatarFallback>
              </Avatar> */}
              <Image
                src={game.homeTeam.logo}
                alt={game.homeTeam.name}
                width={50}
                height={50}
                className="h-14 w-14"
              />
              <span className="text-xl font-bold">{game.homeTeam.name}</span>
            </div>

            <div className="text-center">
              <div className="text-sm text-muted-foreground">
                {game.competition}
              </div>
              <div className="text-2xl font-bold my-1">VS</div>
              <Badge variant="secondary" className="text-sm">
                {new Date(game.date).toLocaleTimeString("pt-PT", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">{game.awayTeam.name}</span>
              {/* <Avatar className="h-14 w-14 border-2 border-white shadow">
                <AvatarImage src={game.awayTeam.logo} />
                <AvatarFallback>{game.awayTeam.name[0]}</AvatarFallback>
              </Avatar> */}
              <Image
                src={game.awayTeam.logo}
                alt={game.awayTeam.name}
                width={50}
                height={50}
                className="h-14 w-14"
              />
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm text-muted-foreground">{game.venue}</div>
            <div className="text-lg font-semibold">
              {new Date(game.date).toLocaleDateString("pt-PT", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </div>
            <Badge
              variant={
                game.status === "scheduled"
                  ? "default"
                  : game.status === "live"
                  ? "destructive"
                  : "outline"
              }
              className="mt-1"
            >
              {game.status === "scheduled"
                ? "Agendado"
                : game.status === "live"
                ? "Ao Vivo"
                : "Terminado"}
            </Badge>
          </div>
        </div>

        {/* Árbitros */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm">
            <Megaphone className="h-4 w-4" />
            <span className="font-medium">Árbitros:</span>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {game.referees.map((ref, i) => (
                <span key={i}>{ref}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Abas principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="squad" className="flex-1">
            <Users className="mr-2 h-4 w-4" />
            Convocatória
          </TabsTrigger>
          <TabsTrigger value="lineup" className="flex-1">
            <Settings className="mr-2 h-4 w-4" />
            Escalação
          </TabsTrigger>
        </TabsList>

        {/* Conteúdo da aba Convocatória */}
        <TabsContent value="squad" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button
              variant={editingSquad ? "default" : "outline"}
              onClick={() => setEditingSquad(!editingSquad)}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              {editingSquad ? "Finalizar Edição" : "Editar Convocatória"}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <TeamSelectionCard
              team={game.homeTeam}
              onPlayerSelect={handlePlayerSelection}
              editing={editingSquad}
              onStatusClick={(player, action) => {
                setCurrentPlayer(player);
                setCurrentAction(action);
                setAbsenceReason(
                  action === "absence"
                    ? player.absenceReason || ""
                    : player.injuryDetails || ""
                );
              }}
            />
            <TeamSelectionCard
              team={game.awayTeam}
              onPlayerSelect={handlePlayerSelection}
              editing={editingSquad}
              onStatusClick={(player, action) => {
                setCurrentPlayer(player);
                setCurrentAction(action);
                setAbsenceReason(
                  action === "absence"
                    ? player.absenceReason || ""
                    : player.injuryDetails || ""
                );
              }}
            />
          </div>
        </TabsContent>

        {/* Conteúdo da aba Escalação */}
        <TabsContent value="lineup" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button size="lg" className="gap-2">
              Confirmar Escalação
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <TeamLineupCard
              team={game.homeTeam}
              onStatusChange={updatePlayerStatus}
              onStatusClick={(player, action) => {
                setCurrentPlayer(player);
                setCurrentAction(action);
                setAbsenceReason(
                  action === "absence"
                    ? player.absenceReason || ""
                    : player.injuryDetails || ""
                );
              }}
            />
            <TeamLineupCard
              team={game.awayTeam}
              onStatusChange={updatePlayerStatus}
              onStatusClick={(player, action) => {
                setCurrentPlayer(player);
                setCurrentAction(action);
                setAbsenceReason(
                  action === "absence"
                    ? player.absenceReason || ""
                    : player.injuryDetails || ""
                );
              }}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal para registrar ausência/lesão */}
      {currentPlayer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {currentAction === "absence" ? (
                  <>
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Registrar Ausência
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Registrar Lesão
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Jogador</Label>
                  <div className="flex items-center gap-3 p-2 border rounded">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={currentPlayer.avatar} />
                      <AvatarFallback>
                        {currentPlayer.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{currentPlayer.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="flex items-center">
                          <Shirt className="h-3 w-3 mr-1" />#
                          {currentPlayer.number}
                        </span>
                        <span>{currentPlayer.position}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <Label>
                    {currentAction === "absence"
                      ? "Motivo da Ausência"
                      : "Detalhes da Lesão"}
                  </Label>
                  <Textarea
                    value={absenceReason}
                    onChange={(e) => setAbsenceReason(e.target.value)}
                    placeholder={
                      currentAction === "absence"
                        ? "Descreva o motivo da ausência (suspensão, problemas pessoais, etc.)"
                        : "Descreva a lesão e tempo estimado de recuperação"
                    }
                    rows={4}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentPlayer(null);
                  setAbsenceReason("");
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  const teamId = game.homeTeam.players.some(
                    (p) => p.id === currentPlayer.id
                  )
                    ? game.homeTeam.id
                    : game.awayTeam.id;
                  markPlayerAsAbsent(
                    teamId,
                    currentPlayer.id,
                    absenceReason,
                    currentAction === "injury"
                  );
                  setCurrentPlayer(null);
                  setAbsenceReason("");
                }}
              >
                Confirmar
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}

// Novo componente PlayerMenuDropdown
function PlayerMenuDropdown({
  player,
  onStatusClick,
}: {
  player: Player;
  onStatusClick: (player: Player, action: "absence" | "injury") => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          className="text-red-500 focus:text-red-500"
          onClick={() => onStatusClick(player, "absence")}
        >
          <AlertTriangle className="mr-2 h-4 w-4" />
          Marcar como Ausente
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-yellow-600 focus:text-yellow-600"
          onClick={() => onStatusClick(player, "injury")}
        >
          <AlertTriangle className="mr-2 h-4 w-4" />
          Registrar Lesão
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TeamSelectionCard({
  team,
  onPlayerSelect,
  editing,
  onStatusClick,
}: {
  team: Team;
  onPlayerSelect: (teamId: string, playerId: string) => void;
  editing: boolean;
  onStatusClick: (player: Player, action: "absence" | "injury") => void;
}) {
  const selectedPlayers = team.players.filter((p) => p.selected);
  const availablePlayers = team.players.filter((p) => !p.selected);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={team.logo} />
              <AvatarFallback>{team.name[0]}</AvatarFallback>
            </Avatar>
            <span>{team.name}</span>
          </CardTitle>
          <Badge
            variant={selectedPlayers.length >= 5 ? "default" : "secondary"}
          >
            {selectedPlayers.length} selecionados
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Jogadores Convocados ({selectedPlayers.length})
          </h4>

          <div className="space-y-1">
            {selectedPlayers.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-4">
                Nenhum jogador selecionado
              </div>
            )}

            {selectedPlayers.map((player) => (
              <PlayerItem
                key={player.id}
                player={player}
                onClick={() => editing && onPlayerSelect(team.id, player.id)}
                selected={true}
                editing={editing}
                showStatus={true}
              />
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <List className="h-4 w-4" />
            Jogadores Disponíveis ({availablePlayers.length})
          </h4>

          <div className="space-y-1">
            {availablePlayers.map((player) => (
              <PlayerItem
                key={player.id}
                player={player}
                onClick={() => editing && onPlayerSelect(team.id, player.id)}
                selected={false}
                editing={editing}
                showStatus={true}
                onStatusClick={(action) => onStatusClick(player, action)}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TeamLineupCard({
  team,
  onStatusChange,
  onStatusClick,
}: {
  team: Team;
  onStatusChange: (
    teamId: string,
    playerId: string,
    status: Player["lineupStatus"]
  ) => void;
  onStatusClick: (player: Player, action: "absence" | "injury") => void;
}) {
  const starters = team.players.filter((p) => p.lineupStatus === "starter");
  const substitutes = team.players.filter(
    (p) => p.lineupStatus === "substitute"
  );
  const absentPlayers = team.players.filter(
    (p) =>
      p.lineupStatus === "absent" ||
      p.status === "absent" ||
      p.status === "injured"
  );

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={team.logo} />
            <AvatarFallback>{team.name[0]}</AvatarFallback>
          </Avatar>
          <span>{team.name}</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Titulares */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-primary" />
              Titulares ({starters.length}/5)
            </h4>
            <span className="text-sm text-muted-foreground">
              {starters.length}/5
            </span>
          </div>

          <div className="space-y-2">
            {starters.map((player) => (
              <PlayerLineupItem
                key={player.id}
                player={player}
                teamId={team.id}
                onStatusChange={onStatusChange}
                onStatusClick={onStatusClick}
              />
            ))}
          </div>
        </div>

        <Separator />

        {/* Suplentes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-yellow-500" />
              Suplentes ({substitutes.length})
            </h4>
          </div>

          <div className="space-y-2">
            {substitutes.map((player) => (
              <PlayerLineupItem
                key={player.id}
                player={player}
                teamId={team.id}
                onStatusChange={onStatusChange}
                onStatusClick={onStatusClick}
              />
            ))}
          </div>
        </div>

        <Separator />

        {/* Ausentes/Lesões */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Ausentes/Lesões ({absentPlayers.length})
            </h4>
          </div>

          <div className="space-y-2">
            {absentPlayers.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-2">
                Nenhum jogador ausente ou lesionado
              </div>
            ) : (
              absentPlayers.map((player) => (
                <div
                  key={player.id}
                  className="p-3 rounded-md border border-red-200 bg-red-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={player.avatar} />
                        <AvatarFallback>
                          {player.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{player.name}</div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center bg-white px-2 py-0.5 rounded-full">
                            <Shirt className="h-3 w-3 mr-1" />#{player.number}
                          </span>
                          <span>{player.position}</span>
                          <Badge variant="outline" className="text-xs">
                            {player.status === "injured"
                              ? "Lesionado"
                              : "Ausente"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        onStatusClick(
                          player,
                          player.status === "injured" ? "injury" : "absence"
                        )
                      }
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                  {(player.absenceReason || player.injuryDetails) && (
                    <div className="mt-2 text-sm p-2 bg-white rounded border">
                      <div className="font-medium">
                        {player.status === "injured"
                          ? "Detalhes da Lesão:"
                          : "Motivo da Ausência:"}
                      </div>
                      <p>{player.absenceReason || player.injuryDetails}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PlayerItem({
  player,
  onClick,
  selected,
  editing,
  showStatus = false,
  onStatusClick,
}: {
  player: Player;
  onClick: () => void;
  selected: boolean;
  editing?: boolean;
  showStatus?: boolean;
  onStatusClick?: (action: "absence" | "injury") => void;
}) {
  const statusColors = {
    available: "bg-green-500",
    injured: "bg-yellow-500",
    absent: "bg-red-500",
  };

  return (
    <div
      className={`flex items-center justify-between p-2 rounded-md transition-colors ${
        selected ? "bg-primary/10" : "hover:bg-muted/50"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar className="h-9 w-9">
            <AvatarImage src={player.avatar} />
            <AvatarFallback>
              {player.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          {showStatus && player.status && (
            <span
              className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${
                statusColors[player.status]
              }`}
            />
          )}
        </div>

        <div>
          <div className="font-medium">{player.name}</div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center bg-secondary px-2 py-0.5 rounded-full">
              <Shirt className="h-3 w-3 mr-1" />#{player.number}
            </span>
            <span>{player.position}</span>
            {player.height && <span>{player.height}</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {editing && !selected && onStatusClick && (
          <div className="flex gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-yellow-600 hover:text-yellow-700 h-8 w-8 p-0"
                  onClick={() => onStatusClick("injury")}
                >
                  <AlertTriangle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Registrar Lesão</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-600 h-8 w-8 p-0"
                  onClick={() => onStatusClick("absence")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Registrar Ausência</TooltipContent>
            </Tooltip>
          </div>
        )}

        {editing && (
          <Button
            variant={selected ? "default" : "outline"}
            size="sm"
            onClick={onClick}
            className="gap-1"
          >
            {selected ? (
              <>
                <Check className="h-4 w-4" />
                <span className="hidden sm:inline">Selecionado</span>
              </>
            ) : (
              "Selecionar"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

function PlayerLineupItem({
  player,
  teamId,
  onStatusChange,
  onStatusClick,
}: {
  player: Player;
  teamId: string;
  onStatusChange: (
    teamId: string,
    playerId: string,
    status: Player["lineupStatus"]
  ) => void;
  onStatusClick: (player: Player, action: "absence" | "injury") => void;
}) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-md border">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              const newStatus =
                player.lineupStatus === "starter" ? "substitute" : "starter";
              onStatusChange(teamId, player.id, newStatus);
            }}
          >
            {player.lineupStatus === "starter" ? (
              <span className="h-3 w-3 rounded-full bg-primary" />
            ) : (
              <span className="h-3 w-3 rounded-full bg-yellow-500" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {player.lineupStatus === "starter" ? "Titular" : "Suplente"}
        </TooltipContent>
      </Tooltip>

      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="relative">
          <Avatar className="h-9 w-9">
            <AvatarImage src={player.avatar} />
            <AvatarFallback>
              {player.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          {player.status && player.status !== "available" && (
            <span
              className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${
                player.status === "injured" ? "bg-yellow-500" : "bg-red-500"
              }`}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{player.name}</div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center bg-secondary px-2 py-0.5 rounded-full">
              <Shirt className="h-3 w-3 mr-1" />#{player.number}
            </span>
            <span>{player.position}</span>
            <span>{player.height}</span>
          </div>
        </div>
        <PlayerMenuDropdown player={player} onStatusClick={onStatusClick} />
      </div>
    </div>
  );
}
