import type {
  BattleEvent,
  BattleState,
  DamageSchool,
  Rng,
  SkillEffect,
  SkillEffectKind,
  UnitRuntime,
} from '../shared/types.js';
import { getStatusDef, pickCleanseTarget, pickPurgeTarget, statusLabel, unitHasStatusFlag } from './statusFx.js';
import { isLiving, reviveUnit } from './lifecycle.js';

export interface SkillEffectContext {
  state: BattleState;
  actor: UnitRuntime;
  targets: UnitRuntime[];
  /** 己方存活单位（结界/回能队友） */
  allies: UnitRuntime[];
  effect: SkillEffect;
  rng: Rng;
  emit: (state: BattleState, code: BattleEvent['code'], payload: Record<string, unknown>) => void;
  /** 已含急速缩放的回能 */
  grantQi: (state: BattleState, unit: UnitRuntime, amount: number) => void;
  attackPower: (unit: UnitRuntime, school: DamageSchool) => number;
  shieldMasteryMult: (unit: UnitRuntime) => number;
}

export type SkillEffectHandler = (ctx: SkillEffectContext) => void;

const handlers = new Map<SkillEffectKind, SkillEffectHandler>();

export function registerSkillEffect(kind: SkillEffectKind, handler: SkillEffectHandler): void {
  handlers.set(kind, handler);
}

export function listSkillEffectKinds(): SkillEffectKind[] {
  return [...handlers.keys()];
}

function applyPurgeBacklash(ctx: SkillEffectContext, statusId: string): void {
  if (!getStatusDef(statusId)?.backlashOnCleanse) return;
  const actor = ctx.actor;
  if (!isLiving(actor)) return;
  const dmg = Math.max(1, Math.floor(actor.maxHp * 0.06));
  actor.hp = Math.max(1, actor.hp - dmg);
  ctx.emit(ctx.state, 'hit', {
    actor: actor.name,
    target: actor.name,
    amount: dmg,
    knockdown: false,
  });
}

function applyPurge(ctx: SkillEffectContext, target: UnitRuntime): void {
  const pick = pickPurgeTarget(target, ctx.rng);
  if (!pick) return;
  if (pick === 'shield') {
    const amount = target.shield;
    target.shield = 0;
    ctx.emit(ctx.state, 'status_remove', {
      actor: ctx.actor.name,
      target: target.name,
      status: '护盾',
      reason: '驱散',
      amount,
    });
    const trap = target.statuses.find((s) => getStatusDef(s.statusId)?.backlashOnCleanse && s.remaining > 0);
    if (trap) applyPurgeBacklash(ctx, trap.statusId);
    return;
  }
  target.statuses = target.statuses.filter((s) => s.statusId !== pick);
  ctx.emit(ctx.state, 'status_remove', {
    actor: ctx.actor.name,
    target: target.name,
    status: statusLabel(pick),
    reason: '驱散',
  });
  applyPurgeBacklash(ctx, pick);
}

function applyCleanse(ctx: SkillEffectContext, target: UnitRuntime): void {
  const pick = pickCleanseTarget(target, ctx.rng);
  if (!pick) return;
  target.statuses = target.statuses.filter((s) => s.statusId !== pick);
  ctx.emit(ctx.state, 'status_remove', {
    actor: ctx.actor.name,
    target: target.name,
    status: statusLabel(pick),
    reason: '净化',
  });
  applyPurgeBacklash(ctx, pick);
}

/** 内置非状态效果；新 kind 用 registerSkillEffect，勿改战斗主循环 if */
registerSkillEffect('purge', (ctx) => {
  for (const t of ctx.targets) applyPurge(ctx, t);
});
registerSkillEffect('cleanse', (ctx) => {
  for (const t of ctx.targets) applyCleanse(ctx, t);
});
registerSkillEffect('grant_qi', (ctx) => {
  ctx.grantQi(ctx.state, ctx.actor, ctx.effect.value ?? 10);
});

/** 治疗目标回能（华佗向） */
registerSkillEffect('ally_grant_qi', (ctx) => {
  const amount = ctx.effect.value ?? 15;
  for (const t of ctx.targets) {
    if (!isLiving(t)) continue;
    ctx.grantQi(ctx.state, t, amount);
  }
});

