export interface Team {
  id: string;
  name: string;
  teamType: { name: string };
  gender: { name: string };
  venue: { name: string };
  contact: string;
  location: string;
  club: { name: string; logo: string };
  sport: { name: string };
  ageCategory: { name: string };
  format: { name: string };
  coach: { name: string };
  _count: { players: number };
}

export interface TeamCharacteristics {
  genders: {
    id: string;
    name: string;
  }[];
  teamTypes: {
    id: string;
    name: string;
  }[];
  venues: {
    id: string;
    name: string;
  }[];
  clubs: {
    id: string;
    name: string;
  }[];
  sports: {
    id: string;
    name: string;
  }[];
  categories: {
    id: string;
    name: string;
  }[];
  formatsTeam: {
    id: string;
    name: string;
  }[];
}
