"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Play,
  Pause,
  Plus,
  Minus,
  Shirt,
  RotateCcw,
  Goal,
  SquareEqual,
  CircleX,
  Replace,
  SquareRoundCorner,
  Flag,
  AlertCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import { useRouter } from "next/navigation";

type MatchPhase =
  | "NOT_STARTED"
  | "FIRST_HALF"
  | "FIRST_HALF_ADDED_TIME"
  | "HALF_TIME"
  | "SECOND_HALF"
  | "SECOND_HALF_ADDED_TIME"
  | "FULL_TIME"
  | "FIRST_EXTRA_TIME"
  | "FIRST_EXTRA_ADDED_TIME"
  | "EXTRA_TIME_HALF_TIME"
  | "SECOND_EXTRA_TIME"
  | "SECOND_EXTRA_ADDED_TIME"
  | "PENALTIES";

type EventType = {
  id: string;
  name: string;
};

type Player = {
  id: string;
  name: string;
  team: {
    id: string;
    club: {
      id: string;
      name: string;
    };
  };
};

type MatchEventPlayer = {
  id: string;
  player: Player;
  role: string;
};

type MatchEvent = {
  id: string;
  type: {
    id: string;
    name: string;
  };
  time: number;
  details: string;
  players: MatchEventPlayer[];
};

type Team = {
  id: string;
  name: string;
  club: {
    id: string;
    name: string;
    logo: string;
  };
  players: Player[];
};

type Match = {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  matchStats: {
    homeScore: number;
    awayScore: number;
    extraTimeHomeScore: number;
    extraTimeAwayScore: number;
    penaltyHomeScore: number;
    penaltyAwayScore: number;
  };
  events: MatchEvent[];
};

type MatchLiveProps = {
  match: Match;
  // onMatchUpdate: (updatedMatch: Match) => void;
  eventTypes: EventType[];
};

