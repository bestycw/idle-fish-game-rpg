import type { Rarity } from '../shared/types.js';
import {
  itemLevelBandForChapter,
  itemLevelFromProgress,
} from '../equipment/catalog/rarity.js';
import type { DungeonDef } from './defs.js';

export type GearDungeonTier = 'normal' | 'hard' | 'hell' | 'rift';

/** 地狱档：高压本偏「对症」T3，不绑套装 */
export const SOLUTION_T3_WEIGHTS: { id: string; weight: number }[] = [
  { id: 'fx_skill_shred', weight: 4 },
  { id: 'fx_purge_hit', weight: 4 },
  { id: 'fx_heal_cleanse', weight: 3 },
  { id: 'fx_skill_mark', weight: 2 },
  { id: 'fx_cc_cut', weight: 2 },
  { id: 'fx_self_cleanse', weight: 2 },
];

export const GEAR_TIER_LABELS: Record<GearDungeonTier, string> = {
  normal: '普通',
  hard: '困难',
  hell: '地狱',
  rift: '秘境',
};

export interface GearDungeonDef {
  id: string;
  name: string;
  tier: GearDungeonTier;
  blurb: string;
  encounterPool: string[];
  lootTableId: string;
  pressure: number;
  staminaCost: number;
  t3IdWeights?: { id: string; weight: number }[];
  rarityWeights?: Partial<Record<Rarity, number>>;
}

/** 卷一猎装实例：主题遭遇 + 难度分档 */
export const GEAR_DUNGEON_DEFS: GearDungeonDef[] = [
  {
    id: 'gear_break_wall',
    name: '不动关·盾鸣廊',
    tier: 'normal',
    blurb: '盾墙主题；破甲/破盾器纹。',
    encounterPool: ['wall'],
    lootTableId: 'loot_gear_normal',
    pressure: 1,
    staminaCost: 10,
    t3IdWeights: [
      { id: 'fx_skill_shred', weight: 3 },
      { id: 'fx_purge_hit', weight: 2 },
    ],
  },
  {
    id: 'gear_arrow_lane',
    name: '落矢廊道',
    tier: 'normal',
    blurb: '切后与护阵向装；对应弓手遭遇。',
    encounterPool: ['archers'],
    lootTableId: 'loot_gear_normal',
    pressure: 1,
    staminaCost: 10,
    t3IdWeights: [
      { id: 'fx_skill_mark', weight: 3 },
      { id: 'fx_cc_cut', weight: 2 },
    ],
  },
  {
    id: 'gear_arrow_hard',
    name: '落鸦矢道·紧弦',
    tier: 'hard',
    blurb: '困难：弓手加压，紫装率提升。',
    encounterPool: ['archers'],
    lootTableId: 'loot_gear_hard',
    pressure: 1.16,
    staminaCost: 11,
    t3IdWeights: [
      { id: 'fx_skill_mark', weight: 4 },
      { id: 'fx_cc_cut', weight: 3 },
    ],
  },
  {
    id: 'gear_raider_trail',
    name: '速攻小道',
    tier: 'normal',
    blurb: '变速与控场向装；速攻与油桶遭遇。',
    encounterPool: ['raiders', 'oil_cask'],
    lootTableId: 'loot_gear_normal',
    pressure: 1.05,
    staminaCost: 10,
  },
  {
    id: 'gear_raider_hard',
    name: '乱阵林蹊·急袭',
    tier: 'hard',
    blurb: '困难：速攻与油火加压，控场器纹权重升。',
    encounterPool: ['raiders', 'oil_cask'],
    lootTableId: 'loot_gear_hard',
    pressure: 1.18,
    staminaCost: 11,
  },
  {
    id: 'gear_spirit_array',
    name: '铁壁灵阵',
    tier: 'hard',
    blurb: '困难：紫装率提升，灵阵与堆盾遭遇。',
    encounterPool: ['spirit_wall', 'shield_stack'],
    lootTableId: 'loot_gear_hard',
    pressure: 1.18,
    staminaCost: 11,
    t3IdWeights: [
      { id: 'fx_skill_shred', weight: 4 },
      { id: 'fx_purge_hit', weight: 3 },
    ],
  },
  {
    id: 'gear_chaos_shrine',
    name: '乱心祭场',
    tier: 'hard',
    blurb: '困难：净化与控场向 T3。',
    encounterPool: ['chaos_rite'],
    lootTableId: 'loot_gear_hard',
    pressure: 1.15,
    staminaCost: 11,
    t3IdWeights: [
      { id: 'fx_heal_cleanse', weight: 3 },
      { id: 'fx_self_cleanse', weight: 3 },
      { id: 'fx_purge_hit', weight: 2 },
    ],
  },
  {
    id: 'gear_chaos_hell',
    name: '乱心祠·狱烟',
    tier: 'hell',
    blurb: '地狱：祭纹高压，净化器纹与对症 T3 集中。',
    encounterPool: ['chaos_rite'],
    lootTableId: 'loot_gear_hell',
    pressure: 1.28,
    staminaCost: 12,
    t3IdWeights: [
      { id: 'fx_heal_cleanse', weight: 4 },
      { id: 'fx_self_cleanse', weight: 4 },
      { id: 'fx_purge_hit', weight: 3 },
      { id: 'fx_skill_shred', weight: 2 },
    ],
    rarityWeights: { rare: 26, epic: 42, legendary: 10 },
  },
  {
    id: 'gear_warden_trial',
    name: '镇守试炼',
    tier: 'hell',
    blurb: '地狱：高压首领，对症解法 T3（原镜渊定位）。',
    encounterPool: ['boss_warden'],
    lootTableId: 'loot_gear_hell',
    pressure: 1.3,
    staminaCost: 12,
    t3IdWeights: SOLUTION_T3_WEIGHTS,
    rarityWeights: { rare: 28, epic: 45, legendary: 12 },
  },
];

const gearById = new Map(GEAR_DUNGEON_DEFS.map((g) => [g.id, g]));

export function getGearDungeon(id: string): GearDungeonDef | undefined {
  return gearById.get(id);
}

export function isGearDungeonId(id: string): boolean {
  return gearById.has(id);
}

export function gearDungeonToDungeonDef(g: GearDungeonDef): DungeonDef {
  return {
    id: g.id,
    name: g.name,
    kind: 'gear',
    runMode: 'battle',
    encounterPool: g.encounterPool,
    lootTableId: g.lootTableId,
    blurb: g.blurb,
    staminaCost: g.staminaCost,
    pressure: g.pressure,
  };
}

export function itemLevelForGearTier(
  chapterCleared: number,
  nodeIndex: number,
  tier: GearDungeonTier,
): number {
  const base = itemLevelFromProgress(chapterCleared, nodeIndex);
  const { min, max } = itemLevelBandForChapter(chapterCleared);
  if (tier === 'normal') return base;
  if (tier === 'hard') {
    return Math.min(max, base + Math.max(4, Math.floor((max - min) * 0.35)));
  }
  if (tier === 'hell' || tier === 'rift') return max;
  return base;
}
