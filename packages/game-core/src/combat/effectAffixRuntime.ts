/**
 * T3 效果词缀战斗运行时 —— 在 combat.ts 各钩子点触发。
 * 所有函数只操作 UnitRuntime/BattleState，不持有额外状态。
 */
import type { BattleEvent, BattleState, Rng, UnitRuntime } from '../shared/types.js';
import { livingUnits, isLiving } from './lifecycle.js';
import { getStatusDef, statusLabel } from './statusFx.js';

// ─── helpers ──────────────────────────────────────────────

/** Check if unit has a specific T3 effect */
export function hasEffectAffix(unit: UnitRuntime, fxId: string): boolean {
  return unit.effectAffixIds?.includes(fxId) ?? false;
}

function emitFx(
  state: BattleState,
  code: BattleEvent['code'],
  payload: Record<string, unknown>,
): void {
  const event: BattleEvent = { code, turn: state.turn, payload };
  state.events.push(event);
  // T3 triggers share existing event codes; we add a log line directly
}

function logFx(state: BattleState, msg: string): void {
  state.log.push(msg);
}

function clampQi(unit: UnitRuntime, gain: number): number {
  const before = unit.qi;
  unit.qi = Math.min(unit.maxQi, unit.qi + gain);
  return unit.qi - before;
}

// ─── Hook: onBattleStart ──────────────────────────────────

/** Hook: on battle start (called once per unit at battle begin) */
export function onBattleStart(state: BattleState, unit: UnitRuntime, _rng: Rng): void {
  // fx_start_shield: 开战→获15%最大生命护盾
  if (hasEffectAffix(unit, 'fx_start_shield')) {
    const amt = Math.floor(unit.maxHp * 0.15);
    unit.shield += amt;
    emitFx(state, 'shield_gain', { actor: unit.name, target: unit.name, amount: amt });
    logFx(state, `${unit.name}【先手结界】获得 ${amt} 点护盾。`);
  }

  // fx_qi_start: 开战→能量+15
  if (hasEffectAffix(unit, 'fx_qi_start')) {
    const gained = clampQi(unit, 15);
    if (gained > 0) {
      emitFx(state, 'qi_gain', { actor: unit.name, qiGain: gained, qi: unit.qi, maxQi: unit.maxQi });
      logFx(state, `${unit.name}【先天蓄能】能量 +${gained}。`);
    }
  }
}

// ─── Hook: onTurnStart ────────────────────────────────────

/** Hook: on turn start (called each turn for each living unit) */
export function onTurnStart(state: BattleState, unit: UnitRuntime, _rng: Rng): void {
  // fx_low_regen: HP<25%+回合开始→回8%血
  if (hasEffectAffix(unit, 'fx_low_regen') && unit.hp / unit.maxHp < 0.25) {
    const heal = Math.floor(unit.maxHp * 0.08);
    unit.hp = Math.min(unit.maxHp, unit.hp + heal);
    emitFx(state, 'heal', { actor: unit.name, target: unit.name, amount: heal });
    logFx(state, `${unit.name}【绝境回春】回复 ${heal} 点生命。`);
  }
}

// ─── Hook: onCritHit ──────────────────────────────────────

/** Hook: on crit hit (called after crit is confirmed) */
export function onCritHit(state: BattleState, actor: UnitRuntime, target: UnitRuntime, _rng: Rng): void {
  // fx_crit_bleed: 暴击→挂1层流血(2回合)
  if (hasEffectAffix(actor, 'fx_crit_bleed') && isLiving(target)) {
    const existing = target.statuses.find((s) => s.statusId === 'bleed');
    const maxLayers = 3;
    const layers = Math.min(maxLayers, (existing?.layers ?? 0) + 1);
    target.statuses = target.statuses.filter((s) => s.statusId !== 'bleed');
    target.statuses.push({ statusId: 'bleed', layers, remaining: 2, value: 0.03 });
    emitFx(state, 'status_apply', {
      actor: actor.name,
      target: target.name,
      status: statusLabel('bleed'),
      duration: 2,
    });
    logFx(state, `${actor.name}【噬血锋】暴击附带流血（${layers}层）。`);
  }

  // fx_crit_qi: 暴击→回能+10
  if (hasEffectAffix(actor, 'fx_crit_qi')) {
    const gained = clampQi(actor, 10);
    if (gained > 0) {
      emitFx(state, 'qi_gain', { actor: actor.name, qiGain: gained, qi: actor.qi, maxQi: actor.maxQi });
      logFx(state, `${actor.name}【会心蓄势】暴击回能 +${gained}。`);
    }
  }
}

