/**
 * T3 运行时：战斗主循环只调钩子名；具体效果用 registerT3Hooks 注册。
 */
import type { BattleEvent, BattleState, Rng, UnitRuntime } from '../shared/types.js';
import { livingUnits, isLiving, tryStandFromLethal } from './lifecycle.js';
import { getStatusDef, statusLabel } from './statusFx.js';
import { adjacentSlots, rowOf } from '../formation/grid.js';

export interface T3HookCtx {
  state: BattleState;
  rng: Rng;
  actor?: UnitRuntime;
  target?: UnitRuntime;
  damage?: number;
  foes?: UnitRuntime[];
  allies?: UnitRuntime[];
  skillHit?: boolean;
  statusId?: string;
}

export interface T3Hooks {
  onBattleStart?: (unit: UnitRuntime, ctx: T3HookCtx) => void;
  onTurnStart?: (unit: UnitRuntime, ctx: T3HookCtx) => void;
  onCritHit?: (ctx: T3HookCtx) => void;
  onKill?: (ctx: T3HookCtx) => void;
  onTakeDamage?: (ctx: T3HookCtx) => void;
  onBlock?: (unit: UnitRuntime, ctx: T3HookCtx) => void;
  onDodge?: (unit: UnitRuntime, ctx: T3HookCtx) => void;
  onLethalDamage?: (unit: UnitRuntime, ctx: T3HookCtx) => boolean;
  onHitTarget?: (ctx: T3HookCtx) => void;
  onHealApplied?: (ctx: T3HookCtx) => void;
  onSkillCast?: (unit: UnitRuntime, ctx: T3HookCtx) => void;
  onStatusApplied?: (ctx: T3HookCtx) => void;
  onStatusExpire?: (unit: UnitRuntime, statusId: string, ctx: T3HookCtx) => void;
  ccDurationReduction?: (unit: UnitRuntime, duration: number) => number;
}

const hooks = new Map<string, T3Hooks>();

export function registerT3Hooks(id: string, set: T3Hooks): void {
  hooks.set(id, set);
}

export function hasEffectAffix(unit: UnitRuntime, fxId: string): boolean {
  return unit.effectAffixIds?.includes(fxId) ?? false;
}

function each(unit: UnitRuntime | undefined, fn: (h: T3Hooks, id: string) => void): void {
  if (!unit?.effectAffixIds) return;
  for (const id of unit.effectAffixIds) {
    const h = hooks.get(id);
    if (h) fn(h, id);
  }
}

function emitFx(state: BattleState, code: BattleEvent['code'], payload: Record<string, unknown>): void {
  state.events.push({ code, turn: state.turn, payload });
}

function logFx(state: BattleState, msg: string): void {
  state.log.push(msg);
}

function clampQi(unit: UnitRuntime, gain: number): number {
  const before = unit.qi;
  unit.qi = Math.min(unit.maxQi, unit.qi + gain);
  return unit.qi - before;
}

function flag(unit: UnitRuntime): Record<string, number | boolean | string> {
  unit.t3State = unit.t3State ?? {};
  return unit.t3State;
}

function applyBleed(state: BattleState, actor: UnitRuntime, target: UnitRuntime, layersAdd = 1): void {
  const existing = target.statuses.find((s) => s.statusId === 'bleed');
  const layers = Math.min(3, (existing?.layers ?? 0) + layersAdd);
  target.statuses = target.statuses.filter((s) => s.statusId !== 'bleed');
  target.statuses.push({ statusId: 'bleed', layers, remaining: 2, value: 0.03 });
  emitFx(state, 'status_apply', {
    actor: actor.name,
    target: target.name,
    status: statusLabel('bleed'),
    duration: 2,
  });
}

function adjacentLiving(units: UnitRuntime[], slot: UnitRuntime['slot'], exceptUid?: string): UnitRuntime[] {
  const adj = new Set(adjacentSlots(slot));
  return livingUnits(units).filter((u) => adj.has(u.slot) && u.uid !== exceptUid);
}

function applyStatusOnce(
  state: BattleState,
  actor: UnitRuntime,
  target: UnitRuntime,
  statusId: string,
  remaining: number,
  extra?: { value?: number },
): void {
  target.statuses = target.statuses.filter((s) => s.statusId !== statusId);
  target.statuses.push({ statusId, remaining, value: extra?.value });
  emitFx(state, 'status_apply', {
    actor: actor.name,
    target: target.name,
    status: statusLabel(statusId),
    duration: remaining,
  });
}

