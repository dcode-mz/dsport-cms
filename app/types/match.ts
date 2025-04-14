export interface Match {
  id: string;
  dateTime: Date;
  venue: {
    id: string;
    name: string;
    location: string;
    capacity?: number;
  };
  referee: {
    id: string;
    name: string;
  };
  homeTeam: {
    id: string;
    name: string;
    club: {
      logo: string;
    };
  };
  awayTeam: {
    id: string;
    name: string;
    club: {
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
