import { cn } from '@/lib/utils';

type BattleEncounterBarProps = {
  turn: number;
  maxTurns: number;
  statusLine: string;
  encounterName: string;
  encounterTier?: 'normal' | 'elite' | 'boss';
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
  encounterTier = 'normal',
  modifierLabels,
  resonanceLabels,
}: BattleEncounterBarProps) {
  const nearCap = turn >= maxTurns - 2;

  return (
    <header
      className={cn(
        'shrink-0 rounded-lg border px-2 py-1.5 sm:px-2.5',
        encounterTier === 'boss'
          ? 'border-amber-400/45 bg-gradient-to-r from-amber-950/35 via-card/50 to-card/45 shadow-[0_0_20px_rgba(251,191,36,0.08)]'
          : encounterTier === 'elite'
            ? 'border-rose-400/40 bg-gradient-to-r from-rose-950/25 via-card/50 to-card/45'
            : 'border-border/70 bg-card/45',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display flex min-w-0 items-center gap-1.5 truncate text-base leading-tight">
          {encounterTier === 'boss' ? (
            <span className="shrink-0 rounded border border-amber-400/50 bg-amber-950/50 px-1 py-0.5 font-mono text-[9px] font-semibold tracking-wide text-amber-200">
              首领
            </span>
          ) : encounterTier === 'elite' ? (
            <span className="shrink-0 rounded border border-rose-400/45 bg-rose-950/50 px-1 py-0.5 font-mono text-[9px] font-semibold tracking-wide text-rose-200">
              精锐
            </span>
          ) : null}
          <span className="truncate">{encounterName}</span>
        </h2>
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