/** 结界：为己方挂盾（张飞当阳 / 雅典娜向） */
registerSkillEffect('team_shield', (ctx) => {
  const mult = ctx.effect.multiplier ?? 0.55;
  const school: DamageSchool = 'phys';
  const amt = Math.max(
    1,
    Math.floor(ctx.attackPower(ctx.actor, school) * mult * ctx.shieldMasteryMult(ctx.actor)),
  );
  for (const ally of ctx.allies) {
    if (!isLiving(ally)) continue;
    ally.shield += amt;
    ctx.emit(ctx.state, 'shield_gain', {
      actor: ctx.actor.name,
      target: ally.name,
      amount: amt,
    });
  }
});

/** 招魂：拉一名倒下队友（优先主角，其次生命上限低者） */
registerSkillEffect('revive_ally', (ctx) => {
  const fallen = ctx.allies.filter((u) => u.dead || u.hp <= 0);
  if (!fallen.length) return;
  const target = [...fallen].sort((a, b) => {
    if (a.isHero !== b.isHero) return a.isHero ? -1 : 1;
    return a.maxHp - b.maxHp;
  })[0]!;
  const ratio = ctx.effect.value ?? 0.35;
  reviveUnit(target, ratio);
  ctx.emit(ctx.state, 'unit_revive', {
    actor: ctx.actor.name,
    target: target.name,
    reason: '招魂',
  });
});

function applySelfBuff(
  ctx: SkillEffectContext,
  statusId: string,
  duration: number,
  extra?: { value?: number; layers?: number; sourceUid?: string },
): void {
  const actor = ctx.actor;
  if (!isLiving(actor)) return;
  actor.statuses = actor.statuses.filter((s) => s.statusId !== statusId);
  actor.statuses.push({
    statusId,
    remaining: duration,
    value: extra?.value,
    layers: extra?.layers,
    sourceUid: extra?.sourceUid,
  });
  ctx.emit(ctx.state, 'status_apply', {
    actor: actor.name,
    target: actor.name,
    status: statusLabel(statusId),
    duration,
  });
}

registerSkillEffect('self_atk_up', (ctx) => {
  applySelfBuff(ctx, 'atk_up', 2);
});
registerSkillEffect('self_def_up', (ctx) => {
  applySelfBuff(ctx, 'def_up', 2);
});
registerSkillEffect('self_spd_up', (ctx) => {
  applySelfBuff(ctx, 'spd_up', 2);
});
registerSkillEffect('self_regen', (ctx) => {
  applySelfBuff(ctx, 'regen', 3, { value: ctx.effect.value ?? 0.04 });
});
registerSkillEffect('self_stagger', (ctx) => {
  applySelfBuff(ctx, 'stagger', 3, { value: 0 });
});
registerSkillEffect('self_earth_shield', (ctx) => {
  const actor = ctx.actor;
  if (!isLiving(actor)) return;
  actor.statuses = actor.statuses.filter((s) => s.statusId !== 'earth_shield');
  actor.statuses.push({ statusId: 'earth_shield', remaining: 3, layers: 3, value: 0.05 });
  ctx.emit(ctx.state, 'status_apply', {
    actor: actor.name,
    target: actor.name,
    status: statusLabel('earth_shield'),
    duration: 3,
  });
});
registerSkillEffect('self_shield', (ctx) => {
  const actor = ctx.actor;
  if (!isLiving(actor)) return;
  const mult = ctx.effect.multiplier ?? 0.4;
  const amt = Math.max(
    1,
    Math.floor(ctx.attackPower(actor, 'phys') * mult * ctx.shieldMasteryMult(actor)),
  );
  actor.shield += amt;
  ctx.emit(ctx.state, 'shield_gain', {
    actor: actor.name,
    target: actor.name,
    amount: amt,
  });
});

