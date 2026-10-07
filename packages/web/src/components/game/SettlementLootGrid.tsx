import type { BattleSettlement, Equipment, PlayerState, WorldPreset } from '@moyu/game-core';
import { useState } from 'react';
import { Popover } from 'radix-ui';
import { cn } from '@/lib/utils';
import { EquipBagCell } from '@/features/inventory/EquipBagCell';
import { EquipPopoverContent } from '@/features/inventory/EquipPopoverContent';
import { EquipTooltip } from '@/features/inventory/EquipTooltip';
import { settlementGrantRows } from '@moyu/game-core';
import { SettlementGrantCells } from '@/components/game/SettlementCurrencyLine';
import { wornItemComparedToLoot } from '@/components/game/settlementLootCompare';

const CELL = 'size-12 shrink-0';

type SettlementLootGridProps = {
  settlement: BattleSettlement;
  equipment: Equipment[];
  player: PlayerState;
  preset: WorldPreset;
  onWearLoot?: (item: Equipment) => void;
  className?: string;
};

export function SettlementLootGrid({
  settlement,
  equipment,
  player,
  preset,
  onWearLoot,
  className,
}: SettlementLootGridProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  const hasGrants = settlementGrantRows(settlement).length > 0;
  if (!hasGrants && equipment.length === 0) return null;

  const toggle = (id: string) => {
    setOpenId((cur) => (cur === id ? null : id));
  };

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      {hasGrants ? (
        <SettlementGrantCells
          settlement={settlement}
          preset={preset}
          className="reward-tile-in"
        />
      ) : null}
      {equipment.length > 0 ? (
        <div className="flex flex-wrap items-center justify-center gap-1.5">
      {equipment.map((item) => {
        const open = openId === item.id;
        const { powerDelta } = wornItemComparedToLoot(player, item);
        return (
          <div key={item.id} className="reward-tile-in inline-flex h-12 shrink-0 items-center">
            <Popover.Root
              modal={false}
              open={open}
              onOpenChange={(next) => {
                if (!next) setOpenId((cur) => (cur === item.id ? null : cur));
              }}
            >
              <Popover.Anchor asChild>
                <div className={CELL}>
                  <EquipBagCell
                    item={item}
                    selected={open}
                    showUpgradeArrow={powerDelta > 0}
                    onSelect={() => toggle(item.id)}
                  />
                </div>
              </Popover.Anchor>
              <EquipPopoverContent
                rarity={item.rarity}
                side="bottom"
                align="center"
                footer={
                  onWearLoot ? (
                    <div className="border-t border-white/5 px-2.5 py-2">
                      <button
                        type="button"
                        onClick={() => onWearLoot(item)}
                        className="w-full rounded-md border border-primary/35 bg-primary/15 py-1.5 text-center text-xs text-primary transition hover:bg-primary/25"
                      >
                        穿戴此件
                      </button>
                    </div>
                  ) : undefined
                }
              >
                <EquipTooltip item={item} />
              </EquipPopoverContent>
            </Popover.Root>
          </div>
        );
      })}
        </div>
      ) : null}
    </div>
  );
}
