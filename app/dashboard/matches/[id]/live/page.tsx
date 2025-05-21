"use client";

import { useState, useEffect } from "react";
import {
  GameState,
  Team,
  Player,
  TeamInGame,
  GameSettings,
  createInitialPlayer,
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
import { generateId } from "@/lib/utils";
import {
  PLAYER_FOULS_EJECTION_PERSONAL,
  PLAYER_FOULS_EJECTION_TECHNICAL,
  TEAM_FOULS_BONUS_THRESHOLD,
} from "@/app/data/basketball-definitions";

// --- Dados Mockados Iniciais ---
const DEFAULT_GAME_SETTINGS: GameSettings = {
  quarters: 4,
  minutesPerQuarter: 10, // FIBA standard, NBA is 12
  minutesPerOvertime: 5,
  teamFoulsForBonus: TEAM_FOULS_BONUS_THRESHOLD,
  playerFoulsToEject: PLAYER_FOULS_EJECTION_PERSONAL,
  playerTechFoulsToEject: PLAYER_FOULS_EJECTION_TECHNICAL,
  coachTechFoulsToEject: 2, // Exemplo
};

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
    timeouts: { full_60_left: 5, short_30_left: 2, mandatory_tv_left: 3 }, // Exemplo de valores iniciais
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
      possessionTeamId: null,
      possessionArrow: null,
      events: [],
      isGameStarted: false,
      isGameClockRunning: false,
      isPausedForEvent: false,
      isGameOver: false,
      winnerTeamId: null,
      eventInProgress: undefined, // Inicialmente nenhum evento em progresso
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
    getPlayerById,
  } = useGameEvents(gameState, setGameState);

  const { gameClockFormatted } = useGameTimer(
    gameState.gameClockSeconds,
    gameState.isGameClockRunning,
    (newTime) =>
      setGameState((prev) => ({ ...prev, gameClockSeconds: newTime })),
    () => {
      // onGamePeriodEnd
      setGameState((prev) => ({ ...prev, isGameClockRunning: false }));
      if (
        !gameState.isPausedForEvent &&
        selectedEventType !== "ADMIN_EVENT" &&
        !gameState.isGameOver
      ) {
        startEvent("ADMIN_EVENT");
        // Passa o estado atual para que o evento de fim de período possa usá-lo
        updateEventData({
          adminEventDetails: { action: "END_PERIOD" },
          quarter: gameState.currentQuarter,
        });
      }
    }
  );

  const handleToggleGameClock = () => {
    if (
      !gameState.isGameStarted ||
      gameState.isGameOver ||
      gameState.isPausedForEvent ||
      (pendingFreeThrows.length > 0 &&
        currentFreeThrowIndex < pendingFreeThrows.length)
    )
      return;
    setGameState((prev) => ({
      ...prev,
      isGameClockRunning: !prev.isGameClockRunning,
    }));
  };

  const handleAdvanceQuarterAdmin = () => {
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
    if (!gameState.isPausedForEvent) {
      // Só ajusta se não estiver a meio de um evento que pausa o jogo
      const newTotalSeconds = minutes * 60 + seconds;
      setGameState((prev) => ({
        ...prev,
        gameClockSeconds: Math.max(0, newTotalSeconds),
      }));
    }
  };

  const handleTogglePossessionManually = () => {
    if (!gameState.isPausedForEvent && !selectedEventType) {
      setGameState((prev) => {
        let newPossessionTeamId = null;
        if (prev.possessionTeamId === prev.homeTeam.id)
          newPossessionTeamId = prev.awayTeam.id;
        else if (prev.possessionTeamId === prev.awayTeam.id)
          newPossessionTeamId = prev.homeTeam.id;
        else newPossessionTeamId = prev.homeTeam.id; // Default para casa se era nulo

        alert(
          `Posse de bola alterada manualmente para: ${
            newPossessionTeamId === prev.homeTeam.id
              ? prev.homeTeam.shortName
              : prev.awayTeam.shortName
          }`
        );
        return { ...prev, possessionTeamId: newPossessionTeamId };
      });
    }
  };

  const handlePlayerListSelection = (player: Player, isOnCourt: boolean) => {
    if (!selectedEventType || !eventData.type || !eventStep) {
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

    // A lógica de atribuição específica para cada evento/passo deve ser o mais granular possível aqui
    // ou delegada para o EventDetailPanel/useGameEvents se a UI do painel de detalhes
    // tiver inputs específicos para cada papel de jogador.
    // Esta função é o ponto de entrada da interação do usuário com as listas de jogadores.

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
          // Se ambos selecionados, o EventDetailPanel mostrará o botão "Próximo"
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
          // Selecionando assistente
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
          // Quem cometeu a falta no arremesso
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
          // Quem pegou o ressalto
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
          // Quem cometeu
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
          // Quem sofreu
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
          // Jogador infrator
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
          // Quem cobra LL
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
          newEventData.turnoverDetails?.stolenByPlayerId !==
            undefined /* switch ativo */ &&
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
          // Quem roubou
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
          // Quem bloqueou
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
          // Quem pegou
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
          // Quem desviou
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
            // Poderia avançar automaticamente aqui ou deixar o usuário clicar em "Próximo" no painel
          }
        }
        break;
    }
    updateEventData(newEventData);
    if (nextStep !== eventStep) advanceEventStep(nextStep);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
        // Não para LL ativos
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
    /* Adicionar todas as funções do hook e handlers */ startEvent,
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
    if (!selectedEventType || !eventData.type) return false;
    if (eventStep === "AWAITING_FREE_THROW") return false;
    if (eventStep?.startsWith("CONFIRM_")) return true;

    // Validações mais específicas para quando o botão "Confirmar" geral deve estar ativo
    // Esta lógica precisa ser robusta e cobrir todos os fluxos.
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
        ); // Se não está a espera de tip-in
      // ... mais validações para outros eventos e seus passos finais
    }
    return false; // Default para desabilitado se não houver regra clara
  };

  const showEventDetailPanel =
    selectedEventType !== null &&
    !(
      eventStep === "AWAITING_FREE_THROW" &&
      pendingFreeThrows.length > 0 &&
      currentFreeThrowIndex >= pendingFreeThrows.length
    );

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
      <main className="flex flex-row flex-1 p-1.5 md:p-2 gap-1.5 md:gap-2 w-full max-w-full overflow-hidden">
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
              !selectedEventType || // Desabilitado se nenhum evento principal selecionado
              (eventStep === "AWAITING_FREE_THROW" &&
                pendingFreeThrows.length > 0 &&
                currentFreeThrowIndex < pendingFreeThrows.length) || // Desabilitado durante LLs ativos
              // Para eventos que não usam seleção de jogador das listas laterais neste passo específico
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
          {showEventDetailPanel ? ( // Usa a condição calculada
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
              onSelectEvent={startEvent}
              isGameStarted={gameState.isGameStarted}
              // Passa a informação se há LLs ativos para que o painel possa mostrar uma mensagem ou opções limitadas
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
