import { grantCurrency } from '../character/growth.js';
import { deployedHasT3 } from '../equipment/loadout.js';
import { createRng } from '../shared/rng.js';
import type { PlayerState } from '../shared/types.js';

/** 单次星尘产出区间（控产：约日 2 次 ≈ 20 尘级） */
export const STARDUST_REALM_RANGE: [number, number] = [8, 12];

export type StardustRealmResult = {
  ok: true;
  state: PlayerState;
  gainedStardust: number;
};

/**
 * 星尘秘境薄壳：不进战斗，直接掉星尘。
 * 对应副本 `stardust_realm`（runMode=instant）；体力扣点由 UI/调用方先 trySpendStamina。
 */
export function runStardustRealm(state: PlayerState): StardustRealmResult {
  const rng = createRng(state.seed + (state.wins + 1) * 17 + state.inventory.length * 3);
  const [lo, hi] = STARDUST_REALM_RANGE;
  const gainedStardust = Math.round(
    rng.int(lo, hi) * (deployedHasT3(state, 'fx_star_dust') ? 1.1 : 1),
  );
  let next = grantCurrency(state, 'stardust', gainedStardust);
  next = { ...next, seed: next.seed + 1 };
  return { ok: true, state: next, gainedStardust };
}
