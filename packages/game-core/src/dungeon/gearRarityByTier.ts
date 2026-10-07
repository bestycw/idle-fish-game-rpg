import type { Rarity, WorldPreset } from '../shared/types.js';
import { tRarityEquip } from '../equipment/equipLocale.js';
import type { GearDungeonDef, GearDungeonTier } from './gearDungeons.js';

const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

export type GearLootRarityMixEntry = {
  rarity: Rarity;
  /** 世界皮品级名 */
  label: string;
  pct: number;
};

/**
 * 猎装品级池（按难度递进）。
 * 普通封顶绿 → 困难封顶蓝 → 地狱封顶紫 → 秘境才开金。
 */
export const GEAR_TIER_RARITY_WEIGHTS: Record<GearDungeonTier, Partial<Record<Rarity, number>>> = {
  /** 普通：凡+精，不出蓝 */
  normal: { common: 62, uncommon: 38 },
  /** 困难：精+良，不出紫/金 */
  hard: { uncommon: 42, rare: 58 },
  /** 地狱：良+珍，不出金 */
  hell: { rare: 45, epic: 55 },
  /** 秘境：珍为主，绝品（金）从此档起 */
  rift: { rare: 18, epic: 50, legendary: 32 },
};

export function maxRarityInWeights(weights: Partial<Record<Rarity, number>>): Rarity {
  for (let i = RARITY_ORDER.length - 1; i >= 0; i--) {
    const r = RARITY_ORDER[i]!;
    if ((weights[r] ?? 0) > 0) return r;
  }
  return 'common';
}

export function maxRarityForGearTier(tier: GearDungeonTier): Rarity {
  return maxRarityInWeights(GEAR_TIER_RARITY_WEIGHTS[tier]);
}

/** 实例可微调比例，但不得突破档位封顶（不用全局 DROPTABLE） */
export function resolveGearRarityWeights(
  def: Pick<GearDungeonDef, 'tier' | 'rarityWeights'>,
): Partial<Record<Rarity, number>> {
  const raw =
    def.rarityWeights && Object.keys(def.rarityWeights).length > 0
      ? { ...def.rarityWeights }
      : { ...GEAR_TIER_RARITY_WEIGHTS[def.tier] };
  const maxIdx = RARITY_ORDER.indexOf(maxRarityForGearTier(def.tier));
  const clipped: Partial<Record<Rarity, number>> = {};
  for (const r of RARITY_ORDER) {
    if (RARITY_ORDER.indexOf(r) > maxIdx) continue;
    const w = raw[r] ?? 0;
    if (w > 0) clipped[r] = w;
  }
  return Object.keys(clipped).length > 0 ? clipped : { ...GEAR_TIER_RARITY_WEIGHTS[def.tier] };
}

/** 猎装 UI：品级名 + 占比（与 roll 权重一致） */
export function gearLootRarityMix(
  def: GearDungeonDef,
  preset: WorldPreset,
): GearLootRarityMixEntry[] {
  const weights = resolveGearRarityWeights(def);
  const rows = RARITY_ORDER.map((r) => ({ r, w: weights[r] ?? 0 })).filter((x) => x.w > 0);
  const total = rows.reduce((s, x) => s + x.w, 0);
  if (total <= 0) return [];
  const raw = rows.map(({ r, w }) => ({
    rarity: r,
    label: tRarityEquip(r, preset),
    pct: Math.round((w / total) * 100),
  }));
  const drift = 100 - raw.reduce((s, x) => s + x.pct, 0);
  if (drift !== 0 && raw.length > 0) {
    raw[raw.length - 1]!.pct += drift;
  }
  return raw;
}