// ─── Hook: onKill ─────────────────────────────────────────

/** Hook: on kill */
export function onKill(state: BattleState, actor: UnitRuntime, _target: UnitRuntime, _rng: Rng): void {
  // fx_kill_qi: 击杀→回能+20
  if (hasEffectAffix(actor, 'fx_kill_qi')) {
    const gained = clampQi(actor, 20);
    if (gained > 0) {
      emitFx(state, 'qi_gain', { actor: actor.name, qiGain: gained, qi: actor.qi, maxQi: actor.maxQi });
      logFx(state, `${actor.name}【杀意回元】击杀回能 +${gained}。`);
    }
  }

  // fx_kill_heal: 击杀→回15%最大生命
  if (hasEffectAffix(actor, 'fx_kill_heal')) {
    const heal = Math.floor(actor.maxHp * 0.15);
    actor.hp = Math.min(actor.maxHp, actor.hp + heal);
    emitFx(state, 'heal', { actor: actor.name, target: actor.name, amount: heal });
    logFx(state, `${actor.name}【嗜杀汲命】击杀回血 ${heal}。`);
  }
}

// ─── Hook: onTakeDamage ──────────────────────────────────

/** Hook: on take damage (called on the target after damage is dealt) */
export function onTakeDamage(state: BattleState, _actor: UnitRuntime, target: UnitRuntime, damage: number, rng: Rng): void {
  // fx_hit_shield: 被击→20%获护盾(10%最大生命)
  if (hasEffectAffix(target, 'fx_hit_shield') && damage > 0 && isLiving(target)) {
    if (rng.next() < 0.20) {
      const amt = Math.floor(target.maxHp * 0.10);
      target.shield += amt;
      emitFx(state, 'shield_gain', { actor: target.name, target: target.name, amount: amt });
      logFx(state, `${target.name}【临危结界】被击触发护盾 ${amt}。`);
    }
  }
}

// ─── Hook: onBlock ────────────────────────────────────────

/** Hook: on block */
export function onBlock(state: BattleState, target: UnitRuntime, _rng: Rng): void {
  // fx_block_qi: 格挡→回能+10
  if (hasEffectAffix(target, 'fx_block_qi')) {
    const gained = clampQi(target, 10);
    if (gained > 0) {
      emitFx(state, 'qi_gain', { actor: target.name, qiGain: gained, qi: target.qi, maxQi: target.maxQi });
      logFx(state, `${target.name}【铁壁蓄能】格挡回能 +${gained}。`);
    }
  }
}

// ─── Hook: onLethalDamage ─────────────────────────────────

/** Hook: on lethal damage (before death, can save) - returns true if saved */
export function onLethalDamage(state: BattleState, unit: UnitRuntime, _rng: Rng): boolean {
  // fx_death_save: 致死→存活1血(每场1次)
  if (hasEffectAffix(unit, 'fx_death_save') && !unit.effectAffixDeathSaveUsed) {
    unit.effectAffixDeathSaveUsed = true;
    unit.hp = 1;
    unit.dead = false;
    logFx(state, `${unit.name}【逆天改命】致命一击后奇迹存活！`);
    return true;
  }
  return false;
}

// ─── Hook: attackDamageBonus ──────────────────────────────

/** Hook: compute damage bonus for attacker based on T3. Returns additive multiplier (0 = no bonus). */
export function attackDamageBonus(actor: UnitRuntime, target: UnitRuntime): number {
  let bonus = 0;

  // fx_first_hit: 首击→伤害+30%
  // Triggers if actor qi <= BATTLE_START_QI (20) — meaning no basic attack qi gain has occurred yet.
  // This is a reliable "first action" heuristic since basic attacks grant +20 qi.
  if (hasEffectAffix(actor, 'fx_first_hit') && actor.qi <= 35) {
    bonus += 0.30;
  }

  // fx_low_execute: 目标HP<30%→伤害+20%
  if (hasEffectAffix(actor, 'fx_low_execute') && target.hp / target.maxHp < 0.30) {
    bonus += 0.20;
  }

  // fx_mark_amp: 目标有猎印→+15%伤害
  if (hasEffectAffix(actor, 'fx_mark_amp')) {
    const hasMark = target.statuses.some((s) => s.statusId === 'mark_prey' && s.remaining > 0);
    if (hasMark) bonus += 0.15;
  }

  return bonus;
}

