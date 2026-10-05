import { cn } from '@/lib/utils';
import { rarityTone } from '@/lib/tones';

/** 装备悬停卡：限制宽度，避免撑破面板/视口 */
export function equipPopoverContentClass(rarity?: string): string {
  return cn(
    'equip-popover-surface z-[80] box-border overflow-hidden rounded-xl border bg-background/98 p-0 shadow-[0_12px_40px_rgba(0,0,0,0.55)] outline-none',
    'w-[min(15.5rem,calc(100vw-1.5rem))] max-w-[calc(100vw-1.5rem)]',
    rarity ? rarityTone(rarity) : 'border-border/55',
  );
}

export const equipPopoverScrollClass =
  'box-border max-h-[min(22rem,65vh)] max-w-full overflow-x-hidden overflow-y-auto overscroll-contain px-2.5 py-2';
