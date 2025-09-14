"use client";

import { useState, useEffect, useCallback } from "react";
import {
  GameState,
  TeamInGame,
  GameSettings,
  createInitialPlayer,
  ApiMatch,
  ApiTeam,
  ApiEventType,
  Player,
} from "@/app/types/match-live";
import { GameHeader } from "@/components/game-header";
import { GameTimerControls } from "@/components/game-timer-controls";
import { useGameTimer } from "@/hooks/use-game-timer";
import { useGameEvents } from "@/hooks/use-game-events";
import { TeamPlayersList } from "@/components/team-players-list";
import { EventTypeCenterPanel } from "@/components/event-type-center-panel";
import { EventDetailPanel } from "@/components/event-detail-panel";
import { EventHistoryPanel } from "@/components/event-history-panel";
import { BoxScorePanel } from "@/components/box-score-panel";
import {
  PLAYER_FOULS_EJECTION_PERSONAL,
  PLAYER_FOULS_EJECTION_TECHNICAL,
  TEAM_FOULS_BONUS_THRESHOLD,
} from "@/app/data/basketball-definitions";

// --- Hook customizado para status da conexão ---
const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Tenta obter o estado inicial do navegador
    if (typeof window !== "undefined" && typeof navigator !== "undefined") {
      setIsOnline(navigator.onLine);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline };
};
// --- Fim do Hook ---

// --- Funções Helper para localStorage (específicas da página) ---
const loadStateFromLocalStorage = (matchId: string): GameState | null => {
  try {
    const serializedState = localStorage.getItem(`gameState_${matchId}`);
    if (serializedState === null) {
      return null;
    }
    return JSON.parse(serializedState);
  } catch (error) {
    console.warn("Aviso: Não foi possível carregar o estado do jogo.", error);
    return null;
  }
};

const getOfflineQueue = (matchId: string): any[] => {
  try {
    const queue = localStorage.getItem(`offlineQueue_${matchId}`);
    return queue ? JSON.parse(queue) : [];
  } catch (error) {
    console.warn("Aviso: Não foi possível ler a fila offline.", error);
    return [];
  }
};

const updateOfflineQueue = (newQueue: any[], matchId: string) => {
  try {
    localStorage.setItem(`offlineQueue_${matchId}`, JSON.stringify(newQueue));
  } catch (error) {
    console.warn("Aviso: Não foi possível atualizar a fila offline.", error);
  }
};
// --- Fim Funções Helper ---

const DEFAULT_GAME_SETTINGS: GameSettings = {
  quarters: 4,
  minutesPerQuarter: 10,
  minutesPerOvertime: 5,
  teamFoulsForBonus: TEAM_FOULS_BONUS_THRESHOLD,
  playerFoulsToEject: PLAYER_FOULS_EJECTION_PERSONAL,
  playerTechFoulsToEject: PLAYER_FOULS_EJECTION_TECHNICAL,
  coachTechFoulsToEject: 2,
};

const transformApiTeamToTeamInGame = (apiTeam: ApiTeam): TeamInGame => {
  const players = apiTeam.players.map((p) =>
    createInitialPlayer(p, apiTeam.id)
  );
  return {
    id: apiTeam.id,
    name: apiTeam.name,
    shortName: apiTeam.name.substring(0, 3).toUpperCase(),
    logo: apiTeam.club.logo,
    primaryColor: "#0d47a1",
    secondaryColor: "#ffffff",
    players: players,
    onCourt: players.slice(0, 5).map((p) => p.id),
    bench: players.slice(5).map((p) => p.id),
    timeouts: { full_60_left: 5, short_30_left: 2, mandatory_tv_left: 3 },
    teamFoulsThisQuarter: 0,
    isInBonus: false,
    coachTechnicalFouls: 0,
    benchTechnicalFouls: 0,
  };
};

