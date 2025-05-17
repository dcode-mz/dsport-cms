import {
  AllShotTypes,
  PersonalFoulType,
  TechnicalFoulType,
  TurnoverType,
  EventTypeOption,
} from "@/app/types/match-live";

export const SHOT_TYPES_2PT: { value: AllShotTypes; label: string }[] = [
  { value: "JUMP_SHOT", label: "Jump Shot" },
  { value: "PULL_UP_JUMP_SHOT", label: "Pull Up Jump Shot" },
  { value: "STEP_BACK_JUMP_SHOT", label: "Step Back Jump Shot" },
  { value: "TURNAROUND_JUMP_SHOT", label: "Turnaround Jump Shot" },
  { value: "LAYUP", label: "Layup" },
  { value: "DRIVING_LAYUP", label: "Driving Layup" },
  { value: "HOOK_SHOT", label: "Hook Shot" },
  { value: "FLOATING_JUMP_SHOT", label: "Floating Jump Shot" },
  { value: "DUNK", label: "Dunk" },
  { value: "ALLEY_OOP", label: "Alley Oop" },
  { value: "TIP_IN_LAYUP", label: "Tip-In Layup" }, // Adicionado para resultado de ressalto
  { value: "TIP_IN_DUNK", label: "Tip-In Dunk" }, // Adicionado
];

export const SHOT_TYPES_3PT: { value: AllShotTypes; label: string }[] = [
  { value: "JUMP_SHOT_3PT", label: "3PT Jump Shot" },
  { value: "PULL_UP_JUMP_SHOT_3PT", label: "3PT Pull Up Jump Shot" },
  { value: "STEP_BACK_JUMP_SHOT_3PT", label: "3PT Step Back Jump Shot" },
  { value: "TURNAROUND_JUMP_SHOT_3PT", label: "3PT Turnaround Jump Shot" },
];

export const ALL_SHOT_TYPES = [...SHOT_TYPES_2PT, ...SHOT_TYPES_3PT];

export const PERSONAL_FOUL_TYPES: {
  value: PersonalFoulType;
  label: string;
  isOffensive?: boolean;
  canResultInShootingFoul?: boolean;
}[] = [
  {
    value: "PERSONAL",
    label: "Pessoal (Não de Arremesso)",
    canResultInShootingFoul: false,
  },
  { value: "SHOOTING", label: "De Arremesso", canResultInShootingFoul: true },
  {
    value: "OFFENSIVE",
    label: "Ofensiva (Ataque)",
    isOffensive: true,
    canResultInShootingFoul: false,
  },
  { value: "DOUBLE", label: "Dupla Falta", canResultInShootingFoul: false }, // Lógica especial de posse
  { value: "LOOSE_BALL", label: "Bola Solta", canResultInShootingFoul: true }, // Pode ou não ser de arremesso
  {
    value: "FLAGRANT_1",
    label: "Flagrante Tipo 1",
    canResultInShootingFoul: true,
  },
  {
    value: "FLAGRANT_2",
    label: "Flagrante Tipo 2 (Ejeção)",
    canResultInShootingFoul: true,
  },
];

export const TECHNICAL_FOUL_TYPES: {
  value: TechnicalFoulType;
  label: string;
  countsAsPersonal?: boolean;
}[] = [
  {
    value: "CLASS_A_PLAYER",
    label: "Técnica Jogador (Classe A - Conta Pessoal)",
    countsAsPersonal: true,
  },
  {
    value: "CLASS_B_PLAYER",
    label: "Técnica Jogador (Classe B - Não Conta Pessoal)",
    countsAsPersonal: false,
  },
  {
    value: "BENCH_TECHNICAL",
    label: "Técnica Banco (Não Conta Pessoal)",
    countsAsPersonal: false,
  },
  {
    value: "COACH_TECHNICAL",
    label: "Técnica Treinador (Não Conta Pessoal)",
    countsAsPersonal: false,
  },
];

export const TURNOVER_TYPES: { value: TurnoverType; label: string }[] = [
  { value: "BAD_PASS", label: "Passe Errado" },
  { value: "LOST_BALL_DRIBBLE", label: "Perda de Bola (Drible)" },
  {
    value: "FREE_THROW_VIOLATION_TURNOVER",
    label: "Violação de Lance Livre (Perda)",
  },
  { value: "BALL_LOST_OUT_OF_BOUNDS", label: "Bola Fora de Campo" },
  { value: "THREE_SECONDS_VIOLATION", label: "Violação de 3 Segundos" },
  {
    value: "FIVE_SECONDS_VIOLATION",
    label: "Violação de 5 Segundos (Reposição)",
  },
  {
    value: "EIGHT_SECONDS_VIOLATION",
    label: "Violação de 8 Segundos (Meio Campo)",
  },
  { value: "TRAVELING", label: "Passos (Travel)" },
  { value: "OFFENSIVE_GOALTENDING", label: "Goaltending Ofensivo" },
  { value: "ILLEGAL_DRIBBLE", label: "Drible Ilegal" },
  { value: "ILLEGAL_SCREEN", label: "Bloqueio Ilegal (Cortina Ofensiva)" },
  { value: "OTHER_TURNOVER", label: "Outro Turnover" },
];

