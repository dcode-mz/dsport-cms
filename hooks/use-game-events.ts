import { useState } from "react";
import {
  GameState,
  EventType,
  Player,
  GameEvent,
  RelatedEvent,
} from "@/app/types/match-live";

type SelectionStep = "main" | "assist" | "foul" | "rebound" | "substitution";

export function useGameEvents(
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>,
  seconds: number
) {
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [secondaryPlayer, setSecondaryPlayer] = useState<Player | null>(null);
  const [foulPlayer, setFoulPlayer] = useState<Player | null>(null);
  const [hasFoul, setHasFoul] = useState<boolean>(false);
  const [lastEvents, setLastEvents] = useState<GameEvent[]>([]);
  const [currentStep, setCurrentStep] = useState<SelectionStep>("main");

  const formatGameTime = () => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  const getQuarterLabel = () => {
    return gameState.currentQuarter <= 4
      ? `Q${gameState.currentQuarter}`
      : `OT${gameState.currentQuarter - 4}`;
  };

  const selectEvent = (eventType: EventType) => {
    setSelectedEvent(eventType);
    setSelectedPlayer(null);
    setSecondaryPlayer(null);
    setFoulPlayer(null);
    setHasFoul(false);
    setCurrentStep("main");
  };

  const selectPlayer = (player: Player) => {
    if (!selectedEvent) return;

    setSelectedPlayer(player);

    switch (selectedEvent) {
      case "2POINTS_MADE":
      case "3POINTS_MADE":
        setCurrentStep("assist");
        break;
      case "2POINTS_MISSED":
      case "3POINTS_MISSED":
      case "FREE_THROW_MISSED":
        setCurrentStep("rebound");
        break;
      case "SUBSTITUTION":
        setCurrentStep("substitution");
        break;
      default:
        break;
    }
  };

  const selectSecondaryPlayer = (player: Player) => {
    setSecondaryPlayer(player);

    if (["2POINTS_MADE", "3POINTS_MADE"].includes(selectedEvent!)) {
      setCurrentStep("foul");
    }
  };

  const handleFoulSelection = (hasFoul: boolean) => {
    setHasFoul(hasFoul);
    setFoulPlayer(null);
  };

  const selectFoulPlayer = (player: Player) => {
    setFoulPlayer(player);
  };

  const handleSkipStep = () => {
    switch (currentStep) {
      case "assist":
        setCurrentStep("foul");
        break;
      default:
        break;
    }
  };

  const resetSelection = () => {
    setSelectedPlayer(null);
    setSecondaryPlayer(null);
    setFoulPlayer(null);
    setHasFoul(false);
    setCurrentStep("main");
  };

  const confirmEvent = () => {
    if (!selectedEvent || !selectedPlayer) return;

    // Validações específicas
    if (selectedEvent === "SUBSTITUTION" && !secondaryPlayer) {
      alert("Selecione o jogador que vai entrar");
      return;
    }

    if (hasFoul && !foulPlayer) {
      alert("Selecione o jogador que cometeu a falta");
      return;
    }

    const gameTime = `${getQuarterLabel()} ${formatGameTime()}`;
    const baseEvent: Omit<GameEvent, "id"> = {
      type: selectedEvent,
      playerId: selectedPlayer.id,
      teamId: selectedPlayer.teamId,
      gameTime,
      timestamp: new Date(),
      quarter: gameState.currentQuarter,
    };

    // Adicionar pontos se for cesta
    if (selectedEvent.includes("MADE")) {
      Object.assign(baseEvent, {
        points: selectedEvent.startsWith("2") ? 2 : 3,
      });
    } else if (selectedEvent === "FREE_THROW_MADE") {
      Object.assign(baseEvent, { points: 1 });
    }

    const relatedEvents: RelatedEvent[] = [];

    // Assistências
    if (
      ["2POINTS_MADE", "3POINTS_MADE"].includes(selectedEvent) &&
      secondaryPlayer
    ) {
      relatedEvents.push({
        type: "ASSIST",
        playerId: secondaryPlayer.id,
        teamId: secondaryPlayer.teamId,
      });
    }

    // Faltas durante a cesta
    if (hasFoul && foulPlayer) {
      relatedEvents.push({
        type: "FOUL_PERSONAL",
        playerId: foulPlayer.id,
        teamId: foulPlayer.teamId,
      });
    }

    // Rebotes
    if (
      ["2POINTS_MISSED", "3POINTS_MISSED", "FREE_THROW_MISSED"].includes(
        selectedEvent
      ) &&
      secondaryPlayer
    ) {
      const reboundType =
        secondaryPlayer.teamId === selectedPlayer.teamId
          ? "OFFENSIVE_REBOUND"
          : "DEFENSIVE_REBOUND";

      relatedEvents.push({
        type: reboundType,
        playerId: secondaryPlayer.id,
        teamId: secondaryPlayer.teamId,
      });
    }

    // Roubos em turnovers
    if (selectedEvent === "TURNOVER" && secondaryPlayer) {
      relatedEvents.push({
        type: "STEAL",
        playerId: secondaryPlayer.id,
        teamId: secondaryPlayer.teamId,
      });
    }

    // Substituições
    if (selectedEvent === "SUBSTITUTION" && secondaryPlayer) {
      relatedEvents.push({
        type: "SUBSTITUTION",
        playerId: secondaryPlayer.id,
        teamId: secondaryPlayer.teamId,
      });
    }

    const completeEvent: GameEvent = {
      ...baseEvent,
      id: Date.now().toString(),
      ...(relatedEvents.length > 0 && { relatedEvents }),
    };

    // Atualizar placar e posse de bola
    const newState = { ...gameState };

    if (
      selectedEvent === "2POINTS_MADE" &&
      selectedPlayer.teamId === gameState.homeTeam.id
    ) {
      newState.homeScore += 2;
    } else if (
      selectedEvent === "2POINTS_MADE" &&
      selectedPlayer.teamId === gameState.awayTeam.id
    ) {
      newState.awayScore += 2;
    } else if (
      selectedEvent === "3POINTS_MADE" &&
      selectedPlayer.teamId === gameState.homeTeam.id
    ) {
      newState.homeScore += 3;
    } else if (
      selectedEvent === "3POINTS_MADE" &&
      selectedPlayer.teamId === gameState.awayTeam.id
    ) {
      newState.awayScore += 3;
    } else if (
      selectedEvent === "FREE_THROW_MADE" &&
      selectedPlayer.teamId === gameState.homeTeam.id
    ) {
      newState.homeScore += 1;
    } else if (
      selectedEvent === "FREE_THROW_MADE" &&
      selectedPlayer.teamId === gameState.awayTeam.id
    ) {
      newState.awayScore += 1;
    }

    if (["TURNOVER", "STEAL", "DEFENSIVE_REBOUND"].includes(selectedEvent)) {
      newState.possession = newState.possession === "HOME" ? "AWAY" : "HOME";
    }

    setGameState({
      ...newState,
      events: [...newState.events, completeEvent],
    });

    setLastEvents((prev) => [completeEvent, ...prev].slice(0, 5));
    resetSelection();
  };

  const undoLastEvent = () => {
    if (gameState.events.length === 0) return;

    const lastEvent = gameState.events[gameState.events.length - 1];
    const newState = { ...gameState };

    if (lastEvent.points) {
      if (lastEvent.teamId === gameState.homeTeam.id) {
        newState.homeScore -= lastEvent.points;
      } else {
        newState.awayScore -= lastEvent.points;
      }
    }

    setGameState({
      ...newState,
      events: newState.events.slice(0, -1),
    });

    setLastEvents((prev) => prev.slice(1));
  };

  return {
    selectedEvent,
    selectedPlayer,
    secondaryPlayer,
    foulPlayer,
    hasFoul,
    currentStep,
    selectEvent,
    selectPlayer,
    selectSecondaryPlayer,
    handleFoulSelection,
    selectFoulPlayer,
    handleSkipStep,
    confirmEvent,
    lastEvents,
    undoLastEvent,
    resetSelection,
    needsSecondaryPlayer: (eventType: EventType | null) => {
      if (!eventType) return false;
      return ["SUBSTITUTION"].includes(eventType);
    },
    isSecondaryPlayerOptional: (eventType: EventType | null) => {
      if (!eventType) return false;
      return [
        "2POINTS_MADE",
        "3POINTS_MADE",
        "2POINTS_MISSED",
        "3POINTS_MISSED",
        "FREE_THROW_MISSED",
        "TURNOVER",
      ].includes(eventType);
    },
  };
}