/** 对盾额外 / 斩杀 / 先声 / 还元 / 残血加疗 / 乘乱 / 撼岳 / 击杀回血：见 skillRules，此处占位 */
registerSkillEffect('vs_shield', () => {});
registerSkillEffect('execute', () => {});
registerSkillEffect('first_cast', () => {});
registerSkillEffect('refund_qi_on_kill', () => {});
registerSkillEffect('heal_low_hp', () => {});
registerSkillEffect('vs_cc', () => {});
registerSkillEffect('vs_high_hp', () => {});
registerSkillEffect('heal_on_kill', () => {});
registerSkillEffect('self_low_hp', () => {});
registerSkillEffect('vs_rank', () => {});
registerSkillEffect('surround', () => {});
registerSkillEffect('focus_streak', () => {});
registerSkillEffect('atonement', () => {});
registerSkillEffect('heal_from_taken', () => {});
registerSkillEffect('vs_back', () => {});
registerSkillEffect('fortune_strike', () => {});
registerSkillEffect('blood_pact', () => {});
registerSkillEffect('dao_stack', () => {});
registerSkillEffect('heal_on_skill', () => {});
registerSkillEffect('extra_hit_front', () => {});
registerSkillEffect('follow_heal', () => {});
registerSkillEffect('on_kill_follow', () => {});
registerSkillEffect('overkill_col', () => {});
registerSkillEffect('clone_hit', () => {});

registerSkillEffect('self_crit_up', (ctx) => {
  applySelfBuff(ctx, 'crit_up', 2);
});
registerSkillEffect('self_immortal', (ctx) => {
  applySelfBuff(ctx, 'immortal', 1);
});
registerSkillEffect('self_stealth', (ctx) => {
  applySelfBuff(ctx, 'stealth_next', 2);
});
registerSkillEffect('self_dmg_cap', (ctx) => {
  applySelfBuff(ctx, 'dmg_cap', 2, { value: ctx.effect.value ?? 0.35 });
});
registerSkillEffect('self_cover', (ctx) => {
  applySelfBuff(ctx, 'cover', 3);
});
registerSkillEffect('self_reflect_cc', (ctx) => {
  applySelfBuff(ctx, 'reflect_cc', 2);
});
registerSkillEffect('self_dao', (ctx) => {
  const actor = ctx.actor;
  if (!isLiving(actor)) return;
  const existing = actor.statuses.find((s) => s.statusId === 'dao' && s.remaining > 0);
  const layers = Math.min(5, (existing?.layers ?? 0) + 1);
  actor.statuses = actor.statuses.filter((s) => s.statusId !== 'dao');
  actor.statuses.push({ statusId: 'dao', remaining: 3, layers });
  ctx.emit(ctx.state, 'status_apply', {
    actor: actor.name,
    target: actor.name,
    status: statusLabel('dao'),
    duration: 3,
  });
});

registerSkillEffect('share_oath', (ctx) => {
  for (const ally of ctx.allies) {
    if (!isLiving(ally) || ally.uid === ctx.actor.uid) continue;
    ally.statuses = ally.statuses.filter((s) => s.statusId !== 'oath');
    ally.statuses.push({ statusId: 'oath', remaining: 3, sourceUid: ctx.actor.uid });
    ctx.emit(ctx.state, 'status_apply', {
      actor: ctx.actor.name,
      target: ally.name,
      status: statusLabel('oath'),
      duration: 3,
    });
  }
});

registerSkillEffect('team_cleanse', (ctx) => {
  for (const ally of ctx.allies) {
    if (!isLiving(ally)) continue;
    applyCleanse(ctx, ally);
  }
});

registerSkillEffect('purge_all', (ctx) => {
  for (const t of ctx.targets) {
    applyPurge(ctx, t);
    applyPurge(ctx, t);
  }
});

registerSkillEffect('cleanse_self', (ctx) => {
  applyCleanse(ctx, ctx.actor);
});

registerSkillEffect('steal_qi', (ctx) => {
  const amount = ctx.effect.value ?? 8;
  let stolen = 0;
  for (const t of ctx.targets) {
    if (!isLiving(t)) continue;
    const take = Math.min(amount, t.qi);
    if (take <= 0) continue;
    t.qi -= take;
    stolen += take;
  }
  if (stolen > 0) ctx.grantQi(ctx.state, ctx.actor, stolen);
});

registerSkillEffect('steal_buff', (ctx) => {
  for (const t of ctx.targets) {
    if (!isLiving(t)) continue;
    const buffs = t.statuses.filter((s) => s.remaining > 0 && getStatusDef(s.statusId)?.kind === 'buff');
    if (!buffs.length) continue;
    const stolen = ctx.rng.pick(buffs);
    t.statuses = t.statuses.filter((s) => s !== stolen);
    ctx.actor.statuses.push({ ...stolen });
    ctx.emit(ctx.state, 'status_remove', {
      actor: ctx.actor.name,
      target: t.name,
      status: statusLabel(stolen.statusId),
      reason: '窃取',
    });
    ctx.emit(ctx.state, 'status_apply', {
      actor: ctx.actor.name,
      target: ctx.actor.name,
      status: statusLabel(stolen.statusId),
      duration: stolen.remaining,
    });
  }
});

