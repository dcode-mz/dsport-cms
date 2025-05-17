import {
  GameState,
  EventType,
  Player,
  GameEvent,
  AllShotTypes,
  PersonalFoulType,
  TechnicalFoulType,
  TurnoverType,
  FreeThrowLog,
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
import { Input } from "@/components/ui/input";
import {
  SHOT_TYPES_2PT,
  SHOT_TYPES_3PT,
  PERSONAL_FOUL_TYPES,
  TECHNICAL_FOUL_TYPES,
  TURNOVER_TYPES,
  ADMIN_EVENT_ACTIONS,
  MAIN_EVENT_TYPE_OPTIONS,
} from "@/app/data/basketball-definitions";
import { CheckCircle, XCircle, ArrowRight } from "lucide-react";

interface EventDetailPanelProps {
  gameState: GameState;
  selectedEventType: EventType;
  currentEventData: Partial<GameEvent>;
  currentEventStep: string | null;
  pendingFreeThrows: FreeThrowLog[];
  currentFreeThrowIndex: number;
  onUpdateEventData: (update: Partial<GameEvent>) => void;
  onAdvanceStep: (nextStep: string | null) => void;
  onPlayerSelectedForRole: (
    player: Player,
    role: string,
    teamType?: "home" | "away" | "either" | "possessing" | "defending"
  ) => void; // Notifica o hook qual jogador foi clicado para qual papel
  onConfirm: () => void;
  onCancel: () => void;
  onFreeThrowAttemptResult: (isMade: boolean) => void;
}

export function EventDetailPanel({
  gameState,
  selectedEventType,
  currentEventData,
  currentEventStep,
  pendingFreeThrows,
  currentFreeThrowIndex,
  onUpdateEventData,
  onAdvanceStep,
  // onPlayerSelectedForRole, // A seleção de jogador agora é mais implícita através das TeamPlayerList e o hook useGameEvents faz a atribuição
  onConfirm,
  onCancel,
  onFreeThrowAttemptResult,
}: EventDetailPanelProps) {
  const { homeTeam, awayTeam, possessionTeamId, settings } = gameState;
  const eventTypeLabel =
    MAIN_EVENT_TYPE_OPTIONS.find((e) => e.type === selectedEventType)?.label ||
    selectedEventType;

  const getPlayerName = (playerId?: string): string => {
    if (!playerId) return "N/D";
    const player = [...homeTeam.players, ...awayTeam.players].find(
      (p) => p.id === playerId
    );
    return player ? `#${player.number} ${player.name}` : "Desconhecido";
  };

  const renderPlayerSelectorHelpText = (
    roleText: string,
    teamScope: string
  ) => (
    <p className="text-xs text-muted-foreground mt-1">
      Selecione {roleText} na lista de jogadores da equipa {teamScope}.
    </p>
  );

  // --- Renderizadores de Campos Específicos ---
  const renderShotTypeSelector = (is3PT: boolean) => {
    const options = is3PT ? SHOT_TYPES_3PT : SHOT_TYPES_2PT;
    return (
      <div className="space-y-1">
        <Label htmlFor="shotType">Tipo de Arremesso</Label>
        <Select
          value={currentEventData.shotDetails?.type}
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
            <SelectValue placeholder="Selecione o tipo" />
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
          Assistência (Opcional):{" "}
          {getPlayerName(currentEventData.shotDetails?.assistPlayerId)}
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
      {renderPlayerSelectorHelpText("o assistente", "da equipa atacante")}
    </div>
  );

  const renderFoulOnPlaySwitch = () => (
    <div className="flex items-center space-x-2 mt-4 border-t pt-3">
      <Switch
        id="foulOnPlay"
        checked={!!currentEventData.foulDetails} // Se existe objeto foulDetails, houve falta
        onCheckedChange={(checked) => {
          if (checked) {
            onUpdateEventData({
              foulDetails: {
                // Inicializa detalhes da falta
                committedBy: "PLAYER", // Assume jogador por defeito
                isPersonalFoul: true, // Assume pessoal por defeito
                resultsInFreeThrows: false, // Default
                drawnByPlayerId: currentEventData.primaryPlayerId, // Quem arremessou é quem sofreu
              },
            });
            onAdvanceStep("SELECT_FOUL_TYPE_ON_SHOT");
          } else {
            onUpdateEventData({ foulDetails: undefined }); // Limpa detalhes da falta
            onAdvanceStep("CONFIRM_SHOT_EVENT"); // Volta para confirmação do arremesso
          }
        }}
      />
      <Label htmlFor="foulOnPlay">Houve falta na jogada do arremesso?</Label>
    </div>
  );

  const renderFoulTypeSelector = (isShootingPlay: boolean) => {
    const relevantFoulTypes = PERSONAL_FOUL_TYPES.filter(
      (ft) => (isShootingPlay ? ft.canResultInShootingFoul : true) // Se é jogada de arremesso, só as que podem ser de arremesso ou outras pessoais
    );
    return (
      <div className="space-y-1">
        <Label htmlFor="foulTypeOnPlay">Tipo de Falta</Label>
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
                isCharge: value === "OFFENSIVE", // Exemplo, pode precisar de mais lógica
              },
            });
            if (foulTypeObj?.isOffensive) {
              // Se for falta ofensiva, não há LLs, posse para defesa
              onAdvanceStep("CONFIRM_SHOT_AND_OFFENSIVE_FOUL");
            } else {
              onAdvanceStep("SELECT_FOULING_PLAYER_ON_SHOT");
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
    teamScopeHelpText: string
  ) => (
    <div className="space-y-1 mt-2">
      <Label>
        {roleText}:{" "}
        {getPlayerName(currentEventData.foulDetails?.committedByPlayerId)}
      </Label>
      {renderPlayerSelectorHelpText("quem cometeu a falta", teamScopeHelpText)}
    </div>
  );

  const renderFreeThrowAwardSelector = () => {
    // Lógica para determinar nº de LLs (complexa, baseada no tipo de falta, local do arremesso, bónus)
    // Simplificação: permite selecionar manualmente por agora
    const numOptions = [0, 1, 2, 3];
    return (
      <div className="space-y-1 mt-2">
        <Label htmlFor="numFTs">Nº Lances Livres</Label>
        <Select
          value={currentEventData.foulDetails?.numberOfFreeThrowsAwarded?.toString()}
          onValueChange={(value) =>
            onUpdateEventData({
              foulDetails: {
                ...currentEventData.foulDetails!,
                numberOfFreeThrowsAwarded: parseInt(value),
                resultsInFreeThrows: parseInt(value) > 0,
              },
            })
          }
        >
          <SelectTrigger id="numFTs">
            <SelectValue placeholder="Nº de L.L." />
          </SelectTrigger>
          <SelectContent>
            {numOptions.map((n) => (
              <SelectItem key={n} value={n.toString()}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  const renderShotSubsequentEventSelector = () => (
    <div className="space-y-2 mt-3 border-t pt-3">
      <Label>Resultado após Arremesso Falhado:</Label>
      <RadioGroup
        onValueChange={(value) => {
          if (value === "REBOUND") onAdvanceStep("SELECT_REBOUND_PLAYER");
          else if (value === "TIP_IN") onAdvanceStep("SELECT_TIP_IN_PLAYER");
          else if (value === "SHOT_CLOCK_VIOLATION") {
            onUpdateEventData({
              turnoverDetails: {
                type: "SHOT_CLOCK_VIOLATION",
                lostByPlayerId: currentEventData.primaryPlayerId!,
              },
            }); // Atribui turnover
            onAdvanceStep("CONFIRM_MISSED_SHOT_EVENT"); // Ou direto para confirmar evento
          } else if (value === "OUT_OF_BOUNDS") {
            /* Lógica para bola fora */ onAdvanceStep(
              "CONFIRM_MISSED_SHOT_EVENT"
            );
          } else onAdvanceStep("CONFIRM_MISSED_SHOT_EVENT"); // Se não houver evento subsequente claro
        }}
        className="flex flex-col gap-1"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="REBOUND" id="resMiss" />{" "}
          <Label htmlFor="resMiss">Ressalto</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="TIP_IN" id="tipMiss" />{" "}
          <Label htmlFor="tipMiss">Tip-In</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="SHOT_CLOCK_VIOLATION" id="scvMiss" />{" "}
          <Label htmlFor="scvMiss">Violação Relógio Posse</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="OUT_OF_BOUNDS" id="oobMiss" />{" "}
          <Label htmlFor="oobMiss">Bola Fora</Label>
        </div>
      </RadioGroup>
    </div>
  );

  // --- Renderizador Principal do Painel de Detalhes ---
  const renderEventContent = () => {
    switch (selectedEventType) {
      // --- JUMP BALL ---
      case "JUMP_BALL":
      case "JUMP_BALL":
        if (currentEventStep === "SELECT_JUMP_BALL_PLAYERS") {
          return (
            <div className="space-y-3">
              <div>
                <Label>Jogador Casa para o Salto:</Label>
                <p className="font-semibold min-h-[20px]">
                  {getPlayerName(
                    currentEventData.jumpBallDetails?.homePlayerId
                  )}
                </p>
                {!currentEventData.jumpBallDetails?.homePlayerId &&
                  renderPlayerSelectorHelpText(
                    "o jogador da casa",
                    "da equipa CASA"
                  )}
              </div>
              <div className="mt-2">
                <Label>Jogador Visitante para o Salto:</Label>
                <p className="font-semibold min-h-[20px]">
                  {getPlayerName(
                    currentEventData.jumpBallDetails?.awayPlayerId
                  )}
                </p>
                {!currentEventData.jumpBallDetails?.awayPlayerId &&
                  renderPlayerSelectorHelpText(
                    "o jogador visitante",
                    "da equipa VISITANTE"
                  )}
              </div>
              {currentEventData.jumpBallDetails?.homePlayerId &&
                currentEventData.jumpBallDetails?.awayPlayerId && (
                  <Button
                    onClick={() => onAdvanceStep("SELECT_JUMP_BALL_WINNER")}
                    className="w-full mt-3"
                  >
                    Próximo: Definir Vencedor do Salto <ArrowRight size={16} />
                  </Button>
                )}
            </div>
          );
        }
        if (currentEventStep === "SELECT_JUMP_BALL_WINNER") {
          return (
            <div className="space-y-2">
              <Label>Quem ganhou a posse no Salto Inicial?</Label>
              <RadioGroup
                onValueChange={(value) =>
                  onUpdateEventData({
                    jumpBallDetails: {
                      ...currentEventData.jumpBallDetails!,
                      wonByTeamId: value,
                      possessionArrowToTeamId:
                        value === homeTeam.id ? awayTeam.id : homeTeam.id, // Seta para o perdedor
                    },
                  })
                }
                value={currentEventData.jumpBallDetails?.wonByTeamId}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={homeTeam.id}
                    id={`jbWin-${homeTeam.id}`}
                  />
                  <Label htmlFor={`jbWin-${homeTeam.id}`}>
                    {homeTeam.name}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={awayTeam.id}
                    id={`jbWin-${awayTeam.id}`}
                  />
                  <Label htmlFor={`jbWin-${awayTeam.id}`}>
                    {awayTeam.name}
                  </Label>
                </div>
              </RadioGroup>
            </div>
          );
        }
        break;

      // --- ARREMESSOS (FEITOS E FALHADOS) ---
      case "2POINTS_MADE":
      case "3POINTS_MADE":
      case "2POINTS_MISSED":
      case "3POINTS_MISSED":
        const isMadeShot = selectedEventType.includes("MADE");
        const is3PTShot = selectedEventType.includes("3POINTS");

        if (currentEventStep === "SELECT_PRIMARY_PLAYER") {
          // Selecionar arremessador
          return (
            <div className="space-y-2">
              <Label>
                Quem arremessou?{" "}
                {getPlayerName(currentEventData.primaryPlayerId)}
              </Label>
              {renderPlayerSelectorHelpText(
                "o arremessador",
                "da equipa com posse"
              )}
            </div>
          );
        }
        if (currentEventStep === "SELECT_SHOT_DETAILS") {
          // Tipo de arremesso, assistência, falta
          return (
            <div className="space-y-3">
              {renderShotTypeSelector(is3PTShot)}
              {isMadeShot && renderAssistSelector()}
              {renderFoulOnPlaySwitch()} {/* Leva a outros passos se "Sim" */}
            </div>
          );
        }
        // Passos para falta em arremesso
        if (currentEventStep === "SELECT_FOUL_TYPE_ON_SHOT")
          return renderFoulTypeSelector(true);
        if (currentEventStep === "SELECT_FOULING_PLAYER_ON_SHOT") {
          return (
            <div className="space-y-3">
              {renderFoulingPlayerSelector(
                "Falta cometida por (Defesa)",
                "da equipa defensora"
              )}
              {currentEventData.foulDetails?.committedByPlayerId &&
                isMadeShot &&
                renderFreeThrowAwardSelector()}{" "}
              {/* And-1 */}
              {currentEventData.foulDetails?.committedByPlayerId &&
                !isMadeShot &&
                renderFreeThrowAwardSelector()}{" "}
              {/* FTs por falta no arremesso */}
            </div>
          );
        }
        // Passo para resultado de arremesso falhado
        if (currentEventStep === "SELECT_MISSED_SHOT_OUTCOME" && !isMadeShot) {
          return renderShotSubsequentEventSelector();
        }
        if (currentEventStep === "SELECT_REBOUND_PLAYER" && !isMadeShot) {
          return (
            <div className="space-y-2">
              <Label>
                Quem pegou o ressalto?{" "}
                {getPlayerName(
                  currentEventData.reboundDetails?.reboundPlayerId
                )}
              </Label>
              {renderPlayerSelectorHelpText(
                "o ressaltador",
                "de qualquer equipa"
              )}
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
                  <RadioGroupItem value="OFFENSIVE" id="rebOff" />{" "}
                  <Label htmlFor="rebOff">Ofensivo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="DEFENSIVE" id="rebDef" />{" "}
                  <Label htmlFor="rebDef">Defensivo</Label>
                </div>
              </RadioGroup>
            </div>
          );
        }
        // ... mais passos para Tip-in, etc.
        break;

      // --- FALTAS (PESSOAL / TÉCNICA) ---
      case "FOUL_PERSONAL":
        if (currentEventStep === "SELECT_PRIMARY_PLAYER") {
          // Quem cometeu
          return (
            <div className="space-y-2">
              <Label>
                Quem cometeu a Falta Pessoal?{" "}
                {getPlayerName(
                  currentEventData.foulDetails?.committedByPlayerId ||
                    currentEventData.primaryPlayerId
                )}
              </Label>
              {renderPlayerSelectorHelpText(
                "quem cometeu",
                "de qualquer equipa"
              )}
            </div>
          );
        }
        if (currentEventStep === "SELECT_FOUL_DETAILS") {
          return (
            <div className="space-y-3">
              <Label htmlFor="foulPType">Tipo de Falta Pessoal</Label>
              <Select
                value={currentEventData.foulDetails?.personalFoulType}
                onValueChange={(value) =>
                  onUpdateEventData({
                    foulDetails: {
                      ...currentEventData.foulDetails!,
                      personalFoulType: value as PersonalFoulType,
                    },
                  })
                }
              >
                <SelectTrigger id="foulPType">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {PERSONAL_FOUL_TYPES.map((ft) => (
                    <SelectItem key={ft.value} value={ft.value}>
                      {ft.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Label>
                Quem sofreu a falta?{" "}
                {getPlayerName(
                  currentEventData.foulDetails?.drawnByPlayerId ||
                    currentEventData.secondaryPlayerId
                )}
              </Label>
              {renderPlayerSelectorHelpText(
                "quem sofreu",
                "de qualquer equipa (geralmente oponente)"
              )}

              {currentEventData.foulDetails?.drawnByPlayerId &&
                renderFreeThrowAwardSelector()}
            </div>
          );
        }
        break;

      case "FOUL_TECHNICAL":
        if (currentEventStep === "SELECT_PRIMARY_PLAYER") {
          // Quem cometeu (se for jogador)
          return (
            <div className="space-y-2">
              <Label>
                Quem cometeu a Falta Técnica? (Se Jogador){" "}
                {getPlayerName(
                  currentEventData.foulDetails?.committedByPlayerId ||
                    currentEventData.primaryPlayerId
                )}
              </Label>
              {renderPlayerSelectorHelpText(
                "o jogador infrator",
                "de qualquer equipa"
              )}
              <Button
                onClick={() =>
                  onAdvanceStep("SELECT_TECHNICAL_FOUL_INFRINGER_NON_PLAYER")
                }
                className="mt-2 text-xs"
                variant="link"
              >
                Ou foi Banco/Treinador?
              </Button>
            </div>
          );
        }
        if (currentEventStep === "SELECT_TECHNICAL_FOUL_INFRINGER_NON_PLAYER") {
          return (
            <div className="space-y-2">
              <Label>Infrator da Falta Técnica (Não Jogador)</Label>
              <RadioGroup
                value={currentEventData.foulDetails?.committedBy}
                onValueChange={(value) =>
                  onUpdateEventData({
                    foulDetails: {
                      ...currentEventData.foulDetails!,
                      committedBy: value as any,
                      committedByPlayerId: undefined,
                    },
                  })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="COACH" id="tecCoach" />{" "}
                  <Label htmlFor="tecCoach">Treinador</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="BENCH" id="tecBench" />{" "}
                  <Label htmlFor="tecBench">Banco</Label>
                </div>
              </RadioGroup>
              {currentEventData.foulDetails?.committedBy && (
                <Select
                  value={currentEventData.foulDetails.committedByTeamId}
                  onValueChange={(val) =>
                    onUpdateEventData({
                      foulDetails: {
                        ...currentEventData.foulDetails!,
                        committedByTeamId: val,
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Equipa do Infrator" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={homeTeam.id}>{homeTeam.name}</SelectItem>
                    <SelectItem value={awayTeam.id}>{awayTeam.name}</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Button
                onClick={() => onAdvanceStep("SELECT_FOUL_DETAILS")}
                className="mt-2 text-xs"
                variant="link"
              >
                Ou foi um Jogador?
              </Button>
            </div>
          );
        }
        if (currentEventStep === "SELECT_FOUL_DETAILS") {
          // Tipo de técnica, LLs
          return (
            <div className="space-y-3">
              <Label htmlFor="foulTType">Tipo de Falta Técnica</Label>
              <Select
                value={currentEventData.foulDetails?.technicalFoulType}
                onValueChange={(value) =>
                  onUpdateEventData({
                    foulDetails: {
                      ...currentEventData.foulDetails!,
                      technicalFoulType: value as TechnicalFoulType,
                    },
                  })
                }
              >
                <SelectTrigger id="foulTType">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TECHNICAL_FOUL_TYPES.map((ft) => (
                    <SelectItem key={ft.value} value={ft.value}>
                      {ft.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Técnicas geralmente dão 1 ou 2 LLs + posse */}
              <Label>
                Quem cobra o(s) Lance(s) Livre(s) da Técnica?{" "}
                {getPlayerName(
                  currentEventData.foulDetails?.freeThrowShooterPlayerId
                )}
              </Label>
              {renderPlayerSelectorHelpText(
                "o cobrador",
                "da equipa adversária ao infrator"
              )}
              {renderFreeThrowAwardSelector()}
            </div>
          );
        }
        break;

      // --- LANCES LIVRES (FLUXO INTERNO) ---
      case "FREE_THROW_ATTEMPT": // Este é um estado interno, não selecionável
        if (
          currentEventStep === "AWAITING_FREE_THROW" &&
          pendingFreeThrows.length > 0
        ) {
          const ft = pendingFreeThrows[currentFreeThrowIndex];
          return (
            <div className="space-y-3 text-center">
              <p className="font-semibold">
                Lance Livre {ft.attemptNumberInSequence} de {ft.totalAwarded}
              </p>
              <p>Cobrador: {getPlayerName(ft.shooterPlayerId)}</p>
              <div className="flex gap-4 justify-center mt-4">
                <Button
                  onClick={() => onFreeThrowAttemptResult(true)}
                  className="bg-green-500 hover:bg-green-600 w-28"
                >
                  <CheckCircle className="mr-2" /> Convertido
                </Button>
                <Button
                  onClick={() => onFreeThrowAttemptResult(false)}
                  className="bg-red-500 hover:bg-red-600 w-28"
                >
                  <XCircle className="mr-2" /> Falhado
                </Button>
              </div>
            </div>
          );
        }
        break;

      // --- SUBSTITUIÇÃO ---
      case "SUBSTITUTION":
        if (currentEventStep === "SELECT_PLAYER_OUT") {
          return (
            <div className="space-y-2">
              <Label>
                Quem SAI do jogo?{" "}
                {getPlayerName(
                  currentEventData.substitutionDetails?.playerOutId
                )}
              </Label>
              {renderPlayerSelectorHelpText("quem sai", "(jogador em campo)")}
            </div>
          );
        }
        if (currentEventStep === "SELECT_PLAYER_IN") {
          return (
            <div className="space-y-2">
              <Label>
                Quem ENTRA no jogo?{" "}
                {getPlayerName(
                  currentEventData.substitutionDetails?.playerInId
                )}
              </Label>
              {renderPlayerSelectorHelpText(
                "quem entra",
                "(jogador no banco da mesma equipa)"
              )}
            </div>
          );
        }
        break;

      // --- TURNOVER ---
      case "TURNOVER":
        if (currentEventStep === "SELECT_PRIMARY_PLAYER") {
          // Quem cometeu
          return (
            <div className="space-y-2">
              <Label>
                Quem cometeu o Turnover?{" "}
                {getPlayerName(
                  currentEventData.turnoverDetails?.lostByPlayerId ||
                    currentEventData.primaryPlayerId
                )}
              </Label>
              {renderPlayerSelectorHelpText(
                "quem perdeu a bola",
                "da equipa com posse"
              )}
            </div>
          );
        }
        if (currentEventStep === "SELECT_TURNOVER_TYPE") {
          return (
            <div className="space-y-2">
              <Label htmlFor="toType">Tipo de Turnover</Label>
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
                <SelectTrigger id="toType">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TURNOVER_TYPES.map((tt) => (
                    <SelectItem key={tt.value} value={tt.value}>
                      {tt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Opcional: quem roubou a bola? */}
              <div className="flex items-center space-x-2 mt-3">
                <Switch
                  id="isStolen"
                  checked={!!currentEventData.turnoverDetails?.stolenByPlayerId}
                  onCheckedChange={(c) => {
                    if (!c)
                      onUpdateEventData({
                        turnoverDetails: {
                          ...currentEventData.turnoverDetails!,
                          stolenByPlayerId: undefined,
                        },
                      });
                  }}
                />
                <Label htmlFor="isStolen">
                  Foi resultado de um Roubo de Bola?
                </Label>
              </div>
              {currentEventData.turnoverDetails?.stolenByPlayerId !==
                undefined && (
                <>
                  <Label>
                    Roubado por:{" "}
                    {getPlayerName(
                      currentEventData.turnoverDetails?.stolenByPlayerId
                    )}
                  </Label>
                  {renderPlayerSelectorHelpText(
                    "quem roubou",
                    "da equipa defensora"
                  )}
                </>
              )}
            </div>
          );
        }
        break;

      // --- TIMEOUT ---
      case "TIMEOUT_REQUEST":
        if (currentEventStep === "SELECT_TEAM_FOR_TIMEOUT") {
          return (
            <div className="space-y-2">
              <Label>Qual equipa pediu Time-out?</Label>
              <RadioGroup
                onValueChange={(value) =>
                  onUpdateEventData({
                    timeoutDetails: { teamId: value, type: "FULL" },
                  })
                } // Default para FULL
                value={currentEventData.timeoutDetails?.teamId}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={homeTeam.id}
                    id={`to-${homeTeam.id}`}
                  />
                  <Label htmlFor={`to-${homeTeam.id}`}>{homeTeam.name}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={awayTeam.id}
                    id={`to-${awayTeam.id}`}
                  />
                  <Label htmlFor={`to-${awayTeam.id}`}>{awayTeam.name}</Label>
                </div>
              </RadioGroup>
              {/* Poderia adicionar seleção de tipo de timeout se houver vários */}
            </div>
          );
        }
        break;

      // --- ADMIN EVENT ---
      case "ADMIN_EVENT":
        if (currentEventStep === "SELECT_ADMIN_ACTION") {
          return (
            <div className="space-y-2">
              <Label htmlFor="adminAction">Ação Administrativa</Label>
              <Select
                value={currentEventData.adminEventDetails?.action}
                onValueChange={(value) => {
                  onUpdateEventData({ adminEventDetails: { action: value } });
                  if (value === "POSSESSION_ARROW_SET")
                    onAdvanceStep("SET_POSSESSION_ARROW_TEAM");
                  else if (
                    value === "START_QUARTER" &&
                    gameState.currentQuarter > 1 &&
                    gameState.currentQuarter <= gameState.settings.quarters
                  ) {
                    // Não para OT aqui
                    onAdvanceStep("SET_POSSESSION_FOR_QUARTER");
                  }
                }}
              >
                <SelectTrigger id="adminAction">
                  <SelectValue placeholder="Selecione a ação" />
                </SelectTrigger>
                <SelectContent>
                  {ADMIN_EVENT_ACTIONS.map((aa) => (
                    <SelectItem key={aa.value} value={aa.value}>
                      {aa.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              )}
            </div>
          );
        }
        if (currentEventStep === "SET_POSSESSION_ARROW_TEAM") {
          return (
            <div className="space-y-2">
              <Label>Seta de Posse aponta para:</Label>
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
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={homeTeam.id}
                    id={`pa-${homeTeam.id}`}
                  />
                  <Label htmlFor={`pa-${homeTeam.id}`}>{homeTeam.name}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={awayTeam.id}
                    id={`pa-${awayTeam.id}`}
                  />
                  <Label htmlFor={`pa-${awayTeam.id}`}>{awayTeam.name}</Label>
                </div>
              </RadioGroup>
            </div>
          );
        }
        if (currentEventStep === "SET_POSSESSION_FOR_QUARTER") {
          // Posse no início do 2º, 3º, 4º quarto (geralmente pela seta)
          return (
            <div className="space-y-2">
              <Label>
                Posse para iniciar o Q{gameState.currentQuarter} (geralmente
                pela seta):
              </Label>
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
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={homeTeam.id}
                    id={`pq-${homeTeam.id}`}
                  />
                  <Label htmlFor={`pq-${homeTeam.id}`}>{homeTeam.name}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={awayTeam.id}
                    id={`pq-${awayTeam.id}`}
                  />
                  <Label htmlFor={`pq-${awayTeam.id}`}>{awayTeam.name}</Label>
                </div>
              </RadioGroup>
            </div>
          );
        }
        break;

      default:
        return (
          <p>
            Detalhes para "{eventTypeLabel}" (Passo: {currentEventStep || "N/D"}
            ) ainda não implementados ou passo inválido.
          </p>
        );
    }
    return (
      <p className="text-muted-foreground text-sm">
        Aguardando seleção ou próximo passo...
      </p>
    );
  };

  // --- Lógica de Habilitação do Botão Confirmar ---
  const canConfirmEvent = (): boolean => {
    if (!selectedEventType || !currentEventData.type) return false;
    if (currentEventStep === "AWAITING_FREE_THROW") return false; // Confirmação é via botões de Made/Missed

    // Adicionar validações específicas por evento e passo aqui
    // Ex: Para JUMP_BALL, todos os campos de jumpBallDetails devem estar preenchidos
    // Ex: Para ARREMESSOS, primaryPlayerId e shotDetails.type devem estar preenchidos
    // Esta lógica pode ficar bem complexa. Por agora, uma verificação genérica.
    switch (selectedEventType) {
      case "JUMP_BALL":
        return !!(
          currentEventData.jumpBallDetails?.homePlayerId &&
          currentEventData.jumpBallDetails?.awayPlayerId &&
          currentEventData.jumpBallDetails?.wonByTeamId
        );
      case "2POINTS_MADE":
      case "3POINTS_MADE":
      case "2POINTS_MISSED":
      case "3POINTS_MISSED":
        if (
          !currentEventData.primaryPlayerId ||
          !currentEventData.shotDetails?.type
        )
          return false;
        if (
          currentEventData.foulDetails &&
          (!currentEventData.foulDetails.personalFoulType ||
            !currentEventData.foulDetails.committedByPlayerId)
        )
          return false; // Se houve falta, precisa de tipo e quem cometeu
        return true;
      case "SUBSTITUTION":
        return !!(
          currentEventData.substitutionDetails?.playerInId &&
          currentEventData.substitutionDetails?.playerOutId &&
          currentEventData.substitutionDetails.playerInId !==
            currentEventData.substitutionDetails.playerOutId
        );
      // ... mais validações
    }
    return true; // Default para true se não houver validação específica (cuidado!)
  };

  return (
    <Card className="w-full h-full max-h-[calc(100vh-240px)] flex flex-col">
      <CardHeader className="py-2 px-3">
        <CardTitle className="text-sm md:text-md text-center">
          Registar: {eventTypeLabel}
          {currentEventStep && (
            <span className="text-xs text-muted-foreground">
              {" "}
              (Passo: {currentEventStep})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 md:p-3 flex-1 overflow-y-auto space-y-3">
        {renderEventContent()}
      </CardContent>
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
    </Card>
  );
}
