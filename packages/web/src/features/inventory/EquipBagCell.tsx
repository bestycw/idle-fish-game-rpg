import { SLOT_SHORT_NAMES, bagCellSignature, itemPower, type Equipment } from '@moyu/game-core';
import { cn } from '@/lib/utils';
import { rarityNameTone } from '@/lib/tones';

function rarityEdge(rarity: Equipment['rarity']): string {
  if (rarity === 'legendary') return 'border-amber-400/80';
  if (rarity === 'epic') return 'border-fuchsia-400/75';
  if (rarity === 'rare') return 'border-sky-400/70';
  if (rarity === 'uncommon') return 'border-emerald-400/65';
  return 'border-[#3a4554]';
}

function rarityFill(rarity: Equipment['rarity']): string {
  if (rarity === 'legendary') return 'from-amber-500/30 via-[#1a140c] to-[#0e0c0a]';
  if (rarity === 'epic') return 'from-fuchsia-500/22 via-[#161018] to-[#0e0c10]';
  if (rarity === 'rare') return 'from-sky-500/20 via-[#10161c] to-[#0c1014]';
  if (rarity === 'uncommon') return 'from-emerald-500/18 via-[#101814] to-[#0c100e]';
  return 'from-[#2a3340] via-[#141a22] to-[#0c1014]';
}

type EquipBagCellProps = {
  item?: Equipment;
  selected?: boolean;
  unseen?: boolean;
  worn?: boolean;
  blocked?: boolean;
  onSelect?: () => void;
};

export function EquipBagCell({
  item,
  selected,
  unseen,
  worn,
  blocked,
  onSelect,
}: EquipBagCellProps) {
  if (!item) {
    return (
      <div
        className="aspect-square w-full rounded-[3px] border border-[#1c2430] bg-[#080b10] shadow-[inset_0_2px_6px_rgba(0,0,0,0.65)]"
        aria-hidden
      />
    );
  }

  const signature = bagCellSignature(item);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={unseen ? `新 ${item.name}` : item.name}
      className={cn(
        'relative aspect-square w-full overflow-hidden rounded-[3px] border bg-gradient-to-b text-left',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-3px_8px_rgba(0,0,0,0.45)]',
        rarityEdge(item.rarity),
        rarityFill(item.rarity),
        selected ? 'gear-cell-picked border-primary' : 'hover:brightness-125',
        unseen && !selected ? 'ring-1 ring-rose-400/80' : null,
        blocked && 'opacity-55',
      )}
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/15" />
      {item.enhanceLevel > 0 ? (
        <span className="absolute left-0.5 top-0 font-mono text-[9px] tabular-nums text-emerald-300">
          +{item.enhanceLevel}
        </span>
      ) : null}
      {unseen ? (
        <span className="pointer-events-none absolute right-0 top-0 z-10 rounded-bl bg-rose-500 px-1 py-0.5 font-mono text-[10px] font-bold leading-none tracking-wide text-white shadow-[0_1px_4px_rgba(0,0,0,0.55)]">
          新
        </span>
      ) : worn ? (
        <span className="pointer-events-none absolute right-0 top-0 z-10 rounded-bl bg-primary px-1 py-0.5 font-mono text-[9px] font-bold leading-none text-primary-foreground">
          穿
        </span>
      ) : selected ? (
        <span className="pointer-events-none absolute right-0 top-0 z-10 rounded-bl bg-primary/90 px-1 py-0.5 font-mono text-[9px] font-bold leading-none text-primary-foreground">
          选
        </span>
      ) : null}
      <span
        className={cn(
          'absolute inset-x-0 flex flex-col items-center justify-center leading-none',
          signature ? 'top-[42%] -translate-y-1/2' : 'inset-y-0',
        )}
      >
        <span
          className={cn(
            'font-display',
            signature ? 'text-[13px]' : 'text-[15px]',
            rarityNameTone(item.rarity),
          )}
        >
          {SLOT_SHORT_NAMES[item.slot]}
        </span>
        {signature ? (
          <span
            className={cn(
              'mt-0.5 max-w-full truncate px-0.5 text-[8px] leading-tight tracking-wide',
              rarityNameTone(item.rarity),
              'opacity-80',
            )}
          >
            {signature}
          </span>
        ) : null}
      </span>
      <span className="absolute bottom-0.5 left-0.5 font-mono text-[10px] tabular-nums text-primary">
        {itemPower(item)}
      </span>
      <span className="absolute bottom-1 right-1 flex gap-0.5">
        {(item.conditions?.length ?? 0) > 0 ? (
          <i className="size-1.5 rotate-45 bg-violet-400/90" />
        ) : null}
        {item.effectAffixId ? <i className="size-1.5 rounded-full bg-teal-400/90" /> : null}
        {item.socketCount > 0 ? (
          <i
            className={cn(
              'size-1.5 rounded-full',
              item.gemId ? 'bg-sky-400' : 'border border-sky-400/70',
            )}
          />
        ) : null}
      </span>
    </button>
  );
}
