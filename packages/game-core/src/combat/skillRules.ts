/**
 * 技能条件规则（能力池 E/K/M 档落地口）。
 * 战斗主循环只调本模块；新规则用 effect.kind / 状态 flag，禁止在 combat.ts 堆具体 id。
 */
import type { SkillDef, SkillEffect, UnitRuntime } from '../shared/types.js';
import { getStatusDef } from './statusRegistry.js';

/** 目标因状态额外承伤倍率（猎印等） */
export function statusIncomingDamageMult(target: UnitRuntime): number {
  let m = 1;
  for (const s of target.statuses) {
    if (s.remaining <= 0) continue;
    const def = getStatusDef(s.statusId);
    if (def?.incomingDamageTakenFromValue && s.value != null) {
      m *= s.value;
    } else if (def?.incomingDamageTakenMult != null) {
      m *= def.incomingDamageTakenMult;
    }
  }
  return m;
}

function effectsOf(skill: SkillDef | undefined): SkillEffect[] {
  return skill?.effects ?? [];
}

/** 技能伤害乘区（对盾/斩杀/先声等） */
export function skillOutgoingDamageMult(
  actor: UnitRuntime,
  target: UnitRuntime,
  skill: SkillDef | undefined,
): number {
  let m = 1;
  for (const e of effectsOf(skill)) {
    if (e.kind === 'vs_shield' && target.shield > 0) {
      m *= e.multiplier ?? 1.3;
    }
    if (e.kind === 'execute') {
      const thr = e.value ?? 0.3;
      if (target.maxHp > 0 && target.hp / target.maxHp <= thr) {
        m *= e.multiplier ?? 1.45;
      }
    }
    if (e.kind === 'first_cast' && (actor.skillCastCount ?? 0) === 0) {
      m *= e.multiplier ?? 1.35;
    }
  }
  return m;
}

/** 治疗乘区：残血加疗 */
export function skillHealMult(target: UnitRuntime, skill: SkillDef | undefined): number {
  let m = 1;
  for (const e of effectsOf(skill)) {
    if (e.kind === 'heal_low_hp') {
      const thr = e.value ?? 0.4;
      if (target.maxHp > 0 && target.hp / target.maxHp <= thr) {
        m *= e.multiplier ?? 1.5;
      }
    }
  }
  return m;
}

export function hasEffect(skill: SkillDef | undefined, kind: string): SkillEffect | undefined {
  return effectsOf(skill).find((e) => e.kind === kind);
}

/** 击杀返还能量：按 qiCost × value（缺省 0.5） */
export function qiRefundOnKill(skill: SkillDef | undefined, killCount: number): number {
  if (killCount <= 0) return 0;
  const e = hasEffect(skill, 'refund_qi_on_kill');
  if (!e) return 0;
  const ratio = e.value ?? 0.5;
  return Math.max(0, Math.floor(skill!.qiCost * ratio * Math.min(killCount, 2)));
}
