"use client";

import { useState, useEffect, useCallback } from "react";
import {
  GameState,
  Team,
  Player,
  TeamInGame,
  EventType,
  GameSettings,
  createInitialPlayer,
  initialPlayerStats,
  PossessionArrowDirection,
} from "@/app/types/match-live";
import { GameHeader } from "@/components/game-header";
import { GameTimerControls } from "@/components/game-timer-controls";
import { useGameTimer } from "@/hooks/use-game-timer";
import { useGameEvents } from "@/hooks/use-game-events";
import { TeamPlayersList } from "@/components/team-players-list";
import { EventTypeCenterPanel } from "@/components/event-type-center-panel";
import { EventDetailPanel } from "@/components/event-detail-panel";
import { EventHistoryPanel } from "@/components/event-history-panel";
import { generateId } from "@/lib/utils";
import { MAIN_EVENT_TYPE_OPTIONS } from "@/app/data/basketball-definitions";

const DEFAULT_GAME_SETTINGS: GameSettings = {
  quarters: 4,
  minutesPerQuarter: 10, // FIBA standard, NBA is 12
  minutesPerOvertime: 5,
  shotClockDuration: 24,
  shotClockResetDurationOffensiveRebound: 14,
  teamFoulsForBonus: 5, // FIBA standard, NBA is 5 (ou 2 nos últimos 2 min)
  playerFoulsToEject: 5, // FIBA standard
};

// --- Dados Mockados Iniciais ---
const mockHomePlayersData: Omit<
  Player,
  "stats" | "isEjected" | "id" | "teamId"
>[] = [
  {
    number: 6,
    name: "LeBron James",
    position: "SF",
    photo:
      "https://res.cloudinary.com/ds1lnrvnq/image/upload/v1742947613/dsport/clubs/logo/sn2iq48c9wzocjkqseud.png",
  },
  {
    number: 23,
    name: "Anthony Davis",
    position: "PF",
    photo:
      "https://res.cloudinary.com/ds1lnrvnq/image/upload/v1742947613/dsport/clubs/logo/sn2iq48c9wzocjkqseud.png",
  },
  { number: 1, name: "D'Angelo Russell", position: "PG" },
  { number: 15, name: "Austin Reaves", position: "SG" },
  { number: 28, name: "Rui Hachimura", position: "PF" },
  { number: 2, name: "Jarred Vanderbilt", position: "SF" },
  { number: 10, name: "Max Christie", position: "SG" },
  { number: 11, name: "Jaxson Hayes", position: "C" },
  { number: 5, name: "Cam Reddish", position: "SF" },
  { number: 0, name: "Taurean Prince", position: "SF" },
];
const mockAwayPlayersData: Omit<
  Player,
  "stats" | "isEjected" | "id" | "teamId"
>[] = [
  {
    number: 7,
    name: "Jayson Tatum",
    position: "SF",
    photo:
      "https://res.cloudinary.com/ds1lnrvnq/image/upload/v1742947613/dsport/clubs/logo/sn2iq48c9wzocjkqseud.png",
  },
  {
    number: 9,
    name: "Jaylen Brown",
    position: "SG",
    photo:
      "https://res.cloudinary.com/ds1lnrvnq/image/upload/v1742947613/dsport/clubs/logo/sn2iq48c9wzocjkqseud.png",
  },
  { number: 4, name: "Jrue Holiday", position: "PG" },
  { number: 8, name: "Kristaps Porzingis", position: "C" },
  { number: 42, name: "Al Horford", position: "C" },
  { number: 12, name: "Derrick White", position: "PG" },
  { number: 30, name: "Sam Hauser", position: "SF" },
  { number: 11, name: "Payton Pritchard", position: "PG" },
  { number: 13, name: "Luke Kornet", position: "C" },
  { number: 0, name: "Oshae Brissett", position: "SF" },
];

