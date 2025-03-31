import { Matchday } from "./matchday";

export interface Stage {
  name: string;
  order: string;
  type: {
    name: string;
  };
  hasMatchdays: boolean;
  twoLegged: boolean;
  extraTimeAllowed: boolean;
  penaltyShootout: boolean;
  teamsToAdvance: number;
  matchdays: Matchday[];
}
