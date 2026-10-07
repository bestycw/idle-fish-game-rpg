import { defaultProgress, ensureRoster } from '../character/growth.js';
import {
  resolveStarterCompanionId,
  starterGiftIds,
} from '../character/starterRoster.js';
import type { PlayerState } from '../shared/types.js';
import { defaultFormation } from './formation.js';

/** 试玩 / 序章进 Hub / 新档：默认阵（主角 + 开局紫）+ 赠送 owned */
export function ensureStarterTrialRoster(state: PlayerState): PlayerState {
  const companionId = resolveStarterCompanionId(state.seed, state.starterCompanionId);
  const gifts = starterGiftIds(companionId);
  const s = ensureRoster({
    ...state,
    starterCompanionId: companionId,
    formation: defaultFormation(companionId),
    heroManual: false,
  });
  const roster = { ...s.roster };
  for (const id of gifts) {
    const row = roster[id] ?? defaultProgress(id);
    roster[id] = { ...row, owned: true };
  }
  return { ...s, roster, starterCompanionId: companionId };
}
