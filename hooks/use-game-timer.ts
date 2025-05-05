import { GameState } from "@/app/types/match-live";
import { useState, useEffect } from "react";

export function useGameTimer(
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
) {
  const [seconds, setSeconds] = useState(
    gameState.currentQuarter <= 4 ? 600 : 300 // 10min para quartos, 5min para OT
  );
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    setSeconds(gameState.currentQuarter <= 4 ? 600 : 300);
  }, [gameState.currentQuarter]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((prev) => prev - 1);
      }, 1000);
    } else if (seconds === 0 && isRunning) {
      handlePeriodEnd();
    }

    return () => clearInterval(interval);
  }, [isRunning, seconds]);

  const handlePeriodEnd = () => {
    setIsRunning(false);
    const isGameOver =
      gameState.currentQuarter >= 4 &&
      (gameState.currentQuarter > 4 ||
        gameState.homeScore !== gameState.awayScore);

    setGameState((prev) => ({
      ...prev,
      isGameOver,
      winner: isGameOver
        ? prev.homeScore > prev.awayScore
          ? "HOME"
          : "AWAY"
        : undefined,
    }));
  };

  const startTimer = () => {
    // Não inicia automaticamente em intervalos ou fim de período
    if (gameState.isGameOver || seconds <= 0) return;

    setIsRunning(true);
  };

  const pauseTimer = () => setIsRunning(false);

  const resetTimer = () =>
    setSeconds(gameState.currentQuarter <= 4 ? 600 : 300);

  const nextQuarter = () => {
    const newQuarter = gameState.currentQuarter + 1;
    setGameState((prev) => ({
      ...prev,
      currentQuarter: newQuarter,
      isGameOver: newQuarter > 4 && prev.homeScore !== prev.awayScore,
    }));
    setSeconds(newQuarter <= 4 ? 600 : 300); // 5min para prorrogação
    setIsRunning(false); // Garante que não inicia automaticamente
  };

  const handleTimeAdjust = (minutes: number, seconds: number) => {
    const totalSeconds = minutes * 60 + seconds;
    setSeconds(totalSeconds);
  };

  const formatTime = () => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return {
    seconds,
    gameTime: formatTime(),
    isRunning,
    startTimer,
    pauseTimer,
    resetTimer,
    nextQuarter,
    handleTimeAdjust,
  };
}
