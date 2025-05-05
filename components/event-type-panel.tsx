import { EventType } from "@/app/types/match-live";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const eventTypes = [
  { type: "2POINTS_MADE", label: "2pts (Cesta)", shortcut: "1" },
  { type: "2POINTS_MISSED", label: "2pts (Erro)", shortcut: "2" },
  { type: "3POINTS_MADE", label: "3pts (Cesta)", shortcut: "3" },
  { type: "3POINTS_MISSED", label: "3pts (Erro)", shortcut: "4" },
  { type: "FREE_THROW_MADE", label: "LL (Cesta)", shortcut: "5" },
  { type: "FREE_THROW_MISSED", label: "LL (Erro)", shortcut: "6" },
  { type: "FOUL_PERSONAL", label: "Falta Pessoal", shortcut: "F" },
  { type: "FOUL_TECHNICAL", label: "Falta Técnica", shortcut: "T" },
  { type: "TURNOVER", label: "Turnover", shortcut: "TO" },
  { type: "STEAL", label: "Roubo", shortcut: "S" },
  { type: "BLOCK", label: "Bloqueio", shortcut: "B" },
  { type: "SUBSTITUTION", label: "Substituição", shortcut: "SUB" },
  { type: "TIMEOUT", label: "Time-out", shortcut: "TOUT" },
];

interface EventTypePanelProps {
  selectedEvent: EventType | null;
  onSelectEvent: (eventType: EventType) => void;
}

export function EventTypePanel({
  selectedEvent,
  onSelectEvent,
}: EventTypePanelProps) {
  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-gray-200 dark:border-gray-700">
      <h3 className="font-bold text-lg mb-4 text-center">Tipos de Evento</h3>
      <div className="grid grid-cols-2 gap-3">
        {eventTypes.map((event) => (
          <Button
            key={event.type}
            onClick={() => onSelectEvent(event.type as EventType)}
            className={cn(
              "h-20 flex flex-col items-center justify-center w-full",
              "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600",
              "border border-gray-200 dark:border-gray-600",
              "transition-all duration-200",
              selectedEvent === event.type
                ? "ring-2 ring-primary border-primary"
                : ""
            )}
          >
            <span className="text-base font-medium text-gray-900 dark:text-gray-100">
              {event.label}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {event.shortcut}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
