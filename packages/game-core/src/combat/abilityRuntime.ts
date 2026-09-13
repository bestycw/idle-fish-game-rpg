/**
 * 能力池战斗钩子。主循环只调本模块 / StatusDef flag，禁止堆具体能力 id。
 */
import { colOf, rowOf } from '../formation/grid.js';
import type { BattleEvent, BattleState, SkillDef, UnitRuntime } from '../shared/types.js';
import { isLiving, livingUnits } from './lifecycle.js';
import { growRuleRatio, hasEffect } from './skillRules.js';
import { getStatusDef, statusLabel, unitHasStatusFlag } from './statusFx.js';

type Emit = (state: BattleState, code: BattleEvent['code'], payload: Record<string, unknown>) => void;

export function capIncomingHit(target: UnitRuntime, amount: number): number {
  let capped = amount;
  for (const s of target.statuses) {
    if (s.remaining <= 0) continue;
    const def = getStatusDef(s.statusId);
    if (!def?.maxHitRatioFromValue || s.value == null) continue;
    const maxHit = Math.max(1, Math.floor(target.maxHp * s.value));
    capped = Math.min(capped, maxHit);
  }
  return capped;
}

/** 义护：带 shareDamage 且 sourceUid=承伤者的队友分走 30% */
export function shareIncomingHpLoss(
  state: BattleState,
  target: UnitRuntime,
  hpLoss: number,
  emit: Emit,
): number {
  if (hpLoss <= 0) return hpLoss;
  const side = state.player.units.includes(target) ? state.player.units : state.enemy.units;
  const guardians = livingUnits(side).filter((u) => {
    if (u.uid === target.uid) return false;
    return u.statuses.some(
      (s) =>
        s.remaining > 0 &&
        s.sourceUid === target.uid &&
        Boolean(getStatusDef(s.statusId)?.shareDamage),
    );
  });
  if (!guardians.length) {
    // 反过来：承伤者自己身上的 oath，source 是守护者
    const oath = target.statuses.find(
      (s) => s.remaining > 0 && s.sourceUid && Boolean(getStatusDef(s.statusId)?.shareDamage),
    );
    if (oath?.sourceUid) {
      const src = livingUnits(side).find((u) => u.uid === oath.sourceUid);
      if (src) guardians.push(src);
    }
  }
  if (!guardians.length) return hpLoss;
  const guard = guardians[0]!;
  const share = Math.floor(hpLoss * 0.3);
  if (share <= 0) return hpLoss;
  const absorb = Math.min(Math.max(0, guard.hp - 1), share);
  if (absorb <= 0) return hpLoss;
  guard.hp -= absorb;
  emit(state, 'hit', {
    actor: guard.name,
    target: guard.name,
    amount: absorb,
    knockdown: false,
  });
  state.log.push(`${guard.name}【义护】为 ${target.name} 分摊 ${absorb}。`);
  return hpLoss - absorb;
}

/** 掩护：前排带 coverFront 的队友为中后排挡 12% */
export function coverFrontIncoming(
  state: BattleState,
  target: UnitRuntime,
  amount: number,
): number {
  if (rowOf(target.slot) === 'front' || amount <= 0) return amount;
  const side = state.player.units.includes(target) ? state.player.units : state.enemy.units;
  const covers = livingUnits(side).filter(
    (u) =>
      u.uid !== target.uid &&
      rowOf(u.slot) === 'front' &&
      unitHasStatusFlag(u, 'coverFront'),
  );
  if (!covers.length) return amount;
  const cover = covers[0]!;
  const share = Math.floor(amount * 0.12);
  if (share <= 0) return amount;
  const absorb = Math.min(Math.max(0, cover.hp - 1), share);
  if (absorb <= 0) return amount;
  cover.hp -= absorb;
  state.log.push(`${cover.name}【掩护】为 ${target.name} 分走 ${absorb}。`);
  return amount - absorb;
}

export function tryPreventLethalStatus(unit: UnitRuntime): boolean {
  const inst = unit.statuses.find((s) => {
    if (s.remaining <= 0) return false;
    return Boolean(getStatusDef(s.statusId)?.preventLethal);
  });
  if (!inst) return false;
  unit.hp = 1;
  unit.dead = false;
  const def = getStatusDef(inst.statusId);
  if (def?.consumeOnPreventLethal) {
    unit.statuses = unit.statuses.filter((s) => s !== inst);
  }
  return true;
}