registerT3Hooks('fx_crit_bleed', {
  onCritHit: ({ state, actor, target }) => {
    if (!actor || !target || !isLiving(target)) return;
    applyBleed(state, actor, target);
    logFx(state, `${actor.name}【噬血锋】暴击附带流血。`);
  },
});

registerT3Hooks('fx_slow_hit', {
  onHitTarget: ({ state, rng, actor, target, damage }) => {
    if (!actor || !target || !damage || !isLiving(target)) return;
    if (rng.next() >= 0.15) return;
    applyStatusOnce(state, actor, target, 'slow', 1);
    logFx(state, `${actor.name}【凝滞】附带迟缓。`);
  },
});

registerT3Hooks('fx_splash', {
  onHitTarget: ({ state, rng, actor, target, damage, foes }) => {
    if (!actor || !target || !damage || !foes) return;
    if (rng.next() >= 0.15) return;
    const adj = adjacentLiving(foes, target.slot, target.uid);
    if (adj.length === 0) return;
    const splashTarget = rng.pick(adj);
    const splashDmg = Math.max(1, Math.floor(damage * 0.25));
    const shieldAbsorb = Math.min(splashTarget.shield, splashDmg);
    splashTarget.shield -= shieldAbsorb;
    const hpDmg = splashDmg - shieldAbsorb;
    if (hpDmg > 0) splashTarget.hp = Math.max(0, splashTarget.hp - hpDmg);
    emitFx(state, 'hit', { actor: actor.name, target: splashTarget.name, amount: splashDmg, knockdown: splashTarget.hp <= 0 });
    logFx(state, `${actor.name}【震荡】溅射→${splashTarget.name}，伤害 ${splashDmg}。`);
    if (splashTarget.hp <= 0 && !splashTarget.dead) {
      const save = tryStandFromLethal(splashTarget, rng);
      if (save === 'nirvana') {
        emitFx(state, 'unit_revive', { target: splashTarget.name, reason: '涅槃' });
      } else if (save === 'resilience') {
        logFx(state, `${splashTarget.name}【不屈】绝处逢生，存活！`);
      } else {
        splashTarget.dead = true;
        splashTarget.hp = 0;
        emitFx(state, 'unit_down', { target: splashTarget.name });
      }
    }
  },
});

registerT3Hooks('fx_bleed_spread', {
  onKill: ({ state, rng, actor, target, foes }) => {
    if (!actor || !target || !foes) return;
    const hadBleed = target.statuses.some((s) => s.statusId === 'bleed');
    if (!hadBleed) return;
    const adj = adjacentLiving(foes, target.slot, target.uid);
    if (adj.length === 0) return;
    const spread = rng.pick(adj);
    applyBleed(state, actor, spread);
    logFx(state, `${actor.name}【溅血】流血扩散→${spread.name}。`);
  },
});

registerT3Hooks('fx_skill_mark', {
  onHitTarget: ({ state, rng, actor, target, skillHit, damage }) => {
    if (!skillHit || !actor || !target || !damage || !isLiving(target)) return;
    if (rng.next() >= 0.2) return;
    applyStatusOnce(state, actor, target, 'mark_prey', 1, { value: 1.15 });
    logFx(state, `${actor.name}【点印】挂上猎印。`);
  },
});

registerT3Hooks('fx_skill_shred', {
  onHitTarget: ({ state, rng, actor, target, skillHit, damage }) => {
    if (!skillHit || !actor || !target || !damage || !isLiving(target)) return;
    if (rng.next() >= 0.35) return;
    applyStatusOnce(state, actor, target, 'shred', 1, { value: 0.7 });
    logFx(state, `${actor.name}【裂甲】附带破甲。`);
  },
});

registerT3Hooks('fx_purge_hit', {
  onHitTarget: ({ state, actor, target }) => {
    if (!actor || !target || !isLiving(target) || target.shield <= 0) return;
    if (flag(actor)[`purge:${state.turn}`]) return;
    const removed = target.shield;
    target.shield = 0;
    flag(actor)[`purge:${state.turn}`] = true;
    logFx(state, `${actor.name}【破灵】驱散 ${target.name} 护盾 ${removed}。`);
    const gained = clampQi(actor, 4);
    if (hasEffectAffix(actor, 'fx_shield_qi') && gained > 0) {
      emitFx(state, 'qi_gain', { actor: actor.name, qiGain: gained, qi: actor.qi, maxQi: actor.maxQi });
    }
  },
});

