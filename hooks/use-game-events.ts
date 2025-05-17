import { useState, useCallback } from "react";
import {
  GameState,
  GameEvent,
  EventType,
  Player,
  TeamInGame,
  FreeThrowLog,
  PossessionArrowDirection,
  GameSettings,
  AllShotTypes,
  PersonalFoulType,
  TechnicalFoulType,
  TurnoverType,
  initialPlayerStats,
} from "@/app/types/match-live";
import { generateId } from "@/lib/utils";
import {
  TEAM_FoulS_BONUS_THRESHOLD,
  PLAYER_FOULS_EJECTION_TECHNICAL,
  PLAYER_FOULS_EJECTION_PERSONAL,
  PERSONAL_FOUL_TYPES,
  TECHNICAL_FOUL_TYPES,
} from "@/app/data/basketball-definitions";

export function useGameEvents(
  initialGameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
) {
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(
    null
  );
  const [eventData, setEventData] = useState<Partial<GameEvent>>({}); // Dados do evento em construção
  const [eventStep, setEventStep] = useState<string | null>(null); // Passo atual dentro de um evento multi-passo

  const [pendingFreeThrows, setPendingFreeThrows] = useState<FreeThrowLog[]>(
    []
  );
  const [currentFreeThrowIndex, setCurrentFreeThrowIndex] = useState(0);

  const formatClockForEvent = (
    gameClockSeconds: number,
    quarter: number
  ): string => {
    const minutes = Math.floor(gameClockSeconds / 60);
    const seconds = gameClockSeconds % 60;
    const qLabel =
      quarter <= initialGameState.settings.quarters
        ? `Q${quarter}`
        : `OT${quarter - initialGameState.settings.quarters}`;
    return `${qLabel} ${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const startEvent = (type: EventType) => {
    setSelectedEventType(type);
    setEventData({ type });
    setEventStep("SELECT_PRIMARY_PLAYER"); // Passo inicial comum para muitos eventos

    // Lógica específica de início de evento
    if (type === "JUMP_BALL") {
      setEventStep("SELECT_JUMP_BALL_PLAYERS"); // Certifique-se que este é o primeiro passo
      updateEventData({
        // Limpa detalhes de saltos anteriores ao iniciar novo evento
        jumpBallDetails: {
          homePlayerId: "",
          awayPlayerId: "",
          wonByTeamId: "",
          possessionArrowToTeamId: "",
        },
      });
    }
    if (type === "SUBSTITUTION") setEventStep("SELECT_PLAYER_OUT");
    if (type === "TIMEOUT_REQUEST") setEventStep("SELECT_TEAM_FOR_TIMEOUT");
    if (
      type === "FOUL_TECHNICAL" &&
      !TECHNICAL_FOUL_TYPES.find(
        (ft) => ft.value === eventData.foulDetails?.technicalFoulType
      )?.countsAsPersonal
    ) {
      setEventStep("SELECT_TECHNICAL_FOUL_INFRINGER_NON_PLAYER"); // Se for técnica de banco/treinador
    }
    if (type === "ADMIN_EVENT") setEventStep("SELECT_ADMIN_ACTION");

    // Pausar cronómetros ao iniciar um evento que necessita de input
    setGameState((prev) => ({
      ...prev,
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
    setSelectedEventType(null);
    setEventData({});
    setEventStep(null);
    setPendingFreeThrows([]);
    setCurrentFreeThrowIndex(0);
    // Retomar cronómetro se o jogo estava a correr e não há outro motivo para pausa
    setGameState((prev) => ({
      ...prev,
      isPausedForEvent: false,
      isGameClockRunning: prev.isGameStarted && !prev.isGameOver,
      isShotClockRunning:
        prev.isGameStarted && !prev.isGameOver && !!prev.possessionTeamId,
    }));
  };

  const _getPlayerById = (
    playerId: string,
    state: GameState
  ): Player | undefined => {
    return [...state.homeTeam.players, ...state.awayTeam.players].find(
      (p) => p.id === playerId
    );
  };

  const _getTeamById = (
    teamId: string,
    state: GameState
  ): TeamInGame | undefined => {
    if (state.homeTeam.id === teamId) return state.homeTeam;
    if (state.awayTeam.id === teamId) return state.awayTeam;
    return undefined;
  };

  const applyEventToState = (
    event: GameEvent,
    currentState: GameState
  ): GameState => {
    const newState = { ...currentState };
    let player: Player | undefined;
    let team: TeamInGame | undefined;
    let opponentTeam: TeamInGame | undefined;

    // Atualizar estatísticas do jogador e equipa
    const updatePlayerStats = (
      playerId: string,
      teamId: string,
      statUpdates: Partial<PlayerStats>
    ) => {
      const targetTeam =
        newState.homeTeam.id === teamId ? newState.homeTeam : newState.awayTeam;
      const playerIndex = targetTeam.players.findIndex(
        (p) => p.id === playerId
      );
      if (playerIndex > -1) {
        const oldStats = targetTeam.players[playerIndex].stats;
        targetTeam.players[playerIndex].stats = {
          ...oldStats,
          ...Object.keys(statUpdates).reduce((acc, key) => {
            const statKey = key as keyof PlayerStats;
            acc[statKey] =
              (oldStats[statKey] || 0) + (statUpdates[statKey] || 0);
            return acc;
          }, {} as PlayerStats),
        };
        if (newState.homeTeam.id === teamId)
          newState.homeTeam = { ...targetTeam };
        else newState.awayTeam = { ...targetTeam };
      }
    };

    // Lógica de atualização de estado por tipo de evento
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
          newState.isGameClockRunning = true; // Inicia o cronómetro do jogo
        }
        break;

      case "2POINTS_MADE":
      case "3POINTS_MADE":
        if (event.shotDetails && event.primaryTeamId && event.primaryPlayerId) {
          const points = event.shotDetails.points;
          if (event.primaryTeamId === newState.homeTeam.id)
            newState.homeScore += points;
          else newState.awayScore += points;

          updatePlayerStats(event.primaryPlayerId, event.primaryTeamId, {
            points,
            ...(points === 2
              ? { fieldGoalsMade2PT: 1, fieldGoalsAttempted2PT: 1 }
              : { fieldGoalsMade3PT: 1, fieldGoalsAttempted3PT: 1 }),
          });

          if (
            event.shotDetails.isAssisted &&
            event.shotDetails.assistPlayerId
          ) {
            updatePlayerStats(
              event.shotDetails.assistPlayerId,
              event.primaryTeamId,
              { assists: 1 }
            );
          }
          // Posse muda para a equipa que sofreu os pontos, para reposição
          newState.possessionTeamId =
            event.primaryTeamId === newState.homeTeam.id
              ? newState.awayTeam.id
              : newState.homeTeam.id;
          newState.isGameClockRunning = false; // Pausa para reposição (operador inicia)
        }
        break;

      case "2POINTS_MISSED":
      case "3POINTS_MISSED":
        if (event.shotDetails && event.primaryTeamId && event.primaryPlayerId) {
          updatePlayerStats(
            event.primaryPlayerId,
            event.primaryTeamId,
            event.shotDetails.points === 0 && event.type === "2POINTS_MISSED"
              ? { fieldGoalsAttempted2PT: 1 }
              : { fieldGoalsAttempted3PT: 1 }
          );
          if (
            event.shotDetails.isBlocked &&
            event.shotDetails.blockPlayerId &&
            event.secondaryTeamId
          ) {
            updatePlayerStats(
              event.shotDetails.blockPlayerId,
              event.secondaryTeamId,
              { blocks: 1 }
            );
          }
          // Posse é definida pelo ressalto ou se a bola sai
          newState.possessionTeamId = null;
          // Shot clock continua ou reseta dependendo do ressalto
        }
        break;

      case "REBOUND_OFFENSIVE":
      case "REBOUND_DEFENSIVE":
        if (
          event.reboundDetails &&
          event.reboundDetails.reboundPlayerId &&
          event.primaryTeamId
        ) {
          const statKey =
            event.type === "REBOUND_OFFENSIVE"
              ? "reboundsOffensive"
              : "reboundsDefensive";
          updatePlayerStats(
            event.reboundDetails.reboundPlayerId,
            event.primaryTeamId,
            { [statKey]: 1 }
          );

          newState.possessionTeamId = event.primaryTeamId;

          newState.isGameClockRunning = true; // O jogo continua

          if (
            event.reboundDetails.isTipInAttempt &&
            event.reboundDetails.tipInShotType
          ) {
            // Este é um novo evento de arremesso
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
            newState.events.push(tipInEvent); // Adiciona o evento de tip-in
            return applyEventToState(tipInEvent, newState); // Recursivamente aplica o estado do tip-in
          }
        } else if (
          event.reboundDetails?.type === "DEAD_BALL_TEAM" &&
          event.reboundDetails.reboundTeamId
        ) {
          // Ex: LL falhado, bola para a equipa X
          newState.possessionTeamId = event.reboundDetails.reboundTeamId;
          newState.isGameClockRunning = false; // Pausa para reposição
        }
        break;

      case "FOUL_PERSONAL":
      case "FOUL_TECHNICAL":
        if (event.foulDetails) {
          const {
            committedByPlayerId,
            committedByTeamId,
            committedBy,
            type,
            personalFoulType,
            technicalFoulType,
          } = event.foulDetails;
          const foulTeam = committedByTeamId
            ? _getTeamById(committedByTeamId, newState)
            : undefined;
          let foulPlayer: Player | undefined;

          if (committedByPlayerId && foulTeam) {
            foulPlayer = _getPlayerById(committedByPlayerId, newState);
            if (foulPlayer) {
              const isPersonal = PERSONAL_FOUL_TYPES.some(
                (ft) => ft.value === personalFoulType
              );
              const isTechnical = TECHNICAL_FOUL_TYPES.some(
                (ft) => ft.value === technicalFoulType
              );

              if (isPersonal) {
                foulPlayer.stats.personalFouls += 1;
                if (
                  foulPlayer.stats.personalFouls >=
                  newState.settings.playerFoulsToEject
                ) {
                  foulPlayer.isEjected = true;
                  event.foulDetails.ejectsPlayer = true;
                }
              }
              if (
                isTechnical &&
                TECHNICAL_FOUL_TYPES.find((t) => t.value === technicalFoulType)
                  ?.countsAsPersonal
              ) {
                foulPlayer.stats.technicalFouls += 1; // Assume que técnica de jogador conta como pessoal para algumas estatísticas
                if (
                  foulPlayer.stats.technicalFouls >=
                  PLAYER_FOULS_EJECTION_TECHNICAL
                ) {
                  foulPlayer.isEjected = true;
                  event.foulDetails.ejectsPlayer = true;
                }
              }
              updatePlayerStats(foulPlayer.id, foulPlayer.teamId, {}); // Para forçar re-render se necessário
            }
          } else if (committedBy === "COACH" && foulTeam) {
            foulTeam.coachTechnicalFouls =
              (foulTeam.coachTechnicalFouls || 0) + 1;
            // Lógica de ejeção de treinador
          } else if (committedBy === "BENCH" && foulTeam) {
            foulTeam.benchTechnicalFouls =
              (foulTeam.benchTechnicalFouls || 0) + 1;
          }

          if (foulTeam && personalFoulType !== "OFFENSIVE") {
            // Faltas ofensivas não contam para o bonus da equipa
            foulTeam.teamFoulsThisQuarter += 1;
            if (
              foulTeam.teamFoulsThisQuarter >=
              newState.settings.teamFoulsForBonus
            ) {
              foulTeam.isInBonus = true;
            }
          }
          if (foulTeam && newState.homeTeam.id === foulTeam.id)
            newState.homeTeam = { ...foulTeam };
          else if (foulTeam && newState.awayTeam.id === foulTeam.id)
            newState.awayTeam = { ...foulTeam };

          // Lógica de Lances Livres e Posse
          if (
            event.foulDetails.resultsInFreeThrows &&
            event.foulDetails.numberOfFreeThrowsAwarded &&
            event.foulDetails.freeThrowShooterPlayerId
          ) {
            const newFTs: FreeThrowLog[] = [];
            for (
              let i = 0;
              i < event.foulDetails.numberOfFreeThrowsAwarded;
              i++
            ) {
              newFTs.push({
                id: generateId("ft"),
                attemptNumberInSequence: i + 1,
                totalAwarded: event.foulDetails.numberOfFreeThrowsAwarded,
                shooterPlayerId: event.foulDetails.freeThrowShooterPlayerId,
                isMade: false, // Será definido no evento FT_ATTEMPT
                isTechnicalOrFlagrantFT:
                  type === "FOUL_TECHNICAL" ||
                  personalFoulType === "FLAGRANT_1" ||
                  personalFoulType === "FLAGRANT_2",
                originalFoulEventId: event.id,
              });
            }
            setPendingFreeThrows(newFTs);
            setCurrentFreeThrowIndex(0);
            newState.isPausedForEvent = true; // Pausa para os Lances Livres
            setEventStep("AWAITING_FREE_THROW");
          } else {
            // Definir posse após falta sem LL (ex: falta ofensiva, falta pessoal sem bonus e sem arremesso)
            if (personalFoulType === "OFFENSIVE" && committedByTeamId) {
              newState.possessionTeamId =
                committedByTeamId === newState.homeTeam.id
                  ? newState.awayTeam.id
                  : newState.homeTeam.id;
            } else if (
              type === "FOUL_TECHNICAL" ||
              personalFoulType === "FLAGRANT_1" ||
              personalFoulType === "FLAGRANT_2"
            ) {
              // Posse para a equipa que sofreu a técnica/flagrante, após os LLs (se houver)
              // Esta posse é definida após o último LL
            } else if (personalFoulType === "DOUBLE") {
              // Posse de bola de acordo com a seta de posse alternada
              if (newState.possessionArrow === "HOME")
                newState.possessionTeamId = newState.homeTeam.id;
              else if (newState.possessionArrow === "AWAY")
                newState.possessionTeamId = newState.awayTeam.id;
              else newState.possessionTeamId = null; // Indefinido se seta não estiver definida
              newState.possessionArrow =
                newState.possessionArrow === "HOME" ? "AWAY" : "HOME"; // Inverte a seta
            } else {
              // Falta pessoal normal, reposição para a equipa que sofreu
              if (event.foulDetails.drawnByPlayerId && committedByTeamId) {
                const drawnByPlayer = _getPlayerById(
                  event.foulDetails.drawnByPlayerId,
                  newState
                );
                if (drawnByPlayer) {
                  newState.possessionTeamId = drawnByPlayer.teamId;
                }
              }
            }
            newState.isGameClockRunning = false; // Pausa para reposição
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
          updatePlayerStats(shooterPlayerId, event.primaryTeamId, {
            freeThrowsAttempted: 1,
            ...(isMade && { freeThrowsMade: 1, points: 1 }),
          });

          if (isMade) {
            if (event.primaryTeamId === newState.homeTeam.id)
              newState.homeScore += 1;
            else newState.awayScore += 1;
          }

          // Lógica de posse após o último lance livre
          if (attemptNumberInSequence === totalAwarded) {
            setPendingFreeThrows([]); // Limpa LLS pendentes
            setCurrentFreeThrowIndex(0);
            newState.isPausedForEvent = false; // Fim da pausa para LLs
            setEventStep(null); // Sai do modo LL

            if (isTechnicalOrFlagrantFT) {
              // Posse para a equipa que sofreu a técnica/flagrante
              const originalFoul = newState.events.find(
                (e) => e.id === event.freeThrowDetails?.originalFoulEventId
              );
              if (originalFoul?.foulDetails?.drawnByPlayerId) {
                const victimPlayer = _getPlayerById(
                  originalFoul.foulDetails.drawnByPlayerId,
                  newState
                );
                if (victimPlayer)
                  newState.possessionTeamId = victimPlayer.teamId;
              } else if (originalFoul?.foulDetails?.committedByTeamId) {
                // Se foi técnica de banco/treinador
                newState.possessionTeamId =
                  originalFoul.foulDetails.committedByTeamId ===
                  newState.homeTeam.id
                    ? newState.awayTeam.id
                    : newState.homeTeam.id;
              }
            } else {
              // Lance livre normal
              if (isMade) {
                // Último LL convertido, posse para a outra equipa
                newState.possessionTeamId =
                  event.primaryTeamId === newState.homeTeam.id
                    ? newState.awayTeam.id
                    : newState.homeTeam.id;
              } else {
                // Último LL falhado, ressalto ou bola morta
                // Aqui seria um evento de REBOUND ou DEAD_BALL_REBOUND
                // Por agora, assumimos que o operador regista o ressalto
                newState.possessionTeamId = null;
              }
            }
            newState.isGameClockRunning = false; // Pausa para reposição ou ressalto
          } else {
            // Ainda há Lances Livres pendentes
            setCurrentFreeThrowIndex((idx) => idx + 1);
            setEventStep("AWAITING_FREE_THROW"); // Continua no modo LL
          }
        }
        break;

      case "TURNOVER":
        if (
          event.turnoverDetails &&
          event.turnoverDetails.lostByPlayerId &&
          event.primaryTeamId
        ) {
          updatePlayerStats(
            event.turnoverDetails.lostByPlayerId,
            event.primaryTeamId,
            { turnovers: 1 }
          );
          newState.possessionTeamId =
            event.primaryTeamId === newState.homeTeam.id
              ? newState.awayTeam.id
              : newState.homeTeam.id;
          newState.isGameClockRunning = false;

          if (event.turnoverDetails.stolenByPlayerId && event.secondaryTeamId) {
            updatePlayerStats(
              event.turnoverDetails.stolenByPlayerId,
              event.secondaryTeamId,
              { steals: 1 }
            );
          }
        }
        break;

      case "STEAL":
        if (
          event.stealDetails &&
          event.stealDetails.stolenByPlayerId &&
          event.primaryTeamId
        ) {
          updatePlayerStats(
            event.stealDetails.stolenByPlayerId,
            event.primaryTeamId,
            { steals: 1 }
          );
          newState.possessionTeamId = event.primaryTeamId; // Equipa que roubou tem a posse
          // Shot clock reseta, jogo continua (geralmente)
          newState.isGameClockRunning = true;

          if (
            event.stealDetails.lostPossessionByPlayerId &&
            event.secondaryTeamId
          ) {
            updatePlayerStats(
              event.stealDetails.lostPossessionByPlayerId,
              event.secondaryTeamId,
              { turnovers: 1 }
            );
          }
        }
        break;

      case "BLOCK":
        if (
          event.blockDetails &&
          event.blockDetails.blockPlayerId &&
          event.primaryTeamId
        ) {
          updatePlayerStats(
            event.blockDetails.blockPlayerId,
            event.primaryTeamId,
            { blocks: 1 }
          );
          // Posse e shot clock dependem de quem recupera a bola após o toco
          // O operador deverá registar o ressalto a seguir
          newState.isGameClockRunning = true; // Jogo continua
        }
        break;

      case "SUBSTITUTION":
        if (event.substitutionDetails) {
          const { playerOutId, playerInId, teamId } = event.substitutionDetails;
          const teamToUpdate =
            newState.homeTeam.id === teamId
              ? newState.homeTeam
              : newState.awayTeam;

          const outIndexOnCourt = teamToUpdate.onCourt.indexOf(playerOutId);
          const inIndexOnBench = teamToUpdate.bench.indexOf(playerInId);

          if (outIndexOnCourt > -1 && inIndexOnBench > -1) {
            teamToUpdate.onCourt.splice(outIndexOnCourt, 1);
            teamToUpdate.bench.splice(inIndexOnBench, 1);
            teamToUpdate.onCourt.push(playerInId);
            teamToUpdate.bench.push(playerOutId);
          }
          if (newState.homeTeam.id === teamId)
            newState.homeTeam = { ...teamToUpdate };
          else newState.awayTeam = { ...teamToUpdate };
        }
        // Substituições geralmente ocorrem com o jogo parado. Não afeta cronómetros aqui.
        break;

      case "TIMEOUT_REQUEST":
        if (event.timeoutDetails && event.timeoutDetails.teamId) {
          const teamReq = _getTeamById(event.timeoutDetails.teamId, newState);
          if (teamReq && teamReq.timeoutsLeft > 0) {
            teamReq.timeoutsLeft -= 1;
            if (newState.homeTeam.id === teamReq.id)
              newState.homeTeam = { ...teamReq };
            else newState.awayTeam = { ...teamReq };
            newState.isGameClockRunning = false; // Pausa para o timeout
          } else {
            console.warn(
              "Tentativa de timeout sem timeouts restantes ou equipa inválida"
            );
            // Reverter este evento ou não adicioná-lo?
          }
        }
        break;

      case "ADMIN_EVENT":
        if (event.adminEventDetails) {
          const action = event.adminEventDetails.action;
          if (action === "START_QUARTER" || action === "START_QUARTER_1") {
            newState.isGameClockRunning = true;
            if (action === "START_QUARTER_1") newState.isGameStarted = true;
            // Resetar faltas de equipa no início de um novo quarto (exceto OT para faltas de jogador)
            if (newState.currentQuarter <= newState.settings.quarters) {
              // Não reseta para OT
              newState.homeTeam.teamFoulsThisQuarter = 0;
              newState.homeTeam.isInBonus = false;
              newState.awayTeam.teamFoulsThisQuarter = 0;
              newState.awayTeam.isInBonus = false;
            }
          } else if (action === "END_QUARTER" || action === "HALF_TIME") {
            newState.isGameClockRunning = false;
            if (
              newState.currentQuarter >= newState.settings.quarters &&
              newState.homeScore !== newState.awayScore
            ) {
              // Fim de jogo se for o último quarto regulamentar e não há empate
              newState.isGameOver = true;
              newState.winnerTeamId =
                newState.homeScore > newState.awayScore
                  ? newState.homeTeam.id
                  : newState.awayTeam.id;
            } else if (
              newState.currentQuarter >= newState.settings.quarters &&
              newState.homeScore === newState.awayScore
            ) {
              // Empate, vai para prorrogação
              newState.currentQuarter += 1;
              newState.gameClockSeconds =
                newState.settings.minutesPerOvertime * 60;
              // Faltas de equipa resetam em OT na NBA. Faltas de jogador continuam.
              newState.homeTeam.teamFoulsThisQuarter = 0;
              newState.homeTeam.isInBonus = false;
              newState.awayTeam.teamFoulsThisQuarter = 0;
              newState.awayTeam.isInBonus = false;
            } else {
              // Próximo quarto normal
              newState.currentQuarter += 1;
              newState.gameClockSeconds =
                newState.settings.minutesPerQuarter * 60;
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
          ) {
            newState.possessionArrow =
              event.adminEventDetails.possessionSetToTeamId ===
              newState.homeTeam.id
                ? "HOME"
                : "AWAY";
          }
        }
        break;
    }
    return newState;
  };

  const confirmCurrentEvent = () => {
    if (!selectedEventType || !eventData.type) {
      console.error("Nenhum evento para confirmar.");
      cancelEvent();
      return;
    }

    const finalEvent: GameEvent = {
      id: generateId("evt"),
      realTimestamp: new Date(),
      gameClock: formatClockForEvent(
        initialGameState.gameClockSeconds,
        initialGameState.currentQuarter
      ), // Usa o estado atual do jogo para o tempo
      quarter: initialGameState.currentQuarter,
      ...eventData, // Dados construídos
    };

    // Validações antes de aplicar
    // Ex: Jogador de substituição não pode ser o mesmo, etc. (complexo, omitido para brevidade)

    const newState = applyEventToState(finalEvent, initialGameState);
    newState.events = [...initialGameState.events, finalEvent]; // Adiciona o evento confirmado

    setGameState(newState);

    // Se não houver Lances Livres pendentes, resetar o fluxo de eventos
    if (pendingFreeThrows.length === 0 || eventStep !== "AWAITING_FREE_THROW") {
      cancelEvent(); // Limpa estado do evento, retoma cronómetros se aplicável
    }
  };

  const handleFreeThrowResult = (isMade: boolean) => {
    if (
      pendingFreeThrows.length > 0 &&
      currentFreeThrowIndex < pendingFreeThrows.length
    ) {
      const currentFT = pendingFreeThrows[currentFreeThrowIndex];
      const ftEvent: GameEvent = {
        id: generateId("evt_ft"),
        type: "FREE_THROW_ATTEMPT",
        gameClock: formatClockForEvent(
          initialGameState.gameClockSeconds,
          initialGameState.currentQuarter
        ),
        realTimestamp: new Date(),
        quarter: initialGameState.currentQuarter,
        primaryPlayerId: currentFT.shooterPlayerId,
        primaryTeamId: _getPlayerById(
          currentFT.shooterPlayerId,
          initialGameState
        )?.teamId,
        freeThrowDetails: {
          ...currentFT,
          isMade: isMade,
        },
        description: `Lance Livre ${currentFT.attemptNumberInSequence}/${
          currentFT.totalAwarded
        } por ${
          _getPlayerById(currentFT.shooterPlayerId, initialGameState)?.name
        } (${isMade ? "CONVERTIDO" : "FALHADO"})`,
      };

      const tempStateWithFT = applyEventToState(ftEvent, initialGameState);
      tempStateWithFT.events = [...initialGameState.events, ftEvent];
      setGameState(tempStateWithFT); // Aplica o estado do LL individual

      // Avança para o próximo LL ou finaliza
      if (currentFreeThrowIndex === pendingFreeThrows.length - 1) {
        setPendingFreeThrows([]);
        setCurrentFreeThrowIndex(0);
        cancelEvent(); // Finaliza o fluxo de evento de falta e LLS
      } else {
        setCurrentFreeThrowIndex((idx) => idx + 1);
        // Permanece em AWAITING_FREE_THROW
      }
    }
  };

  // UNDO é muito complexo para reverter estado perfeitamente.
  // Uma abordagem mais simples é remover o evento e alertar para correção manual.
  // Para uma reversão completa, precisaríamos de snapshots de estado ou lógica de reversão para cada evento.
  const undoLastEvent = () => {
    setGameState((prev) => {
      if (prev.events.length === 0) return prev;

      const lastEvent = prev.events[prev.events.length - 1];
      const revertedState = { ...prev, events: prev.events.slice(0, -1) };

      // Tentar reverter algumas coisas simples (score, faltas)
      // Isto é uma simplificação e pode não cobrir todos os casos ou ser 100% preciso
      if (lastEvent.shotDetails?.points) {
        if (lastEvent.primaryTeamId === revertedState.homeTeam.id)
          revertedState.homeScore -= lastEvent.shotDetails.points;
        else revertedState.awayScore -= lastEvent.shotDetails.points;
      }
      if (lastEvent.freeThrowDetails?.isMade) {
        if (lastEvent.primaryTeamId === revertedState.homeTeam.id)
          revertedState.homeScore -= 1;
        else revertedState.awayScore -= 1;
      }
      // Reverter faltas, substituições, etc., é muito mais complexo.
      // O ideal seria ter uma função `revertEventFromState(event, state)`

      console.warn(
        "UndoLastEvent: Reversão de estado é simplificada. Verifique e corrija manualmente se necessário."
      );
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
  };
}
