import type {
  BattleEvent,
  BattleState,
  DamageSchool,
  Rng,
  SkillEffect,
  SkillEffectKind,
  UnitRuntime,
} from '../shared/types.js';
import { pickCleanseTarget, pickPurgeTarget, statusLabel } from './statusFx.js';
import { isLiving } from './lifecycle.js';

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
    return;
  }
  target.statuses = target.statuses.filter((s) => s.statusId !== pick);
  ctx.emit(ctx.state, 'status_remove', {
    actor: ctx.actor.name,
    target: target.name,
    status: statusLabel(pick),
    reason: '驱散',
  });
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

/** 对盾额外 / 斩杀 / 先声 / 还元 / 残血加疗：见 skillRules（造伤乘区），此处占位不处理 */
registerSkillEffect('vs_shield', () => {});
registerSkillEffect('execute', () => {});
registerSkillEffect('first_cast', () => {});
registerSkillEffect('refund_qi_on_kill', () => {});
registerSkillEffect('heal_low_hp', () => {});

export function runSkillEffects(
  effects: SkillEffect[] | undefined,
  base: Omit<SkillEffectContext, 'effect'>,
): void {
  for (const effect of effects ?? []) {
    const handler = handlers.get(effect.kind);
    if (!handler) continue;
    handler({ ...base, effect });
  }
}