registerT3Hooks('fx_soul_rip', {
  onKill: ({ state, actor }) => {
    if (!actor) return;
    const gained = clampQi(actor, 6);
    if (gained > 0) {
      emitFx(state, 'qi_gain', { actor: actor.name, qiGain: gained, qi: actor.qi, maxQi: actor.maxQi });
      logFx(state, `${actor.name}【夺魂】击杀回能 +${gained}。`);
    }
  },
});

registerT3Hooks('fx_shield_qi', {
  onHitTarget: ({ state, actor, target, damage }) => {
    if (!actor || !target || !damage) return;
    // 破盾由 applyDamage 在盾被打空时另调；此处覆盖「打掉剩余盾」
  },
});

registerT3Hooks('fx_follow_up', {
  onSkillCast: (unit) => {
    const st = flag(unit);
    if (st.shoushiUsed) return;
    st.shoushiArmed = true;
  },
});

registerT3Hooks('fx_start_shield', {
  onBattleStart: (unit, { state }) => {
    const amt = Math.floor(unit.maxHp * 0.08);
    unit.shield += amt;
    emitFx(state, 'shield_gain', { actor: unit.name, target: unit.name, amount: amt });
    logFx(state, `${unit.name}【先手结界】获得 ${amt} 点护盾。`);
  },
});

registerT3Hooks('fx_hit_shield', {
  onTakeDamage: ({ state, rng, target, damage }) => {
    if (!target || !damage || !isLiving(target)) return;
    if (rng.next() >= 0.15) return;
    const amt = Math.floor(target.maxHp * 0.06);
    target.shield += amt;
    emitFx(state, 'shield_gain', { actor: target.name, target: target.name, amount: amt });
    logFx(state, `${target.name}【临危结界】被击触发护盾 ${amt}。`);
  },
});

registerT3Hooks('fx_cc_cut', {
  ccDurationReduction: (_unit, duration) => Math.max(1, duration - 1),
});

registerT3Hooks('fx_death_save', {
  onLethalDamage: (unit, { state }) => {
    if (flag(unit).deathSaveUsed) return false;
    flag(unit).deathSaveUsed = true;
    unit.hp = 1;
    unit.dead = false;
    logFx(state, `${unit.name}【逆天改命】致命一击后奇迹存活！`);
    return true;
  },
});

registerT3Hooks('fx_self_cleanse', {
  onTurnStart: (unit, { state }) => {
    if (state.turn % 3 !== 0) return;
    const debuffs = unit.statuses.filter((s) => {
      if (s.remaining <= 0) return false;
      return getStatusDef(s.statusId)?.cleanseable === true;
    });
    if (debuffs.length === 0) return;
    const pick = debuffs[0]!;
    unit.statuses = unit.statuses.filter((s) => s.statusId !== pick.statusId);
    emitFx(state, 'status_remove', { target: unit.name, status: statusLabel(pick.statusId), reason: '自净' });
    logFx(state, `${unit.name}【自净】净化了 ${statusLabel(pick.statusId)}。`);
  },
});

registerT3Hooks('fx_block_qi', {
  onBlock: (unit, { state }) => {
    const gained = clampQi(unit, 5);
    if (gained > 0) {
      emitFx(state, 'qi_gain', { actor: unit.name, qiGain: gained, qi: unit.qi, maxQi: unit.maxQi });
      logFx(state, `${unit.name}【铁壁微息】格挡回能 +${gained}。`);
    }
  },
});

registerT3Hooks('fx_dodge_heal', {
  onDodge: (unit, { state }) => {
    const heal = Math.max(1, Math.floor(unit.maxHp * 0.02));
    unit.hp = Math.min(unit.maxHp, unit.hp + heal);
    emitFx(state, 'heal', { actor: unit.name, target: unit.name, amount: heal });
    logFx(state, `${unit.name}【闪身回元】闪避回血 ${heal}。`);
  },
});

