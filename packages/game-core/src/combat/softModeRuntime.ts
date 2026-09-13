/**
 * 软模式调度：出手前按战场条件把 softModes 叠进本次 SkillDef。
 * 禁止按 templateId / skillId 写死分支。
 */
import type {
  ApplyStatusDef,
  FollowUpDef,
  SkillDef,
  SkillEffect,
  SoftModeDef,
  SoftModeThen,
  SoftModeWhen,
  UnitRuntime,
} from '../shared/types.js';
import { getStatusDef } from './statusFx.js';

export interface SoftModeContext {
  actor: UnitRuntime;
  allies: UnitRuntime[];
  foes: UnitRuntime[];
  /** 已解析的本次目标（主目标取第一个存活） */
  targets: UnitRuntime[];
}

function primaryTarget(targets: UnitRuntime[]): UnitRuntime | undefined {
  return targets.find((t) => !t.dead && t.hp > 0) ?? targets[0];
}

function underCc(unit: UnitRuntime): boolean {
  return unit.statuses.some((s) => {
    if (s.remaining <= 0) return false;
    return getStatusDef(s.statusId)?.kind === 'cc';
  });
}

export function softModeWhenMet(when: SoftModeWhen, ctx: SoftModeContext): boolean {
  const { actor, allies, targets } = ctx;
  const target = primaryTarget(targets);

  switch (when.kind) {
    case 'first_cast':
      return (actor.skillCastCount ?? 0) === 0;
    case 'self_hp_below':
      return actor.maxHp > 0 && actor.hp / actor.maxHp <= when.value;
    case 'ally_downed':
      return allies.some((u) => u.uid !== actor.uid && (u.dead || u.hp <= 0));
    case 'target_has_status':
      if (!target) return false;
      return target.statuses.some(
        (s) => s.statusId === when.statusId && s.remaining > 0,
      );
    case 'target_under_cc':
      return target ? underCc(target) : false;
    case 'target_hp_below':
      if (!target || target.maxHp <= 0) return false;
      return target.hp / target.maxHp <= when.value;
    case 'target_has_shield':
      return Boolean(target && target.shield > 0);
    default:
      return false;
  }
}

function mergeEffect(effects: SkillEffect[], patch: SkillEffect): void {
  const existing = effects.find((x) => x.kind === patch.kind);
  if (!existing) {
    effects.push({ ...patch });
    return;
  }
  if ((patch.multiplier ?? 0) > (existing.multiplier ?? 0)) {
    existing.multiplier = patch.multiplier;
  }
  if (patch.value != null) existing.value = patch.value;
  if (patch.chance != null) existing.chance = patch.chance;
}

function mergeStatus(statuses: ApplyStatusDef[], patch: ApplyStatusDef): void {
  const idx = statuses.findIndex((s) => s.statusId === patch.statusId);
  if (idx < 0) {
    statuses.push({ ...patch });
    return;
  }
  const base = statuses[idx]!;
  statuses[idx] = {
    statusId: base.statusId,
    chance: patch.chance ?? base.chance,
    duration:
      base.duration != null || patch.duration != null
        ? (base.duration ?? 0) + (patch.duration ?? 0)
        : undefined,
    layers:
      base.layers != null || patch.layers != null
        ? (base.layers ?? 0) + (patch.layers ?? 0)
        : undefined,
    value: patch.value ?? base.value,
  };
}

export function applySoftModeThen(skill: SkillDef, then: SoftModeThen): SkillDef {
  const next: SkillDef = {
    ...skill,
    applyStatus: skill.applyStatus.map((s) => ({ ...s })),
    effects: skill.effects?.map((e) => ({ ...e })) ?? [],
    followUp: skill.followUp ? { ...skill.followUp } : undefined,
  };

  if (then.multiplierDelta) {
    next.multiplier = Math.max(0.1, next.multiplier + then.multiplierDelta);
  }

  const effects = [...(next.effects ?? [])];
  if (then.effectPatches) {
    for (const e of then.effectPatches) mergeEffect(effects, e);
  }
  if (then.reviveAlly) {
    mergeEffect(effects, { kind: 'revive_ally', value: then.reviveAlly.hpRatio });
  }
  if (effects.length > 0) next.effects = effects;
  else delete next.effects;

  if (then.statusPatches) {
    const statuses = [...next.applyStatus];
    for (const p of then.statusPatches) mergeStatus(statuses, p);
    next.applyStatus = statuses;
  }

  if (then.followUp) {
    const fu: FollowUpDef = {
      chance: then.followUp.chance,
      multiplier: then.followUp.multiplier,
      targetPattern: then.followUp.targetPattern ?? skill.targetPattern,
    };
    next.followUp = fu;
  }

  return next;
}

/** 叠所有已满足的 softMode（可叠加）；无命中则返回原 skill 引用。 */
export function resolveSoftModes(skill: SkillDef, ctx: SoftModeContext): SkillDef {
  const modes = skill.softModes;
  if (!modes?.length) return skill;

  let next = skill;
  let changed = false;
  for (const mode of modes) {
    if (!softModeWhenMet(mode.when, ctx)) continue;
    next = applySoftModeThen(next, mode.then);
    changed = true;
  }
  return changed ? next : skill;
}

export function activeSoftModeCopies(skill: SkillDef, ctx: SoftModeContext): string[] {
  return (skill.softModes ?? [])
    .filter((m) => softModeWhenMet(m.when, ctx))
    .map((m) => m.copy);
}

export function listSoftModeCopies(skill: SkillDef | undefined): string[] {
  return (skill?.softModes ?? []).map((m: SoftModeDef) => m.copy);
}
