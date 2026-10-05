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
 * 猎装品级池（按难度递进，禁止普通本出绝品）。
 * 与 gear-dungeon-redesign §2.2：普通白绿蓝、困难紫、地狱紫金。
 */
export const GEAR_TIER_RARITY_WEIGHTS: Record<GearDungeonTier, Partial<Record<Rarity, number>>> = {
  normal: { common: 45, uncommon: 42, rare: 13 },
  hard: { uncommon: 8, rare: 52, epic: 40 },
  hell: { rare: 28, epic: 50, legendary: 12 },
  rift: { rare: 16, epic: 46, legendary: 18 },
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

/** 实例可微调比例，但未写时严格用档位默认池（不用全局 DROPTABLE） */
export function resolveGearRarityWeights(
  def: Pick<GearDungeonDef, 'tier' | 'rarityWeights'>,
): Partial<Record<Rarity, number>> {
  if (def.rarityWeights && Object.keys(def.rarityWeights).length > 0) {
    return def.rarityWeights;
  }
  return { ...GEAR_TIER_RARITY_WEIGHTS[def.tier] };
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