registerT3Hooks('fx_heal_cleanse', {
  onHealApplied: ({ state, rng, actor, target }) => {
    if (!actor || !target || rng.next() >= 0.25) return;
    const debuffs = target.statuses.filter((s) => {
      if (s.remaining <= 0) return false;
      return getStatusDef(s.statusId)?.cleanseable === true;
    });
    if (debuffs.length === 0) return;
    const pick = rng.pick(debuffs);
    target.statuses = target.statuses.filter((s) => s.statusId !== pick.statusId);
    emitFx(state, 'status_remove', { target: target.name, status: statusLabel(pick.statusId), reason: '净疗' });
    logFx(state, `${actor.name}【净疗】净化了 ${target.name} 的 ${statusLabel(pick.statusId)}。`);
  },
});

registerT3Hooks('fx_buff_extend', {
  onStatusApplied: ({ rng, target, statusId }) => {
    if (!target || !statusId || rng.next() >= 0.25) return;
    const meta = getStatusDef(statusId);
    if (meta?.kind !== 'buff') return;
    const s = target.statuses.find((x) => x.statusId === statusId);
    if (s) s.remaining += 1;
  },
});

registerT3Hooks('fx_qi_share', {
  onSkillCast: (unit, { state, rng, allies }) => {
    if (!allies || rng.next() >= 0.25) return;
    const adj = adjacentLiving(allies, unit.slot, unit.uid);
    if (adj.length === 0) return;
    const ally = rng.pick(adj);
    const gained = clampQi(ally, 4);
    if (gained > 0) {
      emitFx(state, 'qi_gain', { actor: ally.name, qiGain: gained, qi: ally.qi, maxQi: ally.maxQi });
      logFx(state, `${unit.name}【引气】${ally.name} 能量 +${gained}。`);
    }
  },
});

registerT3Hooks('fx_debuff_reflect', {
  onStatusApplied: ({ state, rng, actor, target, statusId }) => {
    if (!actor || !target || !statusId) return;
    const meta = getStatusDef(statusId);
    if (!meta || (meta.kind !== 'debuff' && meta.kind !== 'cc')) return;
    if (rng.next() >= 0.15 || !isLiving(actor) || actor.uid === target.uid) return;
    if (actor.statuses.some((s) => s.statusId === statusId)) return;
    actor.statuses.push({ statusId, remaining: 1 });
    emitFx(state, 'status_apply', {
      actor: target.name,
      target: actor.name,
      status: statusLabel(statusId),
      duration: 1,
    });
    logFx(state, `${target.name}【因果】反弹 ${statusLabel(statusId)} 给 ${actor.name}。`);
  },
});

registerT3Hooks('fx_cc_end_heal', {
  onStatusExpire: (unit, statusId, { state }) => {
    if (getStatusDef(statusId)?.kind !== 'cc') return;
    const heal = Math.max(1, Math.floor(unit.maxHp * 0.04));
    unit.hp = Math.min(unit.maxHp, unit.hp + heal);
    emitFx(state, 'heal', { actor: unit.name, target: unit.name, amount: heal });
    logFx(state, `${unit.name}【起身】控制结束回血 ${heal}。`);
  },
});

export function onBattleStart(state: BattleState, unit: UnitRuntime, rng: Rng): void {
  each(unit, (h) => h.onBattleStart?.(unit, { state, rng }));
}

export function onTurnStart(state: BattleState, unit: UnitRuntime, rng: Rng): void {
  each(unit, (h) => h.onTurnStart?.(unit, { state, rng }));
}

export function onCritHit(state: BattleState, actor: UnitRuntime, target: UnitRuntime, rng: Rng): void {
  each(actor, (h) => h.onCritHit?.({ state, rng, actor, target }));
}

export function onKill(state: BattleState, actor: UnitRuntime, target: UnitRuntime, rng: Rng): void {
  const foes = state.player.units.includes(target) ? state.player.units : state.enemy.units;
  each(actor, (h) => h.onKill?.({ state, rng, actor, target, foes }));
}

export function onTakeDamage(state: BattleState, actor: UnitRuntime, target: UnitRuntime, damage: number, rng: Rng): void {
  each(target, (h) => h.onTakeDamage?.({ state, rng, actor, target, damage }));
}

export function onBlock(state: BattleState, target: UnitRuntime, rng: Rng): void {
  each(target, (h) => h.onBlock?.(target, { state, rng, target }));
}

export function onDodge(state: BattleState, target: UnitRuntime, rng: Rng): void {
  each(target, (h) => h.onDodge?.(target, { state, rng, target }));
}

export function onLethalDamage(state: BattleState, unit: UnitRuntime, rng: Rng): boolean {
  let saved = false;
  each(unit, (h) => {
    if (h.onLethalDamage?.(unit, { state, rng })) saved = true;
  });
  return saved;
}

