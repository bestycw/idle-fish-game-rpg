import { cn } from '@/lib/utils';

type BattleEncounterBarProps = {
  turn: number;
  maxTurns: number;
  statusLine: string;
  encounterName: string;
  modifierLabels: string[];
  resonanceLabels: string[];
};

function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full truncate rounded border px-1.5 py-0.5 font-mono text-[10px] leading-none',
        className,
      )}
    >
      {children}
    </span>
  );
}

/** 战斗中顶栏：关名 + 回合 + 词缀/共鸣 chip（无战前长文） */
export function BattleEncounterBar({
  turn,
  maxTurns,
  statusLine,
  encounterName,
  modifierLabels,
  resonanceLabels,
}: BattleEncounterBarProps) {
  const nearCap = turn >= maxTurns - 2;

  return (
    <header className="shrink-0 rounded-lg border border-border/70 bg-card/45 px-2 py-1.5 sm:px-2.5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display min-w-0 truncate text-base leading-tight">{encounterName}</h2>
        <span
          className={cn(
            'shrink-0 font-mono text-[10px] tabular-nums',
            nearCap ? 'text-amber-300/95' : 'text-muted-foreground',
          )}
        >
          {turn}/{maxTurns} · {statusLine}
        </span>
      </div>
      {modifierLabels.length > 0 || resonanceLabels.length > 0 ? (
        <div className="mt-1 flex flex-wrap items-center gap-1">
          {modifierLabels.map((l) => (
            <Chip key={l} className="border-amber-500/35 bg-amber-500/10 text-amber-100/90">
              {l}
            </Chip>
          ))}
          {resonanceLabels.map((l) => (
            <Chip key={l} className="border-teal-500/35 bg-teal-500/10 text-teal-100/90">
              {l}
            </Chip>
          ))}
        </div>
      ) : null}
    </header>
  );
}
