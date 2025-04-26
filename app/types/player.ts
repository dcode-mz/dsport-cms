export interface Player {
  id: string;
  name: string;
  nickname?: string;
  preferredPosition: {
    name: string;
  };
  preferredFoot: {
    name: string;
  };
  dateOfBirth: Date;
  primaryNationality: {
    name: string;
  };
  gender: {
    name: string;
  };
  height: number;
  weight: number;
  photoUrl?: string;
  team: {
    club: {
      name: string;
    };
  };
}

export interface PlayerCharacteristics {
  genders: {
    id: string;
    name: string;
  }[];
  sports: {
    id: string;
    name: string;
  }[];
  teams: {
    id: string;
    name: string;
    gender: {
      id: string;
      name: string;
    };
    club: {
      id: string;
      logo: string;
    };
    sport: {
      id: string;
      name: string;
    };
  }[];
  countries: {
    id: string;
    name: string;
  }[];
  preferredPositions: {
    id: string;
    name: string;
    code: string;
    sport: {
      id: string;
      name: string;
    };
  }[];
  preferredFoots: {
    id: string;
    name: string;
  }[];
}
