import type { ConditionAffix, UnitRuntime } from '../shared/types.js';
import { rowOf } from '../formation/grid.js';
import { getStatusDef } from './statusFx.js';
import {
  CONDITION_OUTGOING_CAP,
  CONDITION_TAKEN_CAP,
} from '../equipment/catalog/conditions.js';

export type HitKind = 'attack' | 'skill';

function activeDebuff(target: UnitRuntime): boolean {
  return target.statuses.some((s) => {
    if (s.remaining <= 0) return false;
    const def = getStatusDef(s.statusId);
    return def?.kind === 'debuff' || def?.kind === 'cc';
  });
}

function outgoingValue(cond: ConditionAffix, ctx: {
  kind: HitKind;
  actor: UnitRuntime;
  target: UnitRuntime;
}): number {
  switch (cond.defId) {
    case 'skill_power':
      return ctx.kind === 'skill' ? cond.value : 0;
    case 'basic_attack':
      return ctx.kind === 'attack' ? cond.value : 0;
    case 'vs_front':
      return rowOf(ctx.target.slot) === 'front' ? cond.value : 0;
    case 'vs_back':
      return rowOf(ctx.target.slot) === 'back' ? cond.value : 0;
    case 'vs_healthy':
      return ctx.target.maxHp > 0 && ctx.target.hp / ctx.target.maxHp >= 0.8 ? cond.value : 0;
    case 'vs_wounded':
      return ctx.target.maxHp > 0 && ctx.target.hp / ctx.target.maxHp <= 0.35 ? cond.value : 0;
    case 'vs_status':
      return activeDebuff(ctx.target) ? cond.value : 0;
    case 'while_shielded':
      return ctx.actor.shield > 0 ? cond.value : 0;
    default:
      return 0;
  }
}

export function conditionOutgoingMult(
  actor: UnitRuntime,
  target: UnitRuntime,
  kind: HitKind,
): number {
  let sum = 0;
  for (const c of actor.conditionAffixes ?? []) {
    sum += outgoingValue(c, { kind, actor, target });
  }
  return 1 + Math.min(CONDITION_OUTGOING_CAP, sum);
}

export function conditionHealMult(actor: UnitRuntime): number {
  let sum = 0;
  for (const c of actor.conditionAffixes ?? []) {
    if (c.defId === 'skill_power') sum += c.value;
  }
  return 1 + Math.min(CONDITION_OUTGOING_CAP, sum);
}

export function conditionIncomingMult(
  target: UnitRuntime,
  attacker: UnitRuntime,
): number {
  let takenReduce = 0;
  let fromBack = 0;
  for (const c of target.conditionAffixes ?? []) {
    if (c.defId === 'dmg_taken_reduce') takenReduce = Math.max(takenReduce, c.value);
    if (c.defId === 'dmg_taken_from_back' && rowOf(attacker.slot) === 'back') {
      fromBack = Math.max(fromBack, c.value);
    }
  }
  takenReduce = Math.min(CONDITION_TAKEN_CAP, takenReduce);
  return (1 - takenReduce) * (1 - fromBack);
}
