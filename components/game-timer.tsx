"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface GameTimerProps {
  gameTime: string;
  isRunning: boolean;
  currentQuarter: number;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onNextQuarter: () => void;
  onTogglePossession: () => void;
  onTimeAdjust: (minutes: number, seconds: number) => void;
}

export function GameTimer({
  gameTime,
  isRunning,
  currentQuarter,
  onStart,
  onPause,
  onReset,
  onNextQuarter,
  onTogglePossession,
  onTimeAdjust,
}: GameTimerProps) {
  const [editMode, setEditMode] = useState(false);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const [mins, secs] = gameTime.split(":").map(Number);
    setMinutes(mins);
    setSeconds(secs);
  }, [gameTime]);

  const handleSave = () => {
    onTimeAdjust(minutes, seconds);
    setEditMode(false);
  };

  const handleIncrement = (type: "minutes" | "seconds") => {
    if (type === "minutes") {
      setMinutes((prev) => Math.min(prev + 1, 59));
    } else {
      setSeconds((prev) => (prev + 1) % 60); // Incrementa de 5 em 5 segundos
    }
  };

  const handleDecrement = (type: "minutes" | "seconds") => {
    if (type === "minutes") {
      setMinutes((prev) => Math.max(prev - 1, 0));
    } else {
      setSeconds((prev) => (prev - 1 + 60) % 60); // Decrementa de 5 em 5 segundos
    }
  };

  const isOvertime = currentQuarter > 4;
  // const quarterLabel = isOvertime
  //   ? `OT${currentQuarter - 4}`
  //   : `Q${currentQuarter}`;

  return (
    <div className="bg-gray-800 text-white p-3 flex flex-wrap justify-center gap-2 shadow-md">
      {editMode ? (
        <div className="flex items-center gap-1 bg-gray-700 px-3 py-1 rounded-full">
          <div className="flex flex-col items-center">
            <button
              onClick={() => handleIncrement("minutes")}
              className="p-1 hover:bg-gray-600 rounded-full"
            >
              ▲
            </button>
            <span className="font-mono text-xl w-8 text-center">
              {minutes.toString().padStart(2, "0")}
            </span>
            <button
              onClick={() => handleDecrement("minutes")}
              className="p-1 hover:bg-gray-600 rounded-full"
            >
              ▼
            </button>
          </div>
          <span className="font-mono text-xl">:</span>
          <div className="flex flex-col items-center">
            <button
              onClick={() => handleIncrement("seconds")}
              className="p-1 hover:bg-gray-600 rounded-full"
            >
              ▲
            </button>
            <span className="font-mono text-xl w-8 text-center">
              {seconds.toString().padStart(2, "0")}
            </span>
            <button
              onClick={() => handleDecrement("seconds")}
              className="p-1 hover:bg-gray-600 rounded-full"
            >
              ▼
            </button>
          </div>
          <Button onClick={handleSave} size="sm" className="ml-2">
            OK
          </Button>
        </div>
      ) : (
        <div
          className="flex items-center gap-2 bg-gray-700 px-3 py-1 rounded-full cursor-pointer"
          onClick={() => setEditMode(true)}
        >
          <span className="font-mono">
            {currentQuarter <= 4
              ? `Q${currentQuarter}`
              : `OT${currentQuarter - 4}`}
          </span>
          <span className="font-mono text-lg">{gameTime}</span>
        </div>
      )}

      <Button
        variant={isRunning ? "destructive" : "default"}
        onClick={isRunning ? onPause : onStart}
        size="sm"
        className="gap-2"
      >
        {isRunning ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            Pausar (Espaço)
          </>
        ) : (
          "Iniciar (Espaço)"
        )}
      </Button>

      <Button variant="secondary" onClick={onReset} size="sm">
        Resetar
      </Button>

      <Button
        variant="default"
        onClick={onNextQuarter}
        size="sm"
        className={cn(isOvertime ? "bg-yellow-600 hover:bg-yellow-700" : "")}
      >
        {isOvertime ? `Próxima OT` : `Próximo Quarto`}
      </Button>

      <Button variant="secondary" onClick={onTogglePossession} size="sm">
        Trocar Posse (P)
      </Button>
    </div>
  );
}
