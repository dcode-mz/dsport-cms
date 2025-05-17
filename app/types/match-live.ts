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
  minutesPlayed?: string; // Formato MM:SS
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
  onCourt: string[]; // Array de IDs dos jogadores em campo
  bench: string[]; // Array de IDs dos jogadores no banco
  timeoutsLeft: number; // Standard: 7 (NBA), pode variar.
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
  | "FREE_THROW_ATTEMPT" // Cada tentativa de LL é um evento
  | "REBOUND_OFFENSIVE"
  | "REBOUND_DEFENSIVE"
  | "DEAD_BALL_REBOUND" // Dead ball rebound é quando a bola sai após um LL falhado no último ou único LL.
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
  | "ASSIST"; // Este é mais um atributo de um evento de cesta

export interface EventTypeOption {
  type: EventType;
  label: string;
  icon: string;
  category: "Início" | "Pontuação" | "Jogo" | "Faltas" | "Gestão";
  requiresPlayer: boolean; // Se a seleção primária é um jogador
  teamScope?: "POSSESSION" | "DEFENDING" | "EITHER"; // Qual(is) equipa(s) o jogador pode ser selecionado
}

export interface FreeThrowLog {
  id: string;
  attemptNumberInSequence: number; // 1 de 2, 2 de 2, etc.
  totalAwarded: number;
  shooterPlayerId: string;
  isMade: boolean;
  isTechnicalOrFlagrantFT: boolean; // Para regras de posse após FT
  originalFoulEventId?: string; // ID do evento de falta que gerou os LLs
}

export interface GameEvent {
  id: string;
  type: EventType;
  gameClock: string; // "Q1 08:34.5"
  realTimestamp: Date;
  quarter: number;
  description?: string; // Gerado automaticamente ou manual para correções

  // IDs de jogadores e equipas
  primaryPlayerId?: string;
  primaryTeamId?: string;
  secondaryPlayerId?: string; // Ex: assistência, quem sofreu falta, jogador bloqueado
  secondaryTeamId?: string;
  tertiaryPlayerId?: string; // Ex: jogador que entrou na substituição

  // Detalhes específicos
  shotDetails?: {
    type: AllShotTypes;
    isMade: boolean;
    points: number; // 0, 1, 2, 3
    isAssisted: boolean;
    assistPlayerId?: string;
    isBlocked: boolean;
    blockPlayerId?: string;
  };
  reboundDetails?: {
    type: "OFFENSIVE" | "DEFENSIVE" | "DEAD_BALL_TEAM";
    reboundPlayerId?: string; // Para OREB/DREB
    reboundTeamId?: string; // Para Dead Ball Rebound (equipa que ganha posse)
    isTipInAttempt?: boolean; // Se o ressalto resultou num tip-in
    tipInShotType?: "TIP_IN_DUNK" | "TIP_IN_LAYUP";
    tipInMade?: boolean;
  };
  foulDetails?: {
    committedByPlayerId?: string;
    committedByTeamId?: string;
    committedBy: "PLAYER" | "BENCH" | "COACH";
    drawnByPlayerId?: string; // Quem sofreu
    type: PersonalFoulType | TechnicalFoulType;
    isPersonalFoul: boolean; // true para PersonalFoulType, false para TechnicalFoulType
    personalFoulType?: PersonalFoulType;
    technicalFoulType?: TechnicalFoulType;
    resultsInFreeThrows: boolean;
    numberOfFreeThrowsAwarded?: number;
    freeThrowShooterPlayerId?: string; // Quem vai cobrar
    isCharge?: boolean;
    isUnsportsmanlike?: boolean; // Flagrante 1 ou 2
    ejectsPlayer?: boolean;
  };
  freeThrowDetails?: FreeThrowLog; // Para cada tentativa de LL
  turnoverDetails?: {
    type: TurnoverType;
    lostByPlayerId: string;
    stolenByPlayerId?: string; // Se o turnover foi um roubo direto
  };
  stealDetails?: {
    stolenByPlayerId: string;
    lostPossessionByPlayerId?: string; // Opcional, se diretamente ligado a um jogador
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
    type: "FULL" | "SHORT_30"; // "FULL" (60-100s), "SHORT_30" (NBA 20s) - adaptar
  };
  challengeDetails?: {
    challengingTeamId: string;
    originalCall?: string; // Descrição da jogada original
    result:
      | "SUCCESSFUL_REVERTED"
      | "UNSUCCESSFUL_MAINTAINED"
      | "UNSUCCESSFUL_LOST_TIMEOUT";
  };
  jumpBallDetails?: {
    homePlayerId: string;
    awayPlayerId: string;
    wonByTeamId: string; // Equipa que ganhou a posse
    possessionArrowToTeamId: string; // Para quem aponta a seta após o salto
  };
  adminEventDetails?: {
    action: string; // "START_QUARTER", "END_GAME", etc.
    notes?: string;
    possessionSetToTeamId?: string; // Para definir posse no início do quarto
  };
}

export type PossessionArrowDirection = "HOME" | "AWAY" | null;

export interface GameSettings {
  quarters: number; // 4
  minutesPerQuarter: number; // 10 ou 12
  minutesPerOvertime: number; // 5
  teamFoulsForBonus: number; // 5
  playerFoulsToEject: number; // 6 (pessoal), 2 (técnica)
}

export interface GameState {
  gameId: string;
  settings: GameSettings;
  homeTeam: TeamInGame;
  awayTeam: TeamInGame;
  homeScore: number;
  awayScore: number;
  currentQuarter: number; // 1-4, 5+ para OT
  gameClockSeconds: number;
  possessionTeamId: string | null;
  possessionArrow: PossessionArrowDirection; // Para qual equipa aponta a seta
  events: GameEvent[];
  isGameStarted: boolean;
  isGameClockRunning: boolean; // Para controlar o estado do cronómetro principal
  isPausedForEvent: boolean; // Se o jogo está pausado para registar um evento complexo (ex: L.L.)
  isGameOver: boolean;
  winnerTeamId?: string | null;
  // Estado para o evento em construção
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
