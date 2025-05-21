// src/app/types/match-live.ts
import { generateId } from "@/lib/utils";

export interface PlayerStats {
  points: number;
  reboundsOffensive: number;
  reboundsDefensive: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  personalFouls: number;
  technicalFouls: number;
  fieldGoalsMade2PT: number;
  fieldGoalsAttempted2PT: number;
  fieldGoalsMade3PT: number;
  fieldGoalsAttempted3PT: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  minutesPlayed?: string;
}

export interface Player {
  id: string;
  number: number;
  name: string;
  position: string;
  teamId: string;
  photo?: string;
  stats: PlayerStats;
  isEjected: boolean;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  players: Player[];
  coachName?: string;
}

export interface TeamInGame extends Team {
  onCourt: string[];
  bench: string[];
  timeouts: {
    full_60_left: number;
    short_30_left: number;
    mandatory_tv_left: number;
  };
  teamFoulsThisQuarter: number;
  isInBonus: boolean;
  coachTechnicalFouls: number;
  benchTechnicalFouls: number;
}

export type ShotType2PT =
  | "JUMP_SHOT"
  | "PULL_UP_JUMP_SHOT"
  | "STEP_BACK_JUMP_SHOT"
  | "TURNAROUND_JUMP_SHOT"
  | "LAYUP"
  | "DRIVING_LAYUP"
  | "HOOK_SHOT"
  | "FLOATING_JUMP_SHOT"
  | "DUNK"
  | "ALLEY_OOP"
  | "TIP_IN_DUNK"
  | "TIP_IN_LAYUP";

export type ShotType3PT =
  | "JUMP_SHOT_3PT"
  | "PULL_UP_JUMP_SHOT_3PT"
  | "STEP_BACK_JUMP_SHOT_3PT"
  | "TURNAROUND_JUMP_SHOT_3PT";

export type AllShotTypes = ShotType2PT | ShotType3PT;

export type PersonalFoulType =
  | "PERSONAL"
  | "SHOOTING"
  | "OFFENSIVE"
  | "DOUBLE"
  | "LOOSE_BALL"
  | "FLAGRANT_1"
  | "FLAGRANT_2";

export type TechnicalFoulType =
  | "CLASS_A_PLAYER"
  | "CLASS_B_PLAYER"
  | "BENCH_TECHNICAL"
  | "COACH_TECHNICAL";

export type TurnoverType =
  | "BAD_PASS"
  | "LOST_BALL_DRIBBLE"
  | "FREE_THROW_VIOLATION_TURNOVER"
  | "BALL_LOST_OUT_OF_BOUNDS"
  | "THREE_SECONDS_VIOLATION"
  | "FIVE_SECONDS_VIOLATION"
  | "EIGHT_SECONDS_VIOLATION"
  | "TRAVELING"
  | "OFFENSIVE_GOALTENDING"
  | "ILLEGAL_DRIBBLE"
  | "ILLEGAL_SCREEN"
  | "OTHER_TURNOVER";

export type EventType =
  | "JUMP_BALL"
  | "2POINTS_MADE"
  | "2POINTS_MISSED"
  | "3POINTS_MADE"
  | "3POINTS_MISSED"
  | "FREE_THROW_ATTEMPT"
  | "REBOUND_OFFENSIVE"
  | "REBOUND_DEFENSIVE"
  | "DEAD_BALL_REBOUND"
  | "FOUL_PERSONAL"
  | "FOUL_TECHNICAL"
  | "TURNOVER"
  | "STEAL"
  | "BLOCK"
  | "DEFLECTION"
  | "SUBSTITUTION"
  | "TIMEOUT_REQUEST"
  | "CHALLENGE"
  | "ADMIN_EVENT"
  | "HELD_BALL"
  | "ASSIST";

export interface EventTypeOption {
  type: EventType;
  label: string;
  icon: string;
  category: "Início" | "Pontuação" | "Jogo" | "Faltas" | "Gestão";
  requiresPlayer: boolean;
  teamScope?: "POSSESSION" | "DEFENDING" | "EITHER";
}

export interface FreeThrowLog {
  id: string;
  attemptNumberInSequence: number;
  totalAwarded: number;
  shooterPlayerId: string;
  isMade: boolean; // Undefined until result is set
  isTechnicalOrFlagrantFT: boolean;
  originalFoulEventId?: string;
}

export interface GameEvent {
  id: string;
  type: EventType;
  gameClock: string;
  realTimestamp: Date;
  quarter: number;
  description?: string;

  primaryPlayerId?: string;
  primaryTeamId?: string;
  secondaryPlayerId?: string;
  secondaryTeamId?: string;
  tertiaryPlayerId?: string;

