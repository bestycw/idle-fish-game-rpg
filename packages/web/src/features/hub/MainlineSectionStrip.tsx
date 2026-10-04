import { nodePlace, type ChapterRouteStop } from '@moyu/game-core';
import { cn } from '@/lib/utils';

type MainlineSectionStripProps = {
  stops: ChapterRouteStop[];
  onSelect: (stop: ChapterRouteStop) => void;
  labelForStop?: (stop: ChapterRouteStop) => { place: string; title: string };
};

/** 本章小节 · 横向卡片（节数随章变化，≥5） */
export function MainlineSectionStrip({
  stops,
  onSelect,
  labelForStop,
}: MainlineSectionStripProps) {
  return (
    <div
      className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="本章小节"
    >
      {stops.map((stop, i) => {
        const current = stop.status === 'current';
        const cleared = stop.status === 'cleared';
        const labels = labelForStop?.(stop);
        const place = labels?.place ?? nodePlace(stop.node);
        const nodeTitle = labels?.title ?? stop.node.title;
        return (
          <button
            key={stop.node.id}
            type="button"
            title={`${place} · ${nodeTitle}`}
            onClick={() => onSelect(stop)}
            aria-current={current ? 'step' : undefined}
            className={cn(
              'flex min-w-[6.75rem] max-w-[8.5rem] shrink-0 flex-col items-start gap-0.5 rounded-lg border px-2 py-1.5 text-left transition',
              current && 'border-primary/55 bg-primary/12 shadow-[0_0_12px_rgba(226,160,74,0.12)]',
              cleared && 'border-border/40 bg-background/25 text-muted-foreground',
              stop.status === 'ahead' &&
                'border-dashed border-border/55 bg-transparent text-muted-foreground/75',
            )}
          >
            <span className="flex w-full items-center justify-between gap-1">
              <span
                className={cn(
                  'inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full font-mono text-[9px]',
                  current && 'bg-primary text-primary-foreground',
                  cleared && 'bg-primary/30 text-primary-foreground/90',
                  stop.status === 'ahead' && 'bg-muted text-muted-foreground',
                )}
              >
                {cleared ? '✓' : stop.node.kind === 'battle' ? '战' : i + 1}
              </span>
              {current ? (
                <span className="font-mono text-[8px] text-primary">此地</span>
              ) : (
                <span className="font-mono text-[8px] text-muted-foreground/60">{i + 1}</span>
              )}
            </span>
            <span className="w-full truncate font-mono text-[10px] leading-tight">{place}</span>
            <span className="w-full truncate font-mono text-[9px] leading-tight text-muted-foreground">
              {nodeTitle}
            </span>
          </button>
        );
      })}
    </div>
  );
}
