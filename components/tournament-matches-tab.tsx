"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogTrigger,
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
  Settings,
  Trash2,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { Tournament } from "@/app/types/tournament";
import Image from "next/image";
import { Matchday } from "@/app/types/matchday";
import { format } from "date-fns";

type Team = {
  id: string;
  club: {
    name: string;
    logo: string;
  };
};

export function MatchesTab({
  tournament,
  availableTournamentTeams,
}: {
  tournament: Tournament;
  availableTournamentTeams: Team[];
}) {
  const [viewMode, setViewMode] = useState<"list" | "rounds">("rounds");
  const [rounds, setRounds] = useState<Matchday[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState({
    matches: true,
    teams: true,
    generating: false,
    saving: false,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentRound, setCurrentRound] = useState<string>("");

  // Form state for manual match creation
  const [matchForm, setMatchForm] = useState({
    round: "",
    homeTeam: "",
    awayTeam: "",
    date: "",
    time: "",
    stadium: "",
    referee: "",
  });

  // Fetch tournament data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setTeams(availableTournamentTeams);
        setIsLoading((prev) => ({ ...prev, teams: false }));

        setRounds(tournament.stages[0].matchdays);
        setIsLoading((prev) => ({ ...prev, matches: false }));
      } catch (error) {
        console.error("Error fetching data:", error);
        toast("Não foi possível carregar os dados do torneio");
      }
    };

    fetchData();
  }, [tournament, availableTournamentTeams]);

  // Generate matches automatically (round-robin)
  const generateAutomaticMatches = async () => {
    setIsLoading((prev) => ({ ...prev, generating: true }));
    try {
      const response = await fetch(
        `http://localhost:4000/tournament/${
          tournament.seasons.find((ts) => ts.isCurrent == true)?.id
        }/matches/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to generate matches");

      const data = await response.json();
      setRounds(data.rounds);
      toast("Jogos gerados automaticamente com sucesso");
    } catch (error) {
      console.error("Error generating matches:", error);
      toast("Não foi possível gerar os jogos automaticamente");
    } finally {
      setIsLoading((prev) => ({ ...prev, generating: false }));
    }
  };

  // Create match manually
  const createManualMatch = async () => {
    setIsLoading((prev) => ({ ...prev, saving: true }));
    try {
      const response = await fetch(
        `/api/tournaments/${tournament.id}/matches`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(matchForm),
        }
      );

      if (!response.ok) throw new Error("Failed to create match");

      const data = await response.json();

      // Update rounds state with the new match
      setRounds((prevRounds) => {
        return prevRounds.map((round) => {
          if (round.id === data.match.roundId) {
            return {
              ...round,
              matches: [...round.matches, data.match],
            };
          }
          return round;
        });
      });
      toast("Jogo criado com sucesso");
      setIsDialogOpen(false);
      resetMatchForm();
    } catch (error) {
      console.error("Error creating match:", error);
      toast("Não foi possível criar o jogo");

    } finally {
      setIsLoading((prev) => ({ ...prev, saving: false }));
    }
  };

  const resetMatchForm = () => {
    setMatchForm({
      round: "",
      homeTeam: "",
      awayTeam: "",
      date: "",
      time: "",
      stadium: "",
      referee: "",
    });
  };

  // Create new round
  const createNewRound = async (type: "group" | "knockout" | "regular") => {
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/rounds`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          name: `Nova ${
            type === "group"
              ? "Fase de Grupos"
              : type === "knockout"
              ? "Eliminatória"
              : "Jornada"
          }`,
        }),
      });

      const data = await response.json();
      setRounds([...rounds, data.round]);
      toast(
        `Nova ${
          type === "group"
            ? "fase de grupos"
            : type === "knockout"
            ? "eliminatória"
            : "jornada"
        } criada`
      );
    } catch (error) {
      console.error("Error creating round:", error);
      toast("Não foi possível criar a jornada");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium flex items-center">
          <Trophy className="mr-2 h-5 w-5" />
          Jogos do Torneio
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
            variant={viewMode === "rounds" ? "default" : "outline"}
            onClick={() => setViewMode("rounds")}
            size="sm"
          >
            <Grid className="mr-2 h-4 w-4" />
            Jornadas
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Criar Jogo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Criar Novo Jogo</DialogTitle>
                <DialogDescription>
                  Preencha os detalhes do jogo. Todos os campos são
                  obrigatórios.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="round" className="text-right">
                    Jornada
                  </Label>
                  <Select
                    value={matchForm.round}
                    onValueChange={(value) =>
                      setMatchForm({ ...matchForm, round: value })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione a jornada" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Jornadas/Fases</SelectLabel>
                        {rounds.map((round) => (
                          <SelectItem key={round.id} value={round.id}>
                            Jornada {round.number}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="homeTeam" className="text-right">
                    Equipa Casa
                  </Label>
                  <Select
                    value={matchForm.homeTeam}
                    onValueChange={(value) =>
                      setMatchForm({ ...matchForm, homeTeam: value })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione a equipa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Equipas</SelectLabel>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            <div className="flex items-center gap-2">
                              <Image
                                width={16}
                                height={16}
                                src={team.club.logo}
                                alt={team.club.name}
                                className="h-4 w-4"
                              />
                              {team.club.name}
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
                    value={matchForm.awayTeam}
                    onValueChange={(value) =>
                      setMatchForm({ ...matchForm, awayTeam: value })
                    }
                    disabled={!matchForm.homeTeam}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione a equipa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Equipas</SelectLabel>
                        {teams
                          .filter((team) => team.id !== matchForm.homeTeam)
                          .map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              <div className="flex items-center gap-2">
                                <Image
                                  width={16}
                                  height={16}
                                  src={team.club.logo}
                                  alt={team.club.name}
                                  className="h-4 w-4"
                                />
                                {team.club.name}
                              </div>
                            </SelectItem>
                          ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">
                    Data
                  </Label>
                  <Input
                    type="date"
                    id="date"
                    value={matchForm.date}
                    onChange={(e) =>
                      setMatchForm({ ...matchForm, date: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="time" className="text-right">
                    Hora
                  </Label>
                  <Input
                    type="time"
                    id="time"
                    value={matchForm.time}
                    onChange={(e) =>
                      setMatchForm({ ...matchForm, time: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="stadium" className="text-right">
                    Estádio
                  </Label>
                  <Input
                    id="stadium"
                    value={matchForm.stadium}
                    onChange={(e) =>
                      setMatchForm({ ...matchForm, stadium: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="referee" className="text-right">
                    Árbitro
                  </Label>
                  <Input
                    id="referee"
                    value={matchForm.referee}
                    onChange={(e) =>
                      setMatchForm({ ...matchForm, referee: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetMatchForm();
                  }}
                  disabled={isLoading.saving}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={createManualMatch}
                  disabled={
                    !matchForm.round ||
                    !matchForm.homeTeam ||
                    !matchForm.awayTeam ||
                    !matchForm.date ||
                    !matchForm.time ||
                    isLoading.saving
                  }
                >
                  {isLoading.saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <PlusCircle className="mr-2 h-4 w-4" />
                  )}
                  Criar Jogo
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            variant="secondary"
            size="sm"
            onClick={generateAutomaticMatches}
            disabled={isLoading.generating || teams.length < 2}
          >
            {isLoading.generating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Gerar Jogos
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configurações de Jornadas</DialogTitle>
                <DialogDescription>
                  Gerir jornadas e fases do torneio
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => createNewRound("regular")}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nova Jornada
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => createNewRound("group")}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Fase de Grupos
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => createNewRound("knockout")}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Eliminatórias
                  </Button>
                </div>

                <ScrollArea className="h-64 rounded-md border p-4">
                  <h4 className="text-sm font-medium mb-2">
                    Jornadas Existentes
                  </h4>
                  <div className="space-y-2">
                    {rounds.map((round) => (
                      <div
                        key={round.id}
                        className="flex items-center justify-between p-2 hover:bg-muted/50 rounded"
                      >
                        <span>Jornada {round.number}</span>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading.matches ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : viewMode === "list" ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Jornada</TableHead>
              <TableHead>Casa</TableHead>
              <TableHead>Fora</TableHead>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Estádio</TableHead>
              <TableHead>Árbitro</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rounds.flatMap((round) =>
              round.matches.map((match) => (
                <TableRow key={match.id}>
                  <TableCell className="font-medium">
                    Jornada {round.number}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Image
                        width={24}
                        height={24}
                        src={match.homeTeam.club.logo}
                        alt={match.homeTeam.club.name}
                        className="h-6 w-6"
                      />
                      {match.homeTeam.club.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Image
                        width={24}
                        height={24}
                        src={match.awayTeam.club.logo}
                        alt={match.awayTeam.club.name}
                        className="h-6 w-6"
                      />
                      {match.awayTeam.club.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(match.dateTime), "dd-MM-yyyy")}{" "}
                    {format(new Date(match.dateTime), "HH:mm")}
                  </TableCell>
                  <TableCell>{match.venue.name || "-"}</TableCell>
                  <TableCell>{match.referee.name || "-"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {rounds.flatMap((r) => r.matches).length === 0 && (
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
        <Tabs
          value={currentRound || (rounds.length > 0 ? rounds[0].id : "")}
          onValueChange={setCurrentRound}
          className="w-full"
        >
          <div className="flex justify-between items-center mb-4">
            <TabsList className="overflow-x-auto">
              {rounds.map((round) => (
                <TabsTrigger key={round.id} value={round.id}>
                  Jornada {round.number}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {rounds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
              <Trophy className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground mb-2">
                Nenhuma jornada criada
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Crie jornadas e adicione jogos para começar
              </p>
              <Button onClick={() => createNewRound("regular")}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Criar Jornada
              </Button>
            </div>
          ) : (
            rounds.map((round) => (
              <TabsContent
                key={round.id}
                value={round.id}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {round.matches.length > 0 ? (
                    round.matches.map((match) => (
                      <div
                        key={match.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            Jornada {round.number}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(match.dateTime), "dd-MM-yyyy")}{" "}
                            {format(new Date(match.dateTime), "HH:mm")}
                          </span>
                        </div>

                        <div className="flex items-center justify-between py-2">
                          <div className="flex items-center gap-3 flex-1">
                            <Image
                              width={40}
                              height={40}
                              src={match.homeTeam.club.logo}
                              alt={match.homeTeam.club.name}
                              className="h-10 w-10"
                            />
                            <span className="font-medium">
                              {match.homeTeam.club.name}
                            </span>
                          </div>
                          <div className="px-4 font-medium">vs</div>
                          <div className="flex items-center gap-3 flex-1 justify-end text-right">
                            <span className="font-medium">
                              {match.awayTeam.club.name}
                            </span>
                            <Image
                              width={40}
                              height={40}
                              src={match.awayTeam.club.logo}
                              alt={match.awayTeam.club.name}
                              className="h-10 w-10"
                            />
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t flex justify-between items-center">
                          <div className="text-sm text-muted-foreground">
                            {match.venue && (
                              <div className="flex items-center gap-2">
                                <span>🏟️ {match.venue.name}</span>
                              </div>
                            )}
                            {match.referee && (
                              <div className="flex items-center gap-2 mt-1">
                                <span>👤 {match.referee.name}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
                      <Play className="h-10 w-10 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium text-muted-foreground mb-2">
                        Nenhum jogo nesta jornada
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Adicione jogos manualmente ou gere automaticamente
                      </p>
                      <Button onClick={() => setIsDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Adicionar Jogo
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            ))
          )}
        </Tabs>
      )}
    </div>
  );
}
