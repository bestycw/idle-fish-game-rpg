import { ratingToPct } from './ratings.js';
import type { Role, UnitRuntime } from '../shared/types.js';

export function masteryPct(unit: UnitRuntime): number {
  return ratingToPct(unit.masteryRating, 'masteryRating');
}

/** 输出向精通乘区（技能伤害） */
export function outputMasteryMult(
  unit: UnitRuntime,
  opts: { single?: boolean; aoe?: boolean },
): number {
  const m = masteryPct(unit);
  switch (unit.role) {
    case 'flex':
      return 1 + m * 0.35;
    case 'st_burst':
      return opts.single !== false ? 1 + m * 0.85 : 1;
    case 'aoe_dps':
      return opts.aoe ? 1 + m * 0.85 : 1;
    default:
      return 1;
  }
}

/** 坦克精通：受伤减伤 */
export function tankDamageTakenMult(unit: UnitRuntime): number {
  if (unit.role !== 'tank') return 1;
  const m = masteryPct(unit);
  return 1 - m * 0.8;
}

/** 坦克精通：护盾量 */
export function shieldMasteryMult(unit: UnitRuntime): number {
  if (unit.role !== 'tank') return 1;
  return 1 + masteryPct(unit);
}

/** 治疗向精通 */
export function healMasteryMult(unit: UnitRuntime, aoe = false): number {
  const m = masteryPct(unit);
  if (unit.role === 'flex') return 1 + m * 0.25;
  if (unit.role === 'st_heal' && !aoe) return 1 + m;
  if (unit.role === 'aoe_heal' && aoe) return 1 + m;
  if (unit.role === 'st_heal') return 1 + m * 0.5;
  if (unit.role === 'aoe_heal') return 1 + m * 0.5;
  return 1;
}

/** 控制向精通：状态命中加成 */
export function controlMasteryBonus(unit: UnitRuntime): number {
  if (unit.role === 'flex') return masteryPct(unit) * 0.35;
  if (unit.role === 'st_ctrl' || unit.role === 'aoe_ctrl') return masteryPct(unit);
  return 0;
}

/** 穿透：st_burst 精通减目标有效防御 */
export function pierceDefReduction(actor: UnitRuntime): number {
  if (actor.role !== 'st_burst') return 0;
  return masteryPct(actor) * 0.5;
}

/** st_burst 暴伤额外 */
export function burstCritDmgExtra(actor: UnitRuntime): number {
  if (actor.role !== 'st_burst') return 0;
  return masteryPct(actor) * 0.1;
}

export function isControlRole(role: Role): boolean {
  return role === 'st_ctrl' || role === 'aoe_ctrl' || role === 'flex';
}
