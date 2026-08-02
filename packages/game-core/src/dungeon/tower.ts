import { grantCurrency } from '../character/growth.js';
import type { PlayerState } from '../shared/types.js';

/** 当前层数（从 1 起）；缺省按 1 */
export function getTowerFloor(state: PlayerState): number {
  return Math.max(1, state.towerFloor ?? 1);
}

/** 打通第 floor 层的修为产出（薄壳曲线，可后调） */
/** 修为唯一产口；曲线略缓（小节点+破境双消耗） */
export function xiuweiForFloor(floor: number): number {
  const f = Math.max(1, floor);
  return 10 + f * 3;
}

/** 每 N 层里程碑额外星尘 */
export const TOWER_MILESTONE_EVERY = 5;
/** 里程碑星尘（低频；控产勿抬太高） */
export const TOWER_MILESTONE_STARDUST = 18;

export function isTowerMilestone(floor: number): boolean {
  return floor > 0 && floor % TOWER_MILESTONE_EVERY === 0;
}

export type ClimbTowerResult = {
  ok: true;
  state: PlayerState;
  /** 刚打通的层号 */
  clearedFloor: number;
  gainedXiuwei: number;
  gainedStardust: number;
  /** 打完后的下一层 */
  nextFloor: number;
  milestone: boolean;
};

/**
 * 爬塔薄壳：不进战斗，直接结算一层修为并推进层数。
 * 每 5 层额外星尘（扩展：改 TOWER_MILESTONE_* 常量即可）。
 */
export function climbTower(state: PlayerState): ClimbTowerResult {
  const clearedFloor = getTowerFloor(state);
  const gainedXiuwei = xiuweiForFloor(clearedFloor);
  const milestone = isTowerMilestone(clearedFloor);
  const gainedStardust = milestone ? TOWER_MILESTONE_STARDUST : 0;
  const nextFloor = clearedFloor + 1;
  let next = grantCurrency(state, 'xiuwei', gainedXiuwei);
  if (gainedStardust > 0) next = grantCurrency(next, 'stardust', gainedStardust);
  next = {
    ...next,
    towerFloor: nextFloor,
    seed: next.seed + 1,
  };
  return {
    ok: true,
    state: next,
    clearedFloor,
    gainedXiuwei,
    gainedStardust,
    nextFloor,
    milestone,
  };
}