export function statusCritChanceBonus(actor: UnitRuntime): number {
  let bonus = 0;
  for (const s of actor.statuses) {
    if (s.remaining <= 0) continue;
    bonus += getStatusDef(s.statusId)?.critChanceBonus ?? 0;
  }
  return bonus;
}

export function consumeNextSkillCrit(actor: UnitRuntime): boolean {
  const inst = actor.statuses.find((s) => {
    if (s.remaining <= 0) return false;
    return Boolean(getStatusDef(s.statusId)?.nextSkillCrit);
  });
  if (!inst) return false;
  actor.statuses = actor.statuses.filter((s) => s !== inst);
  return true;
}

export function applyBloodPactCost(
  state: BattleState,
  actor: UnitRuntime,
  skill: SkillDef | undefined,
  emit: Emit,
): void {
  if (!hasEffect(skill, 'blood_pact')) return;
  const cost = Math.max(1, Math.floor(actor.maxHp * 0.08));
  actor.hp = Math.max(1, actor.hp - cost);
  emit(state, 'hit', {
    actor: actor.name,
    target: actor.name,
    amount: cost,
    knockdown: false,
  });
}

export function trySecondWind(state: BattleState, unit: UnitRuntime, emit: Emit): void {
  if (!unit.secondWind || unit.dead || unit.hp <= 0) return;
  if (unit.maxHp <= 0 || unit.hp / unit.maxHp > 0.35) return;
  if (unit.t3State?.secondWindUsed) return;
  if (unitHasStatusFlag(unit, 'healBlocked')) return;
  unit.t3State = { ...(unit.t3State ?? {}), secondWindUsed: true };
  const heal = Math.max(1, Math.floor(unit.maxHp * 0.15));
  const before = unit.hp;
  unit.hp = Math.min(unit.maxHp, unit.hp + heal);
  const got = unit.hp - before;
  if (got > 0) {
    emit(state, 'heal', { actor: unit.name, target: unit.name, amount: got });
    state.log.push(`${unit.name}【残阳】回血 ${got}。`);
  }
}

export function applyQiOnHit(unit: UnitRuntime, grant: (u: UnitRuntime, amount: number) => void): void {
  const amt = unit.qiOnHit ?? 0;
  if (amt > 0) grant(unit, amt);
}

export function applyLinkHealOverflow(healer: UnitRuntime, target: UnitRuntime, overflow: number): void {
  if (!healer.linkHeal || overflow <= 0) return;
  target.shield += overflow;
}

export interface AfterSkillHitCtx {
  state: BattleState;
  actor: UnitRuntime;
  skill: SkillDef;
  targets: UnitRuntime[];
  foes: UnitRuntime[];
  rng: { next: () => number };
  totalDealt: number;
  killCount: number;
  emit: Emit;
  hitTarget: (target: UnitRuntime, multiplier: number) => number;
}

