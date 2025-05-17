import { useState, useEffect, useCallback, useRef } from "react";

export function useGameTimer(
  initialGameClockSeconds: number,
  isGameClockExternallyRunning: boolean,
  onGameClockTick: (newTime: number) => void,
  onGamePeriodEnd: () => void
) {
  const [gameClock, setGameClock] = useState(initialGameClockSeconds);
  const gameClockIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setGameClock(initialGameClockSeconds);
  }, [initialGameClockSeconds]);

  const clearGameClockInterval = useCallback(() => {
    if (gameClockIntervalRef.current) {
      clearInterval(gameClockIntervalRef.current);
      gameClockIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isGameClockExternallyRunning && gameClock > 0) {
      clearGameClockInterval();
      gameClockIntervalRef.current = setInterval(() => {
        setGameClock((prev) => {
          const newTime = Math.max(0, prev - 1);
          onGameClockTick(newTime);
          if (newTime === 0) {
            onGamePeriodEnd();
            clearGameClockInterval();
          }
          return newTime;
        });
      }, 1000);
    } else {
      clearGameClockInterval();
    }
    return clearGameClockInterval;
  }, [
    isGameClockExternallyRunning,
    gameClock,
    onGameClockTick,
    onGamePeriodEnd,
    clearGameClockInterval,
  ]);

  const formatGameTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  return {
    gameClockFormatted: formatGameTime(gameClock),
  };
}