registerSkillEffect('transfer_debuff', (ctx) => {
  const ally = ctx.allies.find((u) => {
    if (!isLiving(u) || u.uid === ctx.actor.uid) return false;
    return u.statuses.some((s) => s.remaining > 0 && getStatusDef(s.statusId)?.cleanseable);
  });
  const foe = ctx.targets.find((t) => isLiving(t));
  if (!ally || !foe) return;
  const debuff = ally.statuses.find((s) => s.remaining > 0 && getStatusDef(s.statusId)?.cleanseable);
  if (!debuff) return;
  ally.statuses = ally.statuses.filter((s) => s !== debuff);
  foe.statuses.push({ ...debuff });
  ctx.emit(ctx.state, 'status_remove', {
    actor: ctx.actor.name,
    target: ally.name,
    status: statusLabel(debuff.statusId),
    reason: '移花',
  });
  ctx.emit(ctx.state, 'status_apply', {
    actor: ctx.actor.name,
    target: foe.name,
    status: statusLabel(debuff.statusId),
    duration: debuff.remaining,
  });
});

registerSkillEffect('mark_pop', (ctx) => {
  const ratio = ctx.effect.value ?? 0.08;
  for (const t of ctx.targets) {
    if (!isLiving(t)) continue;
    const mark = t.statuses.find(
      (s) => s.remaining > 0 && Boolean(getStatusDef(s.statusId)?.incomingDamageTakenFromValue),
    );
    if (!mark) continue;
    t.statuses = t.statuses.filter((s) => s !== mark);
    const dmg = Math.max(1, Math.floor(t.maxHp * ratio));
    t.hp = Math.max(0, t.hp - dmg);
    ctx.emit(ctx.state, 'hit', {
      actor: ctx.actor.name,
      target: t.name,
      amount: dmg,
      knockdown: t.hp <= 0,
    });
    ctx.emit(ctx.state, 'status_remove', {
      actor: ctx.actor.name,
      target: t.name,
      status: statusLabel(mark.statusId),
      reason: '印爆',
    });
  }
});

registerSkillEffect('domain_lite', (ctx) => {
  for (const t of ctx.targets) {
    if (!isLiving(t)) continue;
    t.statuses = t.statuses.filter((s) => s.statusId !== 'domain');
    t.statuses.push({ statusId: 'domain', remaining: 2 });
    ctx.emit(ctx.state, 'status_apply', {
      actor: ctx.actor.name,
      target: t.name,
      status: statusLabel('domain'),
      duration: 2,
    });
  }
});

registerSkillEffect('time_rewind', (ctx) => {
  const actor = ctx.actor;
  if (!isLiving(actor) || actor.t3State?.timeRewindUsed) return;
  if (unitHasStatusFlag(actor, 'healBlocked')) return;
  actor.t3State = { ...(actor.t3State ?? {}), timeRewindUsed: true };
  const missing = actor.maxHp - actor.hp;
  const ratio = ctx.effect.value ?? 0.4;
  const heal = Math.max(1, Math.floor(missing * ratio));
  if (heal <= 0) return;
  actor.hp = Math.min(actor.maxHp, actor.hp + heal);
  ctx.emit(ctx.state, 'heal', { actor: actor.name, target: actor.name, amount: heal });
});

function effectMissLabel(kind: SkillEffectKind): string {
  if (kind === 'ally_grant_qi' || kind === 'grant_qi') return '灌气';
  return kind;
}

export function runSkillEffects(
  effects: SkillEffect[] | undefined,
  base: Omit<SkillEffectContext, 'effect'>,
): void {
  for (const effect of effects ?? []) {
    const handler = handlers.get(effect.kind);
    if (!handler) continue;
    const chance = effect.chance;
    if (chance != null && chance < 1 && base.rng.next() >= chance) {
      base.emit(base.state, 'effect_miss', {
        actor: base.actor.name,
        effect: effectMissLabel(effect.kind),
      });
      continue;
    }
    handler({ ...base, effect });
  }
}
