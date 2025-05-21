// src/components/box-score-panel.tsx
import {
  GameState,
  initialPlayerStats,
  Player,
  PlayerStats,
  TeamInGame,
} from "@/app/types/match-live";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BoxScorePanelProps {
  gameState: GameState;
}

const PlayerRow = ({ player, team }: { player: Player; team: TeamInGame }) => {
  const isOnCourt = team.onCourt.includes(player.id);
  const formatPercent = (made: number, attempted: number) => {
    if (attempted === 0) return "-";
    return `${((made / attempted) * 100).toFixed(0)}%`;
  };

  return (
    <TableRow
      className={
        player.isEjected
          ? "opacity-50 bg-red-900/10"
          : isOnCourt
          ? "bg-green-900/10 font-semibold"
          : ""
      }
    >
      <TableCell className="py-1 px-1.5 md:px-2 text-xs truncate max-w-[80px] md:max-w-[120px]">
        #{player.number} {player.name} {player.isEjected ? "(E)" : ""}
      </TableCell>
      <TableCell className="py-1 px-1.5 md:px-2 text-xs text-center">
        {player.stats.points}
      </TableCell>
      <TableCell className="py-1 px-1.5 md:px-2 text-xs text-center">
        {player.stats.reboundsOffensive + player.stats.reboundsDefensive}
      </TableCell>
      <TableCell className="py-1 px-1.5 md:px-2 text-xs text-center">
        {player.stats.assists}
      </TableCell>
      <TableCell className="py-1 px-1.5 md:px-2 text-xs text-center">
        {player.stats.steals}
      </TableCell>
      <TableCell className="py-1 px-1.5 md:px-2 text-xs text-center">
        {player.stats.blocks}
      </TableCell>
      <TableCell className="py-1 px-1.5 md:px-2 text-xs text-center">
        {player.stats.turnovers}
      </TableCell>
      <TableCell className="py-1 px-1.5 md:px-2 text-xs text-center">
        {player.stats.personalFouls}
        {player.stats.technicalFouls > 0
          ? `+${player.stats.technicalFouls}T`
          : ""}
      </TableCell>
      <TableCell className="py-1 px-1.5 md:px-2 text-xs text-center">
        {player.stats.fieldGoalsMade2PT + player.stats.fieldGoalsMade3PT}-
        {player.stats.fieldGoalsAttempted2PT +
          player.stats.fieldGoalsAttempted3PT}
        {/* ({formatPercent(player.stats.fieldGoalsMade2PT + player.stats.fieldGoalsMade3PT, player.stats.fieldGoalsAttempted2PT + player.stats.fieldGoalsAttempted3PT)}) */}
      </TableCell>
      <TableCell className="py-1 px-1.5 md:px-2 text-xs text-center">
        {player.stats.fieldGoalsMade3PT}-{player.stats.fieldGoalsAttempted3PT}
        {/* ({formatPercent(player.stats.fieldGoalsMade3PT, player.stats.fieldGoalsAttempted3PT)}) */}
      </TableCell>
      <TableCell className="py-1 px-1.5 md:px-2 text-xs text-center">
        {player.stats.freeThrowsMade}-{player.stats.freeThrowsAttempted}
        {/* ({formatPercent(player.stats.freeThrowsMade, player.stats.freeThrowsAttempted)}) */}
      </TableCell>
    </TableRow>
  );
};

