/**
 * 技能条件规则（能力池 E/K/M 档落地口）。
 * 战斗主循环只调本模块；新规则用 effect.kind / 状态 flag，禁止在 combat.ts 堆具体 id。
 */
import type { SkillDef, SkillEffect, UnitRuntime } from '../shared/types.js';
import { getStatusDef } from './statusRegistry.js';
import { adjacentSlots } from '../formation/grid.js';
import { masteryPct } from './mastery.js';

/**
 * 规则乘区随精通长大：只放大「多出来的那截」。
 * 精通 0 时系数与数据表完全一致（★3 底板）；堆精通后 ★6 同词更疯。
 */
export function growRuleMult(actor: UnitRuntime | undefined, base: number): number {
  if (!actor || base === 1) return base;
  const m = masteryPct(actor);
  if (m <= 0) return base;
  if (base > 1) return 1 + (base - 1) * (1 + m * 0.7);
  return Math.max(0.7, 1 - (1 - base) * (1 + m * 0.4));
}

/** 比例类（伤疗 22%、连斩每层 8%）随精通略涨，带软顶。 */
export function growRuleRatio(
  actor: UnitRuntime | undefined,
  base: number,
  cap = 0.85,
): number {
  if (!actor) return base;
  const m = masteryPct(actor);
  if (m <= 0) return base;
  return Math.min(cap, base * (1 + m * 0.5));
}

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

export interface SkillRuleCtx {
  foes?: UnitRuntime[];
}

function hasAdjacentLivingAlly(target: UnitRuntime, foes: UnitRuntime[]): boolean {
  const adj = new Set(adjacentSlots(target.slot));
  return foes.some((u) => u.uid !== target.uid && !u.dead && u.hp > 0 && adj.has(u.slot));
}

/** 技能伤害乘区（对盾/斩杀/先声等） */
export function skillOutgoingDamageMult(
  actor: UnitRuntime,
  target: UnitRuntime,
  skill: SkillDef | undefined,
  ctx?: SkillRuleCtx,
): number {
  let m = 1;
  for (const e of effectsOf(skill)) {
    if (e.kind === 'vs_shield' && target.shield > 0) {
      m *= growRuleMult(actor, e.multiplier ?? 1.3);
    }
    if (e.kind === 'execute') {
      const thr = e.value ?? 0.3;
      if (target.maxHp > 0 && target.hp / target.maxHp <= thr) {
        m *= growRuleMult(actor, e.multiplier ?? 1.45);
      }
    }
    if (e.kind === 'first_cast' && (actor.skillCastCount ?? 0) === 0) {
      m *= growRuleMult(actor, e.multiplier ?? 1.35);
    }
    if (e.kind === 'vs_cc') {
      const cc = target.statuses.some((s) => {
        if (s.remaining <= 0) return false;
        return getStatusDef(s.statusId)?.kind === 'cc';
      });
      if (cc) m *= growRuleMult(actor, e.multiplier ?? 1.25);
    }
    if (e.kind === 'vs_high_hp') {
      const thr = e.value ?? 0.65;
      if (target.maxHp > 0 && target.hp / target.maxHp >= thr) {
        m *= growRuleMult(actor, e.multiplier ?? 1.25);
      }
    }
    if (e.kind === 'self_low_hp') {
      const thr = e.value ?? 0.4;
      if (actor.maxHp > 0 && actor.hp / actor.maxHp <= thr) {
        m *= growRuleMult(actor, e.multiplier ?? 1.3);
      }
    }
    if (e.kind === 'vs_rank') {
      if (target.rank === 'elite' || target.rank === 'boss') {
        m *= growRuleMult(actor, e.multiplier ?? 1.22);
      }
    }
    if (e.kind === 'surround' && ctx?.foes && hasAdjacentLivingAlly(target, ctx.foes)) {
      m *= growRuleMult(actor, e.multiplier ?? 1.2);
    }
    if (e.kind === 'vs_back') {
      const row = target.slot > 6 ? 'back' : target.slot > 3 ? 'mid' : 'front';
      if (row === 'back' || row === 'mid') {
        m *= growRuleMult(actor, e.multiplier ?? 1.18);
      }
    }
    if (e.kind === 'fortune_strike') {
      const luck = actor.fortuneRating > 0 ? Math.min(0.35, actor.fortuneRating / (actor.fortuneRating + 100)) : 0;
      m *= 1 + luck * growRuleMult(actor, e.multiplier ?? 1.25) * 0.4;
    }
    if (e.kind === 'blood_pact') {
      m *= growRuleMult(actor, e.multiplier ?? 1.28);
    }
    if (e.kind === 'dao_stack') {
      const dao = actor.statuses.find((s) => s.statusId === 'dao' && s.remaining > 0);
      const layers = dao?.layers ?? 0;
      if (layers > 0) m *= 1 + growRuleRatio(actor, e.value ?? 0.1, 0.4) * layers;
    }
    if (e.kind === 'focus_streak') {
      const stacks = actor.focusStreak ?? 0;
      if (stacks > 0) {
        m *= 1 + growRuleRatio(actor, e.value ?? 0.08, 0.2) * Math.min(stacks, 3);
      }
    }
  }
  return m;
}

