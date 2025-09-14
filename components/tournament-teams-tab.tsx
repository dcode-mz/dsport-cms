"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Search, X, PlusCircle, Users, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Tournament } from "@/app/types/tournament";
import Image from "next/image";

type Team = {
  id: string;
  name: string;
  club: {
    name: string;
    logo: string;
  };
};

export function TeamsTab({
  tournament,
  availableTournamentTeams,
}: {
  tournament: Tournament;
  availableTournamentTeams: Team[];
}) {
  // const { toast } = useToast();
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<Team[]>(
    tournament.seasons[0].teams
  );
  const [currentTeams, setCurrentTeams] = useState<Team[]>(
    tournament.seasons[0].teams ?? []
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState({
    current: false,
    available: false,
    saving: false,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Busca equipas disponíveis quando o modal abre ou quando o termo de pesquisa muda
  useEffect(() => {
    if (isDialogOpen) {
      fetchAvailableTeams();
    }
  }, [isDialogOpen, searchTerm]);

  const fetchAvailableTeams = async () => {
    setIsLoading((prev) => ({ ...prev, available: true }));
    try {
      setAvailableTeams(
        availableTournamentTeams.filter(
          (team: Team) =>
            !selectedTeams.some((selected) => selected.id === team.id)
        )
      );
    } catch (error) {
      console.error("Error fetching available teams:", error);
      toast("Não foi possível carregar as equipas disponíveis");
    } finally {
      setIsLoading((prev) => ({ ...prev, available: false }));
    }
  };

  const handleAddTeam = (team: Team) => {
    setSelectedTeams([...selectedTeams, team]);
    setAvailableTeams(availableTeams.filter((t) => t.id !== team.id));
  };

  const handleRemoveTeam = (teamId: string) => {
    const removedTeam = selectedTeams.find((t) => t.id === teamId);
    if (removedTeam) {
      setSelectedTeams(selectedTeams.filter((t) => t.id !== teamId));
      setAvailableTeams([...availableTeams, removedTeam]);
    }
  };

  // 3. Endpoint para adicionar as equipas selecionadas no torneio
  const saveTeams = async () => {
    setIsLoading((prev) => ({ ...prev, saving: true }));
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/tournament/${tournament.id}/teams`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            teamIds: selectedTeams.map((t) => t.id),
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to save teams");

      const updatedTeams = await response.json();
      setCurrentTeams(updatedTeams.teams);
      toast("Equipas do torneio atualizadas com sucesso");
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving teams:", error);
      toast("Não foi possível atualizar as equipas do torneio");
    } finally {
      setIsLoading((prev) => ({ ...prev, saving: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium flex items-center">
          <Users className="mr-2 h-5 w-5" />
          Equipas Participantes ({currentTeams.length})
        </h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={isLoading.current}>
              {isLoading.current ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PlusCircle className="mr-2 h-4 w-4" />
              )}
              Gerir Equipas
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Gerir Equipas do Torneio</DialogTitle>
              <DialogDescription>
                {selectedTeams.length} equipas selecionadas (
                {currentTeams.length} já no torneio)
              </DialogDescription>
            </DialogHeader>

            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar equipas..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isLoading.available}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Equipas Disponíveis ({availableTeams.length})
                  {isLoading.available && (
                    <Loader2 className="ml-2 h-3 w-3 animate-spin inline" />
                  )}
                </h4>
                <ScrollArea className="h-96 rounded-md border">
                  {availableTeams.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      {searchTerm
                        ? "Nenhum resultado encontrado"
                        : "Nenhuma equipa disponível"}
                    </div>
                  ) : (
                    <div className="divide-y">
                      {availableTeams.map((team) => (
                        <div
                          key={team.id}
                          className="p-3 flex items-center justify-between hover:bg-muted/50"
                        >
                          <div className="flex items-center space-x-3">
                            <Image
                              src={
                                team.club.logo || "/default-club-picture.png"
                              }
                              alt={team.name}
                              width={32}
                              height={32}
                              className="h-8 w-8 rounded-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "/default-team-logo.png";
                              }}
                            />
                            <div>
                              <p className="font-medium">{team.name}</p>
                              {/* {team.country && (
                                <p className="text-xs text-muted-foreground">
                                  {team.country}
                                </p>
                              )} */}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddTeam(team)}
                            disabled={selectedTeams.some(
                              (t) => t.id === team.id
                            )}
                          >
                            <PlusCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">
                  Equipas Selecionadas ({selectedTeams.length})
                </h4>
                <ScrollArea className="h-96 rounded-md border">
                  {selectedTeams.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      Nenhuma equipa selecionada
                    </div>
                  ) : (
                    <div className="divide-y">
                      {selectedTeams.map((team) => (
                        <div
                          key={team.id}
                          className="p-3 flex items-center justify-between hover:bg-muted/50"
                        >
                          <div className="flex items-center space-x-3">
                            <Image
                              src={
                                team.club.logo || "/default-club-picture.png"
                              }
                              alt={team.name}
                              width={32}
                              height={32}
                              className="h-8 w-8 rounded-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "/default-club-picture.png";
                              }}
                            />
                            <div>
                              <p className="font-medium">{team.name}</p>
                              {/* {team.country && (
                                <p className="text-xs text-muted-foreground">
                                  {team.country}
                                </p>
                              )} */}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveTeam(team.id)}
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setSelectedTeams(currentTeams); // Reseta para as equipas atuais
                }}
                disabled={isLoading.saving}
              >
                Cancelar
              </Button>
              <Button
                onClick={saveTeams}
                disabled={selectedTeams.length === 0 || isLoading.saving}
              >
                {isLoading.saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                {selectedTeams.length > currentTeams.length
                  ? "Adicionar Equipas"
                  : selectedTeams.length < currentTeams.length
                  ? "Remover Equipas"
                  : "Atualizar Equipas"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Visualização das equipas atuais no torneio */}
      {isLoading.current ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : currentTeams.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {currentTeams.map((team) => (
            <div
              key={team.id}
              className="border rounded-lg p-4 flex items-center space-x-3 hover:bg-muted/50"
            >
              <Image
                src={
                  team.club.logo || "/default-club-picture.png"
                }
                alt={team.name}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "/default-club-picture.png";
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{team.name}</p>
                {/* {team.country && (
                  <p className="text-sm text-muted-foreground truncate">
                    {team.country}
                  </p>
                )} */}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
          <Users className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground mb-2">
            Nenhuma equipa no torneio
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Adicione equipas para começar a configurar o torneio
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Equipas
          </Button>
        </div>
      )}
    </div>
  );
}
