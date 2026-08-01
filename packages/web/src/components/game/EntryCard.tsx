import { cn } from '@/lib/utils';

type EntryCardProps = {
  title: string;
  subtitle?: string;
  badge?: string;
  disabled?: boolean;
  /** 灰锁占位：仍可点，样式虚线弱化 */
  locked?: boolean;
  /** 简易图示：色块标签，非立绘 */
  mark?: string;
  accent?: 'amber' | 'teal' | 'rose' | 'slate';
  onClick: () => void;
  className?: string;
  wide?: boolean;
  /** 宫格更紧凑（更多入口） */
  compact?: boolean;
};

const accentMap = {
  amber: 'from-primary/25 via-card/80 to-card/40 border-primary/35',
  teal: 'from-teal-500/20 via-card/80 to-card/40 border-teal-500/30',
  rose: 'from-rose-500/15 via-card/80 to-card/40 border-rose-500/25',
  slate: 'from-slate-500/15 via-card/80 to-card/40 border-border/80',
};

/** 主流手游首页入口卡：大按钮分区，文字只做说明 */
export function EntryCard({
  title,
  subtitle,
  badge,
  disabled,
  locked,
  mark = '◆',
  accent = 'amber',
  onClick,
  className,
  wide,
  compact,
}: EntryCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-xl border bg-gradient-to-br text-left transition',
        'hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40',
        accentMap[accent],
        locked && 'border-dashed opacity-55',
        compact ? 'min-h-[4.25rem] p-2.5' : wide ? 'min-h-[5.5rem] p-3 sm:min-h-[6.5rem]' : 'min-h-[5rem] p-3',
        className,
      )}
    >
      <div className="absolute -right-2 -top-2 font-display text-4xl text-foreground/5 sm:text-5xl">
        {mark}
      </div>
      {badge ? (
        <span className="mb-1 inline-block rounded bg-background/50 px-1.5 py-0.5 font-mono text-[10px] text-primary">
          {badge}
        </span>
      ) : null}
      {locked ? (
        <span className="mb-1 inline-block rounded bg-background/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          未开放
        </span>
      ) : null}
      <div
        className={cn(
          'relative font-display tracking-wide text-foreground',
          compact ? 'text-base' : 'text-lg sm:text-xl',
        )}
      >
        {title}
      </div>
      {subtitle ? (
        <p
          className={cn(
            'relative mt-0.5 leading-relaxed text-muted-foreground',
            compact ? 'text-[11px]' : 'text-xs sm:text-sm',
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </button>
  );
}
