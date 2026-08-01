import { grantCurrency } from '../character/growth.js';
import type { PlayerState } from '../shared/types.js';

/** 当前层数（从 1 起）；缺省按 1 */
export function getTowerFloor(state: PlayerState): number {
  return Math.max(1, state.towerFloor ?? 1);
}

/** 打通第 floor 层的修为产出（薄壳曲线，可后调） */
export function xiuweiForFloor(floor: number): number {
  const f = Math.max(1, floor);
  return 20 + f * 5;
}

export type ClimbTowerResult = {
  ok: true;
  state: PlayerState;
  /** 刚打通的层号 */
  clearedFloor: number;
  gainedXiuwei: number;
  /** 打完后的下一层 */
  nextFloor: number;
};

/**
 * 爬塔薄壳：不进战斗，直接结算一层修为并推进层数。
 * 对应副本 `tower`（runMode=instant）；完整爬塔战斗后置。
 */
export function climbTower(state: PlayerState): ClimbTowerResult {
  const clearedFloor = getTowerFloor(state);
  const gainedXiuwei = xiuweiForFloor(clearedFloor);
  const nextFloor = clearedFloor + 1;
  let next = grantCurrency(state, 'xiuwei', gainedXiuwei);
  next = {
    ...next,
    towerFloor: nextFloor,
    seed: next.seed + 1,
  };
  return { ok: true, state: next, clearedFloor, gainedXiuwei, nextFloor };
}
