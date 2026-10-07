import { settlementGrantRows, tItem, type BattleSettlement, type WorldPreset } from '@moyu/game-core';
import { cn } from '@/lib/utils';
import { rarityNameTone } from '@/lib/tones';

const CELL = 'size-12 shrink-0';

/** 结算资源格视觉：按物品类型 / 经验丹档位上色 */
function grantCellTone(itemId: string): {
  frame: string;
  mark: string;
  amount: string;
} {
  if (itemId === 'gold') {
    return {
      frame: 'border-amber-400/50 bg-gradient-to-b from-amber-500/18 via-[#14120c] to-[#0c1014]',
      mark: 'text-amber-300',
      amount: 'text-amber-300',
    };
  }
  if (itemId === 'character_exp') {
    return {
      frame: 'border-emerald-400/45 bg-gradient-to-b from-emerald-500/16 via-[#101814] to-[#0c1014]',
      mark: 'text-emerald-300',
      amount: 'text-emerald-300',
    };
  }
  if (itemId === 'xiuwei') {
    return {
      frame: 'border-violet-400/45 bg-gradient-to-b from-violet-500/16 via-[#141018] to-[#0c1014]',
      mark: 'text-violet-300',
      amount: 'text-violet-300',
    };
  }
  if (itemId === 'stardust') {
    return {
      frame: 'border-sky-400/45 bg-gradient-to-b from-sky-500/16 via-[#10161c] to-[#0c1014]',
      mark: 'text-sky-300',
      amount: 'text-sky-300',
    };
  }
  if (itemId === 'ticket') {
    return {
      frame: 'border-teal-400/45 bg-gradient-to-b from-teal-500/14 via-[#101816] to-[#0c1014]',
      mark: 'text-teal-300',
      amount: 'text-teal-300',
    };
  }
  if (itemId === 'enhance_stone') {
    return {
      frame: 'border-orange-400/45 bg-gradient-to-b from-orange-500/14 via-[#18140e] to-[#0c1014]',
      mark: 'text-orange-300',
      amount: 'text-orange-300',
    };
  }
  if (itemId === 'exp_pill_1') {
    return {
      frame: 'border-[#3a4554] bg-gradient-to-b from-[#2a3340]/70 via-[#141a22] to-[#0c1014]',
      mark: rarityNameTone('common'),
      amount: 'text-foreground/80',
    };
  }
  if (itemId === 'exp_pill_2') {
    return {
      frame: 'border-emerald-400/50 bg-gradient-to-b from-emerald-500/18 via-[#101814] to-[#0c1014]',
      mark: rarityNameTone('uncommon'),
      amount: 'text-emerald-300',
    };
  }
  if (itemId === 'exp_pill_3') {
    return {
      frame: 'border-sky-400/50 bg-gradient-to-b from-sky-500/18 via-[#10161c] to-[#0c1014]',
      mark: rarityNameTone('rare'),
      amount: 'text-sky-300',
    };
  }
  if (itemId === 'exp_pill_4') {
    return {
      frame: 'border-amber-400/55 bg-gradient-to-b from-amber-500/20 via-[#1a140c] to-[#0c1014]',
      mark: rarityNameTone('legendary'),
      amount: 'text-amber-300',
    };
  }
  return {
    frame: 'border-border/50 bg-[#0c1018]',
    mark: 'text-foreground/80',
    amount: 'text-primary',
  };
}

export function StaticGrantCell({
  itemId,
  amount,
  preset,
  className,
}: {
  itemId: string;
  amount: number;
  preset: WorldPreset;
  className?: string;
}) {
  const label = tItem(itemId, preset);
  const mark = label.slice(0, 1);
  const tone = grantCellTone(itemId);

  return (
    <div
      className={cn(
        CELL,
        'relative flex flex-col items-center justify-center rounded-[3px] border',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.06),inset_0_-3px_8px_rgba(0,0,0,0.4)]',
        tone.frame,
        className,
      )}
      title={`${label} +${amount}`}
    >
      <span className={cn('font-display text-sm', tone.mark)}>{mark}</span>
      <span className="mt-0.5 max-w-full truncate px-0.5 text-[8px] text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          'absolute bottom-0.5 right-0.5 font-mono text-[10px] tabular-nums',
          tone.amount,
        )}
      >
        +{amount}
      </span>
    </div>
  );
}

type SettlementGrantCellsProps = {
  settlement: BattleSettlement;
  preset: WorldPreset;
  className?: string;
};

/** 结算资源格（灵石 / 修为 / 经验等，与 game-core settlementGrantRows 一致） */
export function SettlementGrantCells({ settlement, preset, className }: SettlementGrantCellsProps) {
  const cells = settlementGrantRows(settlement);
  if (cells.length === 0) return null;

  return (
    <div className="flex items-center justify-center gap-1.5">
      {cells.map((c) => (
        <StaticGrantCell
          key={c.itemId}
          itemId={c.itemId}
          amount={c.amount}
          preset={preset}
          className={className}
        />
      ))}
    </div>
  );
}

export function settlementShowsCurrencyGrants(settlement: BattleSettlement): boolean {
  return settlementGrantRows(settlement).length > 0;
}
