import { rowOf } from '../formation/grid.js';
import type { GridSlot, Rng, UnitRuntime } from '../shared/types.js';
import { getStatusDef } from './statusRegistry.js';

/** 后排攻击 +10%；前排攻击 -5% */
export function positionAtkMod(slot: GridSlot): number {
  const row = rowOf(slot);
  if (row === 'back') return 1.1;
  if (row === 'front') return 0.95;
  return 1;
}

/** 前排防御 +10%；后排防御 -5% */
export function positionDefMod(slot: GridSlot): number {
  const row = rowOf(slot);
  if (row === 'front') return 1.1;
  if (row === 'back') return 0.95;
  return 1;
}

export function isLiving(unit: UnitRuntime): boolean {
  return !unit.dead && unit.hp > 0;
}

export function livingUnits(units: UnitRuntime[]): UnitRuntime[] {
  return units.filter(isLiving);
}

export function canAct(unit: UnitRuntime): boolean {
  if (!isLiving(unit)) return false;
  for (const s of unit.statuses) {
    if (s.remaining <= 0) continue;
    if (getStatusDef(s.statusId)?.blocksAct) return false;
  }
  return true;
}

export function markDeadIfNeeded(unit: UnitRuntime): void {
  if (unit.hp <= 0 && !unit.dead) {
    unit.hp = 0;
    unit.dead = true;
  }
}

export type LethalSaveKind = 'nirvana' | 'resilience';

/** 致死后尝试涅槃（必发一次，按比例起身）或不屈（概率 1 血）。已倒下则不再救。 */
export function tryStandFromLethal(unit: UnitRuntime, rng?: Rng): LethalSaveKind | null {
  if (unit.hp > 0 || unit.dead) return null;
  const ratio = unit.nirvanaHpRatio ?? 0;
  if (ratio > 0 && !unit.t3State?.nirvanaUsed) {
    unit.t3State = { ...(unit.t3State ?? {}), nirvanaUsed: true };
    unit.dead = false;
    unit.hp = Math.max(1, Math.floor(unit.maxHp * ratio));
    unit.statuses = [];
    return 'nirvana';
  }
  if (unit.resilience > 0 && rng && rng.next() < unit.resilience && !unit.t3State?.resilienceUsed) {
    unit.t3State = { ...(unit.t3State ?? {}), resilienceUsed: true };
    unit.dead = false;
    unit.hp = 1;
    return 'resilience';
  }
  return null;
}

/** 招魂 / 外部拉人：清状态后按比例起身 */
export function reviveUnit(unit: UnitRuntime, hpRatio: number): void {
  unit.dead = false;
  unit.hp = Math.max(1, Math.floor(unit.maxHp * hpRatio));
  unit.statuses = [];
}
