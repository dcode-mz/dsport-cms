import { Matchday } from "./matchday";

export interface Stage {
  id: string;
  name: string;
  order: string;
  type: {
    id: string;
    name: string;
  };
  hasMatchdays: boolean;
  twoLegged: boolean;
  extraTimeAllowed: boolean;
  penaltyShootout: boolean;
  teamsToAdvance: number;
  matchdays: Matchday[];
}
