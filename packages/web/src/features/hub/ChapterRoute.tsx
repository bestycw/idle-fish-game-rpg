import { nodePlace, type ChapterRouteStop, type ChapterTick } from '@moyu/game-core';
import { cn } from '@/lib/utils';

const CHAPTER_NUM = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'] as const;

type ChapterRouteProps = {
  ticks: ChapterTick[];
  stops: ChapterRouteStop[];
  finished: boolean;
  onSelect: (stop: ChapterRouteStop) => void;
};

export function ChapterRoute({ ticks, stops, finished, onSelect }: ChapterRouteProps) {
  return (
    <div className="flex flex-col gap-2 sm:w-[9.5rem] sm:shrink-0 sm:border-r sm:border-primary/20 sm:pr-3">
      <ol className="flex gap-1 sm:flex-wrap" aria-label="章节路程">
        {ticks.map((tick) => (
          <li key={tick.order}>
            <span
              title={tick.name}
              className={cn(
                'inline-flex h-6 min-w-6 items-center justify-center rounded-md font-mono text-[10px] tracking-widest',
                tick.status === 'current' && 'bg-primary/25 text-primary ring-1 ring-primary/50',
                tick.status === 'cleared' && 'bg-primary/10 text-primary/80',
                tick.status === 'ahead' && 'bg-background/40 text-muted-foreground/70',
              )}
            >
              {CHAPTER_NUM[tick.order - 1] ?? tick.order}
            </span>
          </li>
        ))}
      </ol>
      <ol className="flex gap-2 overflow-x-auto pb-1 sm:flex-col sm:overflow-visible sm:pb-0">
        {stops.map((stop, i) => {
          const current = stop.status === 'current';
          const cleared = stop.status === 'cleared';
          const place = nodePlace(stop.node);
          return (
            <li key={stop.node.id} className="relative min-w-[7.5rem] sm:min-w-0">
              {i < stops.length - 1 ? (
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-[0.7rem] top-7 hidden h-[calc(100%-0.4rem)] w-px bg-gradient-to-b from-primary/45 to-primary/10 sm:block"
                />
              ) : null}
              <button
                type="button"
                onClick={() => onSelect(stop)}
                aria-current={current ? 'step' : undefined}
                className={cn(
                  'relative flex w-full items-start gap-2 rounded-lg border px-2 py-1.5 text-left transition',
                  current &&
                    'border-primary/60 bg-primary/15 shadow-[0_0_16px_rgba(226,160,74,0.18)]',
                  cleared && 'border-primary/20 bg-background/30 text-muted-foreground',
                  stop.status === 'ahead' && 'border-dashed border-border/70 bg-background/20 text-muted-foreground/80',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full font-mono text-[9px]',
                    current && 'bg-primary text-primary-foreground',
                    cleared && 'bg-primary/35 text-primary-foreground',
                    stop.status === 'ahead' && 'bg-muted text-muted-foreground',
                  )}
                >
                  {cleared ? '过' : stop.node.kind === 'battle' ? '战' : '途'}
                </span>
                <span className="min-w-0">
                  <span
                    className={cn(
                      'block truncate font-display text-sm tracking-wide',
                      current && 'text-foreground',
                    )}
                  >
                    {place}
                  </span>
                  <span className="block truncate font-mono text-[10px] text-muted-foreground">
                    {stop.node.title}
                    {finished && cleared ? '' : current ? ' · 此地' : ''}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