const homeTeamBase: Omit<Team, "players"> = {
  id: "HOME_TEAM_ID",
  name: "Los Angeles Lakers",
  shortName: "LAL",
  logo: "https://res.cloudinary.com/ds1lnrvnq/image/upload/v1742420456/dsport/clubs/logo/gljqlouvtgb9r215j9vt.png",
  primaryColor: "#552583",
  secondaryColor: "#FDB927",
  coachName: "Darvin Ham",
};
const awayTeamBase: Omit<Team, "players"> = {
  id: "AWAY_TEAM_ID",
  name: "Boston Celtics",
  shortName: "BOS",
  logo: "https://res.cloudinary.com/ds1lnrvnq/image/upload/v1742851303/dsport/clubs/logo/nrldhsluaji6gxu0teeu.png",
  primaryColor: "#007A33",
  secondaryColor: "#BA9653",
  coachName: "Joe Mazzulla",
};

const initializeTeamInGame = (
  baseTeam: Omit<Team, "players">,
  playersData: Omit<Player, "stats" | "isEjected" | "id" | "teamId">[],
  startersCount: number = 5
): TeamInGame => {
  const fullPlayers = playersData.map((p) =>
    createInitialPlayer(p, baseTeam.id)
  );
  return {
    ...baseTeam,
    players: fullPlayers,
    onCourt: fullPlayers.slice(0, startersCount).map((p) => p.id),
    bench: fullPlayers.slice(startersCount).map((p) => p.id),
    timeoutsLeft: 7, // Standard NBA, pode ser ajustado nas settings
    teamFoulsThisQuarter: 0,
    isInBonus: false,
    coachTechnicalFouls: 0,
    benchTechnicalFouls: 0,
  };
};
// --- Fim Dados Mockados ---

