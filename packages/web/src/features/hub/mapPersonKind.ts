import type { TownNpcKind } from '@moyu/game-core';

export function mapPersonKindGlyph(kind: TownNpcKind | 'scene'): string {
  if (kind === 'scene') return '剧';
  const m: Record<TownNpcKind, string> = {
    merchant: '商',
    quest: '赏',
    inn: '驿',
    story: '引',
    flavor: '闻',
  };
  return m[kind];
}

export function mapPersonKindClass(kind: TownNpcKind | 'scene'): string {
  if (kind === 'scene') return 'border-primary/30 bg-primary/10 text-primary';
  const m: Record<TownNpcKind, string> = {
    merchant: 'border-amber-500/35 bg-amber-500/12 text-amber-100',
    quest: 'border-violet-500/35 bg-violet-500/12 text-violet-100',
    inn: 'border-sky-500/35 bg-sky-500/12 text-sky-100',
    story: 'border-primary/35 bg-primary/12 text-primary',
    flavor: 'border-border/50 bg-muted/40 text-muted-foreground',
  };
  return m[kind];
}