export function afterOffensiveSkill(ctx: AfterSkillHitCtx): void {
  const { state, actor, skill, targets, foes, totalDealt, killCount, emit, hitTarget } = ctx;
  const healOnSkill = hasEffect(skill, 'heal_on_skill');
  if (healOnSkill && totalDealt > 0 && !unitHasStatusFlag(actor, 'healBlocked')) {
    const amt = Math.max(1, Math.floor(totalDealt * growRuleRatio(actor, healOnSkill.value ?? 0.12, 0.25)));
    const before = actor.hp;
    actor.hp = Math.min(actor.maxHp, actor.hp + amt);
    const got = actor.hp - before;
    if (got > 0) emit(state, 'heal', { actor: actor.name, target: actor.name, amount: got });
  }

  const extraFront = hasEffect(skill, 'extra_hit_front');
  if (extraFront) {
    const front = livingUnits(foes).filter(
      (u) => rowOf(u.slot) === 'front' && !targets.some((t) => t.uid === u.uid),
    );
    const pick = front[0];
    if (pick) {
      const dmg = hitTarget(pick, extraFront.multiplier ?? 0.45);
      if (dmg > 0) {
        emit(state, 'follow_up', { actor: actor.name, target: pick.name, amount: dmg });
        state.log.push(`${actor.name}【扫尾】${pick.name} ${dmg}。`);
      }
    }
  }

  const clone = hasEffect(skill, 'clone_hit');
  if (clone) {
    const focus = livingUnits(targets)[0];
    if (focus) {
      const dmg = hitTarget(focus, clone.multiplier ?? 0.4);
      if (dmg > 0) {
        emit(state, 'follow_up', { actor: actor.name, target: focus.name, amount: dmg });
        state.log.push(`${actor.name}【影袭】${focus.name} ${dmg}。`);
      }
    }
  }

  const chase = hasEffect(skill, 'on_kill_follow');
  if (chase && killCount > 0) {
    const next = livingUnits(foes).find((u) => !targets.some((t) => t.uid === u.uid)) ?? livingUnits(foes)[0];
    if (next && isLiving(next)) {
      const dmg = hitTarget(next, chase.multiplier ?? 0.5);
      if (dmg > 0) {
        emit(state, 'follow_up', { actor: actor.name, target: next.name, amount: dmg });
        state.log.push(`${actor.name}【追亡】${next.name} ${dmg}。`);
      }
    }
  }

  const over = hasEffect(skill, 'overkill_col');
  if (over) {
    for (const t of targets) {
      if (!t.dead) continue;
      const col = colOf(t.slot);
      const next = livingUnits(foes).find((u) => colOf(u.slot) === col && u.uid !== t.uid);
      if (!next) continue;
      const dmg = hitTarget(next, over.value ?? 0.25);
      if (dmg > 0) {
        state.log.push(`${actor.name}【列贯】余伤砸向 ${next.name} ${dmg}。`);
      }
    }
  }
}

export function afterHealSkill(
  state: BattleState,
  actor: UnitRuntime,
  skill: SkillDef,
  allies: UnitRuntime[],
  healedAmount: number,
  emit: Emit,
): void {
  const follow = hasEffect(skill, 'follow_heal');
  if (!follow || healedAmount <= 0) return;
  const lowest = [...livingUnits(allies)].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  if (!lowest || unitHasStatusFlag(lowest, 'healBlocked')) return;
  const extra = Math.max(1, Math.floor(healedAmount * (follow.value ?? 0.4)));
  const room = lowest.maxHp - lowest.hp;
  const applied = Math.min(room, extra);
  if (applied > 0) {
    lowest.hp += applied;
    emit(state, 'heal', { actor: actor.name, target: lowest.name, amount: applied });
  }
  applyLinkHealOverflow(actor, lowest, extra - applied);
}

export function tryReflectCc(
  state: BattleState,
  actor: UnitRuntime,
  target: UnitRuntime,
  statusId: string,
  duration: number,
  emit: Emit,
): void {
  if (!unitHasStatusFlag(target, 'reflectCc')) return;
  const meta = getStatusDef(statusId);
  if (meta?.kind !== 'cc' && !meta?.ccDrBucket) return;
  if (!isLiving(actor) || actor.uid === target.uid) return;
  if (actor.statuses.some((s) => s.statusId === statusId && s.remaining > 0)) return;
  const bounced = Math.max(1, Math.floor(duration * 0.5));
  actor.statuses.push({ statusId, remaining: bounced });
  emit(state, 'status_apply', {
    actor: target.name,
    target: actor.name,
    status: statusLabel(statusId),
    duration: bounced,
  });
  state.log.push(`${target.name}【反制】将 ${statusLabel(statusId)} 弹回 ${actor.name}。`);
}

export function tauntLockedFocus(actor: UnitRuntime, foes: UnitRuntime[]): UnitRuntime | null {
  const taunt = actor.statuses.find((s) => {
    if (s.remaining <= 0 || !s.sourceUid) return false;
    return Boolean(getStatusDef(s.statusId)?.forcesFocus);
  });
  if (!taunt?.sourceUid) return null;
  return livingUnits(foes).find((u) => u.uid === taunt.sourceUid) ?? null;
}
