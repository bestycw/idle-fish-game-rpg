/**
 * 章通关后更新平行世界（轴 + 每 2 章弧末推演）
 */

import type { ParallelArcId, PlayerState } from '../shared/types.js';
import {
  applyParallelWorldAfterChapterClear,
  parallelArcIdFromChapterCleared,
} from './parallelWorldState.js';

export function applyParallelReportAfterChapterClear(
  state: PlayerState,
  chapterClearedAfter: number,
): PlayerState {
  return applyParallelWorldAfterChapterClear(state, chapterClearedAfter);
}

/** 刚通偶数章且该弧简报未展示过时返回 arcId */
export function unseenParallelArcReport(state: PlayerState): ParallelArcId | null {
  const cleared = state.chapterCleared ?? 0;
  const arcId = parallelArcIdFromChapterCleared(cleared);
  if (!arcId) return null;
  const report = state.narrative?.parallelArcReports?.[arcId];
  if (!report) return null;
  const seen = state.narrative?.parallelReportSeenUpToArc ?? 0;
  const arcNum = Number(arcId.replace('arc', ''));
  if (arcNum <= seen) return null;
  return arcId;
}

export function markParallelArcReportSeen(state: PlayerState, arcId: ParallelArcId): PlayerState {
  const idx = Number(arcId.replace('arc', ''));
  const seen = state.narrative?.parallelReportSeenUpToArc ?? 0;
  if (idx <= seen) return state;
  return {
    ...state,
    narrative: {
      ...state.narrative,
      phase: state.narrative?.phase ?? 'mainline',
      parallelReportSeenUpToArc: idx,
    },
  };
}

/** @deprecated 用 markParallelArcReportSeen */
export function markParallelReportSeen(state: PlayerState, _chapterId: string): PlayerState {
  return state;
}
