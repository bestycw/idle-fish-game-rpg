import { tItem, type BattleSettlement, type WorldPreset } from '@moyu/game-core';
import { cn } from '@/lib/utils';

const CELL = 'size-12 shrink-0';

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

  return (
    <div
      className={cn(
        CELL,
        'relative flex flex-col items-center justify-center rounded-[3px] border border-border/50 bg-[#0c1018]',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.06),inset_0_-3px_8px_rgba(0,0,0,0.4)]',
        className,
      )}
      title={`${label} +${amount}`}
    >
      <span className="font-display text-sm text-foreground/80">{mark}</span>
      <span className="mt-0.5 max-w-full truncate px-0.5 text-[8px] text-muted-foreground">
        {label}
      </span>
      <span className="absolute bottom-0.5 right-0.5 font-mono text-[10px] tabular-nums text-primary">
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

/** 灵石、修为：行囊同款方格，不可点 */
export function SettlementGrantCells({ settlement, preset, className }: SettlementGrantCellsProps) {
  const cells: { itemId: string; amount: number }[] = [];
  if (settlement.gold > 0) cells.push({ itemId: 'gold', amount: settlement.gold });
  if (settlement.xiuwei > 0) cells.push({ itemId: 'xiuwei', amount: settlement.xiuwei });

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
  return settlement.gold > 0 || settlement.xiuwei > 0;
}
