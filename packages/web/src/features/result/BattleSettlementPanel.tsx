import type { BattleSettlement, Equipment, PlayerState, WorldPreset } from '@moyu/game-core';
import { useMemo } from 'react';
import { SettlementLootGrid } from '@/components/game/SettlementLootGrid';
import { settlementShowsCurrencyGrants } from '@/components/game/SettlementCurrencyLine';
import { SettlementPartyExp } from '@/components/game/SettlementPartyExp';
import { SettlementSectionRule } from '@/components/game/SettlementSectionRule';

type BattleSettlementPanelProps = {
  settlement: BattleSettlement;
  player: PlayerState;
  onWearLoot?: (item: Equipment) => void;
  worldPreset?: WorldPreset;
  variant?: 'card' | 'stage';
};

function FirstClearLine({ settlement }: { settlement: BattleSettlement }) {
  const fc = settlement.firstClearChapter;
  if (!fc) return null;
  return (
    <p className="mb-4 text-center text-xs text-amber-200/80">
      章首通 · 第 {fc.order} 章 {fc.name}
    </p>
  );
}

export function BattleSettlementPanel({
  settlement,
  player,
  onWearLoot,
  worldPreset = 'xianxia',
  variant = 'card',
}: BattleSettlementPanelProps) {
  const loot = settlement.equipment;
  const allEquipment = useMemo(
    () => (loot ? [loot, ...settlement.bonusEquipment] : settlement.bonusEquipment),
    [loot, settlement.bonusEquipment],
  );

  const hasFirstClear = Boolean(settlement.firstClearChapter);
  const hasEquipLoot = allEquipment.length > 0;
  const hasCurrency = settlementShowsCurrencyGrants(settlement);
  const hasLoot = hasCurrency || hasEquipLoot;
  const hasPartyExp = (settlement.partyExpRows?.length ?? 0) > 0;

  if (!hasEquipLoot && !hasFirstClear && !hasCurrency && !hasPartyExp) return null;

  const body = (
    <>
      <FirstClearLine settlement={settlement} />
      <div className="mx-auto flex w-full max-w-md flex-col gap-3">
        {hasLoot ? (
          <section className="flex flex-col items-center gap-2" aria-label="战利品">
            <SettlementSectionRule label="战利" />
            <SettlementLootGrid
              settlement={settlement}
              equipment={allEquipment}
              player={player}
              preset={worldPreset}
              onWearLoot={onWearLoot}
            />
          </section>
        ) : null}

        {hasLoot && hasPartyExp ? (
          <SettlementSectionRule label="上阵历练" className="mt-1" />
        ) : hasPartyExp ? (
          <SettlementSectionRule label="上阵历练" />
        ) : null}

        {hasPartyExp ? (
          <section
            className="rounded-lg border border-teal-500/20 bg-teal-950/25 px-3 py-3"
            aria-label="上阵经验"
          >
            <SettlementPartyExp settlement={settlement} className="mt-0" />
          </section>
        ) : null}
      </div>
    </>
  );

  if (variant === 'stage') {
    return <div className="w-full" aria-label="战斗收获">{body}</div>;
  }

  return (
    <section
      className="loot-reveal-panel relative overflow-hidden rounded-2xl border border-primary/20 px-6 py-6"
      aria-label="战斗收获"
    >
      <div className="relative z-[1]">{body}</div>
    </section>
  );
}

export function settlementShowsRewardBlock(settlement: BattleSettlement): boolean {
  return (
    settlementShowsCurrencyGrants(settlement) ||
    settlement.equipment != null ||
    settlement.bonusEquipment.length > 0 ||
    Boolean(settlement.firstClearChapter) ||
    (settlement.partyExpRows?.length ?? 0) > 0
  );
}
