/**
 * 平行原世界 · 同步指数与章后档位（真源：parallel-sync-realworld-line spec）
 */

import { CHAPTER_BANDS, type ChapterBand } from '../chapter/bands.js';
import { maxChapterOrder } from '../chapter/defs.js';
import { characterPower } from '../equipment/power.js';
import { normalizeFormation } from '../formation/formation.js';
import { isOwned } from '../character/growth.js';
import { UNIT_TEMPLATES } from '../character/templates.js';
import type { PlayerState } from '../shared/types.js';
import type { ParallelChapterId, ParallelTier } from '../shared/types.js';

const CHAPTER_IDS: ParallelChapterId[] = [
  'ch1',
  'ch2',
  'ch3',
  'ch4',
  'ch5',
  'ch6',
  'ch7',
  'ch8',
  'ch9',
  'ch10',
];

export function parallelChapterIdFromCleared(chapterCleared: number): ParallelChapterId | null {
  const k = Math.round(chapterCleared);
  if (k < 1 || k > CHAPTER_IDS.length) return null;
  return CHAPTER_IDS[k - 1]!;
}

export function partyPowerForSync(state: PlayerState): number {
  const formation = normalizeFormation(state.formation);
  let sum = 0;
  for (const t of UNIT_TEMPLATES) {
    if (formation[t.id] == null) continue;
    if (!isOwned(state, t.id) && t.id !== 'hero') continue;
    sum += characterPower(state, t.id);
  }
  return sum;
}

export function ownedRosterCount(state: PlayerState): number {
  return UNIT_TEMPLATES.filter((t) => isOwned(state, t.id)).length;
}

/** 0–100，章末展示；不参与战斗 */
export function computeParallelSyncScore(state: PlayerState): number {
  const maxCh = maxChapterOrder();
  const cleared = Math.max(0, Math.min(maxCh, state.chapterCleared ?? 0));
  const chapterPart = maxCh > 0 ? (cleared / maxCh) * 100 : 0;

  const band = CHAPTER_BANDS[Math.min(cleared, CHAPTER_BANDS.length - 1)]!;
  const party = partyPowerForSync(state);
  const powerRatio = band.recommendedPower > 0 ? party / band.recommendedPower : 0;
  const powerPart = Math.min(100, Math.max(0, powerRatio * 100));

  const owned = ownedRosterCount(state);
  const anchorPart = Math.min(100, Math.max(0, (owned / 24) * 100));

  const raw = chapterPart * 0.4 + powerPart * 0.4 + anchorPart * 0.2;
  return Math.round(Math.min(100, Math.max(0, raw)));
}

export function resolveParallelTierForChapterClear(
  state: PlayerState,
  /** 通关后 chapterCleared（1 = 刚通 ch1） */
  chapterClearedAfter: number,
): ParallelTier {
  const bandIndex = Math.max(0, Math.min(CHAPTER_BANDS.length - 1, chapterClearedAfter - 1));
  const band = CHAPTER_BANDS[bandIndex]!;
  const party = partyPowerForSync(state);
  const owned = ownedRosterCount(state);

  const tier3 =
    party >= band.crushPower || (owned >= 12 && party >= band.recommendedPower);
  if (tier3) return 3;

  const tier1 = party < band.floorPower || owned < 6;
  if (tier1) return 1;

  return 2;
}

export function flavorTitleForTier(chapterId: ParallelChapterId, tier: ParallelTier): string | undefined {
  if (tier < 3) return undefined;
  const titles: Record<ParallelChapterId, string> = {
    ch1: '免提敢关',
    ch2: '句号会回',
    ch3: '收藏夹成真',
    ch4: '海报反噬',
    ch5: '协议已读',
    ch6: '周报缺席',
    ch7: '门禁反杀',
    ch8: '群聊潜水',
    ch9: '排期硬气',
    ch10: '卷末关屏',
  };
  return titles[chapterId];
}

export function hubSyncBadge(state: PlayerState): 'none' | 'syncing' | 'dual-worker' {
  const tiers = state.narrative?.parallelTierByChapter ?? {};
  const values = CHAPTER_IDS.map((id) => tiers[id]).filter((t): t is ParallelTier => t != null);
  if (values.length === 0) return 'none';
  if (values.length >= maxChapterOrder() && values.every((t) => t >= 2)) return 'dual-worker';
  if (values.some((t) => t >= 2)) return 'syncing';
  return 'none';
}

export function bandForChapterClear(chapterClearedAfter: number): ChapterBand {
  const bandIndex = Math.max(0, Math.min(CHAPTER_BANDS.length - 1, chapterClearedAfter - 1));
  return CHAPTER_BANDS[bandIndex]!;
}
