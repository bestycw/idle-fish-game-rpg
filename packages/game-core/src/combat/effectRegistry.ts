import type {
  BattleEvent,
  BattleState,
  Rng,
  SkillEffect,
  SkillEffectKind,
  UnitRuntime,
} from '../shared/types.js';
import { pickCleanseTarget, pickPurgeTarget, statusLabel } from './statusFx.js';

export interface SkillEffectContext {
  state: BattleState;
  actor: UnitRuntime;
  targets: UnitRuntime[];
  effect: SkillEffect;
  rng: Rng;
  emit: (state: BattleState, code: BattleEvent['code'], payload: Record<string, unknown>) => void;
  /** 已含急速缩放的回能 */
  grantQi: (state: BattleState, unit: UnitRuntime, amount: number) => void;
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
