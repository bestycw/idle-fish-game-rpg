import { grantCurrency } from '../character/growth.js';
import type { ChapterDef } from '../chapter/defs.js';
import type { PlayerState } from '../shared/types.js';

export interface ChapterFirstClearReward {
  stardust: number;
  gold: number;
  ticket?: number;
  enhanceStones?: number;
}

/** 卷一章节首通包（不进猎装掉落表） */
export const CHAPTER_FIRST_CLEAR: Record<number, ChapterFirstClearReward> = {
  1: { stardust: 6, gold: 25 },
  2: { stardust: 6, gold: 28 },
  3: { stardust: 7, gold: 30, ticket: 1 },
  4: { stardust: 7, gold: 32 },
  5: { stardust: 8, gold: 35 },
  6: { stardust: 8, gold: 38, ticket: 1 },
  7: { stardust: 9, gold: 40 },
  8: { stardust: 9, gold: 42 },
  9: { stardust: 10, gold: 45 },
  10: { stardust: 12, gold: 50, ticket: 1, enhanceStones: 3 },
};

export function chapterFirstClearReward(order: number): ChapterFirstClearReward | null {
  return CHAPTER_FIRST_CLEAR[order] ?? null;
}

export function hasClaimedChapterFirstClear(state: PlayerState, order: number): boolean {
  return (state.chapterFirstClearClaimed ?? []).includes(order);
}

/** 章通关时发放首通包（幂等） */
export function applyChapterFirstClear(
  state: PlayerState,
  chapter: ChapterDef,
): { state: PlayerState; applied: ChapterFirstClearReward | null } {
  const order = chapter.order;
  if (hasClaimedChapterFirstClear(state, order)) {
    return { state, applied: null };
  }
  const pack = chapterFirstClearReward(order);
  if (!pack) {
    return { state, applied: null };
  }

  let next = state;
  if (pack.gold > 0) next = { ...next, gold: next.gold + pack.gold };
  if (pack.stardust > 0) next = grantCurrency(next, 'stardust', pack.stardust);
  if (pack.ticket && pack.ticket > 0) next = grantCurrency(next, 'ticket', pack.ticket);
  if (pack.enhanceStones && pack.enhanceStones > 0) {
    next = { ...next, enhanceStones: (next.enhanceStones ?? 0) + pack.enhanceStones };
  }

  const claimed = [...(next.chapterFirstClearClaimed ?? []), order];
  return { state: { ...next, chapterFirstClearClaimed: claimed }, applied: pack };
}