export function MatchLive({
  match,
  // onMatchUpdate,
  eventTypes,
}: MatchLiveProps) {
  // Estado do temporizador
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [addedTime, setAddedTime] = useState(0);
  const [phase, setPhase] = useState<MatchPhase>("NOT_STARTED");
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Estado para eventos
  const [activeEvent, setActiveEvent] = useState<{
    type: string | null;
    team: "home" | "away" | null;
    playerId: string | null;
    assistId: string | null;
    outPlayerId: string | null;
  }>({
    type: null,
    team: null,
    playerId: null,
    assistId: null,
    outPlayerId: null,
  });

  // Constantes de tempo
  const FIRST_HALF_DURATION = 45 * 60;
  const SECOND_HALF_DURATION = 90 * 60;
  const FIRST_EXTRA_DURATION = 105 * 60;
  const SECOND_EXTRA_DURATION = 120 * 60;

  // Limpar timer ao desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Timer effect - corrigido para não reiniciar o componente
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTotalSeconds((prev) => {
          const newTime = prev + 1;
          checkPhaseTransition(newTime);
          return newTime;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  // Verifica transições de fase
  const checkPhaseTransition = useCallback(
    (time: number) => {
      switch (phase) {
        case "FIRST_HALF":
          if (time >= FIRST_HALF_DURATION) {
            setPhase("FIRST_HALF_ADDED_TIME");
          }
          break;
        case "SECOND_HALF":
          if (time >= SECOND_HALF_DURATION) {
            setPhase("SECOND_HALF_ADDED_TIME");
          }
          break;
        case "FIRST_EXTRA_TIME":
          if (time >= FIRST_EXTRA_DURATION) {
            setPhase("FIRST_EXTRA_ADDED_TIME");
          }
          break;
        case "SECOND_EXTRA_TIME":
          if (time >= SECOND_EXTRA_DURATION) {
            setPhase("SECOND_EXTRA_ADDED_TIME");
          }
          break;
        default:
          break;
      }
    },
    [phase]
  );

  // Funções de controle do temporizador
  const startTimer = () => setIsRunning(true);
  const pauseTimer = () => setIsRunning(false);
  const resetTimer = () => {
    pauseTimer();
    setTotalSeconds(0);
    setAddedTime(0);
    setPhase("NOT_STARTED");
  };

  // Funções de transição de fase
  const startFirstHalf = () => {
    setPhase("FIRST_HALF");
    setTotalSeconds(0);
    setAddedTime(0);
    startTimer();
    createEvent("INICIO_PRIMEIRO_TEMPO", "home", "", []);
  };

  const endFirstHalf = () => {
    pauseTimer();
    setPhase("HALF_TIME");
    setTotalSeconds(FIRST_HALF_DURATION); // Fixa em 45:00
    setAddedTime(0); // Remove acréscimos
    createEvent("FIM_PRIMEIRO_TEMPO", "home", "", []);
  };

  const startSecondHalf = () => {
    setPhase("SECOND_HALF");
    setTotalSeconds(FIRST_HALF_DURATION); // Começa a contar a partir de 45:00
    setAddedTime(0);
    startTimer();
    createEvent("INICIO_SEGUNDO_TEMPO", "home", "", []);
  };

  const endSecondHalf = () => {
    pauseTimer();
    setPhase("FULL_TIME");
    setTotalSeconds(SECOND_HALF_DURATION); // Fixa em 90:00
    setAddedTime(0); // Remove acréscimos
    createEvent("FIM_SEGUNDO_TEMPO", "home", "", []);

    // Verifica se precisa de prorrogação
    if (match.matchStats.homeScore === match.matchStats.awayScore) {
      setTimeout(() => {
        startExtraTime();
      }, 2000);
    }
  };

  const startExtraTime = () => {
    setPhase("FIRST_EXTRA_TIME");
    setTotalSeconds(SECOND_HALF_DURATION); // Começa a contar a partir de 90:00
    setAddedTime(0);
    startTimer();
    createEvent("INICIO_TEMPO_EXTRA", "home", "", []);
  };

  const endFirstExtraTime = () => {
    pauseTimer();
    setPhase("EXTRA_TIME_HALF_TIME");
    setTotalSeconds(FIRST_EXTRA_DURATION); // Fixa em 105:00
    setAddedTime(0); // Remove acréscimos
    createEvent("FIM_PRIMEIRO_TEMPO_EXTRA", "home", "", []);
  };

  const startSecondExtraTime = () => {
    setPhase("SECOND_EXTRA_TIME");
    setTotalSeconds(FIRST_EXTRA_DURATION); // Começa a contar a partir de 105:00
    setAddedTime(0);
    startTimer();
    createEvent("INICIO_SEGUNDO_TEMPO_EXTRA", "home", "", []);
  };

  const endMatch = () => {
    pauseTimer();
    setPhase("PENALTIES");
    createEvent("FIM_SEGUNDO_TEMPO_EXTRA", "home", "", []);
  };

  const addExtraTime = (minutes: number) => {
    setAddedTime(minutes);
    createEvent("TEMPO_EXTRA_ADICIONADO", "home", "", []);
  };

  // Formatação do tempo de exibição
  const formatTime = () => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (phase === "PENALTIES") {
      return `Penáltis ${match.matchStats.penaltyHomeScore}-${match.matchStats.penaltyAwayScore}`;
    }

    // Mostra tempo fixo quando não está em andamento
    if (phase === "HALF_TIME") return "45:00";
    if (phase === "FULL_TIME") return "90:00";
    if (phase === "EXTRA_TIME_HALF_TIME") return "105:00";

    // Mostra acréscimos como "45+X" quando aplicável
    if (
      (phase === "FIRST_HALF_ADDED_TIME" ||
        phase === "SECOND_HALF_ADDED_TIME" ||
        phase === "FIRST_EXTRA_ADDED_TIME" ||
        phase === "SECOND_EXTRA_ADDED_TIME") &&
      addedTime > 0
    ) {
      const baseTime =
        phase === "FIRST_HALF_ADDED_TIME"
          ? 45
          : phase === "SECOND_HALF_ADDED_TIME"
          ? 90
          : phase === "FIRST_EXTRA_ADDED_TIME"
          ? 105
          : 120;

      return `${baseTime}+${minutes - baseTime}`;
    }

    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const getPhaseName = () => {
    switch (phase) {
      case "NOT_STARTED":
        return "Jogo não iniciado";
      case "FIRST_HALF":
        return "1º Tempo";
      case "FIRST_HALF_ADDED_TIME":
        return "1º Tempo - Acréscimos";
      case "HALF_TIME":
        return "Intervalo";
      case "SECOND_HALF":
        return "2º Tempo";
      case "SECOND_HALF_ADDED_TIME":
        return "2º Tempo - Acréscimos";
      case "FULL_TIME":
        return "Fim de Jogo";
      case "FIRST_EXTRA_TIME":
        return "Prorrogação - 1º Tempo";
      case "FIRST_EXTRA_ADDED_TIME":
        return "Prorrogação - Acréscimos 1T";
      case "EXTRA_TIME_HALF_TIME":
        return "Intervalo Prorrogação";
      case "SECOND_EXTRA_TIME":
        return "Prorrogação - 2º Tempo";
      case "SECOND_EXTRA_ADDED_TIME":
        return "Prorrogação - Acréscimos 2T";
      case "PENALTIES":
        return "Disputa de Penáltis";
      default:
        return "";
    }
  };

  // Função para criar eventos adaptada ao seu formato
  const createEvent = async (
    eventTypeName: string,
    team: "home" | "away",
    playerId: string,
    matchEventPlayers: Array<{ playerId: string; role: string }>
  ) => {
    try {
      const eventType = eventTypes.find((et) => et.name === eventTypeName);
      if (!eventType) {
        console.error("Tipo de evento não encontrado:", eventTypeName);
        return;
      }

      const minute = Math.floor(totalSeconds / 60);
      const extraTime = addedTime > 0 ? addedTime : undefined;
      const displayTime = extraTime ? +`${minute}+${extraTime}` : minute;

      // Prepara os jogadores do evento no formato correto
      const players: MatchEventPlayer[] = matchEventPlayers.map((player) => {
        const teamData = team === "home" ? match.homeTeam : match.awayTeam;
        const playerData = teamData.players.find(
          (p) => p.id === player.playerId
        ) || {
          id: player.playerId,
          name: "Desconhecido",
          team: team === "home" ? match.homeTeam : match.awayTeam,
        };

        return {
          id: player.playerId,
          player: playerData,
          role: player.role,
        };
      });

      const newEvent: MatchEvent = {
        id: Date.now().toString(),
        type: {
          id: eventType.id,
          name: eventType.name,
        },
        time: displayTime,
        details: getEventDescription(eventTypeName, team, playerId),
        players,
      };
      console.log("Novo evento:", newEvent);
      // Atualiza o estado local
      const updatedMatch = {
        ...match,
        events: [...match.events, newEvent],
      };

      // Atualiza estatísticas se for gol
      if (["GOL", "PENALTI_GOL"].includes(eventTypeName)) {
        if (phase.includes("EXTRA")) {
          if (team === "home") updatedMatch.matchStats.extraTimeHomeScore += 1;
          else updatedMatch.matchStats.extraTimeAwayScore += 1;
        } else {
          if (team === "home") updatedMatch.matchStats.homeScore += 1;
          else updatedMatch.matchStats.awayScore += 1;
        }
      } else if (eventTypeName === "PENALTI_GOL" && phase === "PENALTIES") {
        if (team === "home") updatedMatch.matchStats.penaltyHomeScore += 1;
        else updatedMatch.matchStats.penaltyAwayScore += 1;
      }

      await fetch("http://localhost:4000/match-events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          typeId: eventType.id,
          matchId: match.id,
          time: displayTime,
          details: getEventDescription(eventTypeName, team, playerId),
          players: players.map((player) => ({
            playerId: player.id,
            role: player.role,
          })),
        }),
      });
      router.refresh();
      // onMatchUpdate(updatedMatch);
      return newEvent;
    } catch (error) {
      console.error("Erro ao criar evento:", error);
      toast.error("Erro ao registrar evento");
    }
  };

  const getEventDescription = (
    type: string,
    team: "home" | "away",
    playerId: string
  ) => {
    const teamData = team === "home" ? match.homeTeam : match.awayTeam;
    const player = teamData.players.find((p) => p.id === playerId);

    switch (type) {
      case "GOL":
        return `Golo de ${player?.name || "Desconhecido"}`;
      case "CARTAO_AMARELO":
        return `Cartão amarelo para ${player?.name || "Desconhecido"}`;
      case "CARTAO_VERMELHO":
        return `Cartão vermelho para ${player?.name || "Desconhecido"}`;
      case "SUBSTITUICAO":
        return `Substituição: ${player?.name || "Desconhecido"}`;
      case "FALTA":
        return `Falta cometida por ${player?.name || "Desconhecido"}`;
      case "PENALTI_GOL":
        return `Pênalti marcado por ${player?.name || "Desconhecido"}`;
      case "OFFSIDE":
        return `Impedimento de ${player?.name || "Desconhecido"}`;
      case "CORNER":
        return `Escanteio marcado por ${player?.name || "Desconhecido"}`;
      case "FREE_KICK":
        return `Livre marcado por ${player?.name || "Desconhecido"}`;
      default:
        return `Evento registrado para ${player?.name || "Desconhecido"}`;
    }
  };

  // Componentes da UI
  const TimerDisplay = () => (
    <div className="flex flex-col items-center gap-2">
      <div className="text-5xl font-bold">{formatTime()}</div>
      <div className="text-lg font-medium">{getPhaseName()}</div>
      {addedTime > 0 && (
        <div className="text-sm text-muted-foreground">
          Acréscimos: +{addedTime} min
        </div>
      )}
    </div>
  );

  const TimerControls = () => (
    <div className="flex items-center justify-center gap-4">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setTotalSeconds((prev) => Math.max(0, prev - 60))}
        disabled={phase === "NOT_STARTED" || phase === "PENALTIES"}
      >
        <Minus className="h-4 w-4" />
      </Button>

      <Button
        variant={isRunning ? "default" : "outline"}
        onClick={() => (isRunning ? pauseTimer() : startTimer())}
        disabled={
          phase === "NOT_STARTED" ||
          phase === "HALF_TIME" ||
          phase === "FULL_TIME" ||
          phase === "EXTRA_TIME_HALF_TIME"
        }
      >
        {isRunning ? (
          <>
            <Pause className="mr-2 h-4 w-4" />
            Pausar
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            Continuar
          </>
        )}
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={() => setTotalSeconds((prev) => prev + 60)}
        disabled={phase === "NOT_STARTED" || phase === "PENALTIES"}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );

  const AddExtraTimeButton = () => {
    const [minutes, setMinutes] = useState(1);

    return (
      <div className="flex items-center gap-2">
        <Select
          value={minutes.toString()}
          onValueChange={(value) => setMinutes(parseInt(value))}
        >
          <SelectTrigger className="w-20">
            <SelectValue placeholder="1" />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <SelectItem key={num} value={num.toString()}>
                {num}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={() => addExtraTime(minutes)}
          disabled={
            phase === "NOT_STARTED" ||
            phase === "HALF_TIME" ||
            phase === "FULL_TIME" ||
            phase === "EXTRA_TIME_HALF_TIME" ||
            phase === "PENALTIES"
          }
        >
          Adicionar Acréscimos
        </Button>
      </div>
    );
  };

  const PhaseControls = () => {
    switch (phase) {
      case "NOT_STARTED":
        return (
          <Button onClick={startFirstHalf}>
            <Play className="mr-2 h-4 w-4" />
            Iniciar 1º Tempo
          </Button>
        );
      case "FIRST_HALF":
      case "FIRST_HALF_ADDED_TIME":
        return <Button onClick={endFirstHalf}>Finalizar 1º Tempo</Button>;
      case "HALF_TIME":
        return (
          <Button onClick={startSecondHalf}>
            <Play className="mr-2 h-4 w-4" />
            Iniciar 2º Tempo
          </Button>
        );
      case "SECOND_HALF":
      case "SECOND_HALF_ADDED_TIME":
        return (
          <div className="flex gap-2">
            <Button onClick={endSecondHalf}>Finalizar Jogo</Button>
            {match.matchStats.homeScore === match.matchStats.awayScore && (
              <Button variant="secondary" onClick={startExtraTime}>
                Iniciar Prorrogação
              </Button>
            )}
          </div>
        );
      case "FULL_TIME":
        return (
          <Button onClick={startExtraTime}>
            <Play className="mr-2 h-4 w-4" />
            Iniciar Prorrogação
          </Button>
        );
      case "FIRST_EXTRA_TIME":
      case "FIRST_EXTRA_ADDED_TIME":
        return (
          <Button onClick={endFirstExtraTime}>
            Finalizar 1º Tempo Prorrogação
          </Button>
        );
      case "EXTRA_TIME_HALF_TIME":
        return (
          <Button onClick={startSecondExtraTime}>
            <Play className="mr-2 h-4 w-4" />
            Iniciar 2º Tempo Prorrogação
          </Button>
        );
      case "SECOND_EXTRA_TIME":
      case "SECOND_EXTRA_ADDED_TIME":
        return (
          <div className="flex gap-2">
            <Button onClick={endMatch}>Finalizar Jogo</Button>
            {match.matchStats.extraTimeHomeScore ===
              match.matchStats.extraTimeAwayScore && (
              <Button variant="secondary" onClick={() => setPhase("PENALTIES")}>
                Iniciar Penáltis
              </Button>
            )}
          </div>
        );
      case "PENALTIES":
        return (
          <Button variant="secondary" onClick={resetTimer}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reiniciar Temporizador
          </Button>
        );
      default:
        return null;
    }
  };

  // Componente para registrar eventos corrigido
  const EventForm = () => (
    <div className="grid grid-cols-2 gap-4">
      {/* Time da casa */}
      <Card>
        <CardHeader>
          <CardTitle>{match.homeTeam.name}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          {[
            "GOL",
            "CARTAO_AMARELO",
            "CARTAO_VERMELHO",
            "SUBSTITUICAO",
            "FALTA",
            "CORNER",
          ].map((type) => (
            <Button
              key={type}
              variant={
                activeEvent.type === type && activeEvent.team === "home"
                  ? "default"
                  : "outline"
              }
              onClick={() =>
                setActiveEvent({
                  type,
                  team: "home",
                  playerId: null,
                  assistId: null,
                  outPlayerId: null,
                })
              }
            >
              {type === "GOL" && <Goal className="mr-2 h-4 w-4" />}
              {type === "CARTAO_AMARELO" && (
                <SquareEqual className="mr-2 h-4 w-4 text-yellow-500" />
              )}
              {type === "CARTAO_VERMELHO" && (
                <CircleX className="mr-2 h-4 w-4 text-red-500" />
              )}
              {type === "SUBSTITUICAO" && <Replace className="mr-2 h-4 w-4" />}
              {type === "FALTA" && <Flag className="mr-2 h-4 w-4" />}
              {type === "CORNER" && (
                <SquareRoundCorner className="mr-2 h-4 w-4" />
              )}
              {type === "GOL"
                ? "Golo"
                : type === "CARTAO_AMARELO"
                ? "Amarelo"
                : type === "CARTAO_VERMELHO"
                ? "Vermelho"
                : type === "SUBSTITUICAO"
                ? "Substituição"
                : type === "FALTA"
                ? "Falta"
                : "Escanteio"}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Time visitante */}
      <Card>
        <CardHeader>
          <CardTitle>{match.awayTeam.name}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          {[
            "GOL",
            "CARTAO_AMARELO",
            "CARTAO_VERMELHO",
            "SUBSTITUICAO",
            "FALTA",
            "CORNER",
          ].map((type) => (
            <Button
              key={type}
              variant={
                activeEvent.type === type && activeEvent.team === "away"
                  ? "default"
                  : "outline"
              }
              onClick={() =>
                setActiveEvent({
                  type,
                  team: "away",
                  playerId: null,
                  assistId: null,
                  outPlayerId: null,
                })
              }
            >
              {type === "GOL" && <Goal className="mr-2 h-4 w-4" />}
              {type === "CARTAO_AMARELO" && (
                <SquareEqual className="mr-2 h-4 w-4 text-yellow-500" />
              )}
              {type === "CARTAO_VERMELHO" && (
                <CircleX className="mr-2 h-4 w-4 text-red-500" />
              )}
              {type === "SUBSTITUICAO" && <Replace className="mr-2 h-4 w-4" />}
              {type === "FALTA" && <Flag className="mr-2 h-4 w-4" />}
              {type === "CORNER" && (
                <SquareRoundCorner className="mr-2 h-4 w-4" />
              )}
              {type === "GOL"
                ? "Golo"
                : type === "CARTAO_AMARELO"
                ? "Amarelo"
                : type === "CARTAO_VERMELHO"
                ? "Vermelho"
                : type === "SUBSTITUICAO"
                ? "Substituição"
                : type === "FALTA"
                ? "Falta"
                : "Escanteio"}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Formulário do evento corrigido */}
      {activeEvent.type && activeEvent.team && (
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Registrar Evento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Jogador</Label>
              <Select
                value={activeEvent.playerId || ""}
                onValueChange={(value) =>
                  setActiveEvent((prev) => ({
                    ...prev,
                    playerId: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o jogador">
                    {activeEvent.playerId &&
                      (match[
                        activeEvent.team === "home" ? "homeTeam" : "awayTeam"
                      ].players.find((p) => p.id === activeEvent.playerId)
                        ?.name ||
                        "Selecione")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(activeEvent.team === "home"
                    ? match.homeTeam.players
                    : match.awayTeam.players
                  ).map((player) => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.name} ({10})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {activeEvent.type === "GOL" && activeEvent.playerId && (
              <div>
                <Label>Assistência (opcional)</Label>
                <Select
                  value={activeEvent.assistId || ""}
                  onValueChange={(value) =>
                    setActiveEvent((prev) => ({
                      ...prev,
                      assistId: value === "none" ? null : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o assistente">
                      {activeEvent.assistId &&
                        activeEvent.assistId !== "none" &&
                        (match[
                          activeEvent.team === "home" ? "homeTeam" : "awayTeam"
                        ].players.find((p) => p.id === activeEvent.assistId)
                          ?.name ||
                          "Selecione")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem assistência</SelectItem>
                    {(activeEvent.team === "home"
                      ? match.homeTeam.players
                      : match.awayTeam.players
                    )
                      .filter((player) => player.id !== activeEvent.playerId)
                      .map((player) => (
                        <SelectItem key={player.id} value={player.id}>
                          {player.name} ({10})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {activeEvent.type === "SUBSTITUICAO" && activeEvent.playerId && (
              <div>
                <Label>Jogador que sai</Label>
                <Select
                  value={activeEvent.outPlayerId || ""}
                  onValueChange={(value) =>
                    setActiveEvent((prev) => ({
                      ...prev,
                      outPlayerId: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o jogador">
                      {activeEvent.outPlayerId &&
                        (match[
                          activeEvent.team === "home" ? "homeTeam" : "awayTeam"
                        ].players.find((p) => p.id === activeEvent.outPlayerId)
                          ?.name ||
                          "Selecione")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(activeEvent.team === "home"
                      ? match.homeTeam.players
                      : match.awayTeam.players
                    )
                      .filter((player) => player.id !== activeEvent.playerId)
                      .map((player) => (
                        <SelectItem key={player.id} value={player.id}>
                          {player.name} ({player.team.club.name})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  setActiveEvent({
                    type: null,
                    team: null,
                    playerId: null,
                    assistId: null,
                    outPlayerId: null,
                  })
                }
              >
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  if (!activeEvent.playerId) {
                    toast.error("Selecione um jogador");
                    return;
                  }

                  if (
                    activeEvent.type === "SUBSTITUICAO" &&
                    !activeEvent.outPlayerId
                  ) {
                    toast.error("Selecione o jogador que sai");
                    return;
                  }

                  const matchEventPlayers = [];
                  matchEventPlayers.push({
                    playerId: activeEvent.playerId,
                    role:
                      activeEvent.type === "GOL"
                        ? "Autor do Gol"
                        : activeEvent.type === "SUBSTITUICAO"
                        ? "Jogador que entra"
                        : "Participante",
                  });

                  if (activeEvent.type === "GOL" && activeEvent.assistId) {
                    matchEventPlayers.push({
                      playerId: activeEvent.assistId,
                      role: "Assistente do Gol",
                    });
                  }

                  if (
                    activeEvent.type === "SUBSTITUICAO" &&
                    activeEvent.outPlayerId
                  ) {
                    matchEventPlayers.push({
                      playerId: activeEvent.outPlayerId,
                      role: "Jogador que sai",
                    });
                  }

                  await createEvent(
                    activeEvent.type!,
                    activeEvent.team,
                    activeEvent.playerId,
                    matchEventPlayers
                  );

                  setActiveEvent({
                    type: null,
                    team: null,
                    playerId: null,
                    assistId: null,
                    outPlayerId: null,
                  });

                  toast.success("Evento registrado com sucesso");
                }}
                disabled={
                  !activeEvent.playerId ||
                  (activeEvent.type === "SUBSTITUICAO" &&
                    !activeEvent.outPlayerId)
                }
              >
                Confirmar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Lista de eventos corrigida para seu formato
  const EventsList = () => (
    <Card>
      <CardHeader>
        <CardTitle>Linha do Tempo ({match.events.length} eventos)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {match.events.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Nenhum evento registrado ainda
          </div>
        ) : (
          [...match.events]
            .sort((a, b) => b.time - a.time)
            .map((event) => {
              // Eventos sem jogadores (como FIM_SEGUNDO_TEMPO)
              if (!event.players || event.players.length === 0) {
                return (
                  <div
                    key={event.id}
                    className="border rounded-lg p-3 text-center"
                  >
                    <div className="font-medium">
                      {event.time}
                      {typeof event.time === "number" && "'"}
                    </div>
                    <div className="mt-2 text-sm">{event.details}</div>
                  </div>
                );
              }

              // Eventos com jogadores
              const team =
                event.players[0]?.player.team.id === match.homeTeam.id
                  ? match.homeTeam
                  : match.awayTeam;
              const mainPlayer = event.players.find(
                (p) =>
                  p.role === "Autor do Gol" ||
                  p.role === "Participante" ||
                  p.role === "Jogador que entra"
              );
              const assistant = event.players.find(
                (p) => p.role === "Assistente do Gol"
              );
              const outPlayer = event.players.find(
                (p) => p.role === "Jogador que sai"
              );

              return (
                <div key={event.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {event.type.name === "GOL" && (
                        <Goal className="h-4 w-4 text-green-500" />
                      )}
                      {event.type.name === "CARTAO_AMARELO" && (
                        <SquareEqual className="h-4 w-4 text-yellow-500" />
                      )}
                      {event.type.name === "CARTAO_VERMELHO" && (
                        <CircleX className="h-4 w-4 text-red-500" />
                      )}
                      {event.type.name === "SUBSTITUICAO" && (
                        <Replace className="h-4 w-4 text-blue-500" />
                      )}
                      {event.type.name === "FALTA" && (
                        <Flag className="h-4 w-4 text-orange-500" />
                      )}
                      {event.type.name === "CORNER" && (
                        <SquareRoundCorner className="h-4 w-4 text-purple-500" />
                      )}
                      <span className="font-medium">
                        {event.time}
                        {typeof event.time === "number" && "'"}
                      </span>
                    </div>
                    {team && (
                      <div className="flex items-center gap-2">
                        <img
                          src={team.club.logo}
                          alt={team.name}
                          className="h-6 w-6"
                        />
                        <span className="text-sm">{team.name}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-sm">
                    {event.type.name === "GOL" && (
                      <span>
                        Golo de {mainPlayer?.player.name || "Desconhecido"}
                        {assistant &&
                          `, assistência de ${assistant.player.name}`}
                      </span>
                    )}
                    {event.type.name === "CARTAO_AMARELO" && (
                      <span>
                        Cartão amarelo para{" "}
                        {mainPlayer?.player.name || "Desconhecido"}
                      </span>
                    )}
                    {event.type.name === "CARTAO_VERMELHO" && (
                      <span>
                        Cartão vermelho para{" "}
                        {mainPlayer?.player.name || "Desconhecido"}
                      </span>
                    )}
                    {event.type.name === "SUBSTITUICAO" && (
                      <span>
                        Substituição: {outPlayer?.player.name || "Desconhecido"}{" "}
                        sai, {mainPlayer?.player.name || "Desconhecido"} entra
                      </span>
                    )}
                    {event.type.name === "FALTA" && (
                      <span>
                        Falta cometida por{" "}
                        {mainPlayer?.player.name || "Desconhecido"}
                      </span>
                    )}
                    {event.type.name === "CORNER" && (
                      <span>
                        Escanteio marcado por{" "}
                        {mainPlayer?.player.name || "Desconhecido"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Placar e temporizador */}
      <div className="grid grid-cols-3 items-center gap-4">
        {/* Time da casa */}
        <div className="flex flex-col items-center">
          <img
            src={match.homeTeam.club.logo}
            alt={match.homeTeam.name}
            className="h-20 w-20 mb-2"
          />
          <h2 className="text-xl font-bold">{match.homeTeam.name}</h2>
          <div className="text-3xl font-bold mt-2">
            {phase.includes("EXTRA")
              ? match.matchStats.extraTimeHomeScore
              : match.matchStats.homeScore}
          </div>
        </div>

        {/* Temporizador */}
        <div className="flex flex-col items-center gap-4">
          <TimerDisplay />
          <TimerControls />
          <div className="flex gap-2">
            <AddExtraTimeButton />
            <PhaseControls />
            <Button variant="outline" onClick={resetTimer}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reiniciar
            </Button>
          </div>
        </div>

        {/* Time visitante */}
        <div className="flex flex-col items-center">
          <img
            src={match.awayTeam.club.logo}
            alt={match.awayTeam.name}
            className="h-20 w-20 mb-2"
          />
          <h2 className="text-xl font-bold">{match.awayTeam.name}</h2>
          <div className="text-3xl font-bold mt-2">
            {phase.includes("EXTRA")
              ? match.matchStats.extraTimeAwayScore
              : match.matchStats.awayScore}
          </div>
        </div>
      </div>

      {/* Eventos */}
      <EventForm />
      <EventsList />
    </div>
  );
}
