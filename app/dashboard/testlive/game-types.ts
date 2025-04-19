export type Team = {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  players: Player[];
};

export type Player = {
  id: string;
  number: number;
  name: string;
  position: string;
  teamId: string;
  photo?: string;
};

export type EventType =
  | "2POINTS_MADE"
  | "2POINTS_MISSED"
  | "3POINTS_MADE"
  | "3POINTS_MISSED"
  | "FREE_THROW_MADE"
  | "FREE_THROW_MISSED"
  | "FOUL_PERSONAL"
  | "FOUL_TECHNICAL"
  | "TURNOVER"
  | "STEAL"
  | "BLOCK"
  | "OFFENSIVE_REBOUND"
  | "DEFENSIVE_REBOUND"
  | "SUBSTITUTION"
  | "TIMEOUT"
  | "ASSIST";

export type GameEvent = {
  id: string;
  type: EventType;
  playerId: string;
  teamId: string;
  gameTime: string;
  timestamp: Date;
  quarter: number;
  points?: number;
  relatedEvents?: RelatedEvent[];
};

export type RelatedEvent = {
  type: EventType;
  playerId?: string;
  teamId?: string;
};

export type GameState = {
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  currentQuarter: number;
  possession: "HOME" | "AWAY";
  events: GameEvent[];
  isGameOver: boolean;
  winner?: "HOME" | "AWAY" | "DRAW";
};