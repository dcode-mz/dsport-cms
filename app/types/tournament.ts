import { Stage } from "./stage";

export interface Tournament {
  id: string;
  name: string;
  description: string;
  logo: string;
  organizer: string;
  thirdPlaceMatch: boolean;
  country: { name: string };
  gender: { name: string };
  type: { name: string };
  level: { name: string };
  category: { name: string };
  tieBreakerRule: { tieBreakerRuleType: { name: string }; priority: number }[];
  sport: { name: string };
  _count: { teams: number };
  seasons: {
    id: string;
    startDate: Date;
    endDate: Date;
    isCurrent: boolean;
    stages: Stage[];
    teams: {
      id: string;
      name: string;
      club: {
        name: string;
        logo: string;
      };
    }[];
    _count: { teams: number };
  }[];
}

export interface TournamentCharacteristics {
  countries: {
    id: string;
    name: string;
    logo: string;
  }[];
  genders: {
    id: string;
    name: string;
  }[];
  types: {
    id: string;
    name: string;
  }[];
  levels: {
    id: string;
    name: string;
  }[];
  categories: {
    id: string;
    name: string;
  }[];
  sports: {
    id: string;
    name: string;
    icon: string;
  }[];
  tieBreakerRuleTypes: {
    id: string;
    name: string;
  }[];
  seasons: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
  }[];
  tournamentQualifiersPhases: {
    id: string;
    name: string;
  }[];
}
