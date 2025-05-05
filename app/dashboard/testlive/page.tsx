"use client";

import { useState, useEffect } from "react";
import { EventTypePanel } from "../../../components/event-type-panel";
import { PlayerSelectionPanel } from "../../../components/player-selection-panel";
import { ConfirmationPanel } from "../../../components/confirmation-panel";
import { GameTimer } from "../../../components/game-timer";
import { GameState, Team } from "./game-types";
import { useGameEvents } from "../../../hooks/use-game-events";
import { useGameTimer } from "../../../hooks/use-game-timer";
import { GameHeader } from "@/components/game-header";

// Mock data
const homeTeam: Team = {
  id: "1",
  name: "Los Angeles Lakers",
  shortName: "LAL",
  logo: "https://res.cloudinary.com/ds1lnrvnq/image/upload/v1742420456/dsport/clubs/logo/gljqlouvtgb9r215j9vt.png",
  primaryColor: "#552583",
  secondaryColor: "#FDB927",
  players: [
    {
      id: "1",
      number: 6,
      name: "LeBron James",
      position: "SF",
      teamId: "1",
      photo:
        "https://res.cloudinary.com/ds1lnrvnq/image/upload/v1742947613/dsport/clubs/logo/sn2iq48c9wzocjkqseud.png",
    },
    {
      id: "2",
      number: 7,
      name: "Curry James",
      position: "PG",
      teamId: "1",
      photo:
        "https://res.cloudinary.com/ds1lnrvnq/image/upload/v1742947613/dsport/clubs/logo/sn2iq48c9wzocjkqseud.png",
    },
    {
      id: "3",
      number: 7,
      name: "Adolfo Ricardo",
      position: "SG",
      teamId: "1",
      photo:
        "https://res.cloudinary.com/ds1lnrvnq/image/upload/v1742947613/dsport/clubs/logo/sn2iq48c9wzocjkqseud.png",
    },
    // ... mais jogadores
  ],
};

const awayTeam: Team = {
  id: "2",
  name: "Boston Celtics",
  shortName: "BOS",
  logo: "https://res.cloudinary.com/ds1lnrvnq/image/upload/v1742851303/dsport/clubs/logo/nrldhsluaji6gxu0teeu.png",
  primaryColor: "#007A33",
  secondaryColor: "#BA9653",
  players: [
    {
      id: "21",
      number: 7,
      name: "Jayson Tatum",
      position: "SF",
      teamId: "2",
      photo:
        "https://res.cloudinary.com/ds1lnrvnq/image/upload/v1742947613/dsport/clubs/logo/sn2iq48c9wzocjkqseud.png",
    },
    {
      id: "22",
      number: 10,
      name: "Kelven Levy",
      position: "SF",
      teamId: "2",
      photo:
        "https://res.cloudinary.com/ds1lnrvnq/image/upload/v1742947613/dsport/clubs/logo/sn2iq48c9wzocjkqseud.png",
    },
    {
      id: "23",
      number: 10,
      name: "Edson Sumbane",
      position: "C",
      teamId: "2",
      photo:
        "https://res.cloudinary.com/ds1lnrvnq/image/upload/v1742947613/dsport/clubs/logo/sn2iq48c9wzocjkqseud.png",
    },
    // ... mais jogadores
  ],
};

