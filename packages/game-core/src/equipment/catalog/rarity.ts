import type { Rarity } from '../../shared/types.js';

export const RARITY_MULTIPLIER: Record<Rarity, number> = {
  common: 1.0,
  uncommon: 1.2,
  rare: 1.5,
  epic: 1.8,
  legendary: 2.2,
};

export const RARITY_LABELS_EQUIP: Record<Rarity, string> = {
  common: '普通',
  uncommon: '精良',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

export type DroptableRow = {
  rarity: Rarity;
  weight: number;
  guaranteedSubs: number;
  openRolls: number;
  conditionFirst: number;
  conditionSecond: number;
  rareFirst: number;
  rareSecond: number;
  t3: number;
  socket: number;
  extremeCondition: boolean;
};

export const DROPTABLE: DroptableRow[] = [
  {
    rarity: 'common',
    weight: 40,
    guaranteedSubs: 0,
    openRolls: 0,
    conditionFirst: 0,
    conditionSecond: 0,
    rareFirst: 0,
    rareSecond: 0,
    t3: 0,
    socket: 0,
    extremeCondition: false,
  },
  {
    rarity: 'uncommon',
    weight: 30,
    guaranteedSubs: 1,
    openRolls: 1,
    conditionFirst: 0,
    conditionSecond: 0,
    rareFirst: 0.08,
    rareSecond: 0,
    t3: 0,
    socket: 0,
    extremeCondition: false,
  },
  {
    rarity: 'rare',
    weight: 20,
    guaranteedSubs: 2,
    openRolls: 1,
    conditionFirst: 0.4,
    conditionSecond: 0,
    rareFirst: 0.15,
    rareSecond: 0,
    t3: 0,
    socket: 0,
    extremeCondition: false,
  },
  {
    rarity: 'epic',
    weight: 8,
    guaranteedSubs: 2,
    openRolls: 2,
    conditionFirst: 1,
    conditionSecond: 0.4,
    rareFirst: 0.25,
    rareSecond: 0.12,
    t3: 0.4,
    socket: 0.5,
    extremeCondition: false,
  },
  {
    rarity: 'legendary',
    weight: 2,
    guaranteedSubs: 2,
    openRolls: 2,
    conditionFirst: 1,
    conditionSecond: 0.6,
    rareFirst: 0.4,
    rareSecond: 0.2,
    t3: 1,
    socket: 1,
    extremeCondition: true,
  },
];

export function droptableOf(rarity: Rarity): DroptableRow {
  return DROPTABLE.find((r) => r.rarity === rarity)!;
}

/** 装等只抬底子。ilvl 1 = ×1，每级 +1.5%。 */
export function itemLevelScale(itemLevel: number): number {
  const ilvl = Math.max(1, Math.min(100, Math.round(itemLevel)));
  return 1 + (ilvl - 1) * 0.015;
}

export function wearTierForItemLevel(itemLevel: number): number {
  if (itemLevel <= 20) return 0;
  if (itemLevel <= 40) return 1;
  if (itemLevel <= 60) return 2;
  if (itemLevel <= 80) return 3;
  return 4;
}

export function itemLevelBandForChapter(chapterCleared: number): { min: number; max: number } {
  const bands: Array<[number, number]> = [
    [1, 20],
    [21, 40],
    [41, 60],
    [61, 80],
    [81, 92],
    [93, 100],
  ];
  const idx = Math.max(0, Math.min(bands.length - 1, Math.round(chapterCleared)));
  const [min, max] = bands[idx]!;
  return { min, max };
}

export function itemLevelFromProgress(chapterCleared: number, nodeIndex: number): number {
  const { min, max } = itemLevelBandForChapter(chapterCleared);
  return Math.min(max, min + Math.max(0, nodeIndex) * 4);
}
