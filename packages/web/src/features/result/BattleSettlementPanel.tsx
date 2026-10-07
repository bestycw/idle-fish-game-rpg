import type { BattleSettlement, Equipment, PlayerState, WorldPreset } from '@moyu/game-core';
import { useMemo } from 'react';
import { SettlementLootGrid } from '@/components/game/SettlementLootGrid';
import { settlementShowsCurrencyGrants } from '@/components/game/SettlementCurrencyLine';
import { SettlementPartyExp } from '@/components/game/SettlementPartyExp';

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
    <p className="mb-5 text-center text-xs text-amber-200/80">
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
  const hasPartyExp = (settlement.partyExpRows?.length ?? 0) > 0;

  if (!hasEquipLoot && !hasFirstClear && !hasCurrency && !hasPartyExp) return null;

  const body = (
    <>
      <FirstClearLine settlement={settlement} />
      <div className="mx-auto w-full max-w-md">
        {hasCurrency || hasEquipLoot ? (
          <SettlementLootGrid
            settlement={settlement}
            equipment={allEquipment}
            player={player}
            preset={worldPreset}
            onWearLoot={onWearLoot}
          />
        ) : null}
        {hasPartyExp ? <SettlementPartyExp settlement={settlement} /> : null}
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
