"use client";
// components/tournament/MatchesTab.tsx
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import {
  PlusCircle,
  Play,
  Trophy,
  List,
  Grid,
  Loader2,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Stage } from "@/app/types/stage";
import { Tournament } from "@/app/types/tournament";
import { Matchday } from "@/app/types/matchday";
import { Match } from "@/app/types/match";
import Image from "next/image";
import { AlertDialogStage } from "./alert-dialog-stage";
import { useRouter } from "next/navigation";
import { AlertDialogMatchday } from "./alert-dialog-matchday";
import { DateTimePicker24h } from "./date-time-picker";
import { AlertDialogMatch } from "./alert-dialog-match";

type Team = {
  id: string;
  name: string;
  club: {
    logo: string;
  };
};

interface MatchesTabProps {
  tournament: Tournament;
  availableTournamentTeams: Team[];
  stageTypes: {
    id: string;
    name: string;
  }[];
  referees: {
    id: string;
    name: string;
  }[];
  venues: {
    id: string;
    name: string;
    location: string;
    capacity?: number;
  }[];
  // onStageCreated: (newStage: Stage) => void;
  // onStageUpdated: (updatedStage: Stage) => void;
  // onStageDeleted: (stageOrder: string) => void;
  // onMatchdayCreated: (stageOrder: string, newMatchday: Matchday) => void;
  // onMatchdayUpdated: (stageOrder: string, updatedMatchday: Matchday) => void;
  // onMatchdayDeleted: (stageOrder: string, matchdayId: string) => void;
  // onMatchCreated: (newMatch: Match) => void;
  // onMatchUpdated: (updatedMatch: Match) => void;
  // onMatchDeleted: (matchId: string) => void;
}

