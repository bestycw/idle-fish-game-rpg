import { COMBAT_POWER_SCALE } from '../equipment/power.js';

function bandPower(n: number): number {
  return Math.round(n * COMBAT_POWER_SCALE);
}

/**
 * 章节强度档。敌人跟「正在打的章」走（index = chapterCleared）。
 * 战力是读数与建议，不锁进门、不拿来刷怪。
 */
export interface ChapterBand {
  /** 0 = 第一章（chapterCleared === 0） */
  index: number;
  label: string;
  /** 乘遭遇底稿的攻 / 防 / 血 */
  enemyMult: number;
  /** 低于此站位也很难过 */
  floorPower: number;
  /** 建议战力（展示） */
  recommendedPower: number;
  /** 高于此通常能碾，错队仍可能卡机制 */
  crushPower: number;
}

/**
 * 十章 · 卷一。系数只抬数字；解法窗口在 floor～crush 之间。
 */
/** 原始章档战力 × `COMBAT_POWER_SCALE`（与 `powerFromBonuses` 同倍率） */
export const CHAPTER_BANDS: ChapterBand[] = [
  { index: 0, label: '第一章', enemyMult: 1, floorPower: bandPower(2600), recommendedPower: bandPower(3800), crushPower: bandPower(5400) },
  { index: 1, label: '第二章', enemyMult: 1.25, floorPower: bandPower(3400), recommendedPower: bandPower(4800), crushPower: bandPower(5800) },
  { index: 2, label: '第三章', enemyMult: 1.55, floorPower: bandPower(5000), recommendedPower: bandPower(7200), crushPower: bandPower(8600) },
  { index: 3, label: '第四章', enemyMult: 1.9, floorPower: bandPower(7400), recommendedPower: bandPower(10600), crushPower: bandPower(12700) },
  { index: 4, label: '第五章', enemyMult: 2.3, floorPower: bandPower(10500), recommendedPower: bandPower(15000), crushPower: bandPower(18000) },
  { index: 5, label: '第六章', enemyMult: 2.8, floorPower: bandPower(14700), recommendedPower: bandPower(21000), crushPower: bandPower(25200) },
  { index: 6, label: '第七章', enemyMult: 3.35, floorPower: bandPower(20000), recommendedPower: bandPower(28500), crushPower: bandPower(34200) },
  { index: 7, label: '第八章', enemyMult: 4, floorPower: bandPower(27000), recommendedPower: bandPower(38500), crushPower: bandPower(46200) },
  { index: 8, label: '第九章', enemyMult: 4.75, floorPower: bandPower(36000), recommendedPower: bandPower(51500), crushPower: bandPower(61800) },
  { index: 9, label: '第十章', enemyMult: 5.6, floorPower: bandPower(48000), recommendedPower: bandPower(68500), crushPower: bandPower(82200) },
];

export function chapterBandIndex(chapterCleared: number): number {
  const n = Math.max(0, Math.round(chapterCleared));
  return Math.min(CHAPTER_BANDS.length - 1, n);
}

export function getChapterBand(chapterCleared: number): ChapterBand {
  return CHAPTER_BANDS[chapterBandIndex(chapterCleared)]!;
}

/** 章档 × 本种压力（猎装 1 / 镜渊 1.3）。塔不进战斗。 */
export function battlePressure(chapterCleared: number, dungeonPressure = 1): number {
  return getChapterBand(chapterCleared).enemyMult * dungeonPressure;
}

/**
 * 主线战斗额外加压（随卷内章序略抬，促刷装/抽卡；猎装仍用 battlePressure）。
 * @param chapterOrder 当前章 1-based（正在打的章）
 */
export function mainlineStoryPressure(
  chapterCleared: number,
  chapterOrder: number,
): number {
  const base = battlePressure(chapterCleared);
  const o = Math.max(1, Math.min(10, Math.round(chapterOrder)));
  const ramp = 1 + (o - 1) * 0.05;
  return base * ramp;
}

export type PowerGateKind = 'below_floor' | 'window' | 'crush';

export function powerGate(partyPower: number, band: ChapterBand): PowerGateKind {
  if (partyPower < band.floorPower) return 'below_floor';
  if (partyPower >= band.crushPower) return 'crush';
  return 'window';
}
