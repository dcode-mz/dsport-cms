import { EventType, ApiEventType } from "@/app/types/match-live";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
// Remova a importação de MAIN_EVENT_TYPE_OPTIONS

interface EventTypeCenterPanelProps {
  eventTypes: ApiEventType[]; // Recebe os tipos da API
  onSelectEvent: (eventType: EventType, typeId: string) => void;
  isGameStarted: boolean;
  hasPendingFreeThrows: boolean;
}

// Mapeamento simples de nome de evento da API para ícone/categoria.
// Você pode expandir isso conforme necessário.
const eventVisualMapping: {
  [key: string]: { icon: string; category: string };
} = {
  JUMP_BALL: { icon: "🏀", category: "Início" },
  "2POINTS_MADE": { icon: "✅", category: "Pontuação" },
  "2POINTS_MISSED": { icon: "❌", category: "Pontuação" },
  "3POINTS_MADE": { icon: "🎯", category: "Pontuação" },
  "3POINTS_MISSED": { icon: "⭕", category: "Pontuação" },
  FOUL_PERSONAL: { icon: "⚠️", category: "Faltas" },
  FOUL_TECHNICAL: { icon: "🧑‍⚖️", category: "Faltas" },
  REBOUND_OFFENSIVE: { icon: "💪", category: "Jogo" },
  REBOUND_DEFENSIVE: { icon: "🛡️", category: "Jogo" },
  TURNOVER: { icon: "🔄", category: "Jogo" },
  STEAL: { icon: "🖐️", category: "Jogo" },
  BLOCK: { icon: "🧱", category: "Jogo" },
  SUBSTITUTION: { icon: "🔁", category: "Gestão" },
  TIMEOUT_REQUEST: { icon: "⏱️", category: "Gestão" },
  ADMIN_EVENT: { icon: "⚙️", category: "Gestão" },
  // Adicione outros mapeamentos conforme os nomes da sua API
};

const eventCategoriesOrder: string[] = [
  "Início",
  "Pontuação",
  "Jogo",
  "Faltas",
  "Gestão",
];

export function EventTypeCenterPanel({
  eventTypes,
  onSelectEvent,
  isGameStarted,
  hasPendingFreeThrows,
}: EventTypeCenterPanelProps) {
  const availableEvents = eventTypes.filter((event) => {
    if (hasPendingFreeThrows) {
      return event.name === "SUBSTITUTION" || event.name === "TIMEOUT_REQUEST";
    }
    if (!isGameStarted) {
      return event.name === "JUMP_BALL" || event.name === "ADMIN_EVENT";
    }
    return event.name !== "JUMP_BALL";
  });

  return (
    <Card className="w-full h-full max-h-[calc(100vh-240px)] flex flex-col">
      <CardHeader className="py-2 px-3">
        <CardTitle className="text-sm md:text-md text-center">
          {hasPendingFreeThrows
            ? "Opções Durante Lances Livres"
            : "Selecionar Evento Principal"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-1.5 md:p-2 flex-1 overflow-y-auto">
        {eventCategoriesOrder.map((category) => {
          const eventsInCategory = availableEvents.filter(
            (event) =>
              (eventVisualMapping[event.name]?.category || "Jogo") === category
          );
          if (eventsInCategory.length === 0) return null;

          return (
            <div key={category} className="mb-3">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground px-1 mb-1">
                {category}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-1.5 md:gap-2">
                {eventsInCategory.map((event) => (
                  <Button
                    key={event.id}
                    variant="outline"
                    onClick={() =>
                      onSelectEvent(event.name as EventType, event.id)
                    }
                    className={cn(
                      "h-16 md:h-20 flex flex-col items-center justify-center w-full p-1 text-center",
                      "hover:bg-accent hover:text-accent-foreground",
                      "transition-all duration-150"
                    )}
                    title={event.description}
                  >
                    <span className="text-xl md:text-2xl mb-0.5">
                      {eventVisualMapping[event.name]?.icon || "❓"}
                    </span>
                    <span className="text-[10px] md:text-xs font-medium leading-tight">
                      {event.description}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          );
        })}
        {availableEvents.length === 0 && hasPendingFreeThrows && (
          <p className="text-center text-muted-foreground text-sm p-4">
            Aguardando resultado do Lance Livre.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
