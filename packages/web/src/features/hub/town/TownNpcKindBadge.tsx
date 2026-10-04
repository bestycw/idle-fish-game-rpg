import type { TownNpcKind } from '@moyu/game-core';
import { cn } from '@/lib/utils';

const KIND: Record<TownNpcKind, { label: string; className: string }> = {
  merchant: { label: '商', className: 'bg-amber-500/20 text-amber-200 border-amber-500/35' },
  quest: { label: '赏', className: 'bg-violet-500/20 text-violet-200 border-violet-500/35' },
  inn: { label: '驿', className: 'bg-sky-500/20 text-sky-200 border-sky-500/35' },
  story: { label: '引', className: 'bg-primary/20 text-primary border-primary/35' },
  flavor: { label: '闻', className: 'bg-muted text-muted-foreground border-border/50' },
};

export function TownNpcKindBadge({ kind }: { kind: TownNpcKind }) {
  const k = KIND[kind];
  return (
    <span
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded border px-1 font-mono text-[10px]',
        k.className,
      )}
    >
      {k.label}
    </span>
  );
}
