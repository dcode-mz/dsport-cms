import Image from "next/image";
import {
  TeamInGame,
  PossessionArrowDirection,
  GameSettings,
} from "@/app/types/match-live";
import { ArrowRight, ArrowLeft, Clock, ShieldAlert, Users } from "lucide-react";

interface GameHeaderProps {
  homeTeam: TeamInGame;
  awayTeam: TeamInGame;
  homeScore: number;
  awayScore: number;
  currentQuarter: number;
  gameTime: string; // Formatted
  possessionTeamId: string | null;
  possessionArrow: PossessionArrowDirection;
  isGameOver: boolean;
  winnerTeamId?: string | null;
  gameSettings: GameSettings; // Adicionado para mostrar info de bónus
}

export function GameHeader({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  currentQuarter,
  gameTime,
  possessionTeamId,
  possessionArrow,
  isGameOver,
  winnerTeamId,
  gameSettings,
}: GameHeaderProps) {
  const getQuarterLabel = () => {
    if (isGameOver) return "FIM";
    if (currentQuarter <= gameSettings.quarters) return `Q${currentQuarter}`;
    return `OT${currentQuarter - gameSettings.quarters}`;
  };

  const getWinnerText = () => {
    if (!winnerTeamId && isGameOver) return "EMPATE";
    if (!winnerTeamId) return null;
    return `${
      winnerTeamId === homeTeam.id ? homeTeam.shortName : awayTeam.shortName
    } VENCEU`;
  };

  return (
    <header
      className="bg-gray-800 text-white p-2 md:p-3 shadow-lg sticky top-0 z-50"
      style={
        {
          "--home-color": homeTeam.primaryColor,
          "--away-color": awayTeam.primaryColor,
        } as React.CSSProperties
      }
    >
      <div className="flex justify-between items-center max-w-full mx-auto px-2">
        {/* Time da Casa */}
        <div className="flex items-center gap-2 md:gap-3 w-1/3">
          <div className="relative w-10 h-10 md:w-14 md:h-14 flex-shrink-0">
            <Image
              src={homeTeam.logo}
              alt={homeTeam.name}
              fill
              className="object-contain"
            />
          </div>
          <div className="text-left">
            <h2 className="text-sm md:text-lg font-bold truncate max-w-[100px] md:max-w-[150px]">
              {homeTeam.shortName}
            </h2>
            <p className="text-2xl md:text-4xl font-bold">{homeScore}</p>
            <div className="flex items-center gap-1 text-xs mt-0.5">
              <Users size={12} /> Faltas: {homeTeam.teamFoulsThisQuarter}
              {homeTeam.isInBonus && (
                <ShieldAlert
                  size={12}
                  className="text-red-400"
                  title="Em Bónus"
                />
              )}
            </div>
            <div className="flex items-center gap-1 text-xs">
              <Clock size={12} /> Tempos: {homeTeam.timeoutsLeft}
            </div>
          </div>
          {possessionTeamId === homeTeam.id && (
            <div className="w-1.5 h-8 md:h-12 rounded-full bg-[var(--home-color)] ml-2 animate-pulse"></div>
          )}
        </div>

        {/* Placar Central */}
        <div className="flex flex-col items-center justify-center w-1/3 text-center gap-1">
          <div className="text-xs md:text-sm font-medium bg-gray-700 px-2 py-0.5 rounded-full">
            {getQuarterLabel()}
          </div>
          <p className="text-2xl md:text-4xl font-mono bg-black px-2 py-0.5 md:px-3 md:py-1 rounded-lg tabular-nums">
            {gameTime}
          </p>

          {possessionArrow && (
            <div
              className="mt-1 flex items-center text-sm bg-gray-700 px-1.5 py-0.5 rounded-full"
              title="Próxima Posse Alternada"
            >
              {possessionArrow === "HOME" ? (
                <ArrowLeft size={14} className="text-[var(--home-color)]" />
              ) : (
                <ArrowRight size={14} className="text-[var(--away-color)]" />
              )}
            </div>
          )}
          {isGameOver && (
            <div className="mt-1 text-xs md:text-base font-bold bg-yellow-500 text-gray-900 px-2 py-0.5 md:px-3 md:py-0.5 rounded-full">
              {getWinnerText()}
            </div>
          )}
        </div>

        {/* Time Visitante */}
        <div className="flex items-center gap-2 md:gap-3 w-1/3 justify-end">
          {possessionTeamId === awayTeam.id && (
            <div className="w-1.5 h-8 md:h-12 rounded-full bg-[var(--away-color)] mr-2 animate-pulse"></div>
          )}
          <div className="text-right">
            <h2 className="text-sm md:text-lg font-bold truncate max-w-[100px] md:max-w-[150px]">
              {awayTeam.shortName}
            </h2>
            <p className="text-2xl md:text-4xl font-bold">{awayScore}</p>
            <div className="flex items-center justify-end gap-1 text-xs mt-0.5">
              {awayTeam.isInBonus && (
                <ShieldAlert
                  size={12}
                  className="text-red-400"
                  title="Em Bónus"
                />
              )}
              Faltas: {awayTeam.teamFoulsThisQuarter} <Users size={12} />
            </div>
            <div className="flex items-center justify-end gap-1 text-xs">
              Tempos: {awayTeam.timeoutsLeft} <Clock size={12} />
            </div>
          </div>
          <div className="relative w-10 h-10 md:w-14 md:h-14 flex-shrink-0">
            <Image
              src={awayTeam.logo}
              alt={awayTeam.name}
              fill
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
