import { EventType, EventTypeOption } from "@/app/types/match-live";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MAIN_EVENT_TYPE_OPTIONS } from "@/app/data/basketball-definitions";

const eventCategoriesOrder: EventTypeOption["category"][] = [
  "Início",
  "Pontuação",
  "Jogo",
  "Faltas",
  "Gestão",
];

interface EventTypeCenterPanelProps {
  onSelectEvent: (eventType: EventType) => void;
  isGameStarted: boolean;
  hasPendingFreeThrows: boolean;
}

export function EventTypeCenterPanel({
  onSelectEvent,
  isGameStarted,
  hasPendingFreeThrows,
}: EventTypeCenterPanelProps) {
  const availableEvents = MAIN_EVENT_TYPE_OPTIONS.filter((event) => {
    if (hasPendingFreeThrows) {
      // Se há Lances Livres, só substituição ou timeout (dependendo das regras)
      return event.type === "SUBSTITUTION" || event.type === "TIMEOUT_REQUEST";
    }
    if (!isGameStarted) {
      return event.type === "JUMP_BALL" || event.type === "ADMIN_EVENT"; // Antes do jogo, só Salto ou Admin
    }
    return event.type !== "JUMP_BALL"; // Após início, todos menos Salto
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
            (event) => event.category === category
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
                    key={event.type}
                    variant="outline"
                    onClick={() => onSelectEvent(event.type as EventType)}
                    className={cn(
                      "h-16 md:h-20 flex flex-col items-center justify-center w-full p-1 text-center",
                      "hover:bg-accent hover:text-accent-foreground",
                      "transition-all duration-150"
                    )}
                    title={event.label}
                  >
                    <span className="text-xl md:text-2xl mb-0.5">
                      {event.icon}
                    </span>
                    <span className="text-[10px] md:text-xs font-medium leading-tight">
                      {event.label}
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