/** 治疗乘区：残血加疗 */
export function skillHealMult(
  target: UnitRuntime,
  skill: SkillDef | undefined,
  actor?: UnitRuntime,
): number {
  let m = 1;
  for (const e of effectsOf(skill)) {
    if (e.kind === 'heal_low_hp') {
      const thr = e.value ?? 0.4;
      if (target.maxHp > 0 && target.hp / target.maxHp <= thr) {
        m *= growRuleMult(actor, e.multiplier ?? 1.5);
      }
    }
  }
  return m;
}

export function hasEffect(skill: SkillDef | undefined, kind: string): SkillEffect | undefined {
  return effectsOf(skill).find((e) => e.kind === kind);
}

/** 击杀返还能量：按 qiCost × value（缺省 0.5） */
export function qiRefundOnKill(
  skill: SkillDef | undefined,
  killCount: number,
  actor?: UnitRuntime,
): number {
  if (killCount <= 0) return 0;
  const e = hasEffect(skill, 'refund_qi_on_kill');
  if (!e) return 0;
  const ratio = growRuleRatio(actor, e.value ?? 0.5, 0.8);
  return Math.max(0, Math.floor(skill!.qiCost * ratio * Math.min(killCount, 2)));
}

/** 击杀回血：maxHp × value（缺省 0.12）× 击杀数（最多 2） */
export function hpHealOnKill(actor: UnitRuntime, skill: SkillDef | undefined, killCount: number): number {
  if (killCount <= 0) return 0;
  const e = hasEffect(skill, 'heal_on_kill');
  if (!e) return 0;
  const ratio = growRuleRatio(actor, e.value ?? 0.12, 0.25);
  return Math.max(0, Math.floor(actor.maxHp * ratio * Math.min(killCount, 2)));
}

/** 伤疗同源：造伤按比例抬最残队友 */
export function atonementHealAmount(
  skill: SkillDef | undefined,
  damageDealt: number,
  actor?: UnitRuntime,
): number {
  if (damageDealt <= 0) return 0;
  const e = hasEffect(skill, 'atonement');
  if (!e) return 0;
  return Math.max(0, Math.floor(damageDealt * growRuleRatio(actor, e.value ?? 0.22, 0.4)));
}

/** 以伤回血：按近期承伤回血，帽 35% 生命 */
export function healFromTakenAmount(actor: UnitRuntime, skill: SkillDef | undefined): number {
  const e = hasEffect(skill, 'heal_from_taken');
  if (!e) return 0;
  const taken = actor.recentDamageTaken ?? 0;
  if (taken <= 0) return 0;
  const cap = Math.floor(actor.maxHp * 0.35);
  return Math.min(cap, Math.max(0, Math.floor(taken * growRuleRatio(actor, e.value ?? 0.5, 0.75))));
}

export function pickLowestHpLiving(units: UnitRuntime[]): UnitRuntime | null {
  const living = units.filter((u) => !u.dead && u.hp > 0);
  if (!living.length) return null;
  return [...living].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp || a.maxHp - b.maxHp)[0] ?? null;
}

export function bumpFocusStreak(actor: UnitRuntime, focus: UnitRuntime | undefined): void {
  if (!focus) {
    actor.focusStreak = 0;
    actor.lastSkillTargetUid = undefined;
    return;
  }
  if (actor.lastSkillTargetUid === focus.uid) {
    actor.focusStreak = Math.min(3, (actor.focusStreak ?? 0) + 1);
  } else {
    actor.lastSkillTargetUid = focus.uid;
    actor.focusStreak = 0;
  }
}
