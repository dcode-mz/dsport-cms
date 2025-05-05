"use client";

import { useState, useEffect, use } from "react";
import {
  ChevronDown,
  ChevronUp,
  Megaphone,
  X,
  Users,
  Settings,
  Shirt,
  Check,
  AlertTriangle,
  Edit,
  ArrowRight,
  MoreHorizontal,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ResponseBody } from "@/app/types/response-body";

interface Player {
  id: string;
  name: string;
  photoUrl: string | null;
  preferredNumber: number | null;
  preferredPosition: {
    id: string;
    name: string;
  };
  height: number;
  weight: number;
  condition: {
    status: {
      id: string;
      name: string;
    };
    injuryDate: string | null;
    returnDate: string | null;
    reason: string | null;
  };
  convocations: {
    id: string;
    calledUp: boolean;
    absenceReason: string | null;
  }[];
  positions: {
    id: string;
    starter: boolean;
    onField: boolean;
  }[];
}

interface Team {
  id: string;
  name: string;
  club: {
    logo: string;
  };
  players: Player[];
}

interface Referee {
  id: string;
  name: string;
}

interface MatchDetails {
  id: string;
  dateTime: string;
  venue: {
    id: string;
    name: string;
    location: string;
    capacity: number;
  };
  referee: {
    id: string;
    name: string;
  };
  matchday: {
    id: string;
    number: number;
    stage: {
      id: string;
      name: string;
      tournamentSeason: {
        id: string;
        tournament: {
          id: string;
          name: string;
          logo: string;
        };
      };
    };
  };
  homeTeam: Team;
  awayTeam: Team;
}