export default function LiveGamePage({ params }: { params: { id: string } }) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [eventTypes, setEventTypes] = useState<ApiEventType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOnline } = useOnlineStatus();

  const sportId = "be7615e4-2a20-4de2-b1b3-93ae70fa4db5";

  // Função de sincronização
  const syncOfflineEvents = useCallback(async () => {
    const queue = getOfflineQueue(params.id);
    if (queue.length === 0) {
      return;
    }

    console.log(`Sincronizando ${queue.length} eventos offline...`);
    alert(
      `Conexão reestabelecida. A sincronizar ${queue.length} eventos pendentes.`
    );

    const failedEvents: any[] = [];

    for (const payload of queue) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/match-events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`API falhou para o evento ${payload.typeId}`);
        }
        console.log("Evento sincronizado com sucesso:", payload);
      } catch (error) {
        console.error(
          "Falha ao sincronizar evento, mantendo na fila:",
          payload,
          error
        );
        failedEvents.push(payload);
      }
    }

    updateOfflineQueue(failedEvents, params.id);
    if (failedEvents.length === 0) {
      alert("Todos os eventos pendentes foram sincronizados com sucesso!");
    } else {
      alert(
        `${failedEvents.length} eventos falharam ao sincronizar e permanecerão na fila para a próxima tentativa.`
      );
    }
  }, []);

  useEffect(() => {
    const initializeGame = async () => {
      setIsLoading(true);

      // 1. Tenta carregar do localStorage primeiro
      const savedState = loadStateFromLocalStorage(params.id);
      if (savedState) {
        console.log("Estado do jogo carregado a partir do localStorage.");
        setGameState(savedState);
        // Mesmo com estado salvo, busca os tipos de evento, pois podem mudar
        try {
          const eventTypesResponse = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/match-events/types?sportId=${sportId}`
          );
          if (!eventTypesResponse.ok)
            throw new Error("Falha ao buscar tipos de evento.");
          const eventTypesData: ApiEventType[] =
            await eventTypesResponse.json();
          setEventTypes(eventTypesData);
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Erro ao buscar tipos de evento."
          );
        }
        setIsLoading(false);
        return;
      }

      // 2. Se não houver estado salvo, busca da API
      try {
        const [matchResponse, eventTypesResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/match/${params.id}`),
          fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/match-events/types?sportId=${sportId}`),
        ]);

        if (!matchResponse.ok || !eventTypesResponse.ok) {
          throw new Error("Falha ao buscar dados do jogo ou tipos de evento.");
        }

        const matchData: ApiMatch = await matchResponse.json();
        const eventTypesData: ApiEventType[] = await eventTypesResponse.json();

        setEventTypes(eventTypesData);

        const homeTeam = transformApiTeamToTeamInGame(matchData.homeTeam);
        const awayTeam = transformApiTeamToTeamInGame(matchData.awayTeam);

        const gameSettings: GameSettings = {
          ...DEFAULT_GAME_SETTINGS,
          quarters: matchData.numberPeriods,
          minutesPerQuarter: matchData.durationPerPeriod,
        };

        setGameState({
          gameId: matchData.id,
          settings: gameSettings,
          homeTeam,
          awayTeam,
          homeScore: 0,
          awayScore: 0,
          currentQuarter: 1,
          gameClockSeconds: gameSettings.minutesPerQuarter * 60,
          possessionTeamId: null,
          possessionArrow: null,
          events: [],
          isGameStarted: false,
          isGameClockRunning: false,
          isPausedForEvent: false,
          isGameOver: false,
          winnerTeamId: null,
          eventInProgress: undefined,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Ocorreu um erro desconhecido."
        );
      } finally {
        setIsLoading(false);
      }
    };

    initializeGame();
  }, [sportId]);

  // Efeito para sincronizar quando a conexão volta
  useEffect(() => {
    if (isOnline) {
      syncOfflineEvents();
    }
  }, [isOnline, syncOfflineEvents]);

  const {
    selectedEventType,
    eventData,
    eventStep,
    pendingFreeThrows,
    currentFreeThrowIndex,
    startEvent,
    updateEventData,
    advanceEventStep,
    cancelEvent,
    confirmCurrentEvent,
    handleFreeThrowResult,
    undoLastEvent,
    getPlayerById,
  } = useGameEvents(
    gameState!,
    setGameState as React.Dispatch<React.SetStateAction<GameState>>,
    isOnline
  );

  const { gameClockFormatted } = useGameTimer(
    gameState?.gameClockSeconds ?? 0,
    gameState?.isGameClockRunning ?? false,
    (newTime) =>
      setGameState((prev) =>
        prev ? { ...prev, gameClockSeconds: newTime } : null
      ),
    () => {
      if (!gameState) return;
      setGameState((prev) =>
        prev ? { ...prev, isGameClockRunning: false } : null
      );
      if (
        !gameState.isPausedForEvent &&
        selectedEventType !== "ADMIN_EVENT" &&
        !gameState.isGameOver
      ) {
        startEvent("ADMIN_EVENT");
        updateEventData({
          adminEventDetails: { action: "END_PERIOD" },
          quarter: gameState.currentQuarter,
        });
      }
    }
  );

  const handleToggleGameClock = () => {
    if (
      !gameState ||
      !gameState.isGameStarted ||
      gameState.isGameOver ||
      gameState.isPausedForEvent ||
      (pendingFreeThrows.length > 0 &&
        currentFreeThrowIndex < pendingFreeThrows.length)
    )
      return;
    setGameState((prev) => ({
      ...prev!,
      isGameClockRunning: !prev!.isGameClockRunning,
    }));
  };
  const handleAdvanceQuarterAdmin = () => {
    if (!gameState) return;
    if (
      gameState.isPausedForEvent &&
      selectedEventType === "ADMIN_EVENT" &&
      eventData.adminEventDetails?.action === "END_PERIOD"
    ) {
      confirmCurrentEvent();
    } else if (!gameState.isPausedForEvent && !gameState.isGameOver) {
      startEvent("ADMIN_EVENT");
      updateEventData({
        adminEventDetails: { action: "END_PERIOD" },
        quarter: gameState.currentQuarter,
      });
    }
  };
  const handleAdjustTime = (minutes: number, seconds: number) => {
    if (!gameState || gameState.isPausedForEvent) return;
    const newTotalSeconds = minutes * 60 + seconds;
    setGameState((prev) => ({
      ...prev!,
      gameClockSeconds: Math.max(0, newTotalSeconds),
    }));
  };
  const handleTogglePossessionManually = () => {
    if (!gameState || gameState.isPausedForEvent || selectedEventType) return;
    setGameState((prev) => {
      if (!prev) return null;
      let newPossessionTeamId = null;
      if (prev.possessionTeamId === prev.homeTeam.id)
        newPossessionTeamId = prev.awayTeam.id;
      else if (prev.possessionTeamId === prev.awayTeam.id)
        newPossessionTeamId = prev.homeTeam.id;
      else newPossessionTeamId = prev.homeTeam.id;
      alert(
        `Posse de bola alterada manualmente para: ${
          newPossessionTeamId === prev.homeTeam.id
            ? prev.homeTeam.shortName
            : prev.awayTeam.shortName
        }`
      );
      return { ...prev, possessionTeamId: newPossessionTeamId };
    });
  };
  const handlePlayerListSelection = (player: Player, isOnCourt: boolean) => {
    if (!gameState || !selectedEventType || !eventData.type || !eventStep) {
      console.warn(
        "Seleção de jogador ignorada: Nenhum evento ou passo ativo."
      );
      return;
    }
    if (player.isEjected) {
      alert(
        `${player.name} está ejetado e não pode ser selecionado para esta ação.`
      );
      return;
    }
    const newEventData = { ...eventData };
    let nextStep: string | null = eventStep;
    switch (selectedEventType) {
      case "JUMP_BALL":
        if (eventStep === "SELECT_JUMP_BALL_PLAYERS") {
          if (
            player.teamId === gameState.homeTeam.id &&
            !newEventData.jumpBallDetails?.homePlayerId
          ) {
            newEventData.jumpBallDetails = {
              ...newEventData.jumpBallDetails!,
              homePlayerId: player.id,
            };
          } else if (
            player.teamId === gameState.awayTeam.id &&
            !newEventData.jumpBallDetails?.awayPlayerId
          ) {
            newEventData.jumpBallDetails = {
              ...newEventData.jumpBallDetails!,
              awayPlayerId: player.id,
            };
          }
        }
        break;
      case "2POINTS_MADE":
      case "3POINTS_MADE":
      case "2POINTS_MISSED":
      case "3POINTS_MISSED":
        if (eventStep === "SELECT_PRIMARY_PLAYER") {
          if (
            player.teamId ===
              (eventData.primaryTeamId || gameState.possessionTeamId) &&
            isOnCourt
          ) {
            newEventData.primaryPlayerId = player.id;
            newEventData.primaryTeamId = player.teamId;
            newEventData.shotDetails = {
              type: selectedEventType.startsWith("2POINTS")
                ? "JUMP_SHOT"
                : "JUMP_SHOT_3PT",
              isMade: selectedEventType.includes("MADE"),
              points: selectedEventType.includes("MADE")
                ? selectedEventType.startsWith("2POINTS")
                  ? 2
                  : 3
                : 0,
              isAssisted: false,
              isBlocked: false,
            };
            nextStep = "SELECT_SHOT_DETAILS";
          } else {
            alert("Selecione um jogador em campo da equipa com posse.");
            return;
          }
        } else if (
          eventStep === "SELECT_SHOT_DETAILS" &&
          newEventData.shotDetails?.isMade &&
          !newEventData.shotDetails.assistPlayerId
        ) {
          if (
            player.teamId === newEventData.primaryTeamId &&
            player.id !== newEventData.primaryPlayerId &&
            isOnCourt
          ) {
            newEventData.shotDetails.assistPlayerId = player.id;
            newEventData.shotDetails.isAssisted = true;
          } else if (player.id === newEventData.primaryPlayerId) {
            alert("Jogador não pode assistir a si mesmo.");
            return;
          } else {
            alert(
              "Assistência deve ser de um jogador da mesma equipa e em campo."
            );
            return;
          }
        } else if (
          eventStep === "SELECT_FOULING_PLAYER_ON_SHOT" &&
          newEventData.foulDetails
        ) {
          if (player.teamId !== newEventData.primaryTeamId && isOnCourt) {
            newEventData.foulDetails.committedByPlayerId = player.id;
            newEventData.foulDetails.committedByTeamId = player.teamId;
          } else {
            alert(
              "Falta deve ser cometida por um jogador da equipa adversária em campo."
            );
            return;
          }
        } else if (
          eventStep === "SELECT_REBOUND_PLAYER_AFTER_MISS" &&
          isOnCourt
        ) {
          newEventData.reboundDetails = {
            ...newEventData.reboundDetails,
            reboundPlayerId: player.id,
            type:
              player.teamId === newEventData.primaryTeamId
                ? "OFFENSIVE"
                : "DEFENSIVE",
          };
        }
        break;
      case "FOUL_PERSONAL":
        if (eventStep === "SELECT_PRIMARY_PLAYER" && isOnCourt) {
          newEventData.primaryPlayerId = player.id;
          newEventData.primaryTeamId = player.teamId;
          newEventData.foulDetails = {
            committedByPlayerId: player.id,
            committedByTeamId: player.teamId,
            committedBy: "PLAYER",
            isPersonalFoul: true,
            resultsInFreeThrows: false,
          };
          nextStep = "SELECT_FOUL_DETAILS";
        } else if (
          eventStep === "SELECT_FOUL_DETAILS" &&
          newEventData.foulDetails &&
          !newEventData.foulDetails.drawnByPlayerId
        ) {
          if (
            player.id !== newEventData.foulDetails.committedByPlayerId &&
            isOnCourt
          ) {
            newEventData.foulDetails.drawnByPlayerId = player.id;
          } else if (
            player.id === newEventData.foulDetails.committedByPlayerId
          ) {
            alert("Jogador não pode cometer falta em si mesmo.");
            return;
          } else {
            alert("Selecione um jogador em campo para quem sofreu a falta.");
            return;
          }
        }
        break;
      case "FOUL_TECHNICAL":
        if (
          eventStep === "SELECT_PRIMARY_PLAYER" &&
          newEventData.foulDetails?.committedBy === "PLAYER" &&
          isOnCourt
        ) {
          newEventData.primaryPlayerId = player.id;
          newEventData.primaryTeamId = player.teamId;
          newEventData.foulDetails = {
            ...newEventData.foulDetails,
            committedByPlayerId: player.id,
            committedByTeamId: player.teamId,
          };
          nextStep = "SELECT_FOUL_DETAILS";
        } else if (
          eventStep === "SELECT_FOUL_DETAILS" &&
          newEventData.foulDetails &&
          !newEventData.foulDetails.freeThrowShooterPlayerId &&
          isOnCourt
        ) {
          const infratorTeamId = newEventData.foulDetails.committedByPlayerId
            ? getPlayerById(newEventData.foulDetails.committedByPlayerId)
                ?.teamId
            : newEventData.foulDetails.committedByTeamId;
          if (player.teamId !== infratorTeamId) {
            newEventData.foulDetails.freeThrowShooterPlayerId = player.id;
          } else {
            alert(
              "Cobrador do LL técnico deve ser da equipa adversária ao infrator."
            );
            return;
          }
        }
        break;
      case "SUBSTITUTION":
        if (
          eventStep === "SELECT_PLAYER_OUT" &&
          isOnCourt &&
          !player.isEjected
        ) {
          newEventData.substitutionDetails = {
            ...newEventData.substitutionDetails,
            playerOutId: player.id,
            teamId: player.teamId,
          };
          nextStep = "SELECT_PLAYER_IN";
        } else if (
          eventStep === "SELECT_PLAYER_IN" &&
          !isOnCourt &&
          !player.isEjected &&
          player.teamId === newEventData.substitutionDetails?.teamId
        ) {
          if (player.id === newEventData.substitutionDetails?.playerOutId) {
            alert("Jogador a entrar não pode ser o mesmo que saiu.");
            return;
          }
          newEventData.substitutionDetails = {
            ...newEventData.substitutionDetails!,
            playerInId: player.id,
          };
          nextStep = "CONFIRM_SUBSTITUTION_EVENT";
        }
        break;
      case "TURNOVER":
        if (
          eventStep === "SELECT_PRIMARY_PLAYER" &&
          player.teamId ===
            (eventData.primaryTeamId || gameState.possessionTeamId) &&
          isOnCourt
        ) {
          newEventData.primaryPlayerId = player.id;
          newEventData.primaryTeamId = player.teamId;
          newEventData.turnoverDetails = {
            lostByPlayerId: player.id,
            type: "BAD_PASS",
          };
          nextStep = "SELECT_TURNOVER_TYPE";
        } else if (
          eventStep === "SELECT_TURNOVER_TYPE" &&
          newEventData.turnoverDetails?.stolenByPlayerId !== undefined &&
          player.teamId !== newEventData.primaryTeamId &&
          isOnCourt
        ) {
          newEventData.turnoverDetails.stolenByPlayerId = player.id;
        }
        break;
      case "STEAL":
        if (
          eventStep === "SELECT_PRIMARY_PLAYER" &&
          player.teamId === eventData.primaryTeamId &&
          isOnCourt
        ) {
          newEventData.primaryPlayerId = player.id;
          newEventData.stealDetails = { stolenByPlayerId: player.id };
          nextStep = "SELECT_PLAYER_WHO_LOST_BALL_ON_STEAL";
        } else if (
          eventStep === "SELECT_PLAYER_WHO_LOST_BALL_ON_STEAL" &&
          newEventData.stealDetails &&
          player.teamId !== eventData.primaryTeamId &&
          isOnCourt
        ) {
          newEventData.stealDetails.lostPossessionByPlayerId = player.id;
          nextStep = "CONFIRM_STEAL_EVENT";
        }
        break;
      case "BLOCK":
        if (
          eventStep === "SELECT_PRIMARY_PLAYER" &&
          player.teamId === eventData.primaryTeamId &&
          isOnCourt
        ) {
          newEventData.primaryPlayerId = player.id;
          newEventData.blockDetails = {
            blockPlayerId: player.id,
            shotByPlayerId: "",
          };
          nextStep = "SELECT_BLOCKED_PLAYER";
        } else if (
          eventStep === "SELECT_BLOCKED_PLAYER" &&
          newEventData.blockDetails &&
          player.teamId !== eventData.primaryTeamId &&
          isOnCourt
        ) {
          newEventData.blockDetails.shotByPlayerId = player.id;
          nextStep = "CONFIRM_BLOCK_EVENT";
        }
        break;
      case "REBOUND_OFFENSIVE":
      case "REBOUND_DEFENSIVE":
        if (eventStep === "SELECT_PRIMARY_PLAYER" && isOnCourt) {
          newEventData.primaryPlayerId = player.id;
          newEventData.primaryTeamId = player.teamId;
          newEventData.reboundDetails = {
            reboundPlayerId: player.id,
            type:
              selectedEventType === "REBOUND_OFFENSIVE"
                ? "OFFENSIVE"
                : "DEFENSIVE",
          };
          nextStep =
            selectedEventType === "REBOUND_OFFENSIVE"
              ? "CHECK_TIP_IN_AFTER_OREB"
              : "CONFIRM_REBOUND_EVENT";
        }
        break;
      case "DEFLECTION":
        if (
          eventStep === "SELECT_PRIMARY_PLAYER" &&
          player.teamId === eventData.primaryTeamId &&
          isOnCourt
        ) {
          newEventData.primaryPlayerId = player.id;
          newEventData.deflectionDetails = { deflectedByPlayerId: player.id };
          nextStep = "CONFIRM_DEFLECTION_EVENT";
        }
        break;
      case "HELD_BALL":
        if (eventStep === "SELECT_HELD_BALL_PLAYERS") {
          if (!newEventData.heldBallDetails?.player1Id) {
            newEventData.heldBallDetails = {
              ...newEventData.heldBallDetails!,
              player1Id: player.id,
            };
          } else if (
            !newEventData.heldBallDetails?.player2Id &&
            player.id !== newEventData.heldBallDetails?.player1Id
          ) {
            newEventData.heldBallDetails = {
              ...newEventData.heldBallDetails!,
              player2Id: player.id,
            };
          }
        }
        break;
    }
    updateEventData(newEventData);
    if (nextStep !== eventStep) advanceEventStep(nextStep);
  };
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameState) return;
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.tagName === "SELECT")
      )
        return;
      if (e.key === " ") {
        e.preventDefault();
        if (
          gameState.isGameStarted &&
          !gameState.isGameOver &&
          !gameState.isPausedForEvent &&
          pendingFreeThrows.length === 0 &&
          currentFreeThrowIndex === 0
        )
          handleToggleGameClock();
      }
      if (!selectedEventType && !gameState.isPausedForEvent) {
        if (e.key === "1" || e.key.toLowerCase() === "q") {
          e.preventDefault();
          startEvent("2POINTS_MADE");
        } else if (e.key === "2" || e.key.toLowerCase() === "w") {
          e.preventDefault();
          startEvent("2POINTS_MISSED");
        } else if (e.key === "3" || e.key.toLowerCase() === "e") {
          e.preventDefault();
          startEvent("3POINTS_MADE");
        } else if (e.key === "4" || e.key.toLowerCase() === "r") {
          e.preventDefault();
          startEvent("3POINTS_MISSED");
        } else if (e.key.toLowerCase() === "f") {
          e.preventDefault();
          startEvent("FOUL_PERSONAL");
        } else if (e.key.toLowerCase() === "t") {
          e.preventDefault();
          startEvent("TURNOVER");
        } else if (e.key.toLowerCase() === "s") {
          e.preventDefault();
          startEvent("SUBSTITUTION");
        } else if (e.key.toLowerCase() === "d") {
          e.preventDefault();
          startEvent("REBOUND_DEFENSIVE");
        } else if (e.key.toLowerCase() === "o") {
          e.preventDefault();
          startEvent("REBOUND_OFFENSIVE");
        } else if (e.key.toLowerCase() === "b") {
          e.preventDefault();
          startEvent("BLOCK");
        } else if (e.key.toLowerCase() === "h") {
          e.preventDefault();
          startEvent("HELD_BALL");
        } else if (e.key.toLowerCase() === "p") {
          e.preventDefault();
          handleTogglePossessionManually();
        } else if (e.key.toLowerCase() === "m") {
          e.preventDefault();
          startEvent("TIMEOUT_REQUEST");
        }
      }
      if (selectedEventType && eventStep !== "AWAITING_FREE_THROW") {
        if (e.key === "Enter") {
          e.preventDefault();
          if (canConfirmCurrentEventBasedOnStep()) confirmCurrentEvent();
        }
        if (e.key === "Escape") {
          e.preventDefault();
          cancelEvent();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (gameState.events.length > 0 && !selectedEventType) undoLastEvent();
      }
      if (
        eventStep === "AWAITING_FREE_THROW" &&
        pendingFreeThrows.length > 0 &&
        currentFreeThrowIndex < pendingFreeThrows.length
      ) {
        if (
          e.key === "c" ||
          e.key === "C" ||
          e.key === "m" ||
          e.key === "M" ||
          e.key === "1"
        ) {
          e.preventDefault();
          handleFreeThrowResult(true);
        } else if (
          e.key === "x" ||
          e.key === "X" ||
          e.key === "e" ||
          e.key === "E" ||
          e.key === "0"
        ) {
          e.preventDefault();
          handleFreeThrowResult(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    gameState,
    selectedEventType,
    eventStep,
    eventData,
    pendingFreeThrows,
    currentFreeThrowIndex,
    startEvent,
    updateEventData,
    advanceEventStep,
    cancelEvent,
    confirmCurrentEvent,
    handleFreeThrowResult,
    undoLastEvent,
    handleToggleGameClock,
    handleTogglePossessionManually,
  ]);
  const canConfirmCurrentEventBasedOnStep = (): boolean => {
    if (!gameState || !selectedEventType || !eventData.type) return false;
    if (eventStep === "AWAITING_FREE_THROW") return false;
    if (eventStep?.startsWith("CONFIRM_")) return true;
    switch (selectedEventType) {
      case "JUMP_BALL":
        return (
          eventStep === "SELECT_JUMP_BALL_WINNER" &&
          !!eventData.jumpBallDetails?.wonByTeamId
        );
      case "2POINTS_MADE":
      case "3POINTS_MADE":
        return (
          eventStep === "SELECT_SHOT_DETAILS" &&
          !!eventData.primaryPlayerId &&
          !!eventData.shotDetails?.type &&
          (!eventData.foulDetails ||
            (!!eventData.foulDetails.personalFoulType &&
              !!eventData.foulDetails.committedByPlayerId &&
              !!eventData.foulDetails.drawnByPlayerId))
        );
      case "2POINTS_MISSED":
      case "3POINTS_MISSED":
        return (
          eventStep === "SELECT_SHOT_DETAILS" &&
          !!eventData.primaryPlayerId &&
          !!eventData.shotDetails?.type &&
          (!eventData.foulDetails ||
            (!!eventData.foulDetails.personalFoulType &&
              !!eventData.foulDetails.committedByPlayerId &&
              !!eventData.foulDetails.drawnByPlayerId)) &&
          !eventData.reboundDetails?.isTipInAttempt === undefined
        );
    }
    return false;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
        {" "}
        A carregar dados do jogo...{" "}
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-red-500">
        {" "}
        Erro ao carregar: {error}{" "}
      </div>
    );
  }
  if (!gameState) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
        {" "}
        Não foi possível carregar os dados do jogo.{" "}
      </div>
    );
  }

  const showEventDetailPanel =
    selectedEventType !== null &&
    !(
      eventStep === "AWAITING_FREE_THROW" &&
      pendingFreeThrows.length > 0 &&
      currentFreeThrowIndex >= pendingFreeThrows.length
    );

  return (
    <div className="flex flex-col min-h-screen bg-gray-200 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <div
        className={`fixed top-0 left-0 w-full p-2 text-center text-white z-50 transition-colors duration-500 ${
          isOnline ? "bg-green-600" : "bg-red-600"
        }`}
      >
        {isOnline
          ? "Conectado"
          : "Offline - Os eventos serão guardados e sincronizados mais tarde."}
      </div>
      <GameHeader
        homeTeam={gameState.homeTeam}
        awayTeam={gameState.awayTeam}
        homeScore={gameState.homeScore}
        awayScore={gameState.awayScore}
        currentQuarter={gameState.currentQuarter}
        gameTime={gameClockFormatted}
        possessionTeamId={gameState.possessionTeamId}
        possessionArrow={gameState.possessionArrow}
        isGameOver={gameState.isGameOver}
        winnerTeamId={gameState.winnerTeamId}
        gameSettings={gameState.settings}
      />
      <GameTimerControls
        isGameClockRunning={gameState.isGameClockRunning}
        onToggleGameClock={handleToggleGameClock}
        onAdvanceQuarter={handleAdvanceQuarterAdmin}
        onAdjustTime={handleAdjustTime}
        onTogglePossessionManually={handleTogglePossessionManually}
        canManuallyStartStop={
          gameState.isGameStarted &&
          !gameState.isGameOver &&
          !gameState.isPausedForEvent &&
          !(
            pendingFreeThrows.length > 0 &&
            currentFreeThrowIndex < pendingFreeThrows.length
          )
        }
        currentPossessionTeamId={gameState.possessionTeamId}
        homeTeamShortName={gameState.homeTeam.shortName}
        awayTeamShortName={gameState.awayTeam.shortName}
      />
      <main className="flex flex-row flex-1 p-1.5 md:p-2 gap-1.5 md:gap-2 w-full max-w-full overflow-hidden mt-8">
        <div className="w-1/4 lg:w-1/5 xl:w-1/4 flex-shrink-0">
          <TeamPlayersList
            team={gameState.homeTeam}
            onPlayerSelect={handlePlayerListSelection}
            selectedPlayerForEventId={
              eventData.primaryPlayerId ||
              eventData.secondaryPlayerId ||
              eventData.jumpBallDetails?.homePlayerId ||
              eventData.substitutionDetails?.playerOutId ||
              eventData.substitutionDetails?.playerInId
            }
            title="Casa"
            disabledInteraction={
              !selectedEventType ||
              (eventStep === "AWAITING_FREE_THROW" &&
                pendingFreeThrows.length > 0 &&
                currentFreeThrowIndex < pendingFreeThrows.length) ||
              (["TIMEOUT_REQUEST", "ADMIN_EVENT"].includes(
                selectedEventType!
              ) &&
                !eventStep?.toUpperCase().includes("PLAYER") &&
                !eventStep?.toUpperCase().includes("TEAM_FOR_TIMEOUT")) ||
              (selectedEventType === "HELD_BALL" &&
                eventStep !== "SELECT_HELD_BALL_PLAYERS")
            }
            showSubOutIconPlayerId={eventData.substitutionDetails?.playerOutId}
            showSubInIconPlayerId={eventData.substitutionDetails?.playerInId}
          />
        </div>
        <div className="flex-1 min-w-0">
          {showEventDetailPanel ? (
            <EventDetailPanel
              gameState={gameState}
              selectedEventType={selectedEventType!}
              currentEventData={eventData}
              currentEventStep={eventStep}
              pendingFreeThrows={pendingFreeThrows}
              currentFreeThrowIndex={currentFreeThrowIndex}
              onUpdateEventData={updateEventData}
              onAdvanceStep={advanceEventStep}
              onConfirm={confirmCurrentEvent}
              onCancel={cancelEvent}
              onFreeThrowAttemptResult={handleFreeThrowResult}
            />
          ) : (
            <EventTypeCenterPanel
              eventTypes={eventTypes}
              onSelectEvent={startEvent}
              isGameStarted={gameState.isGameStarted}
              hasPendingFreeThrows={
                pendingFreeThrows.length > 0 &&
                eventStep === "AWAITING_FREE_THROW" &&
                currentFreeThrowIndex < pendingFreeThrows.length
              }
            />
          )}
        </div>
        <div className="w-1/4 lg:w-1/5 xl:w-1/4 flex-shrink-0">
          <TeamPlayersList
            team={gameState.awayTeam}
            onPlayerSelect={handlePlayerListSelection}
            selectedPlayerForEventId={
              eventData.primaryPlayerId ||
              eventData.secondaryPlayerId ||
              eventData.jumpBallDetails?.awayPlayerId ||
              eventData.substitutionDetails?.playerOutId ||
              eventData.substitutionDetails?.playerInId
            }
            title="Visitante"
            disabledInteraction={
              !selectedEventType ||
              (eventStep === "AWAITING_FREE_THROW" &&
                pendingFreeThrows.length > 0 &&
                currentFreeThrowIndex < pendingFreeThrows.length) ||
              (["TIMEOUT_REQUEST", "ADMIN_EVENT"].includes(
                selectedEventType!
              ) &&
                !eventStep?.toUpperCase().includes("PLAYER") &&
                !eventStep?.toUpperCase().includes("TEAM_FOR_TIMEOUT")) ||
              (selectedEventType === "HELD_BALL" &&
                eventStep !== "SELECT_HELD_BALL_PLAYERS")
            }
            showSubOutIconPlayerId={eventData.substitutionDetails?.playerOutId}
            showSubInIconPlayerId={eventData.substitutionDetails?.playerInId}
          />
        </div>
      </main>
      <div className="p-1.5 md:p-2 grid grid-cols-1 xl:grid-cols-2 gap-2">
        <EventHistoryPanel
          lastEvents={gameState.events}
          onUndo={undoLastEvent}
          teams={[gameState.homeTeam, gameState.awayTeam]}
        />
        <BoxScorePanel gameState={gameState} />
      </div>
    </div>
  );
}
