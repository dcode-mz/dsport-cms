import { useState, useCallback } from "react";
import {
  GameState,
  GameEvent,
  EventType,
  Player,
  TeamInGame,
  FreeThrowLog,
  GameSettings,
  PersonalFoulType,
  TechnicalFoulType,
  createInitialPlayer,
  Team,
  PlayerStats,
  ApiPlayer,
} from "@/app/types/match-live";
import { generateId } from "@/lib/utils";
import {
  TECHNICAL_FOUL_TYPES,
  PERSONAL_FOUL_TYPES,
} from "@/app/data/basketball-definitions";

// --- Funções Helper para localStorage ---
const saveStateToLocalStorage = (state: GameState) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(`gameState_${state.gameId}`, serializedState);
  } catch (error) {
    console.warn("Aviso: Não foi possível salvar o estado do jogo.", error);
  }
};

const getOfflineQueue = (matchId: string): any[] => {
  try {
    const queue = localStorage.getItem(`offlineQueue_${matchId}`);
    return queue ? JSON.parse(queue) : [];
  } catch (error) {
    console.warn("Aviso: Não foi possível ler a fila offline.", error);
    return [];
  }
};

const addToOfflineQueue = (payload: any, matchId: string) => {
  try {
    const queue = getOfflineQueue(matchId);
    queue.push(payload);
    localStorage.setItem(`offlineQueue_${matchId}`, JSON.stringify(queue));
  } catch (error) {
    console.warn(
      "Aviso: Não foi possível adicionar evento à fila offline.",
      error
    );
  }
};
// --- Fim Funções Helper ---

// Dados Mockados para a função UNDO (necessários para a reconstrução do estado)
const mockHomePlayersDataForUndo: Omit<
  Player,
  "stats" | "isEjected" | "id" | "teamId"
>[] = [
  {
    number: 6,
    name: "LeBron James",
    position: "SF",
    photo:
      "https://res.cloudinary.com/ds1lnrvnq/image/upload/v1742947613/dsport/clubs/logo/sn2iq48c9wzocjkqseud.png",
  },
  {
    number: 23,
    name: "Anthony Davis",
    position: "PF",
    photo:
      "https://res.cloudinary.com/ds1lnrvnq/image/upload/v1742947613/dsport/clubs/logo/sn2iq48c9wzocjkqseud.png",
  },
  { number: 1, name: "D'Angelo Russell", position: "PG" },
  { number: 15, name: "Austin Reaves", position: "SG" },
  { number: 28, name: "Rui Hachimura", position: "PF" },
  { number: 2, name: "Jarred Vanderbilt", position: "SF" },
  { number: 10, name: "Max Christie", position: "SG" },
  { number: 11, name: "Jaxson Hayes", position: "C" },
  { number: 5, name: "Cam Reddish", position: "SF" },
  { number: 0, name: "Taurean Prince", position: "SF" },
];
const mockAwayPlayersDataForUndo: Omit<
  Player,
  "stats" | "isEjected" | "id" | "teamId"
>[] = [
  {
    number: 7,
    name: "Jayson Tatum",
    position: "SF",
    photo:
      "https://res.cloudinary.com/ds1lnrvnq/image/upload/v1742947613/dsport/clubs/logo/sn2iq48c9wzocjkqseud.png",
  },
  {
    number: 9,
    name: "Jaylen Brown",
    position: "SG",
    photo:
      "https://res.cloudinary.com/ds1lnrvnq/image/upload/v1742947613/dsport/clubs/logo/sn2iq48c9wzocjkqseud.png",
  },
  { number: 4, name: "Jrue Holiday", position: "PG" },
  { number: 8, name: "Kristaps Porzingis", position: "C" },
  { number: 42, name: "Al Horford", position: "C" },
  { number: 12, name: "Derrick White", position: "PG" },
  { number: 30, name: "Sam Hauser", position: "SF" },
  { number: 11, name: "Payton Pritchard", position: "PG" },
  { number: 13, name: "Luke Kornet", position: "C" },
  { number: 0, name: "Oshae Brissett", position: "SF" },
];
const homeTeamBaseForUndo: Omit<Team, "players"> = {
  id: "HOME_TEAM_ID",
  name: "Los Angeles Lakers",
  shortName: "LAL",
  logo: "https://res.cloudinary.com/ds1lnrvnq/image/upload/v1742420456/dsport/clubs/logo/gljqlouvtgb9r215j9vt.png",
  primaryColor: "#552583",
  secondaryColor: "#FDB927",
  coachName: "Darvin Ham",
};
const awayTeamBaseForUndo: Omit<Team, "players"> = {
  id: "AWAY_TEAM_ID",
  name: "Boston Celtics",
  shortName: "BOS",
  logo: "https://res.cloudinary.com/ds1lnrvnq/image/upload/v1742851303/dsport/clubs/logo/nrldhsluaji6gxu0teeu.png",
  primaryColor: "#007A33",
  secondaryColor: "#BA9653",
  coachName: "Joe Mazzulla",
};
const initializeTeamInGameForUndo = (
  baseTeam: Omit<Team, "players">,
  playersData: Omit<Player, "stats" | "isEjected" | "id" | "teamId">[],
  settings: GameSettings,
  startersCount: number = 5
): TeamInGame => {
  const fullPlayers = playersData.map((p) =>
    createInitialPlayer(
      {
        id: generateId("player_undo"),
        name: p.name,
        preferredPosition: { code: p.position, name: p.position },
      } as ApiPlayer,
      baseTeam.id
    )
  );
  return {
    ...baseTeam,
    players: fullPlayers,
    onCourt: fullPlayers.slice(0, startersCount).map((p) => p.id),
    bench: fullPlayers.slice(startersCount).map((p) => p.id),
    timeouts: { full_60_left: 5, short_30_left: 2, mandatory_tv_left: 3 },
    teamFoulsThisQuarter: 0,
    isInBonus: false,
    coachTechnicalFouls: 0,
    benchTechnicalFouls: 0,
  };
};

