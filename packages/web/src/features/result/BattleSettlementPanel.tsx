import {
  RARITY_LABELS,
  itemPower,
  settlementHasLoot,
  type BattleSettlement,
  type Equipment,
} from '@moyu/game-core';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { rarityFrame, rarityNameTone } from '@/lib/tones';
import { EquipTooltip } from '../inventory/EquipTooltip';

type BattleSettlementPanelProps = {
  settlement: BattleSettlement;
  onWearLoot?: (item: Equipment) => void;
  /** stage：结算页文字行；card：带框卡片（复用场景） */
  variant?: 'card' | 'stage';
};

type RewardKind = 'gold' | 'stardust' | 'xiuwei' | 'ticket' | 'enhanceStones';

const REWARD_LABELS: Record<RewardKind, string> = {
  gold: '灵石',
  stardust: '星尘',
  xiuwei: '修为',
  ticket: '寻访帖',
  enhanceStones: '淬灵石',
};

function collectRewardTiles(settlement: BattleSettlement): { kind: RewardKind; amount: number }[] {
  const rows: { kind: RewardKind; amount: number }[] = [];
  if (settlement.gold > 0) rows.push({ kind: 'gold', amount: settlement.gold });
  if (settlement.stardust > 0) rows.push({ kind: 'stardust', amount: settlement.stardust });
  if (settlement.xiuwei > 0) rows.push({ kind: 'xiuwei', amount: settlement.xiuwei });
  if (settlement.ticket > 0) rows.push({ kind: 'ticket', amount: settlement.ticket });
  if (settlement.enhanceStones > 0) rows.push({ kind: 'enhanceStones', amount: settlement.enhanceStones });
  return rows;
}

function RewardLedger({
  tiles,
  loot,
  onWearLoot,
}: {
  tiles: { kind: RewardKind; amount: number }[];
  loot: Equipment | null;
  onWearLoot?: (item: Equipment) => void;
}) {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div className="mx-auto w-full max-w-[16rem] sm:max-w-xs">
      <ul className="list-none space-y-2.5 text-sm leading-relaxed">
        {tiles.map((t, i) => (
          <li
            key={t.kind}
            className="reward-tile-in flex items-baseline justify-between gap-6"
            style={{ animationDelay: `${60 + i * 40}ms` }}
          >
            <span className="text-foreground/70">{REWARD_LABELS[t.kind]}</span>
            <span className="tabular-nums text-foreground/95">+{t.amount}</span>
          </li>
        ))}
        {loot ? (
          <li
            className="reward-tile-in flex items-baseline justify-between gap-6"
            style={{ animationDelay: `${60 + tiles.length * 40}ms` }}
          >
            <span className={cn('min-w-0 truncate', rarityNameTone(loot.rarity))}>
              {loot.enhanceLevel > 0 ? `+${loot.enhanceLevel} ` : ''}
              {loot.name}
            </span>
            <span className="shrink-0 text-foreground/55">×1</span>
          </li>
        ) : null}
      </ul>

      {loot ? (
        <div
          className="reward-tile-in mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground"
          style={{ animationDelay: `${60 + (tiles.length + 1) * 40}ms` }}
        >
          <button
            type="button"
            className="underline-offset-2 hover:text-foreground/80 hover:underline"
            onClick={() => setShowDetail((v) => !v)}
          >
            {showDetail ? '收起属性' : '属性'}
          </button>
          {onWearLoot ? (
            <button
              type="button"
              className="text-primary/90 underline-offset-2 hover:text-primary hover:underline"
              onClick={() => onWearLoot(loot)}
            >
              穿戴
            </button>
          ) : null}
        </div>
      ) : null}

      {loot && showDetail ? (
        <div className="mt-3 rounded-lg border border-border/35 bg-black/20 p-3 text-left">
          <EquipTooltip item={loot} compact />
        </div>
      ) : null}
    </div>
  );
}

function FirstClearLine({ settlement }: { settlement: BattleSettlement }) {
  const fc = settlement.firstClearChapter;
  if (!fc) return null;
  return (
    <p className="mb-5 text-center text-xs text-amber-200/80">
      章首通 · 第 {fc.order} 章 {fc.name}
    </p>
  );
}

function SettlementEquipCard({
  item,
  onWearLoot,
  revealIndex,
}: {
  item: Equipment;
  onWearLoot?: (item: Equipment) => void;
  revealIndex: number;
}) {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div
      className="reward-tile-in mx-auto mt-5 w-full max-w-sm"
      style={{ animationDelay: `${60 + revealIndex * 40}ms` }}
    >
      <div
        className={cn(
          'rounded-xl border p-4',
          rarityFrame(item.rarity),
          item.rarity === 'legendary' && 'loot-equip-legendary',
          item.rarity === 'epic' && 'loot-equip-epic',
        )}
      >
        <p className={cn('font-display text-lg', rarityNameTone(item.rarity))}>
          {item.enhanceLevel > 0 ? `+${item.enhanceLevel} ` : ''}
          {item.name}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {RARITY_LABELS[item.rarity]} · 装等 {item.itemLevel ?? 1} · 战力 {itemPower(item)}
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            className="flex-1 rounded-lg border border-border/50 py-2 text-xs text-muted-foreground"
            onClick={() => setShowDetail((v) => !v)}
          >
            {showDetail ? '收起' : '属性'}
          </button>
          {onWearLoot ? (
            <button
              type="button"
              className="flex-1 rounded-lg bg-primary py-2 text-xs font-medium text-primary-foreground"
              onClick={() => onWearLoot(item)}
            >
              穿戴
            </button>
          ) : null}
        </div>
        {showDetail ? (
          <div className="mt-3 rounded-lg border border-border/30 bg-black/25 p-3">
            <EquipTooltip item={item} compact />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function BattleSettlementPanel({
  settlement,
  onWearLoot,
  variant = 'card',
}: BattleSettlementPanelProps) {
  const tiles = useMemo(() => collectRewardTiles(settlement), [settlement]);
  const loot = settlement.equipment;
  const hasLoot = settlementHasLoot(settlement);
  const hasFirstClear = Boolean(settlement.firstClearChapter);
  const stage = variant === 'stage';

  if (!hasLoot && !hasFirstClear) return null;

  const body = stage ? (
    <>
      <FirstClearLine settlement={settlement} />
      <RewardLedger tiles={tiles} loot={loot} onWearLoot={onWearLoot} />
    </>
  ) : (
    <>
      <FirstClearLine settlement={settlement} />
      {tiles.length > 0 ? (
        <RewardLedger tiles={tiles} loot={null} />
      ) : null}
      {loot ? (
        <SettlementEquipCard
          item={loot}
          onWearLoot={onWearLoot}
          revealIndex={tiles.length}
        />
      ) : null}
    </>
  );

  if (stage) {
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
  return settlementHasLoot(settlement) || Boolean(settlement.firstClearChapter);
}
