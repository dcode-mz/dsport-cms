export interface Match {
  id: string;
  dateTime: Date;
  venue: {
    name: string;
    location: string;
  };
  referee: {
    name: string;
  };
  homeTeam: {
    club: {
      name: string;
      logo: string;
    };
  };
  awayTeam: {
    club: {
      name: string;
      logo: string;
    };
  };
  matchStats: {
    homeScore: number;
    awayScore: number;
  };
  status: {
    name: string;
  };
}
