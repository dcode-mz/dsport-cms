import { Match } from "./match";

export interface Matchday {
  id: string;
  number: number;
  matches: Match[];
}
