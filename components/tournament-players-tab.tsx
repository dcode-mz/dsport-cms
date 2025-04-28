// components/tournament-players-tab.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Check,
  X,
  Users,
  Loader2,
  Shirt,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Tournament } from "@/app/types/tournament";
import Image from "next/image";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { ResponseBody } from "@/app/types/response-body";
import { format } from "date-fns";

type Team = {
  id: string;
  name: string;
  club: {
    name: string;
    logo: string;
  };
  playersRegistered?: boolean;
};

interface Player {
  id: string;
  name: string;
  preferredNumber?: number;
  dateOfBirth: Date;
  photoUrl: string;
  primaryNationality: {
    select: {
      name: string;
      logo: string;
    };
  };
  preferredPosition: {
    name: string;
    code: string;
  };
  isRegistered: boolean;
}

interface PlayersTeam {
  id: string;
  name: string;
  customName: string;
  club: {
    name: string;
    logo: string;
  };
  players: Player[];
}

export function PlayersTab({ tournament }: { tournament: Tournament }) {
  const [teams, setTeams] = useState<Team[]>(tournament.seasons[0].teams || []);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState({
    players: false,
    saving: false,
  });

  useEffect(() => {
    setTeams((prevTeams) =>
      prevTeams.map((team) =>
        team.playersRegistered ? { ...team, playersRegistered: true } : team
      )
    );
  }, []);

  // Buscar jogadores quando uma equipa é selecionada
  useEffect(() => {
    if (selectedTeam) {
      fetchPlayers(selectedTeam.id);
    }
  }, [selectedTeam]);

  const fetchPlayers = async (teamId: string) => {
    setIsLoading((prev) => ({ ...prev, players: true }));
    try {
      const response = await fetch(
        `http://localhost:4000/team/${teamId}/players`
      );
      const data: ResponseBody<PlayersTeam> = await response.json();

      const tournamentSeason = tournament.seasons.findLast(
        (t) => t.isCurrent && t.id
      );

      const responseRegisteredPlayers = await fetch(
        `http://localhost:4000/tournament/${tournamentSeason?.id}/teams/${teamId}/players`
      );

      const dataRegisteredPlayers = await responseRegisteredPlayers.json();

      setPlayers(
        data.payload.players.map((p) => ({
          ...p,
          isRegistered: dataRegisteredPlayers.payload.players.some(
            (rp: string) => rp === p.id
          ),
        }))
      );

      // setTeams((prev) =>
      //   prev.map((team) =>
      //     team.id === teamId
      //       ? {
      //           ...team,
      //           playersRegistered:
      //             dataRegisteredPlayers.payload.players.length > 0,
      //         }
      //       : team
      //   )
      // );
    } catch (error) {
      console.error("Error fetching players:", error);
      toast.error("Não foi possível carregar os jogadores");
    } finally {
      setIsLoading((prev) => ({ ...prev, players: false }));
    }
  };

  const handlePlayerRegistration = (playerId: string, registered: boolean) => {
    setPlayers(
      players.map((player) =>
        player.id === playerId
          ? { ...player, isRegistered: registered }
          : player
      )
    );
  };

  const handleNumberChange = (playerId: string, number: number) => {
    setPlayers(
      players.map((player) =>
        player.id === playerId ? { ...player, preferredNumber: number } : player
      )
    );
  };

  const savePlayers = async () => {
    if (!selectedTeam) return;

    setIsLoading((prev) => ({ ...prev, saving: true }));
    try {
      // Filtrar apenas jogadores registrados
      const registeredPlayers = players
        .filter((p) => p.isRegistered)
        .map(({ id, name, preferredNumber }) => ({
          id,
          name,
          number: preferredNumber,
        }));

      const tournamentSeasonId = tournament.seasons.findLast(
        (t) => t.isCurrent && t.id
      )?.id;
      // Chamada à API para salvar
      const response = await fetch(
        `http://localhost:4000/tournament/${tournamentSeasonId}/teams/${selectedTeam.id}/players`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            players: registeredPlayers,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to save players");

      // Atualizar estado para marcar a equipa como registrada
      setTeams(
        teams.map((team) =>
          team.id === selectedTeam.id
            ? { ...team, playersRegistered: true }
            : team
        )
      );

      toast.success("Jogadores registrados com sucesso");
    } catch (error) {
      console.error("Error saving players:", error);
      toast.error("Não foi possível registrar os jogadores");
    } finally {
      setIsLoading((prev) => ({ ...prev, saving: false }));
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium flex items-center">
          <Shirt className="mr-2 h-5 w-5" />
          Registro de Jogadores
        </h3>
      </div>

      <div className="flex flex-1 gap-6">
        {/* Lista de equipas à esquerda */}
        <div className="w-1/4 border-r pr-4">
          <div className="space-y-2">
            {teams.map((team) => (
              <div
                key={team.id}
                className={`p-3 rounded-lg cursor-pointer flex items-center justify-between ${
                  selectedTeam?.id === team.id
                    ? "bg-muted"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => setSelectedTeam(team)}
              >
                <div className="flex items-center space-x-3 truncate">
                  <Image
                    src={team.club.logo || "/default-club-picture.png"}
                    alt={team.name}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                  <div className="truncate">
                    <p className="font-medium truncate">{team.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {team.club.name}
                    </p>
                  </div>
                </div>
                {team.playersRegistered ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Detalhes dos jogadores à direita */}
        <div className="flex-1">
          {selectedTeam ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Image
                    src={selectedTeam.club.logo || "/default-club-picture.png"}
                    alt={selectedTeam.name}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-medium">{selectedTeam.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedTeam.club.name}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={savePlayers}
                  disabled={selectedTeam.playersRegistered || isLoading.saving}
                >
                  {isLoading.saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  {selectedTeam.playersRegistered
                    ? "Registro Confirmado"
                    : "Confirmar Registro"}
                </Button>
              </div>

              {isLoading.players ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Reg.</TableHead>
                      <TableHead>Foto</TableHead>
                      <TableHead className="w-[100px]">Número</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Data Nasc.</TableHead>
                      <TableHead>Posição</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {players.length > 0 ? (
                      players.map((player) => (
                        <TableRow key={player.id}>
                          <TableCell>
                            <Input
                              type="checkbox"
                              checked={!!player.isRegistered}
                              onChange={(e) =>
                                handlePlayerRegistration(
                                  player.id,
                                  e.target.checked
                                )
                              }
                              className="h-4 w-4"
                            />
                          </TableCell>
                          <TableCell>
                            <Image
                              src={
                                player.photoUrl || "/default-player-picture.png"
                              }
                              alt={player.name}
                              width={40}
                              height={40}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          </TableCell>
                          <TableCell>
                            {player.isRegistered ? (
                              <Input
                                type="number"
                                min="1"
                                max="99"
                                value={player.preferredNumber || ""}
                                onChange={(e) =>
                                  handleNumberChange(
                                    player.id,
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="w-20"
                              />
                            ) : (
                              <span>-</span>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {player.name}
                          </TableCell>
                          <TableCell>
                            {format(
                              new Date(player.dateOfBirth),
                              "dd-MM-yyyy"
                            ) || "-"}
                          </TableCell>
                          <TableCell>
                            {player.preferredPosition.code || "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-muted-foreground"
                        >
                          Nenhum jogador encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Users className="h-10 w-10 mb-4" />
              <p>Selecione uma equipa para ver e registrar os jogadores</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