export const MAIN_EVENT_TYPE_OPTIONS: EventTypeOption[] = [
  {
    type: "JUMP_BALL",
    label: "Salto Inicial",
    icon: "🏀",
    category: "Início",
    requiresPlayer: false,
  },
  {
    type: "2POINTS_MADE",
    label: "Cesta 2pt",
    icon: "✅",
    category: "Pontuação",
    requiresPlayer: true,
    teamScope: "POSSESSION",
  },
  {
    type: "2POINTS_MISSED",
    label: "Falha 2pt",
    icon: "❌",
    category: "Pontuação",
    requiresPlayer: true,
    teamScope: "POSSESSION",
  },
  {
    type: "3POINTS_MADE",
    label: "Cesta 3pt",
    icon: "🎯",
    category: "Pontuação",
    requiresPlayer: true,
    teamScope: "POSSESSION",
  },
  {
    type: "3POINTS_MISSED",
    label: "Falha 3pt",
    icon: "⭕",
    category: "Pontuação",
    requiresPlayer: true,
    teamScope: "POSSESSION",
  },
  // FREE_THROW é um resultado de falta, não um evento primário de seleção aqui. Será tratado no fluxo da falta.
  {
    type: "REBOUND_OFFENSIVE",
    label: "Ressalto Of.",
    icon: "💪",
    category: "Jogo",
    requiresPlayer: true,
    teamScope: "EITHER",
  },
  {
    type: "REBOUND_DEFENSIVE",
    label: "Ressalto Def.",
    icon: "🛡️",
    category: "Jogo",
    requiresPlayer: true,
    teamScope: "EITHER",
  },
  {
    type: "FOUL_PERSONAL",
    label: "Falta Pessoal",
    icon: "⚠️",
    category: "Faltas",
    requiresPlayer: true,
    teamScope: "EITHER",
  }, // Quem cometeu
  {
    type: "FOUL_TECHNICAL",
    label: "Falta Técnica",
    icon: "🧑‍⚖️",
    category: "Faltas",
    requiresPlayer: false,
  }, // Infrator pode ser banco/treinador
  {
    type: "TURNOVER",
    label: "Turnover",
    icon: "🔄",
    category: "Jogo",
    requiresPlayer: true,
    teamScope: "POSSESSION",
  },
  {
    type: "STEAL",
    label: "Roubo Bola",
    icon: "🖐️",
    category: "Jogo",
    requiresPlayer: true,
    teamScope: "DEFENDING",
  },
  {
    type: "BLOCK",
    label: "Bloqueio",
    icon: "🧱",
    category: "Jogo",
    requiresPlayer: true,
    teamScope: "DEFENDING",
  },
  {
    type: "DEFLECTION",
    label: "Desvio Passe",
    icon: "👉",
    category: "Jogo",
    requiresPlayer: true,
    teamScope: "DEFENDING",
  },
  {
    type: "SUBSTITUTION",
    label: "Substituição",
    icon: "🔁",
    category: "Gestão",
    requiresPlayer: false,
  }, // Seleciona jogadores no painel
  {
    type: "TIMEOUT_REQUEST",
    label: "Time-out",
    icon: "⏱️",
    category: "Gestão",
    requiresPlayer: false,
  },
  {
    type: "CHALLENGE",
    label: "Desafio Árbitro",
    icon: "🧐",
    category: "Gestão",
    requiresPlayer: false,
  },
  {
    type: "ADMIN_EVENT",
    label: "Evento Admin",
    icon: "⚙️",
    category: "Gestão",
    requiresPlayer: false,
  },
];

export const ADMIN_EVENT_ACTIONS: { value: string; label: string }[] = [
  { value: "START_QUARTER_1", label: "Iniciar 1º Quarto (Após Salto)" },
  { value: "START_QUARTER", label: "Iniciar Quarto/Prorrogação" },
  { value: "END_QUARTER", label: "Finalizar Quarto/Prorrogação" },
  { value: "HALF_TIME", label: "Intervalo (Meio Tempo)" },
  { value: "END_GAME", label: "Finalizar Jogo" },
  { value: "POSSESSION_ARROW_SET", label: "Definir Seta de Posse" },
  { value: "CORRECTION", label: "Correção Manual (Adicionar Nota)" },
];

export const TEAM_FoulS_BONUS_THRESHOLD = 5; // Faltas para entrar no bónus (varia por regra, ex: 5 na NBA por quarto)
export const PLAYER_FOULS_EJECTION_TECHNICAL = 2; // 2 faltas técnicas ejetam
export const PLAYER_FOULS_EJECTION_PERSONAL = 6; // 6 faltas pessoais ejetam (NBA)