export function useGameEvents(
  currentGameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>,
  isOnline: boolean // Recebe o status da conexão
) {
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(
    null
  );
  const [eventData, setEventData] = useState<Partial<GameEvent>>({});
  const [eventStep, setEventStep] = useState<string | null>(null);

  const [pendingFreeThrows, setPendingFreeThrows] = useState<FreeThrowLog[]>(
    []
  );
  const [currentFreeThrowIndex, setCurrentFreeThrowIndex] = useState(0);

  const formatClockForEvent = (
    gameClockSeconds: number,
    quarter: number,
    settings: GameSettings
  ): string => {
    const minutes = Math.floor(gameClockSeconds / 60);
    const seconds = gameClockSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const _getPlayerById = useCallback(
    (
      playerId?: string,
      state: GameState = currentGameState
    ): Player | undefined => {
      if (!playerId || !state) return undefined;
      let player = state.homeTeam.players.find((p) => p.id === playerId);
      if (player) return player;
      player = state.awayTeam.players.find((p) => p.id === playerId);
      return player;
    },
    [currentGameState]
  );

  const _getTeamById = useCallback(
    (
      teamId?: string,
      state: GameState = currentGameState
    ): TeamInGame | undefined => {
      if (!teamId || !state) return undefined;
      if (state.homeTeam.id === teamId) return state.homeTeam;
      if (state.awayTeam.id === teamId) return state.awayTeam;
      return undefined;
    },
    [currentGameState]
  );

  const resetEventFlow = useCallback(() => {
    setSelectedEventType(null);
    setEventData({});
    setEventStep(null);
    setPendingFreeThrows([]);
    setCurrentFreeThrowIndex(0);
  }, []);

  const startEvent = (type: EventType, typeId?: string) => {
    if (!currentGameState) return;
    resetEventFlow();
    setSelectedEventType(type);
    const initialEventData: Partial<GameEvent> = { type, typeId };
    let initialStep: string | null = "SELECT_PRIMARY_PLAYER";

    switch (type) {
      case "JUMP_BALL":
        initialStep = "SELECT_JUMP_BALL_PLAYERS";
        initialEventData.jumpBallDetails = {
          homePlayerId: "",
          awayPlayerId: "",
          wonByTeamId: "",
          possessionArrowToTeamId: "",
        };
        break;
      case "SUBSTITUTION":
        initialStep = "SELECT_PLAYER_OUT";
        initialEventData.substitutionDetails = {
          playerOutId: "",
          playerInId: "",
          teamId: "",
        };
        break;
      case "TIMEOUT_REQUEST":
        initialStep = "SELECT_TEAM_FOR_TIMEOUT";
        initialEventData.timeoutDetails = { teamId: "", type: "FULL_60" };
        break;
      case "FOUL_TECHNICAL":
        initialStep = "SELECT_TECHNICAL_FOUL_INFRINGER_TYPE";
        initialEventData.foulDetails = {
          committedBy: "PLAYER",
          isPersonalFoul: false,
          resultsInFreeThrows: false,
        };
        break;
      case "ADMIN_EVENT":
        initialStep = "SELECT_ADMIN_ACTION";
        initialEventData.adminEventDetails = { action: "" };
        break;
      case "HELD_BALL":
        initialStep = "SELECT_HELD_BALL_PLAYERS";
        initialEventData.heldBallDetails = {
          possessionAwardedToTeamId: "",
          arrowWillPointToTeamId: "",
        };
        break;
      case "2POINTS_MADE":
      case "3POINTS_MADE":
      case "2POINTS_MISSED":
      case "3POINTS_MISSED":
      case "TURNOVER":
        initialEventData.primaryTeamId =
          currentGameState.possessionTeamId || undefined;
        break;
      case "STEAL":
      case "BLOCK":
      case "DEFLECTION":
        initialEventData.primaryTeamId =
          currentGameState.possessionTeamId === currentGameState.homeTeam.id
            ? currentGameState.awayTeam.id
            : currentGameState.possessionTeamId === currentGameState.awayTeam.id
            ? currentGameState.homeTeam.id
            : undefined;
        break;
      case "REBOUND_OFFENSIVE":
      case "REBOUND_DEFENSIVE":
        initialStep = "SELECT_PRIMARY_PLAYER";
        break;
    }
    setEventData(initialEventData);
    setEventStep(initialStep);
    setGameState((prev) => ({
      ...prev!,
      isGameClockRunning: false,
      isPausedForEvent: true,
    }));
  };

  const updateEventData = (update: Partial<GameEvent>) => {
    setEventData((prev) => ({ ...prev, ...update }));
  };

  const advanceEventStep = (nextStep: string | null) => {
    setEventStep(nextStep);
  };

  const cancelEvent = () => {
    if (!currentGameState) return;
    const wasPausedForEvent = currentGameState.isPausedForEvent;
    resetEventFlow();
    setGameState((prev) => ({
      ...prev!,
      isPausedForEvent: false,
      isGameClockRunning:
        prev!.isGameStarted &&
        !prev!.isGameOver &&
        prev!.gameClockSeconds > 0 &&
        wasPausedForEvent,
    }));
  };

  const _updatePlayerAndTeamFouls = (
    newState: GameState,
    playerId: string | "COACH" | "BENCH",
    teamId: string,
    foulType: PersonalFoulType | TechnicalFoulType,
    isPersonal: boolean,
    eventBeingProcessed: GameEvent
  ) => {
    const teamObj = _getTeamById(teamId, newState);
    if (!teamObj) return;
    let playerObj: Player | undefined;
    if (playerId !== "COACH" && playerId !== "BENCH") {
      const playerIdx = teamObj.players.findIndex(
        (p: Player) => p.id === playerId
      );
      if (playerIdx > -1) {
        playerObj = teamObj.players[playerIdx];
        if (playerObj.isEjected) {
          console.warn(
            `Tentativa de aplicar falta a jogador já ejetado: ${playerObj.name}`
          );
          return;
        }
        if (isPersonal) {
          playerObj.stats.personalFouls += 1;
          if (
            playerObj.stats.personalFouls >=
            newState.settings.playerFoulsToEject
          ) {
            playerObj.isEjected = true;
            if (eventBeingProcessed.foulDetails)
              eventBeingProcessed.foulDetails.ejectsPlayer = true;
          }
        }
        const techFoulType = foulType as TechnicalFoulType;
        if (techFoulType === "CLASS_A_PLAYER") {
          playerObj.stats.technicalFouls += 1;
          playerObj.stats.personalFouls += 1;
          if (
            playerObj.stats.technicalFouls >=
              newState.settings.playerTechFoulsToEject ||
            playerObj.stats.personalFouls >=
              newState.settings.playerFoulsToEject
          ) {
            playerObj.isEjected = true;
            if (eventBeingProcessed.foulDetails)
              eventBeingProcessed.foulDetails.ejectsPlayer = true;
          }
        } else if (techFoulType === "CLASS_B_PLAYER") {
          playerObj.stats.technicalFouls += 1;
          if (
            playerObj.stats.technicalFouls >=
            newState.settings.playerTechFoulsToEject
          ) {
            playerObj.isEjected = true;
            if (eventBeingProcessed.foulDetails)
              eventBeingProcessed.foulDetails.ejectsPlayer = true;
          }
        }
      }
    } else if (playerId === "COACH") {
      teamObj.coachTechnicalFouls += 1;
      if (
        teamObj.coachTechnicalFouls >= newState.settings.coachTechFoulsToEject
      ) {
        if (eventBeingProcessed.foulDetails)
          eventBeingProcessed.foulDetails.ejectsCoach = true;
      }
    } else if (playerId === "BENCH") {
      teamObj.benchTechnicalFouls += 1;
    }
    const countsForTeamBonus =
      (isPersonal && foulType !== "OFFENSIVE") ||
      (foulType as TechnicalFoulType) === "CLASS_A_PLAYER";
    if (countsForTeamBonus && teamObj) {
      teamObj.teamFoulsThisQuarter += 1;
      if (
        teamObj.teamFoulsThisQuarter >= newState.settings.teamFoulsForBonus &&
        !teamObj.isInBonus
      ) {
        teamObj.isInBonus = true;
      }
    }
  };

  const applyEventToState = (
    event: GameEvent,
    currentState: GameState
  ): GameState => {
    const newState = JSON.parse(JSON.stringify(currentState));
    const updatePlayerStatsInState = (
      playerId: string,
      teamId: string,
      statUpdates: Partial<PlayerStats>
    ) => {
      const targetTeamObj =
        newState.homeTeam.id === teamId ? newState.homeTeam : newState.awayTeam;
      const playerIndex = targetTeamObj.players.findIndex(
        (p: Player) => p.id === playerId
      );
      if (playerIndex > -1) {
        const playerToUpdate = targetTeamObj.players[playerIndex];
        if (
          playerToUpdate.isEjected &&
          !(statUpdates.personalFouls || statUpdates.technicalFouls)
        )
          return;
        const oldStats = playerToUpdate.stats;
        const newPlayerStats: PlayerStats = { ...oldStats };
        (Object.keys(statUpdates) as Array<keyof PlayerStats>).forEach(
          (key) => {
            newPlayerStats[key] =
              (oldStats[key] || 0) + (statUpdates[key] || 0);
          }
        );
        targetTeamObj.players[playerIndex].stats = newPlayerStats;
      }
    };
    switch (event.type) {
      case "JUMP_BALL":
        if (event.jumpBallDetails) {
          newState.possessionTeamId = event.jumpBallDetails.wonByTeamId;
          newState.possessionArrow =
            event.jumpBallDetails.possessionArrowToTeamId ===
            newState.homeTeam.id
              ? "HOME"
              : "AWAY";
          newState.isGameStarted = true;
          newState.isGameClockRunning = true;
        }
        break;
      case "2POINTS_MADE":
      case "3POINTS_MADE":
        if (event.shotDetails && event.primaryTeamId && event.primaryPlayerId) {
          const { points, isMade, assistPlayerId, isAssisted } =
            event.shotDetails;
          updatePlayerStatsInState(
            event.primaryPlayerId,
            event.primaryTeamId,
            points === 2
              ? {
                  fieldGoalsAttempted2PT: 1,
                  ...(isMade && { fieldGoalsMade2PT: 1 }),
                }
              : {
                  fieldGoalsAttempted3PT: 1,
                  ...(isMade && { fieldGoalsMade3PT: 1 }),
                }
          );
          if (isMade) {
            updatePlayerStatsInState(
              event.primaryPlayerId,
              event.primaryTeamId,
              { points }
            );
            if (event.primaryTeamId === newState.homeTeam.id)
              newState.homeScore += points;
            else newState.awayScore += points;
            if (isAssisted && assistPlayerId)
              updatePlayerStatsInState(assistPlayerId, event.primaryTeamId, {
                assists: 1,
              });
          }
          newState.isGameClockRunning = false;
          if (!event.foulDetails?.resultsInFreeThrows)
            newState.possessionTeamId =
              event.primaryTeamId === newState.homeTeam.id
                ? newState.awayTeam.id
                : newState.homeTeam.id;
        }
        break;
      case "2POINTS_MISSED":
      case "3POINTS_MISSED":
        if (event.shotDetails && event.primaryTeamId && event.primaryPlayerId) {
          updatePlayerStatsInState(
            event.primaryPlayerId,
            event.primaryTeamId,
            event.type === "2POINTS_MISSED"
              ? { fieldGoalsAttempted2PT: 1 }
              : { fieldGoalsAttempted3PT: 1 }
          );
          if (
            event.shotDetails.isBlocked &&
            event.shotDetails.blockPlayerId &&
            event.secondaryTeamId
          )
            updatePlayerStatsInState(
              event.shotDetails.blockPlayerId,
              event.secondaryTeamId,
              { blocks: 1 }
            );
          if (!event.reboundDetails && !event.foulDetails) {
            newState.possessionTeamId = null;
            newState.isGameClockRunning = true;
          }
        }
        break;
      case "REBOUND_OFFENSIVE":
      case "REBOUND_DEFENSIVE":
        if (
          event.reboundDetails &&
          event.reboundDetails.reboundPlayerId &&
          event.primaryTeamId
        ) {
          updatePlayerStatsInState(
            event.reboundDetails.reboundPlayerId,
            event.primaryTeamId,
            {
              [event.type === "REBOUND_OFFENSIVE"
                ? "reboundsOffensive"
                : "reboundsDefensive"]: 1,
            }
          );
          newState.possessionTeamId = event.primaryTeamId;
          newState.isGameClockRunning = true;
          if (
            event.reboundDetails.isTipInAttempt &&
            event.reboundDetails.tipInShotType &&
            event.reboundDetails.reboundPlayerId
          ) {
            const tipInPoints = event.reboundDetails.tipInMade ? 2 : 0;
            const tipInEvent: GameEvent = {
              id: generateId("evt_tipin"),
              type: tipInPoints > 0 ? "2POINTS_MADE" : "2POINTS_MISSED",
              gameClock: event.gameClock,
              realTimestamp: new Date(),
              quarter: event.quarter,
              primaryPlayerId: event.reboundDetails.reboundPlayerId,
              primaryTeamId: event.primaryTeamId,
              shotDetails: {
                type: event.reboundDetails.tipInShotType,
                isMade: !!event.reboundDetails.tipInMade,
                points: tipInPoints,
                isAssisted: false,
                isBlocked: false,
              },
            };
            newState.events.push(tipInEvent);
            return applyEventToState(tipInEvent, newState);
          }
        }
        break;
      case "DEAD_BALL_REBOUND":
        if (event.reboundDetails?.reboundTeamId) {
          newState.possessionTeamId = event.reboundDetails.reboundTeamId;
          newState.isGameClockRunning = false;
        }
        break;
      case "FOUL_PERSONAL":
      case "FOUL_TECHNICAL":
        if (event.foulDetails) {
          const {
            committedByPlayerId,
            committedByTeamId,
            committedBy,
            personalFoulType,
            technicalFoulType,
            drawnByPlayerId,
          } = event.foulDetails;
          if (committedByTeamId)
            _updatePlayerAndTeamFouls(
              newState,
              committedByPlayerId || committedBy,
              committedByTeamId,
              personalFoulType || technicalFoulType!,
              !!personalFoulType,
              event
            );
          const foulTeamObjFromState = committedByTeamId
            ? _getTeamById(committedByTeamId, newState)
            : undefined;
          const shotDataForFoul = event.shotDetails;
          let resultsInFTs = false;
          let numFTs = 0;
          const ftShooterId =
            drawnByPlayerId || event.foulDetails.freeThrowShooterPlayerId;
          if (personalFoulType === "SHOOTING") {
            resultsInFTs = true;
            numFTs = shotDataForFoul?.type?.includes("3PT") ? 3 : 2;
            if (shotDataForFoul?.isMade) numFTs = 1;
          } else if (
            foulTeamObjFromState?.isInBonus &&
            personalFoulType !== "OFFENSIVE" &&
            ((personalFoulType &&
              PERSONAL_FOUL_TYPES.find(
                (f) => f.value === personalFoulType && !f.isOffensive
              )) ||
              technicalFoulType === "CLASS_A_PLAYER")
          ) {
            resultsInFTs = true;
            numFTs = 2;
          } else if (event.type === "FOUL_TECHNICAL") {
            resultsInFTs = true;
            numFTs = TECHNICAL_FOUL_TYPES.find(
              (t) => t.value === technicalFoulType
            )?.countsAsPersonal
              ? 1
              : 2;
          } else if (
            personalFoulType === "FLAGRANT_1" ||
            personalFoulType === "FLAGRANT_2"
          ) {
            resultsInFTs = true;
            numFTs = 2;
          }
          event.foulDetails.resultsInFreeThrows = resultsInFTs;
          event.foulDetails.numberOfFreeThrowsAwarded = numFTs;
          event.foulDetails.freeThrowShooterPlayerId = ftShooterId;
          if (resultsInFTs && numFTs > 0 && ftShooterId) {
            const shooter = _getPlayerById(ftShooterId, newState);
            if (shooter && shooter.isEjected) {
              event.foulDetails.resultsInFreeThrows = false;
              event.foulDetails.numberOfFreeThrowsAwarded = 0;
              newState.isPausedForEvent = false;
            } else if (shooter) {
              const newFTs: FreeThrowLog[] = [];
              for (let i = 0; i < numFTs; i++)
                newFTs.push({
                  id: generateId("ft"),
                  attemptNumberInSequence: i + 1,
                  totalAwarded: numFTs,
                  shooterPlayerId: ftShooterId!,
                  isMade: false,
                  isTechnicalOrFlagrantFT:
                    event.type === "FOUL_TECHNICAL" ||
                    personalFoulType === "FLAGRANT_1" ||
                    personalFoulType === "FLAGRANT_2",
                  originalFoulEventId: event.id,
                });
              setPendingFreeThrows(newFTs);
              setCurrentFreeThrowIndex(0);
              newState.isPausedForEvent = true;
              setEventStep("AWAITING_FREE_THROW");
            } else {
              event.foulDetails.resultsInFreeThrows = false;
              event.foulDetails.numberOfFreeThrowsAwarded = 0;
              newState.isPausedForEvent = false;
            }
          } else {
            if (personalFoulType === "DOUBLE") {
              newState.possessionTeamId =
                newState.possessionArrow === "HOME"
                  ? newState.homeTeam.id
                  : newState.awayTeam.id;
              newState.possessionArrow =
                newState.possessionArrow === "HOME" ? "AWAY" : "HOME";
            } else if (personalFoulType === "OFFENSIVE" && committedByTeamId)
              newState.possessionTeamId =
                committedByTeamId === newState.homeTeam.id
                  ? newState.awayTeam.id
                  : newState.homeTeam.id;
            else if (drawnByPlayerId) {
              const victim = _getPlayerById(drawnByPlayerId, newState);
              if (victim) newState.possessionTeamId = victim.teamId;
            } else newState.possessionTeamId = null;
            newState.isGameClockRunning = false;
          }
        }
        break;
      case "FREE_THROW_ATTEMPT":
        if (
          event.freeThrowDetails &&
          event.primaryPlayerId &&
          event.primaryTeamId
        ) {
          const {
            shooterPlayerId,
            isMade,
            attemptNumberInSequence,
            totalAwarded,
            isTechnicalOrFlagrantFT,
          } = event.freeThrowDetails;
          updatePlayerStatsInState(shooterPlayerId, event.primaryTeamId, {
            freeThrowsAttempted: 1,
          });
          if (isMade) {
            updatePlayerStatsInState(shooterPlayerId, event.primaryTeamId, {
              freeThrowsMade: 1,
              points: 1,
            });
            if (event.primaryTeamId === newState.homeTeam.id)
              newState.homeScore += 1;
            else newState.awayScore += 1;
          }
          if (attemptNumberInSequence === totalAwarded) {
            setPendingFreeThrows([]);
            setCurrentFreeThrowIndex(0);
            newState.isPausedForEvent = false;
            setEventStep(null);
            if (isTechnicalOrFlagrantFT) {
              const originalFoul = newState.events.find(
                (e: GameEvent) =>
                  e.id === event.freeThrowDetails?.originalFoulEventId
              );
              const victimPlayer = originalFoul?.foulDetails?.drawnByPlayerId
                ? _getPlayerById(
                    originalFoul.foulDetails.drawnByPlayerId,
                    newState
                  )
                : null;
              const victimTeamId =
                victimPlayer?.teamId ||
                (originalFoul?.foulDetails?.committedByTeamId ===
                newState.homeTeam.id
                  ? newState.awayTeam.id
                  : newState.homeTeam.id);
              newState.possessionTeamId = victimTeamId;
            } else {
              if (!isMade) {
                newState.possessionTeamId = null;
                newState.isGameClockRunning = true;
              } else {
                newState.possessionTeamId =
                  event.primaryTeamId === newState.homeTeam.id
                    ? newState.awayTeam.id
                    : newState.homeTeam.id;
                newState.isGameClockRunning = false;
              }
            }
            if (newState.possessionTeamId) newState.isGameClockRunning = false;
          } else {
            setCurrentFreeThrowIndex((idx) => idx + 1);
            setEventStep("AWAITING_FREE_THROW");
            newState.isPausedForEvent = true;
            newState.isGameClockRunning = false;
          }
        }
        break;
      case "SUBSTITUTION":
        if (event.substitutionDetails) {
          const { playerOutId, playerInId, teamId } = event.substitutionDetails;
          const teamToUpdate =
            newState.homeTeam.id === teamId
              ? newState.homeTeam
              : newState.awayTeam;
          const playerInObj = _getPlayerById(playerInId, newState);
          const playerOutObj = _getPlayerById(playerOutId, newState);
          if (playerInObj?.isEjected) {
            return currentState;
          }
          if (!playerOutObj || !teamToUpdate.onCourt.includes(playerOutId)) {
            return currentState;
          }
          if (!playerInObj || !teamToUpdate.bench.includes(playerInId)) {
            return currentState;
          }
          const outIdx = teamToUpdate.onCourt.indexOf(playerOutId);
          const inIdx = teamToUpdate.bench.indexOf(playerInId);
          if (outIdx > -1 && inIdx > -1) {
            teamToUpdate.onCourt.splice(outIdx, 1);
            teamToUpdate.bench.splice(inIdx, 1);
            teamToUpdate.onCourt.push(playerInId);
            teamToUpdate.bench.push(playerOutId);
          }
        }
        break;
      case "TIMEOUT_REQUEST":
        if (
          event.timeoutDetails &&
          event.timeoutDetails.teamId &&
          event.timeoutDetails.type
        ) {
          const teamReq =
            newState.homeTeam.id === event.timeoutDetails.teamId
              ? newState.homeTeam
              : newState.awayTeam;
          const timeoutTypeKey =
            `${event.timeoutDetails.type.toLowerCase()}_left` as keyof TeamInGame["timeouts"];
          if (teamReq.timeouts[timeoutTypeKey] > 0) {
            teamReq.timeouts[timeoutTypeKey] -= 1;
            newState.isGameClockRunning = false;
          } else {
            return currentState;
          }
        }
        break;
      case "HELD_BALL":
        if (event.heldBallDetails) {
          newState.possessionTeamId =
            event.heldBallDetails.possessionAwardedToTeamId;
          newState.possessionArrow =
            event.heldBallDetails.arrowWillPointToTeamId ===
            newState.homeTeam.id
              ? "HOME"
              : "AWAY";
          newState.isGameClockRunning = false;
        }
        break;
      case "ADMIN_EVENT":
        if (event.adminEventDetails) {
          const action = event.adminEventDetails.action;
          if (action === "START_PERIOD") {
            if (newState.currentQuarter >= 1) {
              if (newState.currentQuarter === 1 && newState.isGameStarted) {
              } else if (
                newState.currentQuarter > 1 ||
                !newState.isGameStarted
              ) {
                newState.possessionTeamId =
                  newState.possessionArrow === "HOME"
                    ? newState.homeTeam.id
                    : newState.possessionArrow === "AWAY"
                    ? newState.awayTeam.id
                    : event.adminEventDetails.possessionSetToTeamId || null;
                if (newState.possessionTeamId)
                  newState.possessionArrow =
                    newState.possessionArrow === "HOME" ? "AWAY" : "HOME";
              }
            }
            newState.isGameClockRunning = true;
            if (!newState.isGameStarted) newState.isGameStarted = true;
          } else if (action === "END_PERIOD") {
            newState.isGameClockRunning = false;
            const isLastRegulationQuarter =
              newState.currentQuarter === newState.settings.quarters;
            const isOvertime =
              newState.currentQuarter > newState.settings.quarters;
            if (
              (isLastRegulationQuarter || isOvertime) &&
              newState.homeScore !== newState.awayScore
            ) {
              newState.isGameOver = true;
              newState.winnerTeamId =
                newState.homeScore > newState.awayScore
                  ? newState.homeTeam.id
                  : newState.awayTeam.id;
            } else if (
              (isLastRegulationQuarter || isOvertime) &&
              newState.homeScore === newState.awayScore
            ) {
              newState.currentQuarter += 1;
              newState.gameClockSeconds =
                newState.settings.minutesPerOvertime * 60;
              [newState.homeTeam, newState.awayTeam].forEach((t) => {
                t.teamFoulsThisQuarter = 0;
                t.isInBonus = false;
              });
            } else if (newState.currentQuarter < newState.settings.quarters) {
              newState.currentQuarter += 1;
              newState.gameClockSeconds =
                newState.settings.minutesPerQuarter * 60;
              [newState.homeTeam, newState.awayTeam].forEach((t) => {
                t.teamFoulsThisQuarter = 0;
                t.isInBonus = false;
              });
            } else {
              newState.isGameOver = true;
              newState.winnerTeamId = null;
            }
          } else if (action === "END_GAME") {
            newState.isGameClockRunning = false;
            newState.isGameOver = true;
            newState.winnerTeamId =
              newState.homeScore > newState.awayScore
                ? newState.homeTeam.id
                : newState.awayScore > newState.homeScore
                ? newState.awayTeam.id
                : null;
          } else if (
            action === "POSSESSION_ARROW_SET" &&
            event.adminEventDetails.possessionSetToTeamId
          )
            newState.possessionArrow =
              event.adminEventDetails.possessionSetToTeamId ===
              newState.homeTeam.id
                ? "HOME"
                : "AWAY";
        }
        break;
      case "TURNOVER":
        if (
          event.turnoverDetails &&
          event.turnoverDetails.lostByPlayerId &&
          event.primaryTeamId
        ) {
          updatePlayerStatsInState(
            event.turnoverDetails.lostByPlayerId,
            event.primaryTeamId,
            { turnovers: 1 }
          );
          newState.possessionTeamId =
            event.primaryTeamId === newState.homeTeam.id
              ? newState.awayTeam.id
              : newState.homeTeam.id;
          newState.isGameClockRunning = false;
          if (event.turnoverDetails.stolenByPlayerId && event.secondaryTeamId)
            updatePlayerStatsInState(
              event.turnoverDetails.stolenByPlayerId,
              event.secondaryTeamId,
              { steals: 1 }
            );
        }
        break;
      case "STEAL":
        if (
          event.stealDetails &&
          event.stealDetails.stolenByPlayerId &&
          event.primaryTeamId
        ) {
          updatePlayerStatsInState(
            event.stealDetails.stolenByPlayerId,
            event.primaryTeamId,
            { steals: 1 }
          );
          newState.possessionTeamId = event.primaryTeamId;
          newState.isGameClockRunning = true;
          if (
            event.stealDetails.lostPossessionByPlayerId &&
            event.secondaryTeamId
          )
            updatePlayerStatsInState(
              event.stealDetails.lostPossessionByPlayerId,
              event.secondaryTeamId,
              { turnovers: 1 }
            );
        }
        break;
      case "BLOCK":
        if (
          event.blockDetails &&
          event.blockDetails.blockPlayerId &&
          event.primaryTeamId
        ) {
          updatePlayerStatsInState(
            event.blockDetails.blockPlayerId,
            event.primaryTeamId,
            { blocks: 1 }
          );
          newState.isGameClockRunning = true;
        }
        break;
      case "DEFLECTION":
        break;
    }
    [newState.homeTeam, newState.awayTeam].forEach((team) => {
      const newOnCourt: string[] = [];
      let substitutionNeeded = false;
      team.onCourt.forEach((playerId) => {
        const player = _getPlayerById(playerId, newState);
        if (player && !player.isEjected) {
          newOnCourt.push(playerId);
        } else if (player?.isEjected) {
          if (!team.bench.includes(playerId)) team.bench.push(playerId);
          substitutionNeeded = true;
        }
      });
      team.onCourt = newOnCourt;
      if (substitutionNeeded) {
        newState.isGameClockRunning = false;
      }
    });
    return newState;
  };

  const confirmCurrentEvent = async () => {
    if (!currentGameState || !selectedEventType || !eventData.type) {
      cancelEvent();
      return;
    }
    const finalEvent: GameEvent = {
      id: generateId("evt"),
      realTimestamp: new Date(),
      gameClock: formatClockForEvent(
        currentGameState.gameClockSeconds,
        currentGameState.currentQuarter,
        currentGameState.settings
      ),
      quarter: currentGameState.currentQuarter,
      ...eventData,
    };

    // Validações do evento
    if (finalEvent.type === "SUBSTITUTION" && finalEvent.substitutionDetails) {
      if (
        !finalEvent.substitutionDetails.playerInId ||
        !finalEvent.substitutionDetails.playerOutId
      ) {
        alert("ERRO: Selecione jogador a entrar e a sair para a substituição.");
        return;
      }
      if (
        finalEvent.substitutionDetails.playerInId ===
        finalEvent.substitutionDetails.playerOutId
      ) {
        alert("ERRO: Jogador a entrar não pode ser o mesmo que saiu.");
        return;
      }
      const playerIn = _getPlayerById(
        finalEvent.substitutionDetails.playerInId,
        currentGameState
      );
      if (playerIn?.isEjected) {
        alert(`ERRO: ${playerIn.name} está ejetado e não pode entrar.`);
        return;
      }
    }
    if (finalEvent.type === "TIMEOUT_REQUEST" && finalEvent.timeoutDetails) {
      const teamReq = _getTeamById(
        finalEvent.timeoutDetails.teamId,
        currentGameState
      );
      const timeoutTypeKey =
        `${finalEvent.timeoutDetails.type.toLowerCase()}_left` as keyof TeamInGame["timeouts"];
      if (teamReq && teamReq.timeouts[timeoutTypeKey] <= 0) {
        alert(
          `ERRO: Equipa ${teamReq.shortName} não tem mais timeouts do tipo ${finalEvent.timeoutDetails.type}.`
        );
        return;
      }
    }
    if (
      (finalEvent.type === "2POINTS_MADE" ||
        finalEvent.type === "3POINTS_MADE" ||
        finalEvent.type === "2POINTS_MISSED" ||
        finalEvent.type === "3POINTS_MISSED") &&
      !finalEvent.primaryPlayerId
    ) {
      alert("ERRO: Selecione o jogador que arremessou.");
      return;
    }
    if (
      finalEvent.foulDetails?.resultsInFreeThrows &&
      finalEvent.foulDetails.numberOfFreeThrowsAwarded &&
      finalEvent.foulDetails.numberOfFreeThrowsAwarded > 0 &&
      !finalEvent.foulDetails.freeThrowShooterPlayerId
    ) {
      alert("ERRO: Selecione o jogador para cobrar os Lances Livres.");
      return;
    }

    const totalMinutesPerPeriod = currentGameState.settings.minutesPerQuarter;
    const minutesRemaining = Math.floor(currentGameState.gameClockSeconds / 60);
    const secondsRemaining = currentGameState.gameClockSeconds % 60;
    const minutesIntoPeriod =
      totalMinutesPerPeriod -
      minutesRemaining -
      (secondsRemaining === 0 && currentGameState.gameClockSeconds > 0 ? 1 : 0);
    const secondsIntoPeriod = (60 - secondsRemaining) % 60;

    const payload = {
      matchId: currentGameState.gameId,
      minute: minutesIntoPeriod,
      second: secondsIntoPeriod,
      typeId: finalEvent.typeId,
      subtypeId: finalEvent.subtypeId,
      details: finalEvent.description || `Evento: ${finalEvent.type}`,
      participants: [
        { playerId: finalEvent.primaryPlayerId, role: "Autor Principal" },
        { playerId: finalEvent.secondaryPlayerId, role: "Autor Secundário" },
        ...(finalEvent.shotDetails?.assistPlayerId
          ? [
              {
                playerId: finalEvent.shotDetails.assistPlayerId,
                role: "Assistência",
              },
            ]
          : []),
      ].filter((p) => p.playerId),
    };

    if (isOnline) {
      try {
        console.log(
          "ONLINE: Enviando evento para a API:",
          JSON.stringify(payload, null, 2)
        );
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/match-events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          throw new Error(`API respondeu com status: ${response.status}`);
        }
        console.log("Evento registrado com sucesso na API.");
      } catch (error) {
        console.error(
          "Erro ao enviar evento (mesmo online), adicionando à fila:",
          error
        );
        addToOfflineQueue(payload, currentGameState.gameId);
      }
    } else {
      console.log(
        "OFFLINE: Adicionando evento à fila:",
        JSON.stringify(payload, null, 2)
      );
      addToOfflineQueue(payload, currentGameState.gameId);
    }

    const newState = applyEventToState(finalEvent, currentGameState);
    newState.events = [...currentGameState.events, finalEvent];

    const allPendingFTsProcessed =
      pendingFreeThrows.length > 0 &&
      currentFreeThrowIndex >= pendingFreeThrows.length;

    if (!newState.isPausedForEvent || allPendingFTsProcessed) {
      resetEventFlow();
      newState.isGameClockRunning =
        newState.isGameStarted &&
        !newState.isGameOver &&
        newState.gameClockSeconds > 0 &&
        !newState.isPausedForEvent;
    }

    setGameState(newState);
    saveStateToLocalStorage(newState); // Salva o novo estado
    if (!newState.isPausedForEvent) {
      resetEventFlow();
    }
  };

  const handleFreeThrowResult = (isMade: boolean) => {
    if (
      !currentGameState ||
      pendingFreeThrows.length === 0 ||
      currentFreeThrowIndex >= pendingFreeThrows.length
    ) {
      return;
    }
    const currentFTLog = pendingFreeThrows[currentFreeThrowIndex];
    const shooter = _getPlayerById(
      currentFTLog.shooterPlayerId,
      currentGameState
    );
    if (!shooter) {
      alert("Erro crítico: Cobrador de LL não encontrado.");
      return;
    }
    if (shooter.isEjected) {
      alert(`ERRO: ${shooter.name} está ejetado.`);
      return;
    }

    const ftEvent: GameEvent = {
      id: generateId("evt_ft"),
      type: "FREE_THROW_ATTEMPT",
      gameClock: formatClockForEvent(
        currentGameState.gameClockSeconds,
        currentGameState.currentQuarter,
        currentGameState.settings
      ),
      realTimestamp: new Date(),
      quarter: currentGameState.currentQuarter,
      primaryPlayerId: currentFTLog.shooterPlayerId,
      primaryTeamId: shooter.teamId,
      freeThrowDetails: { ...currentFTLog, isMade: isMade },
      description: `LL ${currentFTLog.attemptNumberInSequence}/${
        currentFTLog.totalAwarded
      } por ${shooter.name} (${isMade ? "CONV." : "FALH."})`,
    };
    const updatedPendingFTs = pendingFreeThrows.map((ft, index) =>
      index === currentFreeThrowIndex ? { ...ft, isMade: isMade } : ft
    );
    setPendingFreeThrows(updatedPendingFTs);

    const tempStateWithFT = applyEventToState(ftEvent, currentGameState);
    tempStateWithFT.events = [...currentGameState.events, ftEvent];

    if (
      currentFTLog.attemptNumberInSequence === currentFTLog.totalAwarded &&
      !tempStateWithFT.isPausedForEvent
    ) {
      resetEventFlow();
      tempStateWithFT.isGameClockRunning =
        tempStateWithFT.isGameStarted &&
        !tempStateWithFT.isGameOver &&
        tempStateWithFT.gameClockSeconds > 0 &&
        !tempStateWithFT.isPausedForEvent;
    }

    setGameState(tempStateWithFT);
    saveStateToLocalStorage(tempStateWithFT); // Salva o novo estado
  };

  const undoLastEvent = () => {
    setGameState((prev) => {
      if (!prev || prev.events.length === 0) {
        return prev;
      }
      const eventsToReplay = prev.events.slice(0, -1);
      const initialHomeTeam = initializeTeamInGameForUndo(
        homeTeamBaseForUndo,
        mockHomePlayersDataForUndo,
        prev.settings
      );
      const initialAwayTeam = initializeTeamInGameForUndo(
        awayTeamBaseForUndo,
        mockAwayPlayersDataForUndo,
        prev.settings
      );

      let revertedState: GameState = {
        gameId: prev.gameId,
        settings: prev.settings,
        homeTeam: initialHomeTeam,
        awayTeam: initialAwayTeam,
        homeScore: 0,
        awayScore: 0,
        currentQuarter: 1,
        gameClockSeconds: prev.settings.minutesPerQuarter * 60,
        possessionTeamId: null,
        possessionArrow: null,
        events: [],
        isGameStarted: false,
        isGameClockRunning: false,
        isPausedForEvent: false,
        isGameOver: false,
        winnerTeamId: null,
      };
      for (const event of eventsToReplay) {
        revertedState = applyEventToState(event, revertedState);
      }
      revertedState.events = eventsToReplay;

      if (selectedEventType) resetEventFlow();
      revertedState.isGameClockRunning = false;
      revertedState.isPausedForEvent = false;

      saveStateToLocalStorage(revertedState); // Salva o estado revertido
      return revertedState;
    });
  };

  return {
    selectedEventType,
    eventData,
    eventStep,
    pendingFreeThrows,
    currentFreeThrowIndex,
    startEvent,
    updateEventData,
    advanceEventStep,
    cancelEvent,
    confirmCurrentEvent,
    handleFreeThrowResult,
    undoLastEvent,
    getPlayerById: _getPlayerById,
  };
}
