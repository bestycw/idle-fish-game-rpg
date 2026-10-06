import type { BattleSettlement, Equipment, PlayerState, WorldPreset } from '@moyu/game-core';
import { useState } from 'react';
import { Popover } from 'radix-ui';
import { cn } from '@/lib/utils';
import { EquipBagCell } from '@/features/inventory/EquipBagCell';
import { EquipPopoverContent } from '@/features/inventory/EquipPopoverContent';
import { EquipTooltip } from '@/features/inventory/EquipTooltip';
import { SettlementGrantCells } from '@/components/game/SettlementCurrencyLine';
import { wornItemComparedToLoot } from '@/components/game/settlementLootCompare';

const CELL = 'size-12 shrink-0';

function LootUpgradeFlow({ delta }: { delta: number }) {
  const up = delta > 0;
  return (
    <span
      className={cn(
        'flex w-5 shrink-0 flex-col items-center justify-center self-center',
        up ? 'text-emerald-400' : 'text-muted-foreground/55',
      )}
      aria-hidden
    >
      <svg width="10" height="12" viewBox="0 0 10 12" className="drop-shadow-[0_0_6px_rgba(52,211,153,0.35)]">
        <path
          d="M5 1 L9 6 H6 V11 H4 V6 H1 Z"
          fill="currentColor"
          className={up ? '' : 'opacity-70'}
        />
      </svg>
      {up ? (
        <span className="mt-0.5 font-mono text-[8px] tabular-nums leading-none">+{delta}</span>
      ) : null}
    </span>
  );
}

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

  const hasGrants = settlement.gold > 0 || settlement.xiuwei > 0;
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
        const { worn, powerDelta } = wornItemComparedToLoot(player, item);
        return (
          <div
            key={item.id}
            className="reward-tile-in inline-flex h-12 shrink-0 items-center gap-0.5"
          >
            {worn ? (
              <div className={cn(CELL, 'pointer-events-none opacity-75')}>
                <EquipBagCell item={worn} worn />
              </div>
            ) : null}
            {worn ? <LootUpgradeFlow delta={powerDelta} /> : null}
            <Popover.Root
              modal={false}
              open={open}
              onOpenChange={(next) => {
                if (!next) setOpenId((cur) => (cur === item.id ? null : cur));
              }}
            >
              <Popover.Anchor asChild>
                <div
                  className={cn(
                    CELL,
                    powerDelta > 0 && 'rounded-[3px] ring-1 ring-inset ring-emerald-400/55',
                  )}
                >
                  <EquipBagCell
                    item={item}
                    selected={open}
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
                        {powerDelta > 0 ? (
                          <span className="ml-1.5 font-mono text-[11px] tabular-nums text-emerald-400">
                            +{powerDelta}
                          </span>
                        ) : null}
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
