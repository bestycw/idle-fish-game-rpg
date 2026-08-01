import { cn } from '@/lib/utils';

export type ChoiceItem = {
  id: string;
  label: string;
  hint?: string;
  disabled?: boolean;
  danger?: boolean;
  onSelect: () => void;
};

type ChoiceListProps = {
  choices: ChoiceItem[];
  className?: string;
};

/** 文字游戏主交互：底部编号选项 */
export function ChoiceList({ choices, className }: ChoiceListProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)} role="list">
      {choices.map((c, i) => (
        <button
          key={c.id}
          type="button"
          role="listitem"
          disabled={c.disabled}
          onClick={c.onSelect}
          style={{ animationDelay: `${i * 40}ms` }}
          className={cn(
            'choice-enter group flex w-full items-start gap-3 rounded-md border px-3 py-3 text-left transition',
            'border-border/80 bg-card/70 hover:border-primary/60 hover:bg-accent/80',
            'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border/80 disabled:hover:bg-card/70',
            c.danger && 'hover:border-destructive/50',
          )}
        >
          <span
            className={cn(
              'font-mono text-sm tabular-nums text-primary/90 group-hover:text-primary',
              c.danger && 'text-destructive/80',
            )}
          >
            {String(i + 1).padStart(2, '0')}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-body text-[15px] leading-snug text-foreground">{c.label}</span>
            {c.hint ? (
              <span className="mt-0.5 block text-xs text-muted-foreground">{c.hint}</span>
            ) : null}
          </span>
          <span className="font-mono text-xs text-muted-foreground opacity-0 transition group-hover:opacity-70">
            ›
          </span>
        </button>
      ))}
    </div>
  );
}