export default function LiveGamePage() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const homeTeam = initializeTeamInGame(homeTeamBase, mockHomePlayersData);
    const awayTeam = initializeTeamInGame(awayTeamBase, mockAwayPlayersData);
    return {
      gameId: generateId("game"),
      settings: DEFAULT_GAME_SETTINGS,
      homeTeam,
      awayTeam,
      homeScore: 0,
      awayScore: 0,
      currentQuarter: 1,
      gameClockSeconds: DEFAULT_GAME_SETTINGS.minutesPerQuarter * 60,
      shotClockSeconds: DEFAULT_GAME_SETTINGS.shotClockDuration,
      possessionTeamId: null,
      possessionArrow: null,
      events: [],
      isGameStarted: false,
      isGameClockRunning: false,
      isShotClockRunning: false,
      isPausedForEvent: false,
      isGameOver: false,
    };
  });

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
  } = useGameEvents(gameState, setGameState);

  const { gameClockFormatted } = useGameTimer(
    gameState.gameClockSeconds,
    gameState.isGameClockRunning,
    (newTime) =>
      setGameState((prev) => ({ ...prev, gameClockSeconds: newTime })),
    () => {
      // onGamePeriodEnd
      setGameState((prev) => ({
        ...prev,
        isGameClockRunning: false,
        isShotClockRunning: false,
      }));
      // Auto-trigger ADMIN_EVENT for END_QUARTER
      if (!gameState.isPausedForEvent && selectedEventType !== "ADMIN_EVENT") {
        // Evita loop se já estiver em evento admin
        startEvent("ADMIN_EVENT");
        updateEventData({ adminEventDetails: { action: "END_QUARTER" } });
        // Não avança step, o painel de admin deve mostrar o botão de confirmar
      }
      console.log("Fim do período!");
    }
  );

  // --- Funções de Controlo do Cronómetro ---
  const handleToggleGameClock = () => {
    if (
      !gameState.isGameStarted ||
      gameState.isGameOver ||
      gameState.isPausedForEvent
    )
      return;
    setGameState((prev) => ({
      ...prev,
      isGameClockRunning: !prev.isGameClockRunning,
      // Se o jogo começa a correr e o shot clock estava parado (e há posse), inicia o shot clock também
    }));
  };

  const handleAdvanceQuarterAdmin = () => {
    // Usado pelo botão de período
    startEvent("ADMIN_EVENT");
    updateEventData({ adminEventDetails: { action: "END_QUARTER" } }); // O hook tratará a lógica de avançar
    // O painel de detalhes do admin event mostrará o botão de confirmar
  };

  const handleAdjustTime = (minutes: number, seconds: number) => {
    if (!gameState.isPausedForEvent) {
      const newTotalSeconds = minutes * 60 + seconds;
      setGameState((prev) => ({
        ...prev,
        // Define o gameClockSeconds para o novo total. Não é um ajuste relativo, mas um set absoluto.
        gameClockSeconds: Math.max(0, newTotalSeconds),
      }));
    }
  };

  const handleTogglePossessionManually = () => {
    if (!gameState.isPausedForEvent) {
      // Só permite se não estiver a meio de um evento
      setGameState((prev) => {
        let newPossessionTeamId = null;
        if (prev.possessionTeamId === prev.homeTeam.id) {
          newPossessionTeamId = prev.awayTeam.id;
        } else if (prev.possessionTeamId === prev.awayTeam.id) {
          newPossessionTeamId = prev.homeTeam.id;
        } else {
          // Se a posse era nula, pode-se definir para a equipa da casa por defeito, ou ter um seletor
          newPossessionTeamId = prev.homeTeam.id;
        }
        return {
          ...prev,
          possessionTeamId: newPossessionTeamId,
          // Opcional: resetar o shot clock ao trocar posse manualmente?
          // shotClockSeconds: prev.settings.shotClockDuration,
          // isShotClockRunning: !!newPossessionTeamId && prev.isGameClockRunning,
        };
      });
    }
  };

  // --- Seleção de Jogador das Listas ---
  const handlePlayerListSelection = (player: Player, isOnCourt: boolean) => {
    if (!selectedEventType || !eventData.type || !eventStep) return;

    const newEventData = { ...eventData };
    let nextStep: string | null = eventStep;

    switch (selectedEventType) {
      case "JUMP_BALL":
        if (eventStep === "SELECT_JUMP_BALL_PLAYERS") {
          if (
            player.teamId === gameState.homeTeam.id && // Corrigido aqui
            !newEventData.jumpBallDetails?.homePlayerId
          ) {
            newEventData.jumpBallDetails = {
              ...newEventData.jumpBallDetails!,
              homePlayerId: player.id,
            };
          } else if (
            player.teamId === gameState.awayTeam.id && // Corrigido aqui
            !newEventData.jumpBallDetails?.awayPlayerId
          ) {
            newEventData.jumpBallDetails = {
              ...newEventData.jumpBallDetails!,
              awayPlayerId: player.id,
            };
          }
          // Verificar se ambos foram selecionados para potencialmente avançar o passo automaticamente
          if (
            newEventData.jumpBallDetails?.homePlayerId &&
            newEventData.jumpBallDetails?.awayPlayerId &&
            nextStep === "SELECT_JUMP_BALL_PLAYERS"
          ) {
            // Não avança o passo aqui, deixa o botão "Próximo" no EventDetailPanel fazer isso
            // ou o usuário clica em outro jogador se quiser mudar a seleção.
          }
        }
        break;
      case "2POINTS_MADE":
      case "3POINTS_MADE":
      case "2POINTS_MISSED":
      case "3POINTS_MISSED":
        if (
          eventStep === "SELECT_PRIMARY_PLAYER" &&
          player.teamId === gameState.possessionTeamId &&
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
        } else if (
          eventStep === "SELECT_SHOT_DETAILS" &&
          newEventData.shotDetails &&
          newEventData.shotDetails.isMade &&
          !newEventData.shotDetails.assistPlayerId &&
          player.teamId === newEventData.primaryTeamId &&
          player.id !== newEventData.primaryPlayerId &&
          isOnCourt
        ) {
          newEventData.shotDetails.assistPlayerId = player.id;
          newEventData.shotDetails.isAssisted = true;
        } else if (
          eventStep === "SELECT_FOULING_PLAYER_ON_SHOT" &&
          newEventData.foulDetails &&
          player.teamId !== newEventData.primaryTeamId &&
          isOnCourt
        ) {
          newEventData.foulDetails.committedByPlayerId = player.id;
          newEventData.foulDetails.committedByTeamId = player.teamId;
        } else if (eventStep === "SELECT_REBOUND_PLAYER" && isOnCourt) {
          newEventData.reboundDetails = {
            ...newEventData.reboundDetails!,
            reboundPlayerId: player.id,
            type:
              player.teamId === newEventData.primaryTeamId
                ? "OFFENSIVE"
                : "DEFENSIVE",
          }; // Auto-define tipo de ressalto
          // Avança automaticamente após selecionar o ressaltador se o tipo for definido
          if (
            newEventData.reboundDetails.reboundPlayerId &&
            newEventData.reboundDetails.type
          ) {
            nextStep = "CONFIRM_MISSED_SHOT_EVENT"; // Ou outro passo relevante
          }
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
          !newEventData.foulDetails.drawnByPlayerId &&
          player.id !== newEventData.foulDetails.committedByPlayerId &&
          isOnCourt
        ) {
          newEventData.foulDetails.drawnByPlayerId = player.id;
        }
        break;
      case "FOUL_TECHNICAL":
        // A lógica para FOUL_TECHNICAL no handlePlayerListSelection pode ser mais complexa
        // porque o infrator pode não ser um jogador (banco/treinador),
        // e o cobrador de LL deve ser da equipa oposta.
        // O EventDetailPanel deve guiar melhor essa seleção.
        // Aqui, apenas um exemplo se o passo for para selecionar o jogador infrator.
        if (eventStep === "SELECT_PRIMARY_PLAYER" && isOnCourt) {
          if (
            !newEventData.foulDetails?.committedBy ||
            newEventData.foulDetails?.committedBy === "PLAYER"
          ) {
            newEventData.primaryPlayerId = player.id;
            newEventData.primaryTeamId = player.teamId;
            newEventData.foulDetails = {
              ...newEventData.foulDetails,
              committedBy: "PLAYER",
              committedByPlayerId: player.id,
              committedByTeamId: player.teamId,
              isPersonalFoul: false,
            };
            nextStep = "SELECT_FOUL_DETAILS";
          }
        } else if (
          eventStep === "SELECT_FOUL_DETAILS" &&
          newEventData.foulDetails &&
          !newEventData.foulDetails.freeThrowShooterPlayerId &&
          isOnCourt
        ) {
          const infratorTeamId = newEventData.foulDetails.committedByPlayerId
            ? _getPlayerById(
                newEventData.foulDetails.committedByPlayerId,
                gameState
              )?.teamId
            : newEventData.foulDetails.committedByTeamId;
          if (player.teamId !== infratorTeamId) {
            newEventData.foulDetails.freeThrowShooterPlayerId = player.id;
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
          if (player.id !== newEventData.substitutionDetails?.playerOutId) {
            // Garante que não é o mesmo jogador
            newEventData.substitutionDetails = {
              ...newEventData.substitutionDetails,
              playerInId: player.id,
            };
          } else {
            // Alertar ou impedir seleção do mesmo jogador
            console.warn("Jogador a entrar não pode ser o mesmo que saiu.");
          }
        }
        break;
      case "TURNOVER":
        if (
          eventStep === "SELECT_PRIMARY_PLAYER" &&
          player.teamId === gameState.possessionTeamId &&
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
          newEventData.turnoverDetails?.stolenByPlayerId !==
            undefined /* significa que o switch "foi roubo?" está ativo */ &&
          player.teamId !== newEventData.primaryTeamId &&
          isOnCourt
        ) {
          newEventData.turnoverDetails.stolenByPlayerId = player.id;
        }
        break;
      case "STEAL":
        // A equipa com posse é a que PERDE a bola. O jogador do STEAL é da equipa DEFENSORA.
        if (
          eventStep === "SELECT_PRIMARY_PLAYER" &&
          player.teamId !== gameState.possessionTeamId &&
          isOnCourt
        ) {
          newEventData.primaryPlayerId = player.id; // Jogador que roubou
          newEventData.primaryTeamId = player.teamId;
          newEventData.stealDetails = { stolenByPlayerId: player.id };
          nextStep = "SELECT_PLAYER_WHO_LOST_BALL_ON_STEAL"; // Novo passo para identificar quem perdeu
        }
        break;
      case "BLOCK":
        // A equipa com posse é a que TENTA o arremesso. O jogador do BLOCK é da equipa DEFENSORA.
        if (
          eventStep === "SELECT_PRIMARY_PLAYER" &&
          player.teamId !== gameState.possessionTeamId &&
          isOnCourt
        ) {
          newEventData.primaryPlayerId = player.id; // Jogador que bloqueou
          newEventData.primaryTeamId = player.teamId;
          newEventData.blockDetails = {
            blockPlayerId: player.id,
            shotByPlayerId: "",
          }; // shotByPlayerId será preenchido no próximo passo
          nextStep = "SELECT_BLOCKED_PLAYER";
        } else if (
          eventStep === "SELECT_BLOCKED_PLAYER" &&
          newEventData.blockDetails &&
          player.teamId === gameState.possessionTeamId &&
          isOnCourt
        ) {
          newEventData.blockDetails.shotByPlayerId = player.id;
        }
        break;
      case "REBOUND_OFFENSIVE":
      case "REBOUND_DEFENSIVE":
        if (eventStep === "SELECT_PRIMARY_PLAYER" && isOnCourt) {
          // Qualquer jogador em campo pode pegar o ressalto
          newEventData.primaryPlayerId = player.id; // Jogador que pegou o ressalto
          newEventData.primaryTeamId = player.teamId;
          newEventData.reboundDetails = {
            reboundPlayerId: player.id,
            // O tipo (Ofensivo/Defensivo) é inferido pelo selectedEventType
            type:
              selectedEventType === "REBOUND_OFFENSIVE"
                ? "OFFENSIVE"
                : "DEFENSIVE",
          };
          nextStep = "CONFIRM_REBOUND_EVENT"; // Ou um passo para Tip-in
        }
        break;
      case "DEFLECTION":
        if (
          eventStep === "SELECT_PRIMARY_PLAYER" &&
          player.teamId !== gameState.possessionTeamId &&
          isOnCourt
        ) {
          // Quem desviou
          newEventData.primaryPlayerId = player.id;
          newEventData.primaryTeamId = player.teamId;
          newEventData.deflectionDetails = { deflectedByPlayerId: player.id };
          nextStep = "CONFIRM_DEFLECTION_EVENT";
        }
        break;
    }
    updateEventData(newEventData);
    if (nextStep !== eventStep) {
      advanceEventStep(nextStep);
    }
  };

  const _getPlayerById = (
    playerId: string,
    state: GameState
  ): Player | undefined => {
    return [...state.homeTeam.players, ...state.awayTeam.players].find(
      (p) => p.id === playerId
    );
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar atalhos se um input, textarea ou select estiver focado
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.tagName === "SELECT")
      ) {
        return;
      }

      // Atalho para Iniciar/Pausar Cronómetro
      if (e.key === " ") {
        // Espaço
        e.preventDefault();
        if (
          gameState.isGameStarted &&
          !gameState.isGameOver &&
          !gameState.isPausedForEvent &&
          pendingFreeThrows.length === 0
        ) {
          handleToggleGameClock();
        }
      }

      // Atalhos para Tipos de Evento (se nenhum evento estiver em progresso)
      if (!selectedEventType && !gameState.isPausedForEvent) {
        if (e.key === "1") {
          e.preventDefault();
          startEvent("2POINTS_MADE");
        }
        if (e.key === "2") {
          e.preventDefault();
          startEvent("2POINTS_MISSED");
        }
        if (e.key === "3") {
          e.preventDefault();
          startEvent("3POINTS_MADE");
        }
        if (e.key === "4") {
          e.preventDefault();
          startEvent("3POINTS_MISSED");
        }
        if (e.key.toLowerCase() === "f") {
          e.preventDefault();
          startEvent("FOUL_PERSONAL");
        }
        if (e.key.toLowerCase() === "t") {
          e.preventDefault();
          startEvent("TURNOVER");
        }
        if (e.key.toLowerCase() === "s") {
          e.preventDefault();
          startEvent("SUBSTITUTION");
        }
        if (e.key.toLowerCase() === "r") {
          e.preventDefault();
          startEvent("REBOUND_DEFENSIVE");
        } // Exemplo para ressalto
        // Adicionar mais atalhos conforme necessário
      }

      // Atalhos dentro do painel de detalhes do evento
      if (
        selectedEventType ||
        (eventStep === "AWAITING_FREE_THROW" && pendingFreeThrows.length > 0)
      ) {
        if (e.key === "Enter") {
          e.preventDefault();
          if (eventStep === "AWAITING_FREE_THROW") {
            // Poderia mapear Enter para "Convertido" e outra tecla para "Falhado"
            // Por agora, não faz nada aqui, AWAITING_FREE_THROWusa os botões
          } else if (canConfirmEvent()) {
            // canConfirmEvent precisa ser acessível ou a lógica replicada
            confirmCurrentEvent();
          }
        }
        if (e.key === "Escape") {
          e.preventDefault();
          cancelEvent();
        }
      }
      // Atalho para Trocar Posse Manualmente
      if (
        e.key.toLowerCase() === "p" &&
        !selectedEventType &&
        !gameState.isPausedForEvent
      ) {
        e.preventDefault();
        handleTogglePossessionManually();
      }

      // Atalho para Desfazer (Cuidado com este, pode ser sensível)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        // Ctrl+Z ou Cmd+Z
        e.preventDefault();
        if (gameState.events.length > 0 && !selectedEventType) {
          // Só desfaz se não estiver a meio de um evento
          undoLastEvent();
        }
      } else if (e.key === "Backspace" && !selectedEventType) {
        // Backspace (quando não num input)
        e.preventDefault();
        if (gameState.events.length > 0) {
          // Talvez mostrar um diálogo de confirmação antes de desfazer com Backspace
          // undoLastEvent();
          console.log("Atalho Backspace para undo: Considerar confirmação.");
        }
      }

      // Atalhos para Lances Livres
      if (eventStep === "AWAITING_FREE_THROW" && pendingFreeThrows.length > 0) {
        if (e.key === "c" || e.key === "C") {
          // 'C' para Convertido
          e.preventDefault();
          handleFreeThrowResult(true);
        }
        if (e.key === "e" || e.key === "E" || e.key === "x" || e.key === "X") {
          // 'E' ou 'X' para Errado/Falhado
          e.preventDefault();
          handleFreeThrowResult(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    gameState,
    selectedEventType,
    eventStep,
    pendingFreeThrows, // Adicionar todas as dependências relevantes
    startEvent,
    confirmCurrentEvent,
    cancelEvent,
    undoLastEvent,
    handleToggleGameClock,
    handleFreeThrowResult,
    handleTogglePossessionManually,
  ]);

  const canConfirmEvent = (): boolean => {
    if (!selectedEventType || !eventData.type) return false;
    if (eventStep === "AWAITING_FREE_THROW") return false;
    // Copiar/adaptar a lógica de `canConfirmEvent` do `EventDetailPanel` aqui
    // Exemplo simplificado:
    switch (selectedEventType) {
      case "JUMP_BALL":
        return !!(
          eventData.jumpBallDetails?.homePlayerId &&
          eventData.jumpBallDetails?.awayPlayerId &&
          eventData.jumpBallDetails?.wonByTeamId
        );
      // ... mais validações
    }
    return true;
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-200 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
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
        onAdjustTime={handleAdjustTime} // Passa a nova função de ajuste
        onTogglePossessionManually={handleTogglePossessionManually} // Passa a função de troca de posse
        canManuallyStartStop={
          gameState.isGameStarted &&
          !gameState.isGameOver &&
          !gameState.isPausedForEvent &&
          pendingFreeThrows.length === 0
        }
        currentPossessionTeamId={gameState.possessionTeamId}
        homeTeamShortName={gameState.homeTeam.shortName}
        awayTeamShortName={gameState.awayTeam.shortName}
      />

      <main className="flex flex-row flex-1 p-1.5 md:p-2 gap-1.5 md:gap-2 w-full max-w-full overflow-hidden">
        {/* Coluna Esquerda - Jogadores Casa */}
        <div className="w-1/4 lg:w-1/5 xl:w-1/4 flex-shrink-0">
          <TeamPlayersList
            team={gameState.homeTeam}
            onPlayerSelect={handlePlayerListSelection}
            selectedPlayerForEventId={
              eventData.primaryPlayerId ||
              eventData.secondaryPlayerId ||
              eventData.jumpBallDetails?.homePlayerId || // Específico para Salto Inicial
              eventData.substitutionDetails?.playerOutId ||
              eventData.substitutionDetails?.playerInId
            }
            title="Casa"
            disabledInteraction={
              !selectedEventType || // Desabilitado se nenhum evento selecionado
              (eventStep === "AWAITING_FREE_THROW" &&
                pendingFreeThrows.length > 0) || // Desabilitado durante Lances Livres
              selectedEventType === "TIMEOUT_REQUEST" ||
              selectedEventType === "ADMIN_EVENT" // Eventos que não precisam de seleção de jogador aqui
            }
            showSubOutIconPlayerId={eventData.substitutionDetails?.playerOutId}
            showSubInIconPlayerId={eventData.substitutionDetails?.playerInId}
          />
        </div>

        {/* Coluna Central - Conteúdo Dinâmico */}
        <div className="flex-1 min-w-0">
          {!selectedEventType ||
          (eventStep === "AWAITING_FREE_THROW" &&
            pendingFreeThrows.length ===
              0) /* Se acabou os LLS, volta ao painel de eventos */ ? (
            <EventTypeCenterPanel
              onSelectEvent={startEvent}
              isGameStarted={gameState.isGameStarted}
              hasPendingFreeThrows={
                pendingFreeThrows.length > 0 &&
                eventStep === "AWAITING_FREE_THROW"
              }
            />
          ) : (
            <EventDetailPanel
              gameState={gameState}
              selectedEventType={selectedEventType!}
              currentEventData={eventData}
              currentEventStep={eventStep}
              pendingFreeThrows={pendingFreeThrows}
              currentFreeThrowIndex={currentFreeThrowIndex}
              onUpdateEventData={updateEventData}
              onAdvanceStep={advanceEventStep}
              onPlayerSelectedForRole={() => {}} // A seleção é tratada em handlePlayerListSelection
              onConfirm={confirmCurrentEvent}
              onCancel={cancelEvent}
              onFreeThrowAttemptResult={handleFreeThrowResult}
            />
          )}
        </div>

        {/* Coluna Direita - Jogadores Visitante */}
        <div className="w-1/4 lg:w-1/5 xl:w-1/4 flex-shrink-0">
          <TeamPlayersList
            team={gameState.awayTeam}
            onPlayerSelect={handlePlayerListSelection}
            selectedPlayerForEventId={
              eventData.primaryPlayerId ||
              eventData.secondaryPlayerId ||
              eventData.jumpBallDetails?.awayPlayerId || // Específico para Salto Inicial
              eventData.substitutionDetails?.playerOutId ||
              eventData.substitutionDetails?.playerInId
            }
            title="Visitante"
            disabledInteraction={
              !selectedEventType ||
              (eventStep === "AWAITING_FREE_THROW" &&
                pendingFreeThrows.length > 0) ||
              selectedEventType === "TIMEOUT_REQUEST" ||
              selectedEventType === "ADMIN_EVENT"
            }
            showSubOutIconPlayerId={eventData.substitutionDetails?.playerOutId}
            showSubInIconPlayerId={eventData.substitutionDetails?.playerInId}
          />
        </div>
      </main>
      <div className="p-1.5 md:p-2">
        <EventHistoryPanel
          lastEvents={gameState.events}
          onUndo={undoLastEvent}
          teams={[gameState.homeTeam, gameState.awayTeam]}
        />
      </div>
    </div>
  );
}
