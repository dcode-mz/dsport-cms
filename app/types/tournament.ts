export interface Tournament {
  id: string;
  name: string;
  description: string;
  logo: string;
  organizer: string;
  country: { name: string };
  gender: { name: string };
  type: { name: string };
  level: { name: string };
  format: { name: string };
  category: { name: string };
  tiebreakerCriteria: { name: string };
  sport: { name: string };
  stages: { name: string }[];
  _count: { teams: number };
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
  formats: {
    id: string;
    name: string;
  }[];
  categories: {
    id: string;
    name: string;
  }[];
  tiebreakerCriteria: {
    id: string;
    name: string;
  }[];
  sports: {
    id: string;
    name: string;
    icon: string;
  }[];
}
