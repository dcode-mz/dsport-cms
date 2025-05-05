import Image from "next/image";
import { cn } from "@/lib/utils";
import { Team } from "@/app/types/match-live";

interface GameHeaderProps {
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  currentQuarter: number;
  gameTime: string;
  possession: "HOME" | "AWAY";
  isGameOver: boolean;
  winner?: "HOME" | "AWAY" | "DRAW";
}

export function GameHeader({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  currentQuarter,
  gameTime,
  possession,
  isGameOver,
  winner,
}: GameHeaderProps) {
  const getQuarterLabel = () => {
    if (isGameOver) return "FIM DE JOGO";
    if (currentQuarter <= 4) return `Q${currentQuarter}`;
    return `PRÓT ${currentQuarter - 4}`;
  };

  const getWinnerText = () => {
    if (!winner) return null;
    if (winner === "DRAW") return "EMPATE";
    return `${
      winner === "HOME" ? homeTeam.shortName : awayTeam.shortName
    } VENCEU`;
  };

  return (
    <header
      className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-4 shadow-lg"
      style={
        {
          "--home-color": homeTeam.primaryColor,
          "--away-color": awayTeam.primaryColor,
        } as React.CSSProperties
      }
    >
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        {/* Time da Casa */}
        <div
          className={cn(
            "flex items-center gap-4 w-1/3",
            possession === "HOME" && "border-b-4",
            possession === "HOME"
              ? "border-[var(--home-color)]"
              : "border-transparent"
          )}
        >
          <div className="relative w-16 h-16">
            <Image
              src={homeTeam.logo}
              alt={homeTeam.name}
              fill
              className="object-contain"
            />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold">{homeTeam.shortName}</h2>
            <p className="text-4xl font-bold">{homeScore}</p>
          </div>
        </div>

        {/* Placar Central */}
        <div className="flex flex-col items-center justify-center w-1/3">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium bg-gray-700 px-3 py-1 rounded-full">
              {getQuarterLabel()}
            </span>
            <p className="text-3xl font-mono bg-gray-800 px-4 py-2 rounded-lg">
              {gameTime}
            </p>
          </div>

          {isGameOver && (
            <div className="mt-2 text-lg font-bold bg-yellow-500 text-gray-900 px-4 py-1 rounded-full">
              {getWinnerText()}
            </div>
          )}
        </div>

        {/* Time Visitante */}
        <div
          className={cn(
            "flex items-center gap-4 w-1/3 justify-end",
            possession === "AWAY" && "border-b-4",
            possession === "AWAY"
              ? "border-[var(--away-color)]"
              : "border-transparent"
          )}
        >
          <div className="text-center">
            <h2 className="text-xl font-bold">{awayTeam.shortName}</h2>
            <p className="text-4xl font-bold">{awayScore}</p>
          </div>
          <div className="relative w-16 h-16">
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
