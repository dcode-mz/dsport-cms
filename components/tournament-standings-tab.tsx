// components/tournament/StandingsTab.tsx
import { LeagueStanding } from "@/app/types/league-standing";
import { ResponseBody } from "@/app/types/response-body";
import { Tournament } from "@/app/types/tournament";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import Image from "next/image";

export async function StandingsTab({ tournament }: { tournament: Tournament }) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/tournament/${tournament.seasons[0].id}/standing`
  );
  const data: ResponseBody<LeagueStanding[]> = await response.json();
  const standings = data.payload;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Classificação</h3>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pos</TableHead>
            <TableHead>Equipa</TableHead>
            <TableHead>J</TableHead>
            <TableHead>V</TableHead>
            <TableHead>E</TableHead>
            <TableHead>D</TableHead>
            <TableHead>GM</TableHead>
            <TableHead>GS</TableHead>
            <TableHead>DG</TableHead>
            <TableHead>Pts</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {standings.map((standing, index) => (
            <TableRow key={standing.team.name}>
              <TableCell>{index + 1}</TableCell>
              <TableCell className="font-medium">
                <div className="flex">
                  <Image
                    src={
                      standing.team.club.logo || "/default-club-picture.png"
                    }
                    width={24}
                    height={24}
                    alt={standing.team.name}
                    className="w-6 h-6 mr-2"
                  />
                  <span>{standing.team.name}</span>
                </div>
              </TableCell>
              <TableCell>{standing.played}</TableCell>
              <TableCell>{standing.won}</TableCell>
              <TableCell>{standing.drawn}</TableCell>
              <TableCell>{standing.lost}</TableCell>
              <TableCell>{standing.goalsFor}</TableCell>
              <TableCell>{standing.goalsAgainst}</TableCell>
              <TableCell>{standing.goalDifference}</TableCell>
              <TableCell className="font-bold">{standing.points}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
