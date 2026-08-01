import { rowOf } from '../formation/grid.js';
import type { GridSlot, UnitRuntime } from '../shared/types.js';
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