  shotDetails?: {
    type: AllShotTypes;
    isMade: boolean;
    points: number;
    isAssisted: boolean;
    assistPlayerId?: string;
    isBlocked: boolean;
    blockPlayerId?: string;
  };
  reboundDetails?: {
    type: "OFFENSIVE" | "DEFENSIVE" | "DEAD_BALL_TEAM";
    reboundPlayerId?: string;
    reboundTeamId?: string;
    isTipInAttempt?: boolean;
    tipInShotType?: "TIP_IN_DUNK" | "TIP_IN_LAYUP";
    tipInMade?: boolean;
  };
  foulDetails?: {
    committedByPlayerId?: string;
    committedByTeamId?: string;
    committedBy: "PLAYER" | "BENCH" | "COACH";
    drawnByPlayerId?: string;
    type: PersonalFoulType | TechnicalFoulType; // Union type
    isPersonalFoul: boolean;
    personalFoulType?: PersonalFoulType;
    technicalFoulType?: TechnicalFoulType;
    resultsInFreeThrows: boolean;
    numberOfFreeThrowsAwarded?: number;
    freeThrowShooterPlayerId?: string;
    isCharge?: boolean;
    isUnsportsmanlike?: boolean;
    ejectsPlayer?: boolean;
    ejectsCoach?: boolean; // Adicionado
  };
  freeThrowDetails?: FreeThrowLog;
  turnoverDetails?: {
    type: TurnoverType;
    lostByPlayerId: string;
    stolenByPlayerId?: string;
  };
  stealDetails?: {
    stolenByPlayerId: string;
    lostPossessionByPlayerId?: string;
  };
  blockDetails?: {
    blockPlayerId: string;
    shotByPlayerId: string;
  };
  deflectionDetails?: {
    deflectedByPlayerId: string;
  };
  substitutionDetails?: {
    playerOutId: string;
    playerInId: string;
    teamId: string;
  };
  timeoutDetails?: {
    teamId: string;
    type: "FULL_60" | "SHORT_30" | "MANDATORY_TV";
  };
  challengeDetails?: {
    challengingTeamId: string;
    originalCall?: string;
    result:
      | "SUCCESSFUL_REVERTED"
      | "UNSUCCESSFUL_MAINTAINED"
      | "UNSUCCESSFUL_LOST_TIMEOUT";
  };
  jumpBallDetails?: {
    homePlayerId: string;
    awayPlayerId: string;
    wonByTeamId: string;
    possessionArrowToTeamId: string;
  };
  heldBallDetails?: {
    player1Id?: string;
    player2Id?: string;
    possessionAwardedToTeamId: string;
    arrowWillPointToTeamId: string;
  };
  adminEventDetails?: {
    action: string;
    notes?: string;
    possessionSetToTeamId?: string; // Para definir posse no início do quarto/período
  };
}

export type PossessionArrowDirection = "HOME" | "AWAY" | null;

export interface GameSettings {
  quarters: number;
  minutesPerQuarter: number;
  minutesPerOvertime: number;
  teamFoulsForBonus: number;
  playerFoulsToEject: number; // Pessoal
  playerTechFoulsToEject: number; // Técnica
  coachTechFoulsToEject: number; // Técnica Treinador
}

export interface GameState {
  gameId: string;
  settings: GameSettings;
  homeTeam: TeamInGame;
  awayTeam: TeamInGame;
  homeScore: number;
  awayScore: number;
  currentQuarter: number;
  gameClockSeconds: number;
  possessionTeamId: string | null;
  possessionArrow: PossessionArrowDirection;
  events: GameEvent[];
  isGameStarted: boolean;
  isGameClockRunning: boolean;
  isPausedForEvent: boolean; // Jogo pausado para registar um evento complexo (LLs, etc.)
  isGameOver: boolean;
  winnerTeamId?: string | null;
  eventInProgress?: Partial<GameEvent> & {
    step?: string;
    pendingFreeThrows?: FreeThrowLog[];
  };
}

export const initialPlayerStats: PlayerStats = {
  points: 0,
  reboundsOffensive: 0,
  reboundsDefensive: 0,
  assists: 0,
  steals: 0,
  blocks: 0,
  turnovers: 0,
  personalFouls: 0,
  technicalFouls: 0,
  fieldGoalsMade2PT: 0,
  fieldGoalsAttempted2PT: 0,
  fieldGoalsMade3PT: 0,
  fieldGoalsAttempted3PT: 0,
  freeThrowsMade: 0,
  freeThrowsAttempted: 0,
};

export function createInitialPlayer(
  playerData: Omit<Player, "stats" | "isEjected" | "id">,
  teamId: string
): Player {
  return {
    id: generateId(`player_${teamId}`),
    ...playerData,
    teamId,
    stats: { ...initialPlayerStats },
    isEjected: false,
  };
}