// ─── Hook: onHitTarget (for splash / pen_shred / purge) ──

/** Hook: after a single-target hit lands. Returns splash damage dealt (0 if none). */
export function onHitTarget(
  state: BattleState,
  actor: UnitRuntime,
  target: UnitRuntime,
  damage: number,
  foes: UnitRuntime[],
  rng: Rng,
): void {
  // fx_splash: 单体命中→15%溅射相邻30%伤害
  if (hasEffectAffix(actor, 'fx_splash') && damage > 0) {
    if (rng.next() < 0.15) {
      const splashDmg = Math.max(1, Math.floor(damage * 0.30));
      // Pick one adjacent living enemy (different from target)
      const adjacent = livingUnits(foes).filter((u) => u.uid !== target.uid);
      if (adjacent.length > 0) {
        const splashTarget = rng.pick(adjacent);
        // Apply splash damage directly
        const shieldAbsorb = Math.min(splashTarget.shield, splashDmg);
        splashTarget.shield -= shieldAbsorb;
        const hpDmg = splashDmg - shieldAbsorb;
        if (hpDmg > 0) splashTarget.hp = Math.max(0, splashTarget.hp - hpDmg);
        emitFx(state, 'hit', { actor: actor.name, target: splashTarget.name, amount: splashDmg, knockdown: splashTarget.hp <= 0 });
        logFx(state, `${actor.name}【震荡】溅射→${splashTarget.name}，伤害 ${splashDmg}。`);
        if (splashTarget.hp <= 0 && !splashTarget.dead) {
          splashTarget.dead = true;
          splashTarget.hp = 0;
          logFx(state, `${splashTarget.name} 倒下。`);
          emitFx(state, 'unit_down', { target: splashTarget.name });
        }
      }
    }
  }

  // fx_pen_shred: 穿透高→附带破甲1回合
  // In this version there's no penRating stat; we trigger unconditionally if the unit has the affix.
  if (hasEffectAffix(actor, 'fx_pen_shred') && damage > 0 && isLiving(target)) {
    target.statuses = target.statuses.filter((s) => s.statusId !== 'shred');
    target.statuses.push({ statusId: 'shred', remaining: 1, value: 0.7 });
    emitFx(state, 'status_apply', {
      actor: actor.name,
      target: target.name,
      status: statusLabel('shred'),
      duration: 1,
    });
    logFx(state, `${actor.name}【透甲蚀骨】附带破甲 1 回合。`);
  }

  // fx_purge_hit: 目标有盾→驱散护盾
  if (hasEffectAffix(actor, 'fx_purge_hit') && isLiving(target) && target.shield > 0) {
    const removed = target.shield;
    target.shield = 0;
    logFx(state, `${actor.name}【破灵一击】驱散 ${target.name} 护盾 ${removed}。`);
  }
}

// ─── Hook: onHealApplied (for heal_cleanse) ──────────────

/** Hook: after heal is applied to a target */
export function onHealApplied(state: BattleState, healer: UnitRuntime, target: UnitRuntime, rng: Rng): void {
  // fx_heal_cleanse: 治疗→30%净化1个debuff
  if (hasEffectAffix(healer, 'fx_heal_cleanse') && rng.next() < 0.30) {
    const debuffs = target.statuses.filter((s) => {
      if (s.remaining <= 0) return false;
      const def = getStatusDef(s.statusId);
      return def?.cleanseable === true;
    });
    if (debuffs.length > 0) {
      const pick = rng.pick(debuffs);
      target.statuses = target.statuses.filter((s) => s.statusId !== pick.statusId);
      emitFx(state, 'status_remove', {
        target: target.name,
        status: statusLabel(pick.statusId),
        reason: '净疗净化',
      });
      logFx(state, `${healer.name}【净疗】净化了 ${target.name} 的 ${statusLabel(pick.statusId)}。`);
    }
  }
}

// ─── Hook: ccDurationReduction (for fx_cc_cut) ────────────

/** Hook: reduce CC duration if target has fx_cc_cut. Returns adjusted duration. */
export function ccDurationReduction(target: UnitRuntime, duration: number): number {
  if (hasEffectAffix(target, 'fx_cc_cut') && duration > 1) {
    return Math.max(1, duration - 1);
  }
  return duration;
}