export function MatchesTab({
  tournament,
  availableTournamentTeams,
  stageTypes,
  referees,
  venues,
}: // onStageCreated,
// onStageUpdated,
// onStageDeleted,
// onMatchdayCreated,
// onMatchdayUpdated,
// onMatchdayDeleted,
// onMatchCreated,
// onMatchUpdated,
// onMatchDeleted,
MatchesTabProps) {
  const router = useRouter();
  const [stageToDelete, setStageToDelete] = useState<Stage | null>(null);
  const [matchdayToDelete, setMatchdayToDelete] = useState<Matchday | null>(
    null
  );
  const [viewMode, setViewMode] = useState<"list" | "stages">("stages");
  const [isLoading, setIsLoading] = useState({
    generating: false,
    saving: false,
    deleting: false,
  });
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>(
    {}
  );
  const [expandedMatchdays, setExpandedMatchdays] = useState<
    Record<string, boolean>
  >({});

  // Form states
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);
  const [isStageDialogOpen, setIsStageDialogOpen] = useState(false);
  const [isMatchdayDialogOpen, setIsMatchdayDialogOpen] = useState(false);

  // Current edited entities
  const [currentStage, setCurrentStage] = useState<Stage | null>(null);
  const [currentMatchday, setCurrentMatchday] = useState<{
    stage: Stage;
    matchday: Matchday;
  } | null>(null);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);

  const [matchForm, setMatchForm] = useState({
    stageId: "",
    matchdayId: "",
    homeTeamId: "",
    awayTeamId: "",
    dateTime: "",
    venueId: "",
    refereeId: "",
  });

  const currentSeason = tournament.seasons.filter(
    (s) => s.isCurrent === true
  )[0];

  const [stageForm, setStageForm] = useState({
    name: "",
    order: currentSeason.stages.length + 1,
    typeId: stageTypes.filter((t) => t.name === "Liga")[0].id,
    hasMatchdays: true,
    twoLegged: false,
    extraTimeAllowed: false,
    penaltyShootout: false,
    teamsToAdvance: 0,
    tournamentSeasonId: currentSeason.id,
  });

  const [matchdayForm, setMatchdayForm] = useState({
    stageId: "",
    number: 1,
  });

  // Initialize expanded states
  useState(() => {
    const initialExpandedStages: Record<string, boolean> = {};
    const initialExpandedMatchdays: Record<string, boolean> = {};

    currentSeason.stages.forEach((stage: Stage) => {
      initialExpandedStages[stage.order] = true;
      stage.matchdays?.forEach((matchday) => {
        initialExpandedMatchdays[matchday.id] = true;
      });
    });

    setExpandedStages(initialExpandedStages);
    setExpandedMatchdays(initialExpandedMatchdays);
  });

  // ======================
  // Stage management
  // ======================
  const openStageDialog = (stage: Stage | null) => {
    setCurrentStage(stage);
    if (stage) {
      setStageForm({
        name: stage.name,
        order: parseInt(stage.order),
        typeId: stage.type.id,
        hasMatchdays: stage.hasMatchdays,
        twoLegged: stage.twoLegged,
        extraTimeAllowed: stage.extraTimeAllowed,
        penaltyShootout: stage.penaltyShootout,
        teamsToAdvance: stage.teamsToAdvance,
        tournamentSeasonId: currentSeason.id,
      });
    } else {
      setStageForm({
        name: "",
        order: currentSeason.stages.length + 1,
        typeId: stageTypes.filter((t) => t.name === "Liga")[0].id,
        hasMatchdays: true,
        twoLegged: false,
        extraTimeAllowed: false,
        penaltyShootout: false,
        teamsToAdvance: 0,
        tournamentSeasonId: currentSeason.id,
      });
    }
    setIsStageDialogOpen(true);
  };

  const createOrUpdateStage = async () => {
    try {
      const isUpdate = !!currentStage;
      const method = isUpdate ? "PUT" : "POST";
      const url = isUpdate
        ? `http://localhost:4000/stage/${currentStage.id}`
        : `http://localhost:4000/stage`;

      await toast.promise(
        fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(stageForm),
        }),
        {
          loading: isUpdate ? "Atualizando fase..." : "Criando fase...",
          success: isUpdate
            ? "Fase atualizada com sucesso"
            : "Fase criada com sucesso",
          error: isUpdate ? "Erro ao atualizar fase" : "Erro ao criar fase",
        }
      );

      setIsStageDialogOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error saving stage:", error);
    }
  };

  // const deleteStage = async (stage: Stage) => {
  // try {
  //   setIsLoading((prev) => ({ ...prev, deleting: true }));
  //   await toast.promise(
  //     fetch(`http://localhost:4000/stages/`, {
  //       method: "DELETE",
  //     }),
  //     {
  //       loading: "Eliminando fase...",
  //       success: () => {
  //         onStageDeleted(stageOrder);
  //         return "Fase eliminada com sucesso";
  //       },
  //       error: "Erro ao eliminar fase",
  //     }
  //   );
  // } catch (error) {
  //   console.error("Error deleting stage:", error);
  // } finally {
  //   setIsLoading((prev) => ({ ...prev, deleting: false }));
  // }
  // };

  // ======================
  // Matchday management
  // ======================
  const openMatchdayDialog = (stage: Stage, matchday: Matchday | null) => {
    setCurrentMatchday(matchday ? { stage, matchday } : null);
    if (matchday) {
      setMatchdayForm({
        stageId: stage.id,
        number: matchday.number,
      });
    } else {
      setMatchdayForm({
        stageId: stage.id,
        number: (stage.matchdays?.length || 0) + 1,
      });
    }
    setIsMatchdayDialogOpen(true);
  };

  const createOrUpdateMatchday = async () => {
    try {
      const isUpdate = !!currentMatchday;
      const method = isUpdate ? "PUT" : "POST";
      const url = isUpdate
        ? `/api/tournaments/${tournament.id}/matchdays/${currentMatchday?.matchday.id}`
        : `http://localhost:4000/matchday`;

      await toast.promise(
        fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...matchdayForm,
            stageId: matchdayForm.stageId,
          }),
        }),
        {
          loading: isUpdate ? "Atualizando jornada..." : "Criando jornada...",
          success: isUpdate
            ? "Jornada atualizada com sucesso"
            : "Jornada criada com sucesso",
          error: isUpdate
            ? "Erro ao atualizar jornada"
            : "Erro ao criar jornada",
        }
      );

      // const data = await response.json();

      // if (isUpdate) {
      //   onMatchdayUpdated(matchdayForm.stageId, data.matchday);
      // } else {
      //   onMatchdayCreated(matchdayForm.stageId, data.matchday);
      // }

      setIsMatchdayDialogOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error saving matchday:", error);
    }
  };

  // const deleteMatchday = async (stageOrder: string, matchdayId: string) => {
  //   try {
  //     setIsLoading((prev) => ({ ...prev, deleting: true }));

  //     await toast.promise(
  //       fetch(`/api/tournaments/${tournament.id}/matchdays/${matchdayId}`, {
  //         method: "DELETE",
  //       }),
  //       {
  //         loading: "Eliminando jornada...",
  //         success: () => {
  //           onMatchdayDeleted(stageOrder, matchdayId);
  //           return "Jornada eliminada com sucesso";
  //         },
  //         error: "Erro ao eliminar jornada",
  //       }
  //     );
  //   } catch (error) {
  //     console.error("Error deleting matchday:", error);
  //   } finally {
  //     setIsLoading((prev) => ({ ...prev, deleting: false }));
  //   }
  // };

  // ======================
  // Match management
  // ======================
  const openMatchDialog = (
    match: Match | null,
    stageId: string,
    matchdayId?: string
  ) => {
    setCurrentMatch(match);
    if (match) {
      const date = new Date(match.dateTime);

      setMatchForm({
        stageId: stageId,
        matchdayId: matchdayId || "",
        homeTeamId: match.homeTeam.id,
        awayTeamId: match.awayTeam.id,
        dateTime: date.toISOString(),
        venueId: match.venue?.id || "",
        refereeId: match.referee?.id || "",
      });
    } else {
      setMatchForm({
        stageId: stageId,
        matchdayId: matchdayId || "",
        homeTeamId: "",
        awayTeamId: "",
        dateTime: "",
        venueId: "",
        refereeId: "",
      });
    }
    setIsMatchDialogOpen(true);
  };

  const createOrUpdateMatch = async () => {
    setIsLoading((prev) => ({ ...prev, saving: true }));
    try {
      const isUpdate = !!currentMatch;
      const method = isUpdate ? "PUT" : "POST";
      const url = isUpdate
        ? `http://localhost:4000/match/${currentMatch.id}`
        : `http://localhost:4000/match`;

      await toast.promise(
        fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stageId: matchForm.stageId,
            matchdayId: matchForm.matchdayId || null,
            homeTeamId: matchForm.homeTeamId,
            awayTeamId: matchForm.awayTeamId,
            dateTime: matchForm.dateTime,
            venueId: matchForm.venueId !== "" ? matchForm.venueId : null,
            refereeId: matchForm.refereeId !== "" ? matchForm.refereeId : null,
            seasonId: currentSeason.id,
            numberPeriods: 2,
            durationPerPeriod: 45,
            halfTimeDuration: 15,
          }),
        }),
        {
          loading: isUpdate ? "Atualizando jogo..." : "Criando jogo...",
          success: isUpdate
            ? "Jogo atualizado com sucesso"
            : "Jogo criado com sucesso",
          error: isUpdate ? "Erro ao atualizar jogo" : "Erro ao criar jogo",
        }
      );

      // const data = await response.json();

      // if (isUpdate) {
      //   onMatchUpdated(data.match);
      // } else {
      //   onMatchCreated(data.match);
      // }

      setIsMatchDialogOpen(false);
      resetMatchForm();
      router.refresh();
    } catch (error) {
      console.error("Error saving match:", error);
    } finally {
      setIsLoading((prev) => ({ ...prev, saving: false }));
    }
  };

  const deleteMatch = async (matchId: string) => {
    try {
      setIsLoading((prev) => ({ ...prev, deleting: true }));

      await toast.promise(
        fetch(`/api/tournaments/${tournament.id}/matches/${matchId}`, {
          method: "DELETE",
        }),
        {
          loading: "Eliminando jogo...",
          success: () => {
            onMatchDeleted(matchId);
            return "Jogo eliminado com sucesso";
          },
          error: "Erro ao eliminar jogo",
        }
      );
    } catch (error) {
      console.error("Error deleting match:", error);
    } finally {
      setIsLoading((prev) => ({ ...prev, deleting: false }));
    }
  };

  // ======================
  // Helper functions
  // ======================
  const resetMatchForm = () => {
    setMatchForm({
      stageId: "",
      matchdayId: "",
      homeTeamId: "",
      awayTeamId: "",
      dateTime: "",
      venueId: "",
      refereeId: "",
    });
    setCurrentMatch(null);
  };

  const toggleStage = (stageOrder: string) => {
    setExpandedStages((prev) => ({
      ...prev,
      [stageOrder]: !prev[stageOrder],
    }));
  };

  const toggleMatchday = (matchdayId: string) => {
    setExpandedMatchdays((prev) => ({
      ...prev,
      [matchdayId]: !prev[matchdayId],
    }));
  };

  const formatDateTime = (dateTime: Date) => {
    const date = new Date(dateTime);
    return (
      date.toLocaleDateString("pt-PT") +
      " " +
      date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })
    );
  };

  const generateMatchesForStage = async (stageOrder: string) => {
    setIsLoading((prev) => ({ ...prev, generating: true }));
    try {
      // POST /api/tournaments/{tournamentId}/stages/{stageOrder}/generate-matches
      const response = await toast.promise(
        fetch(
          `/api/tournaments/${tournament.id}/stages/${stageOrder}/generate-matches`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }
        ),
        {
          loading: "Gerando jogos...",
          success: "Jogos gerados com sucesso",
          error: "Erro ao gerar jogos",
        }
      );

      if (!response.ok) throw new Error("Failed to generate matches");
    } catch (error) {
      console.error("Error generating matches:", error);
    } finally {
      setIsLoading((prev) => ({ ...prev, generating: false }));
    }
  };

  // ======================
  // Render
  // ======================
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium flex items-center">
          <Trophy className="mr-2 h-5 w-5" />
          Gestão de Jogos
        </h3>

        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            onClick={() => setViewMode("list")}
            size="sm"
          >
            <List className="mr-2 h-4 w-4" />
            Lista
          </Button>
          <Button
            variant={viewMode === "stages" ? "default" : "outline"}
            onClick={() => setViewMode("stages")}
            size="sm"
          >
            <Grid className="mr-2 h-4 w-4" />
            Fases/Jornadas
          </Button>

          <Button size="sm" onClick={() => openStageDialog(null)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Fase
          </Button>
        </div>
      </div>

      {viewMode === "list" ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fase</TableHead>
              <TableHead>Jornada</TableHead>
              <TableHead>Casa</TableHead>
              <TableHead>Fora</TableHead>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Local</TableHead>
              <TableHead>Árbitro</TableHead>
              <TableHead>Resultado</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentSeason.stages.flatMap((stage) =>
              stage.matchdays?.flatMap((matchday) =>
                matchday.matches.map((match) => (
                  <TableRow key={match.id}>
                    <TableCell className="font-medium">{stage.name}</TableCell>
                    <TableCell>{matchday.number}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Image
                          width={24}
                          height={24}
                          src={
                            match.homeTeam.club.logo ||
                            "/default-club-picture.png"
                          }
                          alt={match.homeTeam.name}
                          className="h-6 w-6"
                        />
                        {match.homeTeam.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Image
                          width={24}
                          height={24}
                          src={
                            match.awayTeam.club.logo ||
                            "/default-club-picture.png"
                          }
                          alt={match.awayTeam.name}
                          className="h-6 w-6"
                        />
                        {match.awayTeam.name}
                      </div>
                    </TableCell>
                    <TableCell>{formatDateTime(match.dateTime)}</TableCell>
                    <TableCell>{match.venue?.name || "-"}</TableCell>
                    <TableCell>{match.referee?.name || "-"}</TableCell>
                    <TableCell>
                      {match.matchStats
                        ? `${match.matchStats.homeScore} - ${match.matchStats.awayScore}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            openMatchDialog(match, stage.id, matchday.id)
                          }
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMatch(match.id)}
                          disabled={isLoading.deleting}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )
            )}
          </TableBody>
          {currentSeason.stages
            .flatMap((s) => s.matchdays || [])
            .flatMap((m) => m.matches).length === 0 && (
            <TableCaption className="py-8">
              <div className="flex flex-col items-center justify-center">
                <Trophy className="h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground mb-2">
                  Nenhum jogo agendado
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Adicione jogos manualmente ou gere automaticamente
                </p>
              </div>
            </TableCaption>
          )}
        </Table>
      ) : (
        <div className="space-y-4">
          {currentSeason.stages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
              <Trophy className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground mb-2">
                Nenhuma fase criada
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Crie fases para organizar o torneio
              </p>
              <Button onClick={() => openStageDialog(null)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Criar Primeira Fase
              </Button>
            </div>
          ) : (
            [...currentSeason.stages]
              .sort((a, b) => parseInt(a.order) - parseInt(b.order))
              .map((stage) => (
                <div
                  key={stage.order}
                  className="border rounded-lg overflow-hidden"
                >
                  <div
                    className="flex items-center justify-between p-4 bg-muted/50 cursor-pointer hover:bg-muted"
                    onClick={() => toggleStage(stage.order)}
                  >
                    <div className="flex items-center space-x-3">
                      {expandedStages[stage.order] ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                      <h4 className="font-medium">
                        {stage.name} ({stage.type.name})
                      </h4>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            openStageDialog(stage);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setStageToDelete(stage);
                            // deleteStage(stage);
                          }}
                          disabled={isLoading.deleting}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                        {stageToDelete && (
                          <AlertDialogStage
                            open={!!stageToDelete}
                            onOpenChange={(open) => {
                              if (!open) setStageToDelete(null);
                            }}
                            stage={stageToDelete}
                          />
                        )}
                      </div>
                      {stage.hasMatchdays && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openMatchdayDialog(stage, null);
                          }}
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Jornada
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Implementar geração de jogos
                          toast.info(
                            "Funcionalidade de geração de jogos será implementada"
                          );
                        }}
                        disabled={isLoading.generating}
                      >
                        {isLoading.generating ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="mr-2 h-4 w-4" />
                        )}
                        Gerar Jogos
                      </Button>
                    </div>
                  </div>

                  {expandedStages[stage.order] && (
                    <div className="p-4 pt-0 space-y-4">
                      {!stage.hasMatchdays ? (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h5 className="font-medium">Jogos Diretos</h5>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                openMatchDialog(null, stage.id);
                              }}
                            >
                              <PlusCircle className="mr-2 h-4 w-4" />
                              Adicionar Jogo
                            </Button>
                          </div>
                          {stage.matchdays?.flatMap((m) => m.matches[0])
                            .length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground border rounded-lg">
                              <p className="mb-2">Nenhum jogo nesta fase</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {stage.matchdays?.flatMap((matchday) =>
                                matchday.matches.map((match) => (
                                  <MatchCard
                                    key={match.id}
                                    match={match}
                                    onEdit={() =>
                                      openMatchDialog(match, stage.id)
                                    }
                                    isDeleting={isLoading.deleting}
                                  />
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      ) : stage.matchdays?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                          <p className="mb-2">Nenhuma jornada nesta fase</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              openMatchdayDialog(stage, null);
                            }}
                          >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Criar Jornada
                          </Button>
                        </div>
                      ) : (
                        [...stage.matchdays]
                          .sort((a, b) => a.number - b.number)
                          .map((matchday) => (
                            <div
                              key={matchday.id}
                              className="border rounded-lg overflow-hidden"
                            >
                              <div
                                className="flex items-center justify-between p-3 bg-muted/25 cursor-pointer hover:bg-muted/50"
                                onClick={() => toggleMatchday(matchday.id)}
                              >
                                <div className="flex items-center space-x-3">
                                  {expandedMatchdays[matchday.id] ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                  <h5 className="font-medium">
                                    Jornada {matchday.number}
                                  </h5>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="flex gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openMatchdayDialog(stage, matchday);
                                      }}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // deleteMatchday(
                                        //   stage.order,
                                        //   matchday.id
                                        // );
                                        setMatchdayToDelete(matchday);
                                      }}
                                      disabled={isLoading.deleting}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                    {matchdayToDelete && (
                                      <AlertDialogMatchday
                                        open={!!matchdayToDelete}
                                        onOpenChange={(open) => {
                                          if (!open) setMatchdayToDelete(null);
                                        }}
                                        matchday={matchdayToDelete}
                                      />
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openMatchDialog(
                                        null,
                                        stage.id,
                                        matchday.id
                                      );
                                    }}
                                  >
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Jogo
                                  </Button>
                                </div>
                              </div>

                              {expandedMatchdays[matchday.id] && (
                                <div className="p-4 pt-0">
                                  {matchday.matches.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                                      <p className="mb-2">
                                        Nenhum jogo nesta jornada
                                      </p>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          openMatchDialog(
                                            null,
                                            stage.id,
                                            matchday.id
                                          );
                                        }}
                                      >
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Adicionar Jogo
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {matchday.matches.map((match) => (
                                        <MatchCard
                                          key={match.id}
                                          match={match}
                                          onEdit={() =>
                                            openMatchDialog(
                                              match,
                                              stage.id,
                                              matchday.id
                                            )
                                          }
                                          isDeleting={isLoading.deleting}
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))
                      )}
                    </div>
                  )}
                </div>
              ))
          )}
        </div>
      )}

      {/* Dialog para criar/editar fase */}
      <Dialog open={isStageDialogOpen} onOpenChange={setIsStageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentStage ? "Editar Fase" : "Criar Nova Fase"}
            </DialogTitle>
            <DialogDescription>
              {currentStage
                ? "Atualize os detalhes da fase"
                : "Defina o tipo de fase para o torneio"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input
                id="name"
                value={stageForm.name}
                onChange={(e) =>
                  setStageForm({ ...stageForm, name: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="order" className="text-right">
                Ordem
              </Label>
              <Input
                type="number"
                id="order"
                value={stageForm.order}
                onChange={(e) =>
                  setStageForm({
                    ...stageForm,
                    order: parseInt(e.target.value),
                  })
                }
                className="col-span-3"
                min="1"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Tipo
              </Label>
              <Select
                value={stageForm.typeId}
                onValueChange={(value) =>
                  setStageForm({
                    ...stageForm,
                    typeId: value,
                  })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {stageTypes.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="hasMatchdays" className="text-right">
                Tem Jornadas?
              </Label>
              <Select
                value={stageForm.hasMatchdays ? "true" : "false"}
                onValueChange={(value) =>
                  setStageForm({ ...stageForm, hasMatchdays: value === "true" })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Tem jornadas?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Sim</SelectItem>
                  <SelectItem value="false">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="twoLegged" className="text-right">
                Jogos Ida/Volta
              </Label>
              <Select
                value={stageForm.twoLegged ? "true" : "false"}
                onValueChange={(value) =>
                  setStageForm({ ...stageForm, twoLegged: value === "true" })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Jogos ida/volta?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Sim</SelectItem>
                  <SelectItem value="false">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="extraTimeAllowed" className="text-right">
                Prolongamento
              </Label>
              <Select
                value={stageForm.extraTimeAllowed ? "true" : "false"}
                onValueChange={(value) =>
                  setStageForm({
                    ...stageForm,
                    extraTimeAllowed: value === "true",
                  })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Prolongamento?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Sim</SelectItem>
                  <SelectItem value="false">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="penaltyShootout" className="text-right">
                Disputa de pênaltis
              </Label>
              <Select
                value={stageForm.penaltyShootout ? "true" : "false"}
                onValueChange={(value) =>
                  setStageForm({
                    ...stageForm,
                    penaltyShootout: value === "true",
                  })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Disputa de pênaltis?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Sim</SelectItem>
                  <SelectItem value="false">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsStageDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={createOrUpdateStage} disabled={!stageForm.name}>
              {currentStage ? (
                <Pencil className="mr-2 h-4 w-4" />
              ) : (
                <PlusCircle className="mr-2 h-4 w-4" />
              )}
              {currentStage ? "Atualizar Fase" : "Criar Fase"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para criar/editar jornada */}
      <Dialog
        open={isMatchdayDialogOpen}
        onOpenChange={setIsMatchdayDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentMatchday ? "Editar Jornada" : "Criar Nova Jornada"}
            </DialogTitle>
            <DialogDescription>
              {currentMatchday
                ? "Atualize os detalhes da jornada"
                : "Adicione uma nova jornada à fase selecionada"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="matchdayNumber" className="text-right">
                Número
              </Label>
              <Input
                type="number"
                id="matchdayNumber"
                value={matchdayForm.number}
                onChange={(e) =>
                  setMatchdayForm({
                    ...matchdayForm,
                    number: parseInt(e.target.value) || 1,
                  })
                }
                className="col-span-3"
                min="1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsMatchdayDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={createOrUpdateMatchday}
              disabled={!matchdayForm.stageId}
            >
              {currentMatchday ? (
                <Pencil className="mr-2 h-4 w-4" />
              ) : (
                <PlusCircle className="mr-2 h-4 w-4" />
              )}
              {currentMatchday ? "Atualizar Jornada" : "Criar Jornada"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para criar/editar jogo */}
      <Dialog open={isMatchDialogOpen} onOpenChange={setIsMatchDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {currentMatch ? "Editar Jogo" : "Criar Novo Jogo"}
            </DialogTitle>
            <DialogDescription>
              {currentMatch
                ? "Atualize os detalhes do jogo"
                : "Preencha os detalhes do jogo"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="matchStage" className="text-right">
                Fase
              </Label>
              <Select
                value={matchForm.stageId}
                onValueChange={(value) => {
                  setMatchForm({
                    ...matchForm,
                    stageId: value,
                    matchdayId: "",
                  });
                }}
                disabled={!!currentMatch || !!matchForm.matchdayId}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione a fase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {currentSeason.stages.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        {stage.name} ({stage.type.name})
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {matchForm.stageId &&
              currentSeason.stages.find((s) => s.id === matchForm.stageId)
                ?.hasMatchdays && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="matchMatchday" className="text-right">
                    Jornada
                  </Label>
                  <Select
                    value={matchForm.matchdayId}
                    onValueChange={(value) =>
                      setMatchForm({ ...matchForm, matchdayId: value })
                    }
                    disabled={!matchForm.stageId || !!currentMatch}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione a jornada" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {currentSeason.stages
                          .find((s) => s.id === matchForm.stageId)!
                          .matchdays?.map((matchday) => (
                            <SelectItem key={matchday.id} value={matchday.id}>
                              Jornada {matchday.number}
                            </SelectItem>
                          )) || (
                          <SelectLabel>Nenhuma jornada disponível</SelectLabel>
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="homeTeam" className="text-right">
                Equipa Casa
              </Label>
              <Select
                value={matchForm.homeTeamId}
                onValueChange={(value) =>
                  setMatchForm({ ...matchForm, homeTeamId: value })
                }
                disabled={!matchForm.stageId}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione a equipa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {availableTournamentTeams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        <div className="flex items-center gap-2">
                          <Image
                            width={16}
                            height={16}
                            src={team.club.logo || "/default-club-picture.png"}
                            alt={team.name}
                            className="h-4 w-4"
                          />
                          {team.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="awayTeam" className="text-right">
                Equipa Fora
              </Label>
              <Select
                value={matchForm.awayTeamId}
                onValueChange={(value) =>
                  setMatchForm({ ...matchForm, awayTeamId: value })
                }
                disabled={!matchForm.homeTeamId}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione a equipa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {availableTournamentTeams
                      .filter((team) => team.id !== matchForm.homeTeamId)
                      .map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          <div className="flex items-center gap-2">
                            <Image
                              width={16}
                              height={16}
                              src={
                                team.club.logo || "/default-club-picture.png"
                              }
                              alt={team.name}
                              className="h-4 w-4"
                            />
                            {team.name}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dateTime" className="text-right">
                Data e Hora
              </Label>
              <div className="col-span-3">
                <DateTimePicker24h
                  value={
                    matchForm.dateTime
                      ? new Date(matchForm.dateTime)
                      : undefined
                  }
                  onChange={(selectedDate) =>
                    setMatchForm({
                      ...matchForm,
                      dateTime: selectedDate.toISOString(), // formato ISO: "2024-10-11T15:30:00Z"
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="venueId" className="text-right">
                Estádio
              </Label>
              <Select
                value={matchForm.venueId}
                onValueChange={(value) =>
                  setMatchForm({
                    ...matchForm,
                    venueId: value,
                  })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o Estádio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {venues.map((venue) => (
                      <SelectItem key={venue.id} value={venue.id}>
                        <div className="flex items-center gap-2">
                          {venue.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="matchMatchday" className="text-right">
                Árbitro
              </Label>
              <Select
                value={matchForm.refereeId}
                onValueChange={(value) =>
                  setMatchForm({ ...matchForm, refereeId: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o árbitro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {referees.map((referee) => (
                      <SelectItem key={referee.id} value={referee.id}>
                        {referee.name}
                      </SelectItem>
                    )) || <SelectLabel>Nenhuma Árbitro disponível</SelectLabel>}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsMatchDialogOpen(false);
                resetMatchForm();
              }}
              disabled={isLoading.saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={createOrUpdateMatch}
              disabled={
                !matchForm.stageId ||
                (!matchForm.matchdayId &&
                  currentSeason.stages.find((s) => s.id === matchForm.stageId)
                    ?.hasMatchdays) ||
                !matchForm.homeTeamId ||
                !matchForm.awayTeamId ||
                !matchForm.dateTime ||
                isLoading.saving
              }
            >
              {isLoading.saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : currentMatch ? (
                <Pencil className="mr-2 h-4 w-4" />
              ) : (
                <PlusCircle className="mr-2 h-4 w-4" />
              )}
              {currentMatch ? "Atualizar Jogo" : "Criar Jogo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface MatchCardProps {
  match: Match;
  onEdit: () => void;
  isDeleting: boolean;
}

function MatchCard({ match, onEdit, isDeleting }: MatchCardProps) {
  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null);

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-muted-foreground">
          {new Date(match.dateTime).toLocaleDateString("pt-PT")}{" "}
          {new Date(match.dateTime).toLocaleTimeString("pt-PT", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3 flex-1">
          <Image
            width={40}
            height={40}
            src={match.homeTeam.club.logo || "/default-club-picture.png"}
            alt={match.homeTeam.name}
            className="h-10 w-10"
          />
          <span className="font-medium">{match.homeTeam.name}</span>
        </div>
        <div className="px-4 font-medium">
          {match.matchStats ? (
            <span className="font-bold">
              {match.matchStats.homeScore} - {match.matchStats.awayScore}
            </span>
          ) : (
            <span>vs</span>
          )}
        </div>
        <div className="flex items-center gap-3 flex-1 justify-end text-right">
          <span className="font-medium">{match.awayTeam.name}</span>
          <Image
            width={40}
            height={40}
            src={match.awayTeam.club.logo || "/default-club-picture.png"}
            alt={match.awayTeam.name}
            className="h-10 w-10"
          />
        </div>
      </div>

      <div className="mt-4 pt-4 border-t flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {match.venue && (
            <div className="flex items-center gap-2">
              <span>
                🏟️ {match.venue.name}{" "}
                {match.venue.location && `(${match.venue.location})`}
              </span>
            </div>
          )}
          {match.referee && (
            <div className="flex items-center gap-2 mt-1">
              <span>👤 {match.referee.name}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setMatchToDelete(match);
            }}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
          {matchToDelete && (
            <AlertDialogMatch
              open={!!matchToDelete}
              onOpenChange={(open) => {
                if (!open) setMatchToDelete(null);
              }}
              match={matchToDelete}
            />
          )}
        </div>
      </div>
    </div>
  );
}
