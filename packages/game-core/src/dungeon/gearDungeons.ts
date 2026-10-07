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
    /** 第一本教学刷装：精英盾墙，不是满配首领（首领留给困难+） */
    tier: 'normal',
    blurb: '盾墙精锐巡逻；破甲/破盾器纹。',
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
    id: 'gear_wall_hard',
    name: '盾鸣廊·重关',
    tier: 'hard',
    blurb: '困难：盾墙/叠盾双首领轮换，破甲器纹权重升。',
    encounterPool: ['boss_wall', 'boss_shield_stack'],
    lootTableId: 'loot_gear_hard',
    pressure: 1.17,
    staminaCost: 11,
    t3IdWeights: [
      { id: 'fx_skill_shred', weight: 4 },
      { id: 'fx_purge_hit', weight: 3 },
    ],
  },
  {
    id: 'gear_wall_hell',
    name: '不动关·狱门',
    tier: 'hell',
    blurb: '地狱：盾墙首领与镇守轮换，高压破甲/破盾向。',
    encounterPool: ['boss_wall', 'boss_warden'],
    lootTableId: 'loot_gear_hell',
    pressure: 1.27,
    staminaCost: 12,
    t3IdWeights: [
      { id: 'fx_skill_shred', weight: 4 },
      { id: 'fx_purge_hit', weight: 4 },
      { id: 'fx_skill_mark', weight: 2 },
    ],
  },
  {
    id: 'gear_spirit_gate',
    name: '灵障关口',
    tier: 'normal',
    blurb: '灵阵首领；深破甲与灵伤向装。',
    encounterPool: ['boss_spirit_wall'],
    lootTableId: 'loot_gear_normal',
    pressure: 1.04,
    staminaCost: 10,
    t3IdWeights: [
      { id: 'fx_skill_shred', weight: 3 },
      { id: 'fx_purge_hit', weight: 2 },
    ],
  },
  {
    id: 'gear_oil_well',
    name: '油火井',
    tier: 'normal',
    blurb: '油火首领；禁疗/穿透点医向器纹。',
    encounterPool: ['boss_oil'],
    lootTableId: 'loot_gear_normal',
    pressure: 1.05,
    staminaCost: 10,
    t3IdWeights: [
      { id: 'fx_purge_hit', weight: 3 },
      { id: 'fx_skill_mark', weight: 2 },
    ],
  },
  {
    id: 'gear_oil_furnace',
    name: '油火锻炉',
    tier: 'hard',
    blurb: '困难：油火与速攻首领轮换，控场/斩杀向。',
    encounterPool: ['boss_oil', 'boss_raiders'],
    lootTableId: 'loot_gear_hard',
    pressure: 1.17,
    staminaCost: 11,
    t3IdWeights: [
      { id: 'fx_purge_hit', weight: 3 },
      { id: 'fx_cc_cut', weight: 3 },
    ],
  },
  {
    id: 'gear_shield_vault',
    name: '叠盾秘库',
    tier: 'normal',
    blurb: '叠盾首领；对盾增伤/破盾器纹。',
    encounterPool: ['boss_shield_stack'],
    lootTableId: 'loot_gear_normal',
    pressure: 1.06,
    staminaCost: 10,
    t3IdWeights: [
      { id: 'fx_purge_hit', weight: 4 },
      { id: 'fx_skill_shred', weight: 2 },
    ],
  },
  {
    id: 'gear_shield_bastion',
    name: '叠盾堡垒',
    tier: 'hard',
    blurb: '困难：叠盾与盾墙首领，破盾器纹集中。',
    encounterPool: ['boss_shield_stack', 'boss_wall'],
    lootTableId: 'loot_gear_hard',
    pressure: 1.18,
    staminaCost: 11,
    t3IdWeights: [
      { id: 'fx_purge_hit', weight: 4 },
      { id: 'fx_skill_shred', weight: 3 },
    ],
  },
  {
    id: 'gear_arrow_lane',
    name: '落矢廊道',
    tier: 'normal',
    blurb: '伏弓首领；切后与护阵向装。',
    encounterPool: ['boss_archers'],
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
    blurb: '困难：伏弓首领加压，蓝装率提升。',
    encounterPool: ['boss_archers', 'boss_raiders'],
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
    blurb: '速攻/油火首领；变速与控场向装。',
    encounterPool: ['boss_raiders', 'boss_oil'],
    lootTableId: 'loot_gear_normal',
    pressure: 1.05,
    staminaCost: 10,
  },
  {
    id: 'gear_raider_hard',
    name: '乱阵林蹊·急袭',
    tier: 'hard',
    blurb: '困难：速攻/油火首领加压，控场器纹权重升。',
    encounterPool: ['boss_raiders', 'boss_oil'],
    lootTableId: 'loot_gear_hard',
    pressure: 1.18,
    staminaCost: 11,
  },
  {
    id: 'gear_spirit_array',
    name: '铁壁灵阵',
    tier: 'hard',
    blurb: '困难：灵阵/叠盾首领，蓝装率提升。',
    encounterPool: ['boss_spirit_wall', 'boss_shield_stack'],
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
    blurb: '困难：乱心首领，净化与控场向 T3。',
    encounterPool: ['boss_chaos_rite'],
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
    blurb: '地狱：乱心/镇守首领，净化与对症 T3。',
    encounterPool: ['boss_chaos_rite', 'boss_warden'],
    lootTableId: 'loot_gear_hell',
    pressure: 1.28,
    staminaCost: 12,
    t3IdWeights: [
      { id: 'fx_heal_cleanse', weight: 4 },
      { id: 'fx_self_cleanse', weight: 4 },
      { id: 'fx_purge_hit', weight: 3 },
      { id: 'fx_skill_shred', weight: 2 },
    ],
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
  },
  {
    id: 'gear_warden_rift',
    name: '镜渊终局',
    tier: 'rift',
    blurb: '秘境：三首领轮换，绝品率与对症 T3 顶点。',
    encounterPool: ['boss_warden', 'boss_chaos_rite', 'boss_shield_stack'],
    lootTableId: 'loot_gear_rift',
    pressure: 1.36,
    staminaCost: 13,
    t3IdWeights: SOLUTION_T3_WEIGHTS,
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
