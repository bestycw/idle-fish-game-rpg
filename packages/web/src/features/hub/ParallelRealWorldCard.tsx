import { hubParallelTeaser, type PlayerState } from '@moyu/game-core';
import { cn } from '@/lib/utils';

type ParallelRealWorldCardProps = {
  player: PlayerState;
  onOpen: () => void;
};

export function ParallelRealWorldCard({ player, onOpen }: ParallelRealWorldCardProps) {
  const teaser = hubParallelTeaser(player);
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'w-full rounded-xl border p-3 text-left transition-colors',
        teaser.hasUnread
          ? 'border-amber-500/35 bg-amber-500/8 hover:bg-amber-500/12'
          : 'border-border/50 bg-card/40 hover:bg-card/55',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-[10px] tracking-[0.2em] text-cyan-400/85">平行线</p>
          <p className="font-display text-base tracking-wide">{teaser.title}</p>
          <p className="mt-1 line-clamp-3 text-xs leading-snug text-foreground/80">{teaser.subtitle}</p>
        </div>
        {teaser.hasUnread ? (
          <span className="shrink-0 rounded-full bg-amber-500 px-2 py-0.5 font-mono text-[9px] text-amber-950">
            新
          </span>
        ) : (
          <span className="shrink-0 font-mono text-[10px] text-muted-foreground">查看</span>
        )}
      </div>
    </button>
  );
}
