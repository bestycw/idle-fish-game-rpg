/**
 * DEV · 主线快进（仅 Web 金手指入口调用，勿进正式玩法）
 */

import type { PlayerState } from '../shared/types.js';
import { advanceStoryNode, completeChapterBattle, getChapterView } from './progress.js';

const MAX_STEPS = 256;

/** 从当前节点推到本章结束（story 跳过演出逻辑，battle 跳过波次） */
export function devClearCurrentChapter(state: PlayerState): {
  state: PlayerState;
  message: string;
  clearedChapter: boolean;
} {
  let s = state;
  for (let i = 0; i < MAX_STEPS; i++) {
    const view = getChapterView(s);
    if (view.finished) {
      return { state: s, message: '卷一已全部通关。', clearedChapter: false };
    }
    if (!view.node) {
      return { state: s, message: 'DEV：无当前节点。', clearedChapter: false };
    }
    if (view.node.kind === 'story') {
      const r = advanceStoryNode(s);
      if (!r.ok) return { state: s, message: r.message, clearedChapter: false };
      s = r.state;
      if (r.clearedChapter) {
        return { state: s, message: `[DEV] ${r.message}`, clearedChapter: true };
      }
      continue;
    }
    const r = completeChapterBattle(s);
    if (!r.ok) return { state: s, message: r.message, clearedChapter: false };
    s = r.state;
    if (r.clearedChapter) {
      return { state: s, message: `[DEV] ${r.message}`, clearedChapter: true };
    }
  }
  return { state: s, message: 'DEV：步数上限，请再点一次。', clearedChapter: false };
}

/** 重复「通本章」直到卷一结束或达到章数上限 */
export function devClearMainlineChapters(
  state: PlayerState,
  chapterCount: number,
): { state: PlayerState; message: string } {
  let s = state;
  let cleared = 0;
  for (let c = 0; c < chapterCount; c++) {
    const view = getChapterView(s);
    if (view.finished) break;
    const r = devClearCurrentChapter(s);
    s = r.state;
    if (!r.clearedChapter) {
      return { state: s, message: r.message };
    }
    cleared++;
  }
  const view = getChapterView(s);
  if (view.finished) {
    return { state: s, message: `[DEV] 卷一十章已通（连推 ${cleared} 章）。` };
  }
  return {
    state: s,
    message: `[DEV] 已快进 ${cleared} 章，当前进度见 Hub。`,
  };
}
