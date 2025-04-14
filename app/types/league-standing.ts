export interface LeagueStanding {
  team: {
    name: string;
    club: {
      name: string;
      logo: string;
    };
  };
  played: number;
  points: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}
