"use client";

import React from "react";
import {
  GameState,
  EventType,
  Player,
  GameEvent,
  AllShotTypes,
  PersonalFoulType,
  TurnoverType,
  FreeThrowLog,
  TeamInGame, // Adicionado TeamInGame
} from "@/app/types/match-live";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
// import { Input } from "@/components/ui/input"; // Input não estava sendo usado, removido por ora
import {
  SHOT_TYPES_2PT,
  SHOT_TYPES_3PT,
  PERSONAL_FOUL_TYPES,
  TECHNICAL_FOUL_TYPES,
  TURNOVER_TYPES,
  ADMIN_EVENT_ACTIONS,
  MAIN_EVENT_TYPE_OPTIONS,
  TIMEOUT_TYPES,
} from "@/app/data/basketball-definitions";
import {
  CheckCircle,
  XCircle,
  ArrowRight,
  CheckSquare,
  AlertTriangle,
} from "lucide-react";

interface EventDetailPanelProps {
  gameState: GameState; // gameState já é uma prop
  selectedEventType: EventType;
  currentEventData: Partial<GameEvent>;
  currentEventStep: string | null;
  pendingFreeThrows: FreeThrowLog[];
  currentFreeThrowIndex: number;
  onUpdateEventData: (update: Partial<GameEvent>) => void;
  onAdvanceStep: (nextStep: string | null) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onFreeThrowAttemptResult: (isMade: boolean) => void;
}