export default function GamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const matchId = use(params).id;
  const router = useRouter();
  const [matchDetails, setMatchDetails] = useState<MatchDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("squad");
  const [editingSquad, setEditingSquad] = useState(false);
  const [absenceReason, setAbsenceReason] = useState("");
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [currentAction, setCurrentAction] = useState<"absence" | "injury">(
    "absence"
  );

  // Lista de árbitros disponíveis
  const [availableReferees, setAvailableReferees] = useState<Referee[]>([]);
  const [refereeRoles, setRefereeRoles] = useState<
    { id: string; name: string }[]
  >([]);

  // Estado para atribuição de árbitros
  const [refereeAssignments, setRefereeAssignments] = useState<
    { id: string; refereeId: string | null; role: string }[]
  >([]);

  // Buscar dados da partida
  useEffect(() => {
    if (!matchId) return;

    const fetchRefereeRoles = async () => {
      try {
        const response = await fetch(`http://localhost:4000/referee/roles`);
        const data: ResponseBody<{ id: string; name: string }[]> =
          await response.json();
        setRefereeRoles(data.payload);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        }
      }
    };

    const fetchRefereeList = async () => {
      try {
        const response = await fetch(`http://localhost:4000/referee`);
        const data: ResponseBody<Referee[]> = await response.json();
        setAvailableReferees(data.payload);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        }
      }
    };

    const fetchMatchDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:4000/match/${matchId}/players/registered`
        );

        if (!response.ok) {
          throw new Error("Erro ao carregar dados da partida");
        }

        const data = await response.json();

        // Transformar os dados da API para o formato esperado
        const transformPlayers = (team: {
          tournamentSeasons: { playerSeasonTeam: { player: Player }[] }[];
        }): Player[] => {
          return team.tournamentSeasons[0].playerSeasonTeam.map(
            (pst: { player: Player }) => ({
              ...pst.player,
              convocations: pst.player.convocations || [],
              positions: pst.player.positions || [],
            })
          );
        };

        // Definir refereeAssignments apenas uma vez, usando os officials se existirem
        if (data.payload.officials && data.payload.officials.length > 0) {
          setRefereeAssignments(
            data.payload.officials.map(
              (official: {
                role: { id: string; name: string };
                referee: { id: string };
              }) => ({
                id: official.role.id,
                refereeId: official.referee.id,
                role: official.role.name,
              })
            )
          );
        } else {
          // Se não houver officials, buscar os roles e criar assignments vazios
          const rolesResponse = await fetch(
            `http://localhost:4000/referee/roles`
          );
          const rolesData: ResponseBody<{ id: string; name: string }[]> =
            await rolesResponse.json();

          setRefereeAssignments(
            rolesData.payload.map((role) => ({
              id: role.id,
              refereeId: null,
              role: role.name,
            }))
          );
        }

        setMatchDetails({
          ...data.payload,
          homeTeam: {
            ...data.payload.homeTeam,
            players: transformPlayers(data.payload.homeTeam),
          },
          awayTeam: {
            ...data.payload.awayTeam,
            players: transformPlayers(data.payload.awayTeam),
          },
        });
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMatchDetails();
    fetchRefereeList();
    fetchRefereeRoles();
  }, [matchId]);

  // Atualizar atribuição de árbitros
  const updateRefereeAssignment = (roleId: string, refereeId: string) => {
    setRefereeAssignments((prev) =>
      prev.map((assignment) =>
        assignment.id === roleId ? { ...assignment, refereeId } : assignment
      )
    );
  };

  // Obter árbitros disponíveis para uma função específica
  const getAvailableRefereesForRole = (roleId: string) => {
    const assignedRefereeIds = refereeAssignments
      .filter((a) => a.id !== roleId && a.refereeId)
      .map((a) => a.refereeId);

    return availableReferees.filter(
      (ref) => !assignedRefereeIds.includes(ref.id)
    );
  };

  // Manipular seleção de jogadores
  const handlePlayerSelection = (
    teamId: string,
    playerId: string,
    calledUp: boolean
  ) => {
    if (!matchDetails) return;

    setMatchDetails((prev) => {
      if (!prev) return null;

      const updatePlayerConvocations = (players: Player[]) =>
        players.map((player) =>
          player.id === playerId
            ? {
                ...player,
                convocations: [
                  {
                    id: player.convocations[0]?.id || `conv-${playerId}`,
                    calledUp,
                    absenceReason: calledUp
                      ? null
                      : player.convocations[0]?.absenceReason || null,
                  },
                ],
              }
            : player
        );

      return {
        ...prev,
        homeTeam:
          teamId === prev.homeTeam.id
            ? {
                ...prev.homeTeam,
                players: updatePlayerConvocations(prev.homeTeam.players),
              }
            : prev.homeTeam,
        awayTeam:
          teamId === prev.awayTeam.id
            ? {
                ...prev.awayTeam,
                players: updatePlayerConvocations(prev.awayTeam.players),
              }
            : prev.awayTeam,
      };
    });
  };

  // Atualizar status do jogador (titular/suplente)
  const updatePlayerStatus = (
    teamId: string,
    playerId: string,
    starter: boolean
  ) => {
    if (!matchDetails) return;

    setMatchDetails((prev) => {
      if (!prev) return null;

      const updatePlayerPositions = (players: Player[]) =>
        players.map((player) =>
          player.id === playerId
            ? {
                ...player,
                positions: [
                  {
                    id: player.positions[0]?.id || `pos-${playerId}`,
                    starter,
                    onField: starter,
                  },
                ],
              }
            : player
        );

      return {
        ...prev,
        homeTeam:
          teamId === prev.homeTeam.id
            ? {
                ...prev.homeTeam,
                players: updatePlayerPositions(prev.homeTeam.players),
              }
            : prev.homeTeam,
        awayTeam:
          teamId === prev.awayTeam.id
            ? {
                ...prev.awayTeam,
                players: updatePlayerPositions(prev.awayTeam.players),
              }
            : prev.awayTeam,
      };
    });
  };

  // Registrar ausência/lesão
  const markPlayerAsAbsent = (
    teamId: string,
    playerId: string,
    reason: string,
    isInjury: boolean
  ) => {
    if (!matchDetails) return;

    setMatchDetails((prev) => {
      if (!prev) return null;

      const updatePlayer = (players: Player[]) =>
        players.map((player) =>
          player.id === playerId
            ? {
                ...player,
                condition: {
                  ...player.condition,
                  status: {
                    id: isInjury ? "injured" : "absent",
                    name: isInjury ? "LESIONADO" : "AUSENTE",
                  },
                  reason: isInjury ? "Lesão" : reason,
                },
                convocations: [
                  {
                    id: player.convocations[0]?.id || `conv-${playerId}`,
                    calledUp: false,
                    absenceReason: reason,
                  },
                ],
              }
            : player
        );

      return {
        ...prev,
        homeTeam:
          teamId === prev.homeTeam.id
            ? { ...prev.homeTeam, players: updatePlayer(prev.homeTeam.players) }
            : prev.homeTeam,
        awayTeam:
          teamId === prev.awayTeam.id
            ? { ...prev.awayTeam, players: updatePlayer(prev.awayTeam.players) }
            : prev.awayTeam,
      };
    });

    setAbsenceReason("");
    setCurrentPlayer(null);
    toast(
      isInjury
        ? "Lesão registrada"
        : "Ausência registrada" +
            `\n O jogador foi marcado como ${
              isInjury ? "lesionado" : "ausente"
            }.`
    );
  };

  // Salvar convocações e escalação
  const saveConvocations = async () => {
    if (!matchDetails || !matchId) return;

    try {
      const response = await fetch(
        `http://localhost:4000/match/${matchId}/convocations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            homeTeam: {
              players: matchDetails.homeTeam.players.map((p) => ({
                playerId: p.id,
                calledUp: p.convocations[0]?.calledUp || false,
                absenceReason: !p.convocations[0]?.calledUp
                  ? p.convocations[0]?.absenceReason || null
                  : null,
              })),
            },
            awayTeam: {
              players: matchDetails.awayTeam.players.map((p) => ({
                playerId: p.id,
                calledUp: p.convocations[0]?.calledUp || false,
                absenceReason: !p.convocations[0]?.calledUp
                  ? p.convocations[0]?.absenceReason || null
                  : null,
              })),
            },
          }),
        }
      );

      if (!response.ok) throw new Error("Erro ao salvar convocações");

      toast(
        "Convocatória salva \nAs convocações foram atualizadas com sucesso!"
      );
      setEditingSquad(false);
    } catch (err) {
      if (err instanceof Error) {
        toast("Erro: " + err.message);
      } else {
        toast("Erro desconhecido");
      }
    }
  };
  // Função para salvar escalação (atualizada com onField)
  const saveLineup = async () => {
    if (!matchDetails || !matchId) return;

    try {
      const response = await fetch(
        `http://localhost:4000/match/${matchId}/lineup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            homeTeam: {
              players: matchDetails.homeTeam.players
                .filter((p) => p.convocations[0]?.calledUp)
                .map((p) => ({
                  playerId: p.id,
                  starter: p.positions[0]?.starter || false,
                  onField: p.positions[0]?.onField || false,
                  position: p.preferredPosition.id,
                })),
            },
            awayTeam: {
              players: matchDetails.awayTeam.players
                .filter((p) => p.convocations[0]?.calledUp)
                .map((p) => ({
                  playerId: p.id,
                  starter: p.positions[0]?.starter || false,
                  onField: p.positions[0]?.onField || false,
                  position: p.preferredPosition.id,
                })),
            },
          }),
        }
      );

      if (!response.ok) throw new Error("Erro ao salvar escalação");

      toast("Escalação salva \nA escalação foi registrada com sucesso!");
    } catch (err) {
      if (err instanceof Error) {
        toast("Erro: " + err.message);
      } else {
        toast("Erro desconhecido");
      }
    }
  };

  // Salvar árbitros
  const saveReferees = async () => {
    if (!matchId) return;

    try {
      const response = await fetch(
        `http://localhost:4000/match/${matchId}/referees`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            referees: refereeAssignments,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao salvar árbitros");
      }
      setShowRefereePanel(false);
      router.refresh();
      toast("Árbitros atualizados com sucesso!");
    } catch (err) {
      if (err instanceof Error) {
        toast(err.message);
      } else {
        toast("An unknown error occurred");
      }
    }
  };
  const [showRefereePanel, setShowRefereePanel] = useState(false);
  if (loading)
    return (
      <div className="container mx-auto py-6 text-center">Carregando...</div>
    );
  if (error)
    return (
      <div className="container mx-auto py-6 text-center text-red-500">
        {error}
      </div>
    );
  if (!matchDetails)
    return (
      <div className="container mx-auto py-6 text-center">
        Partida não encontrada
      </div>
    );

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Cabeçalho do Jogo */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6 border">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Image
                src={
                  matchDetails.homeTeam.club.logo || "/default-club-picture.png"
                }
                alt={matchDetails.homeTeam.name}
                width={50}
                height={50}
                className="h-14 w-14 rounded-full"
              />

              <span className="text-xl font-bold">
                {matchDetails.homeTeam.name}
              </span>
            </div>

            <div className="text-center">
              <div className="text-sm text-muted-foreground">
                {matchDetails.matchday.stage.tournamentSeason.tournament.name} -
                Jornada {matchDetails.matchday.number}
              </div>
              <div className="text-2xl font-bold my-1">VS</div>
              <Badge variant="secondary" className="text-sm">
                {new Date(matchDetails.dateTime).toLocaleTimeString("pt-PT", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">
                {matchDetails.awayTeam.name}
              </span>
              <Image
                src={
                  matchDetails.awayTeam.club.logo || "/default-club-picture.png"
                }
                alt={matchDetails.awayTeam.name}
                width={50}
                height={50}
                className="h-14 w-14 rounded-full"
              />
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm text-muted-foreground">
              {matchDetails.venue.name}
            </div>
            <div className="text-lg font-semibold">
              {(() => {
                const date = new Date(matchDetails.dateTime).toLocaleDateString(
                  "pt-PT",
                  {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }
                );
                return date.charAt(0).toUpperCase() + date.slice(1);
              })()}
            </div>
            <Button
              variant="default"
              className="relative bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg gap-2 overflow-hidden"
              onClick={() => router.push(`/match/${matchId}/live`)}
            >
              {/* Efeito de onda pulsante */}
              <span className="absolute inset-0">
                <span className="absolute inset-0 bg-red-400 rounded-lg opacity-0 animate-ping-slow" />
              </span>

              {/* Conteúdo do botão */}
              <span className="relative flex items-center gap-2">
                <span className="font-bold tracking-wide">EM DIRECTO</span>
                <ArrowRight className="h-4 w-4" />
              </span>
            </Button>
          </div>
        </div>

        {/* Árbitros */}

        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Megaphone className="h-4 w-4" />
              <span className="font-medium">Árbitros:</span>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {refereeAssignments.length > 0 ? (
                  refereeAssignments
                    .filter((a) => a.refereeId)
                    .map((assignment) => {
                      const referee = availableReferees.find(
                        (r) => r.id === assignment.refereeId
                      );
                      const role = refereeRoles.find(
                        (r) => r.id === assignment.id
                      );

                      return referee ? (
                        <span key={assignment.id}>
                          {referee.name} ({role?.name})
                        </span>
                      ) : null;
                    })
                ) : (
                  <span>Sem árbitros cadastrados</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRefereePanel(!showRefereePanel)}
              >
                {showRefereePanel ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={saveReferees}>
                Salvar Árbitros
              </Button>
            </div>
          </div>

          {/* Painel de edição de árbitros (aparece quando expandido) */}
          {showRefereePanel && (
            <div className="mt-3 space-y-3">
              {refereeRoles.map((role) => {
                const assignment = refereeAssignments.find(
                  (a) => a.id === role.id
                );
                const availableRefs = getAvailableRefereesForRole(role.id);

                return (
                  <div
                    key={role.id}
                    className="flex items-center gap-3 p-2 bg-white rounded-lg border"
                  >
                    <Badge variant="outline" className="whitespace-nowrap">
                      {role.name}
                    </Badge>

                    <Select
                      value={assignment?.refereeId || ""}
                      onValueChange={(value) =>
                        updateRefereeAssignment(role.id, value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={`Selecionar ${role.name}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRefs.map((referee) => (
                          <SelectItem key={referee.id} value={referee.id}>
                            {referee.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Abas principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="squad" className="flex-1">
            <Users className="mr-2 h-4 w-4" />
            Convocatória
          </TabsTrigger>
          <TabsTrigger
            value="lineup"
            className="flex-1"
            disabled={
              !matchDetails.homeTeam.players.some(
                (p) => p.convocations[0]?.calledUp
              ) ||
              !matchDetails.awayTeam.players.some(
                (p) => p.convocations[0]?.calledUp
              )
            }
          >
            <Settings className="mr-2 h-4 w-4" />
            Escalação
          </TabsTrigger>
        </TabsList>

        {/* Conteúdo da aba Convocatória */}
        <TabsContent value="squad" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button
              onClick={() =>
                editingSquad ? saveConvocations() : setEditingSquad(true)
              }
              variant={editingSquad ? "default" : "outline"}
            >
              {editingSquad ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Finalizar Convocatória
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar Convocatória
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <TeamSelectionCard
              team={matchDetails.homeTeam}
              onPlayerSelect={handlePlayerSelection}
              editing={editingSquad}
              onStatusClick={(player, action) => {
                setCurrentPlayer(player);
                setCurrentAction(action);
                setAbsenceReason(
                  action === "absence"
                    ? player.convocations[0]?.absenceReason || ""
                    : player.condition.reason || ""
                );
              }}
            />
            <TeamSelectionCard
              team={matchDetails.awayTeam}
              onPlayerSelect={handlePlayerSelection}
              editing={editingSquad}
              onStatusClick={(player, action) => {
                setCurrentPlayer(player);
                setCurrentAction(action);
                setAbsenceReason(
                  action === "absence"
                    ? player.convocations[0]?.absenceReason || ""
                    : player.condition.reason || ""
                );
              }}
            />
          </div>
        </TabsContent>

        {/* Conteúdo da aba Escalação */}
        <TabsContent value="lineup" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button size="lg" className="gap-2" onClick={saveLineup}>
              <Check className="h-4 w-4" />
              Confirmar Escalação
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <TeamLineupCard
              team={matchDetails.homeTeam}
              onStatusChange={updatePlayerStatus}
              onStatusClick={(player, action) => {
                setCurrentPlayer(player);
                setCurrentAction(action);
                setAbsenceReason(
                  action === "absence"
                    ? player.convocations[0]?.absenceReason || ""
                    : player.condition.reason || ""
                );
              }}
            />
            <TeamLineupCard
              team={matchDetails.awayTeam}
              onStatusChange={updatePlayerStatus}
              onStatusClick={(player, action) => {
                setCurrentPlayer(player);
                setCurrentAction(action);
                setAbsenceReason(
                  action === "absence"
                    ? player.convocations[0]?.absenceReason || ""
                    : player.condition.reason || ""
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
                      <AvatarImage
                        src={
                          currentPlayer.photoUrl ||
                          "/default-player-picture.png"
                        }
                      />
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
                          <Shirt className="h-3 w-3 mr-1" />
                          {currentPlayer.preferredNumber
                            ? `#${currentPlayer.preferredNumber}`
                            : "Sem número"}
                        </span>
                        <span>{currentPlayer.preferredPosition.name}</span>
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
                  const teamId = matchDetails.homeTeam.players.some(
                    (p) => p.id === currentPlayer.id
                  )
                    ? matchDetails.homeTeam.id
                    : matchDetails.awayTeam.id;
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

// Componentes auxiliares (TeamSelectionCard, TeamLineupCard, PlayerMenuDropdown)
// ... (mantenha os mesmos componentes que mostrei anteriormente, adaptados para usar os dados da API)

function TeamSelectionCard({
  team,
  onPlayerSelect,
  editing,
  onStatusClick,
}: {
  team: Team;
  onPlayerSelect: (teamId: string, playerId: string, calledUp: boolean) => void;
  editing: boolean;
  onStatusClick: (player: Player, action: "absence" | "injury") => void;
}) {
  const selectedPlayers = team.players.filter(
    (p) => p.convocations[0]?.calledUp
  );
  const availablePlayers = team.players.filter(
    (p) => !p.convocations[0]?.calledUp
  );

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Image
              src={team.club.logo || "/default-club-picture.png"}
              alt={team.name}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full"
            />
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
                onClick={() =>
                  editing && onPlayerSelect(team.id, player.id, false)
                }
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
                onClick={() =>
                  editing && onPlayerSelect(team.id, player.id, true)
                }
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
  onStatusChange: (teamId: string, playerId: string, starter: boolean) => void;
  onStatusClick: (player: Player, action: "absence" | "injury") => void;
}) {
  const starters = team.players.filter((p) => p.positions[0]?.starter);
  const substitutes = team.players.filter(
    (p) => p.convocations[0]?.calledUp && !p.positions[0]?.starter
  );
  const absentPlayers = team.players.filter(
    (p) => !p.convocations[0]?.calledUp
  );

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image
            src={team.club.logo || "/default-club-picture.png"}
            alt={team.name}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full"
          />
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
                        <AvatarImage
                          src={player.photoUrl || "/default-player-picture.png"}
                        />
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
                            <Shirt className="h-3 w-3 mr-1" />
                            {player.preferredNumber
                              ? `#${player.preferredNumber}`
                              : "Sem número"}
                          </span>
                          <span>{player.preferredPosition.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {player.condition.status.name.toLowerCase() ===
                            "lesionado"
                              ? "Lesionado"
                              : "Ausente"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <PlayerMenuDropdown
                      player={player}
                      onStatusClick={onStatusClick}
                    />
                  </div>
                  {(player.convocations[0]?.absenceReason ||
                    player.condition.reason) && (
                    <div className="mt-2 text-sm p-2 bg-white rounded border">
                      <div className="font-medium">
                        {player.condition.status.name.toLowerCase() ===
                        "lesionado"
                          ? "Detalhes da Lesão:"
                          : "Motivo da Ausência:"}
                      </div>
                      <p>
                        {player.convocations[0]?.absenceReason ||
                          player.condition.reason}
                      </p>
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
    DISPONIVEL: "bg-green-500",
    LESIONADO: "bg-yellow-500",
    AUSENTE: "bg-red-500",
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
            <AvatarImage
              src={player.photoUrl || "/default-player-picture.png"}
            />
            <AvatarFallback>
              {player.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          {showStatus && (
            <span
              className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${
                statusColors[
                  player.condition.status.name as keyof typeof statusColors
                ] || "bg-gray-500"
              }`}
            />
          )}
        </div>

        <div>
          <div className="font-medium">{player.name}</div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center bg-secondary px-2 py-0.5 rounded-full">
              <Shirt className="h-3 w-3 mr-1" />
              {player.preferredNumber
                ? `#${player.preferredNumber}`
                : "Sem número"}
            </span>
            <span>{player.preferredPosition.name}</span>
            <span>{player.height}m</span>
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
  onStatusChange: (teamId: string, playerId: string, starter: boolean) => void;
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
              onStatusChange(teamId, player.id, !player.positions[0]?.starter);
            }}
          >
            {player.positions[0]?.starter ? (
              <span className="h-3 w-3 rounded-full bg-primary" />
            ) : (
              <span className="h-3 w-3 rounded-full bg-yellow-500" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {player.positions[0]?.starter ? "Titular" : "Suplente"}
        </TooltipContent>
      </Tooltip>

      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="relative">
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={player.photoUrl || "/default-player-picture.png"}
            />
            <AvatarFallback>
              {player.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          {player.condition.status.name !== "DISPONIVEL" && (
            <span
              className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${
                player.condition.status.name === "LESIONADO"
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{player.name}</div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center bg-secondary px-2 py-0.5 rounded-full">
              <Shirt className="h-3 w-3 mr-1" />
              {player.preferredNumber
                ? `#${player.preferredNumber}`
                : "Sem número"}
            </span>
            <span>{player.preferredPosition.name}</span>
            <span>{player.height}m</span>
          </div>
        </div>
      </div>

      <PlayerMenuDropdown player={player} onStatusClick={onStatusClick} />
    </div>
  );
}

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
