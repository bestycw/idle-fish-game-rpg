/**
 * DEV · 战斗秒杀（验证用）
 */

import type { BattleState } from '../shared/types.js';
import { markDeadIfNeeded } from './lifecycle.js';

export function devForceBattleWin(state: BattleState): BattleState {
  if (state.status !== 'ongoing') return state;
  const enemy = {
    ...state.enemy,
    units: state.enemy.units.map((u) => {
      const next = { ...u, hp: 0 };
      markDeadIfNeeded(next);
      return next;
    }),
  };
  return {
    ...state,
    enemy,
    status: 'won',
  };
}