const TeamTable = ({ team, title }: { team: TeamInGame; title: string }) => {
  const teamTotals: PlayerStats = team.players.reduce(
    (acc: PlayerStats, player) => {
      Object.keys(player.stats).forEach((key) => {
        const statKey = key as keyof PlayerStats;
        acc[statKey] =
          Number(acc[statKey] || 0) + Number(player.stats[statKey] || 0);
      });
      return acc;
    },
    { ...initialPlayerStats }
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-2 bg-gray-100 dark:bg-gray-800">
        <CardTitle className="text-sm">
          {title} - {team.name} ({team.shortName})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table className="text-[10px] md:text-xs">
          <TableHeader>
            <TableRow>
              <TableHead className="py-1 px-1.5 md:px-2 h-7">Jogador</TableHead>
              <TableHead className="py-1 px-1.5 md:px-2 h-7 text-center">
                PTS
              </TableHead>
              <TableHead className="py-1 px-1.5 md:px-2 h-7 text-center">
                REB
              </TableHead>
              <TableHead className="py-1 px-1.5 md:px-2 h-7 text-center">
                AST
              </TableHead>
              <TableHead className="py-1 px-1.5 md:px-2 h-7 text-center">
                STL
              </TableHead>
              <TableHead className="py-1 px-1.5 md:px-2 h-7 text-center">
                BLK
              </TableHead>
              <TableHead className="py-1 px-1.5 md:px-2 h-7 text-center">
                TO
              </TableHead>
              <TableHead className="py-1 px-1.5 md:px-2 h-7 text-center">
                FLS
              </TableHead>
              <TableHead className="py-1 px-1.5 md:px-2 h-7 text-center">
                FG
              </TableHead>
              <TableHead className="py-1 px-1.5 md:px-2 h-7 text-center">
                3PT
              </TableHead>
              <TableHead className="py-1 px-1.5 md:px-2 h-7 text-center">
                FT
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {team.players.map((player) => (
              <PlayerRow key={player.id} player={player} team={team} />
            ))}
            <TableRow className="font-bold bg-gray-200 dark:bg-gray-700">
              <TableCell className="py-1 px-1.5 md:px-2">TOTAL</TableCell>
              <TableCell className="py-1 px-1.5 md:px-2 text-center">
                {teamTotals.points}
              </TableCell>
              <TableCell className="py-1 px-1.5 md:px-2 text-center">
                {teamTotals.reboundsOffensive + teamTotals.reboundsDefensive}
              </TableCell>
              <TableCell className="py-1 px-1.5 md:px-2 text-center">
                {teamTotals.assists}
              </TableCell>
              <TableCell className="py-1 px-1.5 md:px-2 text-center">
                {teamTotals.steals}
              </TableCell>
              <TableCell className="py-1 px-1.5 md:px-2 text-center">
                {teamTotals.blocks}
              </TableCell>
              <TableCell className="py-1 px-1.5 md:px-2 text-center">
                {teamTotals.turnovers}
              </TableCell>
              <TableCell className="py-1 px-1.5 md:px-2 text-center">
                {teamTotals.personalFouls}
                {teamTotals.technicalFouls > 0
                  ? `+${teamTotals.technicalFouls}T`
                  : ""}
              </TableCell>
              <TableCell className="py-1 px-1.5 md:px-2 text-center">
                {teamTotals.fieldGoalsMade2PT + teamTotals.fieldGoalsMade3PT}-
                {teamTotals.fieldGoalsAttempted2PT +
                  teamTotals.fieldGoalsAttempted3PT}
              </TableCell>
              <TableCell className="py-1 px-1.5 md:px-2 text-center">
                {teamTotals.fieldGoalsMade3PT}-
                {teamTotals.fieldGoalsAttempted3PT}
              </TableCell>
              <TableCell className="py-1 px-1.5 md:px-2 text-center">
                {teamTotals.freeThrowsMade}-{teamTotals.freeThrowsAttempted}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export function BoxScorePanel({ gameState }: BoxScorePanelProps) {
  return (
    <Tabs defaultValue="homeTeam" className="w-full mt-2">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="homeTeam">
          {gameState.homeTeam.shortName} Stats
        </TabsTrigger>
        <TabsTrigger value="awayTeam">
          {gameState.awayTeam.shortName} Stats
        </TabsTrigger>
      </TabsList>
      <TabsContent value="homeTeam">
        <TeamTable team={gameState.homeTeam} title="Estatísticas Casa" />
      </TabsContent>
      <TabsContent value="awayTeam">
        <TeamTable team={gameState.awayTeam} title="Estatísticas Visitante" />
      </TabsContent>
    </Tabs>
  );
}