export default function LiveGamePage() {
  const [gameState, setGameState] = useState<GameState>({
    homeTeam,
    awayTeam,
    homeScore: 0,
    awayScore: 0,
    currentQuarter: 1,
    possession: "HOME",
    events: [],
    isGameOver: false,
  });

  const {
    gameTime,
    isRunning,
    seconds,
    startTimer,
    pauseTimer,
    resetTimer,
    nextQuarter,
  } = useGameTimer(gameState, setGameState);

  const {
    selectedEvent,
    selectedPlayer,
    secondaryPlayer,
    foulPlayer,
    currentStep,
    selectEvent,
    selectPlayer,
    selectSecondaryPlayer,
    handleFoulSelection,
    handleSkipStep,
    confirmEvent,
    lastEvents,
    undoLastEvent,
    resetSelection,
    hasFoul,
    selectFoulPlayer,
  } = useGameEvents(gameState, setGameState, seconds);

  const togglePossession = () => {
    setGameState((prev) => ({
      ...prev,
      possession: prev.possession === "HOME" ? "AWAY" : "HOME",
    }));
  };

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT") return;

      // Atalhos para tipos de evento
      if (e.key === "1") selectEvent("2POINTS_MADE");
      if (e.key === "2") selectEvent("2POINTS_MISSED");
      if (e.key === "3") selectEvent("3POINTS_MADE");
      if (e.key === "4") selectEvent("3POINTS_MISSED");
      if (e.key === "5") selectEvent("FREE_THROW_MADE");
      if (e.key === "6") selectEvent("FREE_THROW_MISSED");
      if (e.key.toLowerCase() === "f") selectEvent("FOUL_PERSONAL");
      if (e.key.toLowerCase() === "t") selectEvent("TURNOVER");
      if (e.key.toLowerCase() === "s") selectEvent("SUBSTITUTION");
      if (e.key === " ") isRunning ? pauseTimer() : startTimer();
      if (e.key === "p") togglePossession();
      if (e.key === "Enter") {
        if (selectedEvent && selectedPlayer) {
          if (selectedEvent === "SUBSTITUTION" && !secondaryPlayer) {
            return; // Não permite confirmar substituição sem jogador que entra
          }
          confirmEvent();
        }
      }
      if (e.key === "Backspace") undoLastEvent();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedEvent, selectedPlayer, isRunning, secondaryPlayer]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <GameHeader
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        homeScore={gameState.homeScore}
        awayScore={gameState.awayScore}
        currentQuarter={gameState.currentQuarter}
        gameTime={gameTime}
        possession={gameState.possession}
        isGameOver={gameState.isGameOver}
        winner={gameState.winner}
      />

      <GameTimer
        gameTime={gameTime}
        isRunning={isRunning}
        currentQuarter={gameState.currentQuarter}
        onStart={startTimer}
        onPause={pauseTimer}
        onReset={resetTimer}
        onNextQuarter={nextQuarter}
        onTogglePossession={togglePossession}
      />

      <main className="flex flex-col lg:flex-row flex-1 p-2 md:p-4 gap-3 max-w-7xl mx-auto w-full">
        <div className="w-full lg:w-1/4">
          <EventTypePanel
            selectedEvent={selectedEvent}
            onSelectEvent={selectEvent}
          />
        </div>

        <div className="w-full lg:w-2/4">
          <PlayerSelectionPanel
            selectedEvent={selectedEvent}
            selectedPlayer={selectedPlayer}
            secondaryPlayer={secondaryPlayer}
            foulPlayer={foulPlayer}
            currentTeam={gameState.possession === "HOME" ? homeTeam : awayTeam}
            opponentTeam={gameState.possession === "HOME" ? awayTeam : homeTeam}
            currentStep={currentStep}
            onSelectPlayer={selectPlayer}
            onSelectSecondaryPlayer={selectSecondaryPlayer}
            hasFoul={hasFoul}
            onSelectFoulPlayer={selectFoulPlayer}
            onFoulSelection={handleFoulSelection}
            onSkipStep={handleSkipStep}
            onConfirm={confirmEvent}
            onCancel={resetSelection}
          />
        </div>

        <div className="w-full lg:w-1/4">
          <ConfirmationPanel
            selectedEvent={selectedEvent}
            selectedPlayer={selectedPlayer}
            secondaryPlayer={secondaryPlayer}
            foulPlayer={foulPlayer}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            onConfirm={confirmEvent}
            lastEvents={lastEvents}
            onUndo={undoLastEvent}
            gameTime={gameTime}
            currentQuarter={gameState.currentQuarter}
          />
        </div>
      </main>
    </div>
  );
}
