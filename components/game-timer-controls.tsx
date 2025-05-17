// src/components/game-timer-controls.tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pause,
  Play,
  Settings,
  SkipForward,
  Repeat,
} from "lucide-react"; // Adicionado Repeat
import { useState } from "react";

interface GameTimerControlsProps {
  isGameClockRunning: boolean;
  onToggleGameClock: () => void;
  onAdvanceQuarter: () => void;
  onAdjustTime: (minutes: number, seconds: number) => void; // Modificado para aceitar minutos e segundos
  onTogglePossessionManually: () => void; // Adicionado
  canManuallyStartStop: boolean;
  currentPossessionTeamId: string | null; // Para mostrar a posse atual (opcional)
  homeTeamShortName: string; // Para o botão de posse
  awayTeamShortName: string; // Para o botão de posse
}

export function GameTimerControls({
  isGameClockRunning,
  onToggleGameClock,
  onAdvanceQuarter,
  onAdjustTime,
  onTogglePossessionManually,
  canManuallyStartStop,
  currentPossessionTeamId,
  homeTeamShortName,
  awayTeamShortName,
}: GameTimerControlsProps) {
  const [showAdjustPanel, setShowAdjustPanel] = useState(false);
  const [adjMinutes, setAdjMinutes] = useState("0");
  const [adjSeconds, setAdjSeconds] = useState("0");

  const handleApplyTimeAdjustment = () => {
    const minutes = parseInt(adjMinutes, 10) || 0;
    const seconds = parseInt(adjSeconds, 10) || 0;
    onAdjustTime(minutes, seconds); // Chama a função de ajuste com minutos e segundos
    setAdjMinutes("0");
    setAdjSeconds("0");
    setShowAdjustPanel(false);
  };

  const getPossessionLabel = () => {
    if (!currentPossessionTeamId) return "Posse N/D";
    // Assumindo que os IDs são "HOME_TEAM_ID" e "AWAY_TEAM_ID" como no exemplo anterior
    // Ajuste esta lógica se os IDs forem diferentes
    if (currentPossessionTeamId === "HOME_TEAM_ID")
      return `Posse: ${homeTeamShortName}`;
    if (currentPossessionTeamId === "AWAY_TEAM_ID")
      return `Posse: ${awayTeamShortName}`;
    return "Posse ?";
  };

  return (
    <div className="bg-gray-700 text-white p-2 flex flex-wrap justify-center items-center gap-2 shadow-md">
      <Button
        variant={isGameClockRunning ? "destructive" : "default"}
        onClick={onToggleGameClock}
        size="sm"
        className="gap-1"
        disabled={!canManuallyStartStop}
        title={
          isGameClockRunning ? "Pausar Jogo (Espaço)" : "Iniciar Jogo (Espaço)"
        }
      >
        {isGameClockRunning ? <Pause size={16} /> : <Play size={16} />}
        Tempo
      </Button>
      <Button
        variant="outline"
        onClick={onAdvanceQuarter}
        size="sm"
        className="gap-1 bg-yellow-500 hover:bg-yellow-600 text-black"
      >
        <SkipForward size={16} /> Período
      </Button>
      <Button
        variant="outline"
        onClick={onTogglePossessionManually}
        size="sm"
        className="gap-1"
        title="Trocar Posse Manualmente (P)"
      >
        <Repeat size={16} /> Posse
      </Button>
      {/* <span className="text-xs hidden md:inline">({getPossessionLabel()})</span> */}

      <Button
        variant="outline"
        onClick={() => setShowAdjustPanel(!showAdjustPanel)}
        size="sm"
        className="gap-1"
      >
        <Settings size={16} /> Ajustar Tempo
      </Button>

      {showAdjustPanel && (
        <div className="w-full flex flex-col md:flex-row items-center justify-center gap-2 p-2 border-t border-gray-600 mt-2">
          <div className="flex items-center gap-1">
            <Label htmlFor="adjMin" className="text-xs">
              Min:
            </Label>
            <Input
              type="number"
              id="adjMin"
              value={adjMinutes}
              onChange={(e) => setAdjMinutes(e.target.value)}
              className="w-14 h-8 text-black"
              placeholder="M"
              min="0"
              max="99"
            />
          </div>
          <div className="flex items-center gap-1">
            <Label htmlFor="adjSec" className="text-xs">
              Seg:
            </Label>
            <Input
              type="number"
              id="adjSec"
              value={adjSeconds}
              onChange={(e) => setAdjSeconds(e.target.value)}
              className="w-14 h-8 text-black"
              placeholder="S"
              min="0"
              max="59"
            />
          </div>
          <Button onClick={handleApplyTimeAdjustment} size="sm">
            Aplicar Ajuste
          </Button>
        </div>
      )}
    </div>
  );
}