export function onHitTarget(
  state: BattleState,
  actor: UnitRuntime,
  target: UnitRuntime,
  damage: number,
  foes: UnitRuntime[],
  rng: Rng,
  skillHit = false,
): void {
  each(actor, (h) => h.onHitTarget?.({ state, rng, actor, target, damage, foes, skillHit }));
}

export function onHealApplied(state: BattleState, healer: UnitRuntime, target: UnitRuntime, rng: Rng): void {
  each(healer, (h) => h.onHealApplied?.({ state, rng, actor: healer, target }));
}

export function onSkillCast(state: BattleState, unit: UnitRuntime, rng: Rng, allies: UnitRuntime[]): void {
  each(unit, (h) => h.onSkillCast?.(unit, { state, rng, allies }));
}

export function onStatusApplied(
  state: BattleState,
  actor: UnitRuntime,
  target: UnitRuntime,
  statusId: string,
  rng: Rng,
): void {
  each(target, (h) => h.onStatusApplied?.({ state, rng, actor, target, statusId }));
}

export function onStatusExpire(state: BattleState, unit: UnitRuntime, statusId: string, rng: Rng): void {
  each(unit, (h) => h.onStatusExpire?.(unit, statusId, { state, rng }));
}

export function ccDurationReduction(target: UnitRuntime, duration: number): number {
  let d = duration;
  each(target, (h) => {
    if (h.ccDurationReduction) d = h.ccDurationReduction(target, d);
  });
  return d;
}

/** 收势：下一记普攻 +0.3 */
export function followUpAttackMult(actor: UnitRuntime): number {
  if (actor.t3State?.shoushiArmed) {
    actor.t3State.shoushiArmed = false;
    actor.t3State.shoushiUsed = true;
    return 1.3;
  }
  return 1;
}

/** 同袍：相邻致死 20% 分摊 25% */
export function tryAllyCover(
  state: BattleState,
  target: UnitRuntime,
  remainHpDamage: number,
  rng: Rng,
): number {
  if (remainHpDamage < target.hp) return remainHpDamage;
  const side = state.player.units.includes(target) ? state.player.units : state.enemy.units;
  const covers = livingUnits(side).filter(
    (u) => u.uid !== target.uid && hasEffectAffix(u, 'fx_ally_cover') && adjacentSlots(target.slot).includes(u.slot),
  );
  for (const cover of covers) {
    if (rng.next() >= 0.2) continue;
    const share = Math.floor(remainHpDamage * 0.25);
    cover.hp = Math.max(1, cover.hp - share);
    logFx(state, `${cover.name}【同袍】为 ${target.name} 分摊 ${share}。`);
    return remainHpDamage - share;
  }
  return remainHpDamage;
}

/** 护阵：前排自己，后排相邻受伤分走 10%，每回合一次 */
export function tryFrontGuard(
  state: BattleState,
  target: UnitRuntime,
  damage: number,
): number {
  if (rowOf(target.slot) === 'front') return damage;
  const side = state.player.units.includes(target) ? state.player.units : state.enemy.units;
  const guards = livingUnits(side).filter(
    (u) =>
      hasEffectAffix(u, 'fx_front_guard') &&
      rowOf(u.slot) === 'front' &&
      adjacentSlots(target.slot).includes(u.slot) &&
      !flag(u)[`guard:${state.turn}`],
  );
  if (guards.length === 0) return damage;
  const guard = guards[0]!;
  const share = Math.floor(damage * 0.1);
  if (share <= 0) return damage;
  flag(guard)[`guard:${state.turn}`] = true;
  const absorb = Math.min(guard.hp - 1, share);
  if (absorb > 0) guard.hp -= absorb;
  logFx(state, `${guard.name}【护阵】为 ${target.name} 分走 ${absorb}。`);
  return damage - absorb;
}

export function grantShieldBreakQi(state: BattleState, actor: UnitRuntime): void {
  if (!hasEffectAffix(actor, 'fx_shield_qi')) return;
  const gained = clampQi(actor, 4);
  if (gained > 0) {
    emitFx(state, 'qi_gain', { actor: actor.name, qiGain: gained, qi: actor.qi, maxQi: actor.maxQi });
    logFx(state, `${actor.name}【破盾息】能量 +${gained}。`);
  }
}
