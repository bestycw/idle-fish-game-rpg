import { getStatusDef } from './statusFx.js';
import { ratingToPct } from './ratings.js';
import type { Role, StatusId, UnitRuntime } from '../shared/types.js';

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

/** 状态命中基础值（未算控制精通 / 目标幸运）；UI 与公式同源 */
export const STATUS_LAND_BASE = 0.75;

/** 控制向精通：状态命中加成（绝对值，加在 STATUS_LAND_BASE 上） */
export function controlMasteryBonus(unit: UnitRuntime): number {
  return controlMasteryBonusFrom(unit.role, unit.masteryRating);
}

export function controlMasteryBonusFrom(role: Role, masteryRating: number): number {
  const m = ratingToPct(masteryRating, 'masteryRating');
  if (role === 'flex') return m * 0.35;
  if (role === 'st_ctrl' || role === 'aoe_ctrl') return m;
  return 0;
}

/** 某状态的抵抗检定基础命中 */
export function statusLandBase(statusId?: StatusId): number {
  if (!statusId) return STATUS_LAND_BASE;
  return getStatusDef(statusId)?.landBase ?? STATUS_LAND_BASE;
}

/**
 * 对敌方挂状态的命中率（幸运默认 0，供技能页展示）。
 * 与战斗 `rollStatusLand` 同源：clamp(0.15, 0.95, base + 精通加成 - fortune×0.005)
 */
export function statusLandChance(
  role: Role,
  masteryRating: number,
  targetFortune = 0,
  statusId?: StatusId,
): number {
  const base = statusLandBase(statusId);
  let bonus = controlMasteryBonusFrom(role, masteryRating);
  // 低 landBase 状态：精通加命中按比例打折，避免 25% 基础被堆回 50%+
  if (base < STATUS_LAND_BASE) {
    bonus *= base / STATUS_LAND_BASE;
  }
  const raw = base + bonus - targetFortune * 0.005;
  return Math.min(0.95, Math.max(0.15, raw));
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

/** 控制精通：硬控/扰乱时长 ×(1+m×0.15)；flex 半额 */
export function controlDurationMult(unit: UnitRuntime): number {
  const m = masteryPct(unit);
  if (unit.role === 'st_ctrl' || unit.role === 'aoe_ctrl') return 1 + m * 0.15;
  if (unit.role === 'flex') return 1 + m * 0.15 * 0.5;
  return 1;
}

export type MasteryCarrier = Pick<UnitRuntime, 'role' | 'masteryRating'>;

/**
 * 增幅精通：破甲 value 更低（防更脆）。
 * value 为防御乘区，返回修正后 value（下限 0.45）。
 */
export function shredValueWithMastery(unit: MasteryCarrier, baseValue: number): number {
  const m = ratingToPct(unit.masteryRating, 'masteryRating');
  let deepen = 0;
  if (unit.role === 'group_amp') deepen = m * 0.35;
  else if (unit.role === 'flex') deepen = m * 0.15;
  if (deepen <= 0) return baseValue;
  // 破甲幅度 (1-value) 加深
  const shredAmt = Math.min(0.55, (1 - baseValue) * (1 + deepen));
  return Math.max(0.45, 1 - shredAmt);
}

/** 增幅精通：猎印承伤倍率略增 */
export function markPreyValueWithMastery(unit: MasteryCarrier, baseValue: number): number {
  const m = ratingToPct(unit.masteryRating, 'masteryRating');
  if (unit.role === 'group_amp') return baseValue * (1 + m * 0.25);
  if (unit.role === 'flex') return baseValue * (1 + m * 0.1);
  return baseValue;
}

export function isControlRole(role: Role): boolean {
  return role === 'st_ctrl' || role === 'aoe_ctrl' || role === 'flex';
}
