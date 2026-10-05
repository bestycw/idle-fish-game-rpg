import { createRng } from '../shared/rng.js';
import type { PlayerState } from '../shared/types.js';

/** 主线战斗节点完成：战利收缴（微量灵石，不掉装） */
export function grantMainlineBattleScrap(state: PlayerState, salt: number): PlayerState {
  const rng = createRng(state.seed + salt * 17 + (state.chapterNodeIndex ?? 0));
  const gold = rng.int(1, 5);
  return { ...state, gold: state.gold + gold, seed: state.seed + 1 };
}
