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
  height: number;
  weight: number;
  photoUrl?: string;
  team: {
    club: {
      name: string;
    };
  };
}
