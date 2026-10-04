import { cn } from '@/lib/utils';

export type BattleSpeed = 1 | 2 | 3;

type BattleSpeedControlsProps = {
  speed: BattleSpeed;
  onSpeed: (speed: BattleSpeed) => void;
  onSkip: () => void;
  /** DEV · 秒杀本场 */
  onDevInstantWin?: () => void;
  disabled?: boolean;
};

const SPEEDS: BattleSpeed[] = [1, 2, 3];

export function BattleSpeedControls({
  speed,
  onSpeed,
  onSkip,
  onDevInstantWin,
  disabled,
}: BattleSpeedControlsProps) {
  return (
    <div
      className="flex shrink-0 items-center justify-between gap-2 rounded-lg border border-border/60 bg-card/40 px-2 py-1.5"
      aria-label="战斗倍速"
    >
      <div className="flex items-center gap-1">
        {SPEEDS.map((s) => {
          const on = speed === s;
          return (
            <button
              key={s}
              type="button"
              disabled={disabled}
              onClick={() => onSpeed(s)}
              className={cn(
                'min-w-[2.25rem] rounded-md px-2 py-1 font-mono text-[11px] tabular-nums transition',
                on
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                disabled && 'pointer-events-none opacity-45',
              )}
            >
              {s}×
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-1.5">
        {onDevInstantWin ? (
          <button
            type="button"
            disabled={disabled}
            onClick={onDevInstantWin}
            className={cn(
              'rounded-md border border-amber-500/40 px-2 py-1 font-mono text-[11px] text-amber-400 transition',
              'hover:bg-amber-500/15',
              disabled && 'pointer-events-none opacity-45',
            )}
          >
            秒杀
          </button>
        ) : null}
        <button
          type="button"
          disabled={disabled}
          onClick={onSkip}
          className={cn(
            'rounded-md border border-border/70 px-2.5 py-1 font-mono text-[11px] text-foreground/90 transition',
            'hover:border-primary/45 hover:bg-primary/10 hover:text-primary',
            disabled && 'pointer-events-none opacity-45',
          )}
        >
          跳过
        </button>
      </div>
    </div>
  );
}
