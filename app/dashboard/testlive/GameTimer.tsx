import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GameTimerProps {
  gameTime: string;
  isRunning: boolean;
  currentQuarter: number;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onNextQuarter: () => void;
  onTogglePossession: () => void;
}

export function GameTimer({
  gameTime,
  isRunning,
  currentQuarter,
  onStart,
  onPause,
  onReset,
  onNextQuarter,
  onTogglePossession,
}: GameTimerProps) {
  const isOvertime = currentQuarter > 4;
  const quarterLabel = isOvertime 
    ? `OT${currentQuarter - 4}`
    : `Q${currentQuarter}`;

  return (
    <div className="bg-gray-800 text-white p-3 flex flex-wrap justify-center gap-2 shadow-md">
      <div className="flex items-center gap-2 bg-gray-700 px-3 py-1 rounded-full">
        <span className="font-mono">{quarterLabel}</span>
        <span className="font-mono text-lg">{gameTime}</span>
      </div>

      <Button 
        variant={isRunning ? 'destructive' : 'default'}
        onClick={isRunning ? onPause : onStart}
        size="sm"
        className="gap-2"
      >
        {isRunning ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            Pausar (Espaço)
          </>
        ) : (
          'Iniciar (Espaço)'
        )}
      </Button>

      <Button 
        variant="secondary"
        onClick={onReset}
        size="sm"
      >
        Resetar
      </Button>

      <Button 
        variant="default"
        onClick={onNextQuarter}
        size="sm"
        className={cn(
          isOvertime ? "bg-yellow-600 hover:bg-yellow-700" : ""
        )}
      >
        {isOvertime ? `Próxima OT` : `Próximo Quarto`}
      </Button>

      <Button 
        variant="secondary"
        onClick={onTogglePossession}
        size="sm"
      >
        Trocar Posse (P)
      </Button>
    </div>
  );
}