export function EventDetailPanel({
  gameState, // Usaremos este gameState para os helpers
  selectedEventType,
  currentEventData,
  currentEventStep,
  pendingFreeThrows,
  currentFreeThrowIndex,
  onUpdateEventData,
  onAdvanceStep,
  onConfirm,
  onCancel,
  onFreeThrowAttemptResult,
}: EventDetailPanelProps) {
  const { homeTeam, awayTeam, possessionTeamId, settings } = gameState;
  const eventTypeDetails = MAIN_EVENT_TYPE_OPTIONS.find(
    (e) => e.type === selectedEventType
  );
  const eventTypeLabel = eventTypeDetails?.label || selectedEventType;

  // --- Helpers Internos para buscar dados do gameState ---
  const _getPlayerByIdFromProps = (playerId?: string): Player | undefined => {
    if (!playerId) return undefined;
    let player = gameState.homeTeam.players.find((p) => p.id === playerId);
    if (player) return player;
    player = gameState.awayTeam.players.find((p) => p.id === playerId);
    return player;
  };

  const _getTeamByIdFromProps = (teamId?: string): TeamInGame | undefined => {
    if (!teamId) return undefined;
    if (gameState.homeTeam.id === teamId) return gameState.homeTeam;
    if (gameState.awayTeam.id === teamId) return gameState.awayTeam;
    return undefined;
  };
  // --- Fim Helpers Internos ---

  const getPlayerName = (playerId?: string): string => {
    if (!playerId) return "N/D";
    const player = _getPlayerByIdFromProps(playerId); // Usa o helper interno
    return player ? `#${player.number} ${player.name}` : "Desconhecido";
  };

  const renderPlayerSelectorHelpText = (
    roleText: string,
    teamScopeText: string
  ) => (
    <p className="text-xs text-muted-foreground mt-1 italic">
      Clique para selecionar {roleText} na lista de jogadores da equipa{" "}
      {teamScopeText}.
    </p>
  );

  const renderShotTypeSelector = (is3PTContext: boolean) => {
    const options = is3PTContext ? SHOT_TYPES_3PT : SHOT_TYPES_2PT;
    const currentShotType = currentEventData.shotDetails?.type;
    return (
      <div className="space-y-1">
        <Label htmlFor="shotType">Tipo de Arremesso</Label>
        <Select
          value={currentShotType}
          onValueChange={(value) =>
            onUpdateEventData({
              shotDetails: {
                ...currentEventData.shotDetails!,
                type: value as AllShotTypes,
              },
            })
          }
        >
          <SelectTrigger id="shotType">
            <SelectValue placeholder="Selecione o tipo de arremesso" />
          </SelectTrigger>
          <SelectContent>
            {options.map((st) => (
              <SelectItem key={st.value} value={st.value}>
                {st.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  const renderAssistSelector = () => (
    <div className="space-y-1 mt-3">
      <div className="flex justify-between items-center">
        <Label>
          Assistência:{" "}
          <span className="font-semibold">
            {getPlayerName(currentEventData.shotDetails?.assistPlayerId)}
          </span>
        </Label>
        {currentEventData.shotDetails?.assistPlayerId && (
          <Button
            variant="link"
            size="xs"
            onClick={() =>
              onUpdateEventData({
                shotDetails: {
                  ...currentEventData.shotDetails!,
                  assistPlayerId: undefined,
                  isAssisted: false,
                },
              })
            }
          >
            Limpar
          </Button>
        )}
      </div>
      {!currentEventData.shotDetails?.assistPlayerId &&
        renderPlayerSelectorHelpText(
          "o assistente",
          "da equipa atacante (opcional)"
        )}
    </div>
  );

  const renderFoulOnPlaySwitch = (
    nextStepIfYes: string,
    nextStepIfNo: string
  ) => (
    <div className="flex items-center space-x-2 mt-4 border-t pt-3">
      <Switch
        id="foulOnPlay"
        checked={!!currentEventData.foulDetails}
        onCheckedChange={(checked) => {
          if (checked) {
            onUpdateEventData({
              foulDetails: {
                committedBy: "PLAYER",
                isPersonalFoul: true,
                resultsInFreeThrows: false,
                drawnByPlayerId: currentEventData.primaryPlayerId,
              },
              shotDetails: currentEventData.shotDetails,
            });
            onAdvanceStep(nextStepIfYes);
          } else {
            onUpdateEventData({ foulDetails: undefined });
            onAdvanceStep(nextStepIfNo);
          }
        }}
      />
      <Label htmlFor="foulOnPlay">Houve falta na jogada do arremesso?</Label>
    </div>
  );

  const renderFoulTypeSelectorOnShot = () => {
    const relevantFoulTypes = PERSONAL_FOUL_TYPES.filter(
      (ft) => ft.canResultInShootingFoul || ft.isOffensive
    );
    return (
      <div className="space-y-1">
        <Label htmlFor="foulTypeOnPlay">Tipo de Falta no Arremesso</Label>
        <Select
          value={currentEventData.foulDetails?.personalFoulType}
          onValueChange={(value) => {
            const foulTypeObj = PERSONAL_FOUL_TYPES.find(
              (ft) => ft.value === value
            );
            onUpdateEventData({
              foulDetails: {
                ...currentEventData.foulDetails!,
                personalFoulType: value as PersonalFoulType,
                isCharge: value === "OFFENSIVE",
                resultsInFreeThrows: foulTypeObj?.isOffensive
                  ? false
                  : currentEventData.foulDetails!.resultsInFreeThrows,
              },
            });
            // O próximo passo depende se é ofensiva ou defensiva, e se a cesta foi feita
            const shotWasMade = currentEventData.shotDetails?.isMade;
            if (foulTypeObj?.isOffensive) {
              onAdvanceStep("SELECT_FOULING_PLAYER_ON_SHOT"); // Selecionar quem da equipa atacante cometeu
            } else {
              onAdvanceStep("SELECT_FOULING_PLAYER_ON_SHOT"); // Selecionar quem da equipa defensora cometeu
            }
          }}
        >
          <SelectTrigger id="foulTypeOnPlay">
            <SelectValue placeholder="Tipo de falta pessoal" />
          </SelectTrigger>
          <SelectContent>
            {relevantFoulTypes.map((ft) => (
              <SelectItem key={ft.value} value={ft.value}>
                {ft.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  const renderFoulingPlayerSelector = (
    roleText: string,
    teamScopeHelpText: string,
    nextStep: string
  ) => (
    <div className="space-y-1 mt-2">
      <Label>
        {roleText}:{" "}
        <span className="font-semibold">
          {getPlayerName(currentEventData.foulDetails?.committedByPlayerId)}
        </span>
      </Label>
      {!currentEventData.foulDetails?.committedByPlayerId &&
        renderPlayerSelectorHelpText("quem cometeu a falta", teamScopeHelpText)}
      {currentEventData.foulDetails?.committedByPlayerId && (
        <Button onClick={() => onAdvanceStep(nextStep)} className="w-full mt-2">
          Próximo
        </Button>
      )}
    </div>
  );

  const renderFreeThrowAwardAndConfirmation = (confirmationStep: string) => {
    let autoAwardedFTs = 0;
    const foulDetails = currentEventData.foulDetails;
    const shotDetails = currentEventData.shotDetails;
    const committingTeam = foulDetails?.committedByTeamId
      ? _getTeamByIdFromProps(foulDetails.committedByTeamId)
      : undefined; // Usa helper interno

    if (foulDetails?.personalFoulType === "SHOOTING") {
      autoAwardedFTs = shotDetails?.type?.includes("3PT") ? 3 : 2;
      if (shotDetails?.isMade) autoAwardedFTs = 1;
    } else if (
      committingTeam?.isInBonus &&
      foulDetails?.personalFoulType !== "OFFENSIVE" &&
      (PERSONAL_FOUL_TYPES.find(
        (f) => f.value === foulDetails?.personalFoulType && !f.isOffensive
      ) ||
        foulDetails?.technicalFoulType === "CLASS_A_PLAYER")
    ) {
      autoAwardedFTs = 2;
    } else if (
      selectedEventType === "FOUL_TECHNICAL" &&
      foulDetails?.technicalFoulType
    ) {
      autoAwardedFTs = TECHNICAL_FOUL_TYPES.find(
        (t) => t.value === foulDetails.technicalFoulType
      )?.countsAsPersonal
        ? 1
        : 2;
    } else if (
      foulDetails?.personalFoulType === "FLAGRANT_1" ||
      foulDetails?.personalFoulType === "FLAGRANT_2"
    ) {
      autoAwardedFTs = 2;
    }

    if (
      foulDetails &&
      (foulDetails.numberOfFreeThrowsAwarded === undefined ||
        foulDetails.numberOfFreeThrowsAwarded !== autoAwardedFTs)
    ) {
      // Usar um setTimeout para evitar loop de re-renderização se onUpdateEventData causar re-render imediato deste componente
      setTimeout(
        () =>
          onUpdateEventData({
            foulDetails: {
              ...foulDetails,
              numberOfFreeThrowsAwarded: autoAwardedFTs,
              resultsInFreeThrows: autoAwardedFTs > 0,
            },
          }),
        0
      );
    }

    return (
      <div className="space-y-3 mt-2">
        <p className="text-sm">
          Falta cometida por:{" "}
          <span className="font-bold">
            {getPlayerName(foulDetails?.committedByPlayerId)}
          </span>
        </p>
        <p className="text-sm">
          Falta sofrida por:{" "}
          <span className="font-bold">
            {getPlayerName(foulDetails?.drawnByPlayerId)}
          </span>
        </p>
        <p className="text-sm">
          Tipo de Falta:{" "}
          <span className="font-bold">
            {foulDetails?.personalFoulType || foulDetails?.technicalFoulType}
          </span>
        </p>
        <Label htmlFor="numFTs">
          Nº Lances Livres Atribuídos:{" "}
          <span className="font-bold">
            {foulDetails?.numberOfFreeThrowsAwarded ?? autoAwardedFTs}
          </span>
        </Label>
        {(foulDetails?.numberOfFreeThrowsAwarded ?? autoAwardedFTs) > 0 &&
          !foulDetails?.freeThrowShooterPlayerId &&
          selectedEventType === "FOUL_TECHNICAL" && (
            <>
              <Label>
                Quem cobra os Lances Livres da Técnica?{" "}
                <span className="font-semibold">
                  {getPlayerName(foulDetails?.freeThrowShooterPlayerId)}
                </span>
              </Label>
              {!foulDetails?.freeThrowShooterPlayerId &&
                renderPlayerSelectorHelpText(
                  "o cobrador",
                  "da equipa adversária ao infrator"
                )}
            </>
          )}
        <Button
          onClick={() => onAdvanceStep(confirmationStep)}
          className="w-full mt-3"
          disabled={
            (foulDetails?.numberOfFreeThrowsAwarded ?? autoAwardedFTs) > 0 &&
            !foulDetails?.freeThrowShooterPlayerId &&
            selectedEventType === "FOUL_TECHNICAL"
          }
        >
          Ir para Confirmação da Falta
        </Button>
      </div>
    );
  };

  const renderShotSubsequentOptions = () => (
    <div className="space-y-2 mt-3 border-t pt-3">
      <Label>Após o Arremesso Falhado:</Label>
      <RadioGroup
        onValueChange={(value) => {
          if (value === "REBOUND_ATTEMPT") {
            if (!currentEventData.reboundDetails)
              onUpdateEventData({ reboundDetails: { type: "DEFENSIVE" } });
            onAdvanceStep("SELECT_REBOUND_PLAYER_AFTER_MISS");
          } else if (value === "NO_SUBSEQUENT_EVENT") {
            onUpdateEventData({ reboundDetails: undefined });
            onAdvanceStep("CONFIRM_MISSED_SHOT_EVENT");
          }
        }}
        className="flex flex-col gap-1"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="REBOUND_ATTEMPT" id="resAfterMiss" />{" "}
          <Label htmlFor="resAfterMiss">Registar Ressalto (Opcional)</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="NO_SUBSEQUENT_EVENT" id="noSubAfterMiss" />{" "}
          <Label htmlFor="noSubAfterMiss">
            Sem Ressalto / Confirmar Falha Direto
          </Label>
        </div>
      </RadioGroup>
    </div>
  );

  const renderReboundDetailsAfterMiss = () => (
    <div className="space-y-3">
      <Label>
        Quem pegou o Ressalto?{" "}
        <span className="font-semibold">
          {getPlayerName(currentEventData.reboundDetails?.reboundPlayerId)}
        </span>
      </Label>
      {!currentEventData.reboundDetails?.reboundPlayerId &&
        renderPlayerSelectorHelpText(
          "o ressaltador",
          "de qualquer equipa em campo"
        )}

      {currentEventData.reboundDetails?.reboundPlayerId && (
        <>
          <RadioGroup
            value={currentEventData.reboundDetails?.type}
            onValueChange={(value) =>
              onUpdateEventData({
                reboundDetails: {
                  ...currentEventData.reboundDetails!,
                  type: value as any,
                },
              })
            }
            className="flex gap-4 mt-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="OFFENSIVE" id="rebOffMiss" />{" "}
              <Label htmlFor="rebOffMiss">Ofensivo</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="DEFENSIVE" id="rebDefMiss" />{" "}
              <Label htmlFor="rebDefMiss">Defensivo</Label>
            </div>
          </RadioGroup>
          {currentEventData.reboundDetails?.type === "OFFENSIVE" && (
            <div className="mt-2 border-t pt-2 space-y-1">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isTipIn"
                  checked={!!currentEventData.reboundDetails?.isTipInAttempt}
                  onCheckedChange={(c) =>
                    onUpdateEventData({
                      reboundDetails: {
                        ...currentEventData.reboundDetails!,
                        isTipInAttempt: c,
                        tipInMade: c ? false : undefined,
                        tipInShotType: c ? "TIP_IN_LAYUP" : undefined,
                      },
                    })
                  }
                />
                <Label htmlFor="isTipIn">Tentativa de Tip-In?</Label>
              </div>
              {currentEventData.reboundDetails?.isTipInAttempt && (
                <>
                  <Select
                    value={currentEventData.reboundDetails.tipInShotType}
                    onValueChange={(v) =>
                      onUpdateEventData({
                        reboundDetails: {
                          ...currentEventData.reboundDetails!,
                          tipInShotType: v as any,
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de Tip-In" />
                    </SelectTrigger>
                    <SelectContent>
                      {" "}
                      <SelectItem value="TIP_IN_LAYUP">
                        Tip-In Layup
                      </SelectItem>{" "}
                      <SelectItem value="TIP_IN_DUNK">Tip-In Dunk</SelectItem>{" "}
                    </SelectContent>
                  </Select>
                  <RadioGroup
                    value={currentEventData.reboundDetails.tipInMade?.toString()}
                    onValueChange={(v) =>
                      onUpdateEventData({
                        reboundDetails: {
                          ...currentEventData.reboundDetails!,
                          tipInMade: v === "true",
                        },
                      })
                    }
                    className="flex gap-2"
                  >
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="true" id="tipMade" />{" "}
                      <Label htmlFor="tipMade">Convertido</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="false" id="tipMissed" />{" "}
                      <Label htmlFor="tipMissed">Falhado</Label>
                    </div>
                  </RadioGroup>
                </>
              )}
            </div>
          )}
          <Button
            onClick={() => onAdvanceStep("CONFIRM_MISSED_SHOT_EVENT")}
            className="w-full mt-3"
          >
            Próximo: Confirmar Arremesso Falhado
          </Button>
        </>
      )}
    </div>
  );

  const renderFreeThrowSequenceDisplay = () => (
    <div className="space-y-4 text-center">
      <h3 className="font-semibold text-lg">Sequência de Lances Livres</h3>
      <p>
        Cobrador:{" "}
        <span className="font-bold">
          {getPlayerName(pendingFreeThrows[0]?.shooterPlayerId)}
        </span>
      </p>
      <div className="grid grid-cols-3 gap-2 items-center my-4 max-w-md mx-auto">
        {pendingFreeThrows.map((ft, index) => (
          <div
            key={ft.id || index}
            className={`p-3 border rounded-lg text-center transition-all ${
              index === currentFreeThrowIndex
                ? "border-primary ring-2 ring-primary bg-primary/10 shadow-lg scale-105"
                : "border-gray-300 dark:border-gray-700"
            } ${
              ft.isMade === true
                ? "bg-green-100 dark:bg-green-800/30 border-green-500"
                : ft.isMade === false
                ? "bg-red-100 dark:bg-red-800/30 border-red-500"
                : ""
            }`}
          >
            <p className="text-sm font-medium">
              LL {ft.attemptNumberInSequence} / {ft.totalAwarded}
            </p>
            {index === currentFreeThrowIndex ? (
              <p className="text-xs text-blue-500 animate-pulse mt-1">
                Aguardando...
              </p>
            ) : ft.isMade === true ? (
              <CheckCircle className="mx-auto mt-1 text-green-500" />
            ) : ft.isMade === false ? (
              <XCircle className="mx-auto mt-1 text-red-500" />
            ) : (
              <p className="text-xs text-muted-foreground mt-1">- Pendente -</p>
            )}
          </div>
        ))}
      </div>
      {currentFreeThrowIndex < pendingFreeThrows.length && (
        <div className="flex gap-4 justify-center mt-6">
          <Button
            onClick={() => onFreeThrowAttemptResult(true)}
            className="bg-green-600 hover:bg-green-700 text-white w-32 text-base py-3 shadow-md"
          >
            {" "}
            <CheckCircle className="mr-2" /> Marcado (C){" "}
          </Button>
          <Button
            onClick={() => onFreeThrowAttemptResult(false)}
            className="bg-red-600 hover:bg-red-700 text-white w-32 text-base py-3 shadow-md"
          >
            {" "}
            <XCircle className="mr-2" /> Falhado (E/X){" "}
          </Button>
        </div>
      )}
      {currentFreeThrowIndex >= pendingFreeThrows.length &&
        pendingFreeThrows.every((ft) => ft.isMade !== undefined) && ( // Mudado para isMade !== undefined
          <div className="p-4 text-center text-green-600 dark:text-green-400">
            <CheckSquare className="mx-auto h-10 w-10 mb-2" />
            <p className="font-semibold">
              Sequência de Lances Livres Completa!
            </p>
            <Button onClick={onCancel} className="mt-4">
              Voltar à Seleção de Eventos
            </Button>{" "}
            {/* Botão para sair do modo LL */}
          </div>
        )}
    </div>
  );

  const renderTimeoutTypeSelector = () => (
    <div className="space-y-1">
      <Label htmlFor="timeoutTypeSel">Tipo de Timeout</Label>
      <Select
        value={currentEventData.timeoutDetails?.type}
        onValueChange={(value) =>
          onUpdateEventData({
            timeoutDetails: {
              ...currentEventData.timeoutDetails!,
              type: value as any,
            },
          })
        }
      >
        <SelectTrigger id="timeoutTypeSel">
          <SelectValue placeholder="Selecione o tipo de timeout" />
        </SelectTrigger>
        <SelectContent>
          {TIMEOUT_TYPES.map((tt) => {
            const teamRequesting = _getTeamByIdFromProps(
              currentEventData.timeoutDetails!.teamId!
            ); // Usa helper interno
            const timeoutsLeft =
              teamRequesting?.timeouts[
                `${tt.value.toLowerCase()}_left` as keyof TeamInGame["timeouts"]
              ];
            const disabled = timeoutsLeft !== undefined && timeoutsLeft <= 0;
            return (
              <SelectItem key={tt.value} value={tt.value} disabled={disabled}>
                {tt.label} (Restantes: {disabled ? 0 : timeoutsLeft ?? "N/A"})
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );

  const renderConfirmationStep = (
    message: string = "Pronto para confirmar este evento?"
  ) => (
    <div className="p-4 text-center space-y-3">
      <CheckSquare className="mx-auto h-12 w-12 text-green-500" />
      <p className="font-semibold">{message}</p>
      <p className="text-xs text-muted-foreground">
        Verifique todos os detalhes selecionados antes de submeter.
      </p>
    </div>
  );

  // --- Renderizador Principal ---
  const renderEventContent = () => {
    if (
      currentEventStep === "AWAITING_FREE_THROW" &&
      pendingFreeThrows.length > 0 &&
      currentFreeThrowIndex < pendingFreeThrows.length
    ) {
      return renderFreeThrowSequenceDisplay();
    }
    // Se acabou os LLs, mas ainda está no passo AWAITING_FREE_THROW, mostra a mensagem de conclusão.
    if (
      currentEventStep === "AWAITING_FREE_THROW" &&
      (pendingFreeThrows.length === 0 ||
        currentFreeThrowIndex >= pendingFreeThrows.length)
    ) {
      return (
        <div className="p-4 text-center">
          <CheckSquare className="mx-auto h-10 w-10 text-green-500 mb-2" />
          <p className="text-muted-foreground">
            Lances Livres concluídos. Clique em "Cancelar" para voltar ou o
            sistema resetará.
          </p>
        </div>
      );
    }

    switch (selectedEventType) {
      case "JUMP_BALL":
        if (currentEventStep === "SELECT_JUMP_BALL_PLAYERS")
          return (
            <div className="space-y-3">
              {" "}
              <div>
                {" "}
                <Label>Jogador Casa para o Salto:</Label>{" "}
                <p className="font-semibold min-h-[20px]">
                  {getPlayerName(
                    currentEventData.jumpBallDetails?.homePlayerId
                  )}
                </p>{" "}
                {!currentEventData.jumpBallDetails?.homePlayerId &&
                  renderPlayerSelectorHelpText(
                    "o jogador da casa",
                    "CASA"
                  )}{" "}
              </div>{" "}
              <div className="mt-2">
                {" "}
                <Label>Jogador Visitante para o Salto:</Label>{" "}
                <p className="font-semibold min-h-[20px]">
                  {getPlayerName(
                    currentEventData.jumpBallDetails?.awayPlayerId
                  )}
                </p>{" "}
                {!currentEventData.jumpBallDetails?.awayPlayerId &&
                  renderPlayerSelectorHelpText(
                    "o jogador visitante",
                    "VISITANTE"
                  )}{" "}
              </div>{" "}
              {currentEventData.jumpBallDetails?.homePlayerId &&
                currentEventData.jumpBallDetails?.awayPlayerId && (
                  <Button
                    onClick={() => onAdvanceStep("SELECT_JUMP_BALL_WINNER")}
                    className="w-full mt-3"
                  >
                    Próximo <ArrowRight size={16} />
                  </Button>
                )}{" "}
            </div>
          );
        if (currentEventStep === "SELECT_JUMP_BALL_WINNER")
          return (
            <div className="space-y-2">
              {" "}
              <Label>Quem ganhou a posse no Salto Inicial?</Label>{" "}
              <RadioGroup
                onValueChange={(value) =>
                  onUpdateEventData({
                    jumpBallDetails: {
                      ...currentEventData.jumpBallDetails!,
                      wonByTeamId: value,
                      possessionArrowToTeamId:
                        value === homeTeam.id ? awayTeam.id : homeTeam.id,
                    },
                  })
                }
                value={currentEventData.jumpBallDetails?.wonByTeamId}
              >
                {" "}
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={homeTeam.id}
                    id={`jbWin-${homeTeam.id}`}
                  />
                  <Label htmlFor={`jbWin-${homeTeam.id}`}>
                    {homeTeam.name}
                  </Label>
                </div>{" "}
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={awayTeam.id}
                    id={`jbWin-${awayTeam.id}`}
                  />
                  <Label htmlFor={`jbWin-${awayTeam.id}`}>
                    {awayTeam.name}
                  </Label>
                </div>{" "}
              </RadioGroup>{" "}
              {currentEventData.jumpBallDetails?.wonByTeamId && (
                <Button
                  onClick={() => onAdvanceStep("CONFIRM_JUMP_BALL_EVENT")}
                  className="w-full mt-3"
                >
                  Próximo: Confirmar
                </Button>
              )}{" "}
            </div>
          );
        if (currentEventStep === "CONFIRM_JUMP_BALL_EVENT")
          return renderConfirmationStep(
            "Confirmar Salto Inicial e Início de Jogo?"
          );
        break;

      case "2POINTS_MADE":
      case "3POINTS_MADE":
      case "2POINTS_MISSED":
      case "3POINTS_MISSED":
        const isMadeShot = selectedEventType.includes("MADE");
        const is3PTContext = selectedEventType.includes("3POINTS");
        if (currentEventStep === "SELECT_PRIMARY_PLAYER")
          return (
            <div className="space-y-2">
              {" "}
              <Label>
                Quem arremessou?{" "}
                <span className="font-semibold">
                  {getPlayerName(currentEventData.primaryPlayerId)}
                </span>
              </Label>{" "}
              {!currentEventData.primaryPlayerId &&
                renderPlayerSelectorHelpText(
                  "o arremessador",
                  `da equipa ${
                    currentEventData.primaryTeamId === homeTeam.id
                      ? homeTeam.shortName
                      : currentEventData.primaryTeamId === awayTeam.id
                      ? awayTeam.shortName
                      : "com posse"
                  }`
                )}{" "}
            </div>
          );
        if (currentEventStep === "SELECT_SHOT_DETAILS")
          return (
            <div className="space-y-3">
              {" "}
              {renderShotTypeSelector(is3PTContext)}{" "}
              {isMadeShot && renderAssistSelector()}{" "}
              {renderFoulOnPlaySwitch(
                "SELECT_FOUL_TYPE_ON_SHOT",
                isMadeShot ? "CONFIRM_SHOT_EVENT" : "SELECT_MISSED_SHOT_OUTCOME"
              )}{" "}
              {!isMadeShot &&
                !currentEventData.foulDetails &&
                renderShotSubsequentOptions()}{" "}
              {!currentEventData.foulDetails &&
                (isMadeShot ||
                  (!isMadeShot &&
                    !currentEventData.reboundDetails?.reboundPlayerId &&
                    currentEventData.reboundDetails === undefined)) && (
                  <Button
                    onClick={() =>
                      onAdvanceStep(
                        isMadeShot
                          ? "CONFIRM_SHOT_EVENT"
                          : "CONFIRM_MISSED_SHOT_EVENT"
                      )
                    }
                    className="w-full mt-3"
                    disabled={!currentEventData.shotDetails?.type}
                  >
                    Confirmar Detalhes do Arremesso
                  </Button>
                )}{" "}
            </div>
          );
        if (currentEventStep === "SELECT_FOUL_TYPE_ON_SHOT")
          return (
            <div className="space-y-2">{renderFoulTypeSelectorOnShot()}</div>
          );
        if (currentEventStep === "SELECT_FOULING_PLAYER_ON_SHOT")
          return renderFoulingPlayerSelector(
            "Falta cometida por",
            `da equipa ${
              currentEventData.foulDetails?.personalFoulType === "OFFENSIVE"
                ? currentEventData.primaryTeamId === homeTeam.id
                  ? homeTeam.shortName
                  : awayTeam.shortName
                : currentEventData.primaryTeamId === homeTeam.id
                ? awayTeam.shortName
                : homeTeam.shortName
            }`,
            "CALCULATE_FTS_FOR_SHOT_FOUL"
          );
        if (currentEventStep === "CALCULATE_FTS_FOR_SHOT_FOUL")
          return renderFreeThrowAwardAndConfirmation(
            isMadeShot ? "CONFIRM_SHOT_EVENT" : "CONFIRM_MISSED_SHOT_EVENT"
          );
        if (currentEventStep === "SELECT_MISSED_SHOT_OUTCOME" && !isMadeShot)
          return renderShotSubsequentOptions();
        if (
          currentEventStep === "SELECT_REBOUND_PLAYER_AFTER_MISS" &&
          !isMadeShot
        )
          return renderReboundDetailsAfterMiss();
        if (currentEventStep === "CONFIRM_SHOT_EVENT")
          return renderConfirmationStep(
            `Confirmar Cesta de ${is3PTContext ? 3 : 2} Pontos?`
          );
        if (currentEventStep === "CONFIRM_MISSED_SHOT_EVENT")
          return renderConfirmationStep(
            `Confirmar Arremesso Falhado de ${is3PTContext ? 3 : 2} Pontos?`
          );
        break;

      case "FOUL_PERSONAL":
      case "FOUL_TECHNICAL":
        if (
          selectedEventType === "FOUL_TECHNICAL" &&
          currentEventStep === "SELECT_TECHNICAL_FOUL_INFRINGER_TYPE"
        )
          return (
            <div className="space-y-2">
              {" "}
              <Label>Tipo de Infrator da Falta Técnica:</Label>{" "}
              <RadioGroup
                onValueChange={(val) => {
                  onUpdateEventData({
                    foulDetails: {
                      ...currentEventData.foulDetails,
                      committedBy: val as any,
                      isPersonalFoul: false,
                    },
                  });
                  if (val === "PLAYER") onAdvanceStep("SELECT_PRIMARY_PLAYER");
                  else
                    onAdvanceStep("SELECT_TECHNICAL_FOUL_INFRINGER_NON_PLAYER");
                }}
              >
                {" "}
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PLAYER" id="ftInfPlayer" />
                  <Label htmlFor="ftInfPlayer">Jogador</Label>
                </div>{" "}
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="COACH" id="ftInfCoach" />
                  <Label htmlFor="ftInfCoach">Treinador</Label>
                </div>{" "}
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="BENCH" id="ftInfBench" />
                  <Label htmlFor="ftInfBench">Banco</Label>
                </div>{" "}
              </RadioGroup>{" "}
            </div>
          );
        if (
          selectedEventType === "FOUL_TECHNICAL" &&
          currentEventStep === "SELECT_TECHNICAL_FOUL_INFRINGER_NON_PLAYER"
        )
          return (
            <div className="space-y-2">
              {" "}
              <Label>
                Equipa do Infrator ({currentEventData.foulDetails?.committedBy}
                ):
              </Label>{" "}
              <RadioGroup
                value={currentEventData.foulDetails?.committedByTeamId}
                onValueChange={(val) =>
                  onUpdateEventData({
                    foulDetails: {
                      ...currentEventData.foulDetails!,
                      committedByTeamId: val,
                    },
                  })
                }
              >
                {" "}
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={homeTeam.id} id="ftInfHT" />{" "}
                  <Label htmlFor="ftInfHT">{homeTeam.name}</Label>
                </div>{" "}
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={awayTeam.id} id="ftInfAT" />{" "}
                  <Label htmlFor="ftInfAT">{awayTeam.name}</Label>
                </div>{" "}
              </RadioGroup>{" "}
              {currentEventData.foulDetails?.committedByTeamId && (
                <Button
                  onClick={() => onAdvanceStep("SELECT_FOUL_DETAILS")}
                  className="w-full mt-2"
                >
                  Próximo
                </Button>
              )}{" "}
            </div>
          );
        if (currentEventStep === "SELECT_PRIMARY_PLAYER")
          return (
            <div className="space-y-2">
              {" "}
              <Label>
                Quem cometeu a Falta?{" "}
                <span className="font-semibold">
                  {getPlayerName(currentEventData.primaryPlayerId)}
                </span>
              </Label>{" "}
              {!currentEventData.primaryPlayerId &&
                renderPlayerSelectorHelpText(
                  "quem cometeu",
                  "de qualquer equipa"
                )}{" "}
            </div>
          );
        if (currentEventStep === "SELECT_FOUL_DETAILS")
          return (
            <div className="space-y-3">
              {" "}
              <Label htmlFor="foulPType">
                Tipo de Falta{" "}
                {selectedEventType === "FOUL_PERSONAL" ? "Pessoal" : "Técnica"}
              </Label>{" "}
              <Select
                value={
                  selectedEventType === "FOUL_PERSONAL"
                    ? currentEventData.foulDetails?.personalFoulType
                    : currentEventData.foulDetails?.technicalFoulType
                }
                onValueChange={(value) =>
                  onUpdateEventData({
                    foulDetails: {
                      ...currentEventData.foulDetails!,
                      [selectedEventType === "FOUL_PERSONAL"
                        ? "personalFoulType"
                        : "technicalFoulType"]: value as any,
                    },
                  })
                }
              >
                {" "}
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>{" "}
                <SelectContent>
                  {(selectedEventType === "FOUL_PERSONAL"
                    ? PERSONAL_FOUL_TYPES
                    : TECHNICAL_FOUL_TYPES
                  ).map((ft) => (
                    <SelectItem key={ft.value} value={ft.value}>
                      {ft.label}
                    </SelectItem>
                  ))}
                </SelectContent>{" "}
              </Select>{" "}
              <Label>
                Quem sofreu a falta (se aplicável)?{" "}
                <span className="font-semibold">
                  {getPlayerName(currentEventData.foulDetails?.drawnByPlayerId)}
                </span>
              </Label>{" "}
              {!currentEventData.foulDetails?.drawnByPlayerId &&
                renderPlayerSelectorHelpText(
                  "quem sofreu",
                  "de qualquer equipa"
                )}{" "}
              {((selectedEventType === "FOUL_PERSONAL" &&
                currentEventData.foulDetails?.personalFoulType &&
                currentEventData.foulDetails?.drawnByPlayerId) ||
                (selectedEventType === "FOUL_TECHNICAL" &&
                  currentEventData.foulDetails?.technicalFoulType &&
                  (currentEventData.foulDetails.committedByPlayerId ||
                    currentEventData.foulDetails.committedByTeamId))) && (
                <Button
                  onClick={() =>
                    onAdvanceStep("CALCULATE_FTS_FOR_NON_SHOT_FOUL")
                  }
                  className="w-full mt-2"
                >
                  Próximo: Calcular LLs
                </Button>
              )}{" "}
            </div>
          );
        if (currentEventStep === "CALCULATE_FTS_FOR_NON_SHOT_FOUL")
          return renderFreeThrowAwardAndConfirmation("CONFIRM_FOUL_EVENT");
        if (currentEventStep === "CONFIRM_FOUL_EVENT")
          return renderConfirmationStep("Confirmar Falta?");
        break;

      case "REBOUND_OFFENSIVE":
      case "REBOUND_DEFENSIVE":
        if (currentEventStep === "SELECT_PRIMARY_PLAYER")
          return (
            <div className="space-y-2">
              {" "}
              <Label>
                Quem pegou o Ressalto?{" "}
                <span className="font-semibold">
                  {getPlayerName(currentEventData.primaryPlayerId)}
                </span>
              </Label>{" "}
              {!currentEventData.primaryPlayerId &&
                renderPlayerSelectorHelpText(
                  "o ressaltador",
                  "de qualquer equipa"
                )}{" "}
              {currentEventData.primaryPlayerId && (
                <Button
                  onClick={() =>
                    onAdvanceStep(
                      selectedEventType === "REBOUND_OFFENSIVE"
                        ? "CHECK_TIP_IN_AFTER_OREB"
                        : "CONFIRM_REBOUND_EVENT"
                    )
                  }
                  className="w-full mt-2"
                >
                  Próximo
                </Button>
              )}{" "}
            </div>
          );
        if (
          currentEventStep === "CHECK_TIP_IN_AFTER_OREB" &&
          selectedEventType === "REBOUND_OFFENSIVE"
        )
          return (
            <div className="mt-2 border-t pt-2 space-y-1">
              {" "}
              <p>
                Ressalto Ofensivo por:{" "}
                <span className="font-semibold">
                  {getPlayerName(currentEventData.primaryPlayerId)}
                </span>
              </p>{" "}
              <div className="flex items-center space-x-2">
                {" "}
                <Switch
                  id="isTipIn"
                  checked={!!currentEventData.reboundDetails?.isTipInAttempt}
                  onCheckedChange={(c) =>
                    onUpdateEventData({
                      reboundDetails: {
                        ...currentEventData.reboundDetails!,
                        isTipInAttempt: c,
                        tipInMade: c ? false : undefined,
                        tipInShotType: c ? "TIP_IN_LAYUP" : undefined,
                      },
                    })
                  }
                />{" "}
                <Label htmlFor="isTipIn">Tentativa de Tip-In?</Label>{" "}
              </div>{" "}
              {currentEventData.reboundDetails?.isTipInAttempt && (
                <>
                  {" "}
                  <Select
                    value={currentEventData.reboundDetails.tipInShotType}
                    onValueChange={(v) =>
                      onUpdateEventData({
                        reboundDetails: {
                          ...currentEventData.reboundDetails!,
                          tipInShotType: v as any,
                        },
                      })
                    }
                  >
                    {" "}
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de Tip-In" />
                    </SelectTrigger>{" "}
                    <SelectContent>
                      {" "}
                      <SelectItem value="TIP_IN_LAYUP">
                        Tip-In Layup
                      </SelectItem>{" "}
                      <SelectItem value="TIP_IN_DUNK">Tip-In Dunk</SelectItem>{" "}
                    </SelectContent>{" "}
                  </Select>{" "}
                  <RadioGroup
                    value={currentEventData.reboundDetails.tipInMade?.toString()}
                    onValueChange={(v) =>
                      onUpdateEventData({
                        reboundDetails: {
                          ...currentEventData.reboundDetails!,
                          tipInMade: v === "true",
                        },
                      })
                    }
                    className="flex gap-2"
                  >
                    {" "}
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="true" id="tipMade" />{" "}
                      <Label htmlFor="tipMade">Convertido</Label>
                    </div>{" "}
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="false" id="tipMissed" />{" "}
                      <Label htmlFor="tipMissed">Falhado</Label>
                    </div>{" "}
                  </RadioGroup>{" "}
                </>
              )}{" "}
              <Button
                onClick={() => onAdvanceStep("CONFIRM_REBOUND_EVENT")}
                className="w-full mt-2"
              >
                Próximo: Confirmar Ressalto
              </Button>{" "}
            </div>
          );
        if (currentEventStep === "CONFIRM_REBOUND_EVENT")
          return renderConfirmationStep("Confirmar Ressalto?");
        break;

      case "SUBSTITUTION":
        if (currentEventStep === "SELECT_PLAYER_OUT")
          return (
            <div className="space-y-2">
              {" "}
              <Label>
                Quem SAI do jogo?{" "}
                <span className="font-semibold">
                  {getPlayerName(
                    currentEventData.substitutionDetails?.playerOutId
                  )}
                </span>
              </Label>{" "}
              {!currentEventData.substitutionDetails?.playerOutId &&
                renderPlayerSelectorHelpText(
                  "quem sai",
                  "(jogador em campo)"
                )}{" "}
            </div>
          );
        if (currentEventStep === "SELECT_PLAYER_IN")
          return (
            <div className="space-y-2">
              {" "}
              <Label>
                Quem ENTRA no jogo?{" "}
                <span className="font-semibold">
                  {getPlayerName(
                    currentEventData.substitutionDetails?.playerInId
                  )}
                </span>
              </Label>{" "}
              {!currentEventData.substitutionDetails?.playerInId &&
                renderPlayerSelectorHelpText(
                  "quem entra",
                  `(banco da equipa ${
                    currentEventData.substitutionDetails?.teamId === homeTeam.id
                      ? homeTeam.shortName
                      : awayTeam.shortName
                  })`
                )}{" "}
            </div>
          );
        if (currentEventStep === "CONFIRM_SUBSTITUTION_EVENT")
          return renderConfirmationStep("Confirmar Substituição?");
        break;

      case "TIMEOUT_REQUEST":
        if (currentEventStep === "SELECT_TEAM_FOR_TIMEOUT")
          return (
            <div className="space-y-2">
              {" "}
              <Label>Qual equipa pediu Time-out?</Label>{" "}
              <RadioGroup
                onValueChange={(value) =>
                  onUpdateEventData({
                    timeoutDetails: {
                      ...currentEventData.timeoutDetails!,
                      teamId: value,
                    },
                  })
                }
                value={currentEventData.timeoutDetails?.teamId}
              >
                {" "}
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={homeTeam.id}
                    id={`to-${homeTeam.id}`}
                  />
                  <Label htmlFor={`to-${homeTeam.id}`}>{homeTeam.name}</Label>
                </div>{" "}
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={awayTeam.id}
                    id={`to-${awayTeam.id}`}
                  />
                  <Label htmlFor={`to-${awayTeam.id}`}>{awayTeam.name}</Label>
                </div>{" "}
              </RadioGroup>{" "}
              {currentEventData.timeoutDetails?.teamId && (
                <Button
                  onClick={() => onAdvanceStep("SELECT_TIMEOUT_TYPE")}
                  className="w-full mt-2"
                >
                  Próximo
                </Button>
              )}{" "}
            </div>
          );
        if (currentEventStep === "SELECT_TIMEOUT_TYPE")
          return (
            <div className="space-y-2">
              {" "}
              <p>
                Equipa:{" "}
                <span className="font-semibold">
                  {currentEventData.timeoutDetails?.teamId === homeTeam.id
                    ? homeTeam.name
                    : awayTeam.name}
                </span>
              </p>{" "}
              {renderTimeoutTypeSelector()}{" "}
              {currentEventData.timeoutDetails?.type && (
                <Button
                  onClick={() => onAdvanceStep("CONFIRM_TIMEOUT_EVENT")}
                  className="w-full mt-2"
                >
                  Próximo: Confirmar
                </Button>
              )}{" "}
            </div>
          );
        if (currentEventStep === "CONFIRM_TIMEOUT_EVENT")
          return renderConfirmationStep("Confirmar Pedido de Timeout?");
        break;

      case "HELD_BALL":
        if (currentEventStep === "SELECT_HELD_BALL_PLAYERS")
          return (
            <div className="space-y-3">
              {" "}
              <p className="text-sm text-muted-foreground">
                Opcional: Selecione os jogadores envolvidos na Bola Presa.
              </p>{" "}
              <div>
                {" "}
                <Label>
                  Jogador 1:{" "}
                  <span className="font-semibold">
                    {getPlayerName(currentEventData.heldBallDetails?.player1Id)}
                  </span>
                </Label>{" "}
                {!currentEventData.heldBallDetails?.player1Id &&
                  renderPlayerSelectorHelpText(
                    "o primeiro jogador",
                    "de qualquer equipa"
                  )}{" "}
              </div>{" "}
              <div>
                {" "}
                <Label>
                  Jogador 2:{" "}
                  <span className="font-semibold">
                    {getPlayerName(currentEventData.heldBallDetails?.player2Id)}
                  </span>
                </Label>{" "}
                {currentEventData.heldBallDetails?.player1Id &&
                  !currentEventData.heldBallDetails?.player2Id &&
                  renderPlayerSelectorHelpText(
                    "o segundo jogador",
                    "de qualquer equipa"
                  )}{" "}
              </div>{" "}
              <Button
                onClick={() => onAdvanceStep("CONFIRM_HELD_BALL")}
                className="w-full mt-2"
              >
                Próximo / Pular Seleção
              </Button>{" "}
            </div>
          );
        if (currentEventStep === "CONFIRM_HELD_BALL")
          return renderConfirmationStep("Confirmar Bola Presa?");
        break;

      case "TURNOVER":
        if (currentEventStep === "SELECT_PRIMARY_PLAYER")
          return (
            <div className="space-y-2">
              {" "}
              <Label>
                Quem cometeu o Turnover?{" "}
                <span className="font-semibold">
                  {getPlayerName(currentEventData.primaryPlayerId)}
                </span>
              </Label>{" "}
              {!currentEventData.primaryPlayerId &&
                renderPlayerSelectorHelpText(
                  "quem perdeu a bola",
                  `da equipa ${
                    currentEventData.primaryTeamId === homeTeam.id
                      ? homeTeam.shortName
                      : currentEventData.primaryTeamId === awayTeam.id
                      ? awayTeam.shortName
                      : "com posse"
                  }`
                )}{" "}
            </div>
          );
        if (currentEventStep === "SELECT_TURNOVER_TYPE")
          return (
            <div className="space-y-2">
              {" "}
              <Label htmlFor="toType">Tipo de Turnover</Label>{" "}
              <Select
                value={currentEventData.turnoverDetails?.type}
                onValueChange={(value) =>
                  onUpdateEventData({
                    turnoverDetails: {
                      ...currentEventData.turnoverDetails!,
                      type: value as TurnoverType,
                    },
                  })
                }
              >
                {" "}
                <SelectTrigger id="toType">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>{" "}
                <SelectContent>
                  {TURNOVER_TYPES.map((tt) => (
                    <SelectItem key={tt.value} value={tt.value}>
                      {tt.label}
                    </SelectItem>
                  ))}
                </SelectContent>{" "}
              </Select>{" "}
              <div className="flex items-center space-x-2 mt-3">
                {" "}
                <Switch
                  id="isStolen"
                  checked={
                    currentEventData.turnoverDetails?.stolenByPlayerId !==
                    undefined
                  }
                  onCheckedChange={(c) =>
                    onUpdateEventData({
                      turnoverDetails: {
                        ...currentEventData.turnoverDetails!,
                        stolenByPlayerId: c ? "" : undefined,
                      },
                    })
                  }
                />{" "}
                <Label htmlFor="isStolen">
                  Foi resultado de um Roubo de Bola?
                </Label>{" "}
              </div>{" "}
              {currentEventData.turnoverDetails?.stolenByPlayerId !==
                undefined && (
                <>
                  {" "}
                  <Label>
                    Roubado por:{" "}
                    <span className="font-semibold">
                      {getPlayerName(
                        currentEventData.turnoverDetails?.stolenByPlayerId
                      )}
                    </span>
                  </Label>{" "}
                  {!currentEventData.turnoverDetails?.stolenByPlayerId &&
                    renderPlayerSelectorHelpText(
                      "quem roubou",
                      "da equipa defensora"
                    )}{" "}
                </>
              )}{" "}
              <Button
                onClick={() => onAdvanceStep("CONFIRM_TURNOVER_EVENT")}
                className="w-full mt-3"
                disabled={
                  !currentEventData.turnoverDetails?.type ||
                  currentEventData.turnoverDetails?.stolenByPlayerId === ""
                }
              >
                Próximo: Confirmar
              </Button>{" "}
            </div>
          );
        if (currentEventStep === "CONFIRM_TURNOVER_EVENT")
          return renderConfirmationStep("Confirmar Turnover?");
        break;

      case "STEAL":
        if (currentEventStep === "SELECT_PRIMARY_PLAYER")
          return (
            <div className="space-y-2">
              {" "}
              <Label>
                Quem fez o Roubo de Bola?{" "}
                <span className="font-semibold">
                  {getPlayerName(currentEventData.primaryPlayerId)}
                </span>
              </Label>{" "}
              {!currentEventData.primaryPlayerId &&
                renderPlayerSelectorHelpText(
                  "quem roubou",
                  `da equipa ${
                    currentEventData.primaryTeamId === homeTeam.id
                      ? homeTeam.shortName
                      : currentEventData.primaryTeamId === awayTeam.id
                      ? awayTeam.shortName
                      : "defensora"
                  }`
                )}{" "}
            </div>
          );
        if (currentEventStep === "SELECT_PLAYER_WHO_LOST_BALL_ON_STEAL")
          return (
            <div className="space-y-2">
              {" "}
              <Label>
                Quem perdeu a posse (opcional)?{" "}
                <span className="font-semibold">
                  {getPlayerName(
                    currentEventData.stealDetails?.lostPossessionByPlayerId
                  )}
                </span>
              </Label>{" "}
              {!currentEventData.stealDetails?.lostPossessionByPlayerId &&
                renderPlayerSelectorHelpText(
                  "quem perdeu a bola",
                  "da equipa adversária"
                )}{" "}
              <Button
                onClick={() => onAdvanceStep("CONFIRM_STEAL_EVENT")}
                className="w-full mt-2"
              >
                Próximo / Pular
              </Button>{" "}
            </div>
          );
        if (currentEventStep === "CONFIRM_STEAL_EVENT")
          return renderConfirmationStep("Confirmar Roubo de Bola?");
        break;

      case "BLOCK":
        if (currentEventStep === "SELECT_PRIMARY_PLAYER")
          return (
            <div className="space-y-2">
              {" "}
              <Label>
                Quem fez o Bloqueio?{" "}
                <span className="font-semibold">
                  {getPlayerName(currentEventData.primaryPlayerId)}
                </span>
              </Label>{" "}
              {!currentEventData.primaryPlayerId &&
                renderPlayerSelectorHelpText(
                  "quem bloqueou",
                  `da equipa ${
                    currentEventData.primaryTeamId === homeTeam.id
                      ? homeTeam.shortName
                      : currentEventData.primaryTeamId === awayTeam.id
                      ? awayTeam.shortName
                      : "defensora"
                  }`
                )}{" "}
            </div>
          );
        if (currentEventStep === "SELECT_BLOCKED_PLAYER")
          return (
            <div className="space-y-2">
              {" "}
              <Label>
                Quem teve o arremesso bloqueado?{" "}
                <span className="font-semibold">
                  {getPlayerName(currentEventData.blockDetails?.shotByPlayerId)}
                </span>
              </Label>{" "}
              {!currentEventData.blockDetails?.shotByPlayerId &&
                renderPlayerSelectorHelpText(
                  "quem arremessou",
                  "da equipa adversária"
                )}{" "}
              {currentEventData.blockDetails?.shotByPlayerId && (
                <Button
                  onClick={() => onAdvanceStep("CONFIRM_BLOCK_EVENT")}
                  className="w-full mt-2"
                >
                  Próximo: Confirmar
                </Button>
              )}
            </div>
          );
        if (currentEventStep === "CONFIRM_BLOCK_EVENT")
          return renderConfirmationStep("Confirmar Bloqueio?");
        break;

      case "DEFLECTION":
        if (currentEventStep === "SELECT_PRIMARY_PLAYER")
          return (
            <div className="space-y-2">
              {" "}
              <Label>
                Quem fez o Desvio de Passe?{" "}
                <span className="font-semibold">
                  {getPlayerName(currentEventData.primaryPlayerId)}
                </span>
              </Label>{" "}
              {!currentEventData.primaryPlayerId &&
                renderPlayerSelectorHelpText(
                  "quem desviou",
                  `da equipa ${
                    currentEventData.primaryTeamId === homeTeam.id
                      ? homeTeam.shortName
                      : currentEventData.primaryTeamId === awayTeam.id
                      ? awayTeam.shortName
                      : "defensora"
                  }`
                )}{" "}
              {currentEventData.primaryPlayerId && (
                <Button
                  onClick={() => onAdvanceStep("CONFIRM_DEFLECTION_EVENT")}
                  className="w-full mt-2"
                >
                  Próximo: Confirmar
                </Button>
              )}{" "}
            </div>
          );
        if (currentEventStep === "CONFIRM_DEFLECTION_EVENT")
          return renderConfirmationStep("Confirmar Desvio de Passe?");
        break;

      case "ADMIN_EVENT":
        if (currentEventStep === "SELECT_ADMIN_ACTION")
          return (
            <div className="space-y-2">
              {" "}
              <Label htmlFor="adminAction">Ação Administrativa</Label>{" "}
              <Select
                value={currentEventData.adminEventDetails?.action}
                onValueChange={(value) => {
                  onUpdateEventData({ adminEventDetails: { action: value } });
                  if (value === "POSSESSION_ARROW_SET")
                    onAdvanceStep("SET_POSSESSION_ARROW_TEAM");
                  else if (
                    value === "START_PERIOD" &&
                    gameState.currentQuarter >= 1 &&
                    gameState.currentQuarter < gameState.settings.quarters + 10
                  )
                    onAdvanceStep("SET_POSSESSION_FOR_PERIOD");
                  else onAdvanceStep("CONFIRM_ADMIN_EVENT");
                }}
              >
                {" "}
                <SelectTrigger id="adminAction">
                  <SelectValue placeholder="Selecione a ação" />
                </SelectTrigger>{" "}
                <SelectContent>
                  {ADMIN_EVENT_ACTIONS.map((aa) => (
                    <SelectItem key={aa.value} value={aa.value}>
                      {aa.label}
                    </SelectItem>
                  ))}
                </SelectContent>{" "}
              </Select>{" "}
              {currentEventData.adminEventDetails?.action === "CORRECTION" && (
                <Textarea
                  placeholder="Notas sobre a correção..."
                  value={currentEventData.adminEventDetails.notes}
                  onChange={(e) =>
                    onUpdateEventData({
                      adminEventDetails: {
                        ...currentEventData.adminEventDetails!,
                        notes: e.target.value,
                      },
                    })
                  }
                />
              )}{" "}
            </div>
          );
        if (currentEventStep === "SET_POSSESSION_ARROW_TEAM")
          return (
            <div className="space-y-2">
              {" "}
              <Label>Seta de Posse aponta para:</Label>{" "}
              <RadioGroup
                onValueChange={(value) =>
                  onUpdateEventData({
                    adminEventDetails: {
                      ...currentEventData.adminEventDetails!,
                      possessionSetToTeamId: value,
                    },
                  })
                }
                value={
                  currentEventData.adminEventDetails?.possessionSetToTeamId
                }
              >
                {" "}
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={homeTeam.id}
                    id={`pa-${homeTeam.id}`}
                  />
                  <Label htmlFor={`pa-${homeTeam.id}`}>{homeTeam.name}</Label>
                </div>{" "}
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={awayTeam.id}
                    id={`pa-${awayTeam.id}`}
                  />
                  <Label htmlFor={`pa-${awayTeam.id}`}>{awayTeam.name}</Label>
                </div>{" "}
              </RadioGroup>{" "}
              {currentEventData.adminEventDetails?.possessionSetToTeamId && (
                <Button
                  onClick={() => onAdvanceStep("CONFIRM_ADMIN_EVENT")}
                  className="w-full mt-2"
                >
                  Próximo: Confirmar
                </Button>
              )}{" "}
            </div>
          );
        if (currentEventStep === "SET_POSSESSION_FOR_PERIOD")
          return (
            <div className="space-y-2">
              {" "}
              <Label>
                Posse para iniciar o Período{" "}
                {gameState.currentQuarter + 1 > gameState.settings.quarters
                  ? `OT${
                      gameState.currentQuarter + 1 - gameState.settings.quarters
                    }`
                  : gameState.currentQuarter + 1}{" "}
                (Seta aponta para:{" "}
                {gameState.possessionArrow === "HOME"
                  ? homeTeam.shortName
                  : gameState.possessionArrow === "AWAY"
                  ? awayTeam.shortName
                  : "N/D"}
                ):
              </Label>{" "}
              <RadioGroup
                onValueChange={(value) =>
                  onUpdateEventData({
                    adminEventDetails: {
                      ...currentEventData.adminEventDetails!,
                      possessionSetToTeamId: value,
                    },
                  })
                }
                value={
                  currentEventData.adminEventDetails?.possessionSetToTeamId ||
                  (gameState.possessionArrow === "HOME"
                    ? homeTeam.id
                    : gameState.possessionArrow === "AWAY"
                    ? awayTeam.id
                    : undefined)
                }
              >
                {" "}
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={homeTeam.id}
                    id={`pq-${homeTeam.id}`}
                  />
                  <Label htmlFor={`pq-${homeTeam.id}`}>{homeTeam.name}</Label>
                </div>{" "}
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={awayTeam.id}
                    id={`pq-${awayTeam.id}`}
                  />
                  <Label htmlFor={`pq-${awayTeam.id}`}>{awayTeam.name}</Label>
                </div>{" "}
              </RadioGroup>{" "}
              {currentEventData.adminEventDetails?.possessionSetToTeamId && (
                <Button
                  onClick={() => onAdvanceStep("CONFIRM_ADMIN_EVENT")}
                  className="w-full mt-2"
                >
                  Próximo: Confirmar
                </Button>
              )}{" "}
            </div>
          );
        if (currentEventStep === "CONFIRM_ADMIN_EVENT")
          return renderConfirmationStep("Confirmar Evento Administrativo?");
        break;

      default:
        return (
          <div className="p-4 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-yellow-500 mb-2" />
            <p className="text-muted-foreground">
              Configuração pendente para: {eventTypeLabel} (Passo:{" "}
              {currentEventStep || "N/D"}).
            </p>
          </div>
        );
    }
    return (
      <p className="text-center text-muted-foreground p-4">
        Aguardando ação ou próximo passo...
      </p>
    );
  };

  const canConfirmEvent = (): boolean => {
    if (!selectedEventType || !currentEventData.type) return false;
    if (
      currentEventStep === "AWAITING_FREE_THROW" &&
      pendingFreeThrows.length > 0 &&
      currentFreeThrowIndex < pendingFreeThrows.length
    )
      return false;
    if (currentEventStep?.startsWith("CONFIRM_")) return true;

    // Validações mais explícitas para quando o botão "Confirmar" geral deve estar ativo
    switch (selectedEventType) {
      case "JUMP_BALL":
        return (
          currentEventStep === "SELECT_JUMP_BALL_WINNER" &&
          !!currentEventData.jumpBallDetails?.wonByTeamId
        );
      case "2POINTS_MADE":
      case "3POINTS_MADE":
        return (
          currentEventStep === "SELECT_SHOT_DETAILS" &&
          !!currentEventData.primaryPlayerId &&
          !!currentEventData.shotDetails?.type &&
          (!currentEventData.foulDetails ||
            (!!currentEventData.foulDetails.personalFoulType &&
              !!currentEventData.foulDetails.committedByPlayerId &&
              !!currentEventData.foulDetails.drawnByPlayerId))
        );
      case "2POINTS_MISSED":
      case "3POINTS_MISSED":
        return (
          (currentEventStep === "SELECT_SHOT_DETAILS" &&
            !!currentEventData.primaryPlayerId &&
            !!currentEventData.shotDetails?.type &&
            !currentEventData.foulDetails &&
            !currentEventData.reboundDetails) || // Caso: arremesso falhado simples sem nada a seguir
          (currentEventStep === "SELECT_REBOUND_PLAYER_AFTER_MISS" &&
            !!currentEventData.reboundDetails?.reboundPlayerId &&
            !!currentEventData.reboundDetails?.type) || // Caso: ressalto selecionado
          (currentEventStep === "CALCULATE_FTS_FOR_SHOT_FOUL" &&
            !!currentEventData.foulDetails?.committedByPlayerId)
        ); // Caso: falta no arremesso falhado
      case "FOUL_PERSONAL":
      case "FOUL_TECHNICAL":
        return (
          currentEventStep === "SELECT_FOUL_DETAILS" &&
          !!currentEventData.foulDetails &&
          (!!currentEventData.foulDetails.committedByPlayerId ||
            !!currentEventData.foulDetails.committedByTeamId) &&
          (selectedEventType === "FOUL_PERSONAL"
            ? !!currentEventData.foulDetails.personalFoulType
            : !!currentEventData.foulDetails.technicalFoulType) &&
          (!(
            currentEventData.foulDetails.resultsInFreeThrows &&
            (currentEventData.foulDetails.numberOfFreeThrowsAwarded ?? 0) > 0 &&
            selectedEventType === "FOUL_TECHNICAL"
          ) ||
            !!currentEventData.foulDetails.freeThrowShooterPlayerId)
        );
      case "REBOUND_OFFENSIVE":
      case "REBOUND_DEFENSIVE":
        return (
          (currentEventStep === "SELECT_PRIMARY_PLAYER" &&
            !!currentEventData.primaryPlayerId &&
            selectedEventType === "REBOUND_DEFENSIVE") || // Defensivo pode confirmar direto
          (currentEventStep === "CHECK_TIP_IN_AFTER_OREB" &&
            !!currentEventData.primaryPlayerId)
        ); // Ofensivo vai para tip-in ou confirmação
      case "SUBSTITUTION":
        return (
          currentEventStep === "SELECT_PLAYER_IN" &&
          !!(
            currentEventData.substitutionDetails?.playerInId &&
            currentEventData.substitutionDetails?.playerOutId
          )
        );
      case "TIMEOUT_REQUEST":
        return (
          currentEventStep === "SELECT_TIMEOUT_TYPE" &&
          !!currentEventData.timeoutDetails?.teamId &&
          !!currentEventData.timeoutDetails?.type
        );
      case "TURNOVER":
        return (
          currentEventStep === "SELECT_TURNOVER_TYPE" &&
          !!currentEventData.turnoverDetails?.type &&
          (!currentEventData.turnoverDetails.stolenByPlayerId === undefined ||
            !!currentEventData.turnoverDetails.stolenByPlayerId)
        );
      case "STEAL":
        return (
          currentEventStep === "SELECT_PLAYER_WHO_LOST_BALL_ON_STEAL" &&
          !!currentEventData.stealDetails?.stolenByPlayerId
        );
      case "BLOCK":
        return (
          currentEventStep === "SELECT_BLOCKED_PLAYER" &&
          !!currentEventData.blockDetails?.blockPlayerId &&
          !!currentEventData.blockDetails?.shotByPlayerId
        );
      case "DEFLECTION":
        return (
          currentEventStep === "SELECT_PRIMARY_PLAYER" &&
          !!currentEventData.deflectionDetails?.deflectedByPlayerId
        );
      case "HELD_BALL":
        return (
          currentEventStep === "SELECT_HELD_BALL_PLAYERS" ||
          currentEventStep === "CONFIRM_HELD_BALL"
        );
      case "ADMIN_EVENT":
        return (
          (currentEventStep === "SELECT_ADMIN_ACTION" &&
            !!currentEventData.adminEventDetails?.action &&
            !["POSSESSION_ARROW_SET", "START_PERIOD"].includes(
              currentEventData.adminEventDetails.action
            )) ||
          (currentEventStep === "SET_POSSESSION_ARROW_TEAM" &&
            !!currentEventData.adminEventDetails?.possessionSetToTeamId) ||
          (currentEventStep === "SET_POSSESSION_FOR_PERIOD" &&
            !!currentEventData.adminEventDetails?.possessionSetToTeamId)
        );
    }
    return false;
  };

  return (
    <Card className="w-full h-full max-h-[calc(100vh-240px)] flex flex-col">
      <CardHeader className="py-2 px-3">
        <CardTitle className="text-sm md:text-md text-center">
          Registar: {eventTypeLabel}
          {currentEventStep &&
            !currentEventStep.startsWith("CONFIRM_") &&
            !(currentEventStep === "AWAITING_FREE_THROW") && (
              <span className="block text-xs text-muted-foreground mt-0.5">
                {" "}
                (Passo: {currentEventStep.replace(/_/g, " ").toLowerCase()})
              </span>
            )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 md:p-3 flex-1 overflow-y-auto space-y-3">
        {renderEventContent()}
      </CardContent>
      {!(
        currentEventStep === "AWAITING_FREE_THROW" &&
        pendingFreeThrows.length > 0 &&
        currentFreeThrowIndex < pendingFreeThrows.length
      ) && (
        <CardFooter className="p-2 md:p-3 border-t flex flex-col sm:flex-row gap-2">
          <Button
            onClick={onConfirm}
            className="flex-1"
            disabled={!canConfirmEvent()}
          >
            Confirmar Evento
          </Button>
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
