import { defaultProgress, ensureRoster } from '../character/growth.js';
import { DEFAULT_STARTER_GIFT_IDS } from '../character/starterRoster.js';
import type { PlayerState } from '../shared/types.js';
import { defaultFormation } from './formation.js';

/** 试玩 / 序章进 Hub / 新档：默认阵 + 赠送伙伴 owned */
export function ensureStarterTrialRoster(state: PlayerState): PlayerState {
  const s = ensureRoster({
    ...state,
    formation: defaultFormation(),
    heroManual: false,
  });
  const roster = { ...s.roster };
  for (const id of DEFAULT_STARTER_GIFT_IDS) {
    const row = roster[id] ?? defaultProgress(id);
    roster[id] = { ...row, owned: true };
  }
  return { ...s, roster };
}
