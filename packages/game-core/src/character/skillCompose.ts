/**
 * 技能合成管道：底板 SkillDef + 修正条 → 战斗只认最终 SkillDef。
 * @see docs/superpowers/specs/2026-08-02-character-foundation-design.md
 */
import type {
  ApplyStatusDef,
  CharacterProgress,
  FollowUpDef,
  SkillDef,
  SkillEffect,
  UnitTemplate,
} from '../shared/types.js';
import { statusLabel } from '../combat/statusFx.js';
import { listBreakthroughPerks } from './breakthroughPerks.js';
import { getSkill } from './skills.js';
import {
  proseSkillEffect,
  proseSkillEffectDelta,
  summarizeApplyStatus,
  type StarNodeDef,
  type StarNodeEffect,
} from './starTypes.js';
import { unlockedStarNodes } from './starTracks.js';

export type SkillModifierSource = 'star' | 'breakthrough' | 'equipment' | 'awaken';

export interface SkillModifier {
  source: SkillModifierSource;
  /** UI：「★3 七进七出」 */
  label?: string;
  multiplierDelta?: number;
  qiCostDelta?: number;
  followUp?: FollowUpDef;
  /** 强化已有 applyStatus 的时长/层数/强度 */
  statusBoost?: { duration?: number; layers?: number; valueMult?: number };
  /** 强化同 statusId 或追加新状态 */
  statusPatches?: ApplyStatusDef[];
  /** 追加非状态效果（purge/cleanse/…） */
  effectPatches?: SkillEffect[];
  tagMults?: { tag: string; delta: number }[];
  focusPolicy?: string;
  targetPattern?: string;
  addTags?: string[];
  /** 装备形态互斥 id */
  morphId?: string;
}

export interface SkillComposeContext {
  /** 已解析的装备形态等修正（由 equipment 侧产出） */
  extraModifiers?: SkillModifier[];
}

function effectsToModifier(
  source: SkillModifierSource,
  label: string,
  effects: StarNodeEffect[],
): SkillModifier | null {
  const mod: SkillModifier = { source, label };
  let any = false;
  for (const fx of effects) {
    if (fx.kind === 'skill_mult') {
      mod.multiplierDelta = (mod.multiplierDelta ?? 0) + fx.delta;
      any = true;
    } else if (fx.kind === 'qi_cost') {
      mod.qiCostDelta = (mod.qiCostDelta ?? 0) + fx.delta;
      any = true;
    } else if (fx.kind === 'status_boost') {
      mod.statusBoost = {
        duration: (mod.statusBoost?.duration ?? 0) + (fx.duration ?? 0),
        layers: (mod.statusBoost?.layers ?? 0) + (fx.layers ?? 0),
        valueMult: (mod.statusBoost?.valueMult ?? 1) * (fx.valueMult ?? 1),
      };
      any = true;
    } else if (fx.kind === 'enable_follow_up') {
      mod.followUp = { chance: fx.chance, multiplier: fx.multiplier };
      any = true;
    } else if (fx.kind === 'status_unlock') {
      mod.statusPatches = [...(mod.statusPatches ?? []), { ...fx.status }];
      any = true;
    } else if (fx.kind === 'effect_unlock') {
      mod.effectPatches = [...(mod.effectPatches ?? []), { ...fx.effect }];
      any = true;
    } else if (fx.kind === 'tag_mult') {
      mod.tagMults = [...(mod.tagMults ?? []), { tag: fx.tag, delta: fx.delta }];
      any = true;
    } else if (fx.kind === 'focus_policy') {
      mod.focusPolicy = fx.policy;
      any = true;
    } else if (fx.kind === 'pattern') {
      mod.targetPattern = fx.pattern;
      any = true;
    } else if (fx.kind === 'tag_add') {
      mod.addTags = [...(mod.addTags ?? []), fx.tag];
      any = true;
    }
  }
  return any ? mod : null;
}

function nodeToModifier(source: SkillModifierSource, node: StarNodeDef): SkillModifier | null {
  const label =
    source === 'star' ? `★${node.star} ${node.label}` : node.label;
  return effectsToModifier(source, label, node.effects);
}

/** 收集升星 / 破境 / 额外（装）修正；可改倍率、状态、焦点、形状与 tag */
export function listSkillModifiers(
  template: UnitTemplate,
  progress: CharacterProgress,
  ctx?: SkillComposeContext,
): SkillModifier[] {
  const mods: SkillModifier[] = [];
  for (const node of unlockedStarNodes(template.id, progress.star, progress.starBranch)) {
    const m = nodeToModifier('star', node);
    if (m) mods.push(m);
  }
  for (const perk of listBreakthroughPerks(template.id, progress.breakthroughTier)) {
    const m = effectsToModifier('breakthrough', perk.label, perk.effects);
    if (m) mods.push(m);
  }
  if (ctx?.extraModifiers?.length) {
    mods.push(...ctx.extraModifiers);
  }
  return mods;
}

function mergeStatus(base: ApplyStatusDef, patch: ApplyStatusDef): ApplyStatusDef {
  return {
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

function applyStatusBoost(
  statuses: ApplyStatusDef[],
  boost: { duration: number; layers: number; valueMult: number },
): ApplyStatusDef[] {
  if (boost.duration === 0 && boost.layers === 0 && boost.valueMult === 1) {
    return statuses;
  }
  return statuses.map((s) => ({
    ...s,
    duration: s.duration != null ? s.duration + boost.duration : s.duration,
    layers: s.layers != null ? s.layers + boost.layers : s.layers,
    value:
      s.value != null && boost.valueMult !== 1 ? s.value * boost.valueMult : s.value,
  }));
}

/** 合成最终技能；战斗侧只读结果 */
export function composeSkill(base: SkillDef, mods: SkillModifier[]): SkillDef {
  let multiplier = base.multiplier;
  let qiCost = base.qiCost;
  let applyStatus = base.applyStatus.map((s) => ({ ...s }));
  let effects: SkillEffect[] = base.effects?.map((e) => ({ ...e })) ?? [];
  let followUp: FollowUpDef | undefined = base.followUp
    ? { ...base.followUp }
    : undefined;
  let tags = [...base.tags];
  let focusPolicy = base.focusPolicy;
  let targetPattern = base.targetPattern;

  let boostDuration = 0;
  let boostLayers = 0;
  let boostValueMult = 1;
  const tagMults: { tag: string; delta: number }[] = [];

  for (const m of mods) {
    if (m.multiplierDelta) multiplier += m.multiplierDelta;
    if (m.qiCostDelta) qiCost += m.qiCostDelta;
    if (m.followUp) {
      followUp = {
        chance: m.followUp.chance,
        multiplier: m.followUp.multiplier,
        targetPattern: m.followUp.targetPattern ?? base.targetPattern,
      };
    }
    if (m.statusBoost) {
      boostDuration += m.statusBoost.duration ?? 0;
      boostLayers += m.statusBoost.layers ?? 0;
      if (m.statusBoost.valueMult != null) {
        boostValueMult *= m.statusBoost.valueMult;
      }
    }
    if (m.statusPatches) {
      for (const patch of m.statusPatches) {
        const idx = applyStatus.findIndex((s) => s.statusId === patch.statusId);
        if (idx >= 0) {
          applyStatus[idx] = mergeStatus(applyStatus[idx]!, patch);
        } else {
          applyStatus.push({ ...patch });
        }
      }
    }
    if (m.effectPatches) {
      for (const e of m.effectPatches) {
        const existing = effects.find((x) => x.kind === e.kind);
        if (!existing) {
          effects.push({ ...e });
        } else {
          if ((e.multiplier ?? 0) > (existing.multiplier ?? 0)) {
            existing.multiplier = e.multiplier;
          }
          if (e.value != null) existing.value = e.value;
          if (e.chance != null) existing.chance = e.chance;
        }
      }
    }
    if (m.tagMults) tagMults.push(...m.tagMults);
    if (m.focusPolicy) focusPolicy = m.focusPolicy;
    if (m.targetPattern) targetPattern = m.targetPattern;
    if (m.addTags) {
      for (const t of m.addTags) {
        if (!tags.includes(t)) tags.push(t);
      }
    }
  }

  for (const tm of tagMults) {
    const hit =
      tm.tag === 'single'
        ? targetPattern === 'single'
        : tags.includes(tm.tag);
    if (hit) multiplier += tm.delta;
  }

  applyStatus = applyStatusBoost(applyStatus, {
    duration: boostDuration,
    layers: boostLayers,
    valueMult: boostValueMult,
  });

  const next: SkillDef = {
    ...base,
    multiplier: Math.max(0.1, multiplier),
    qiCost: Math.max(15, Math.round(qiCost)),
    applyStatus,
    tags,
    targetPattern,
    focusPolicy,
  };
  if (effects.length > 0) next.effects = effects;
  else delete (next as { effects?: SkillEffect[] }).effects;
  if (followUp) next.followUp = followUp;
  else delete (next as { followUp?: FollowUpDef }).followUp;
  return next;
}

/** 相对底板的可读 diff（升星预览 / UI） */
export function skillDiffLines(before: SkillDef, after: SkillDef): string[] {
  const lines: string[] = [];
  if (Math.abs(after.multiplier - before.multiplier) > 0.001) {
    const up = after.multiplier > before.multiplier;
    lines.push(
      `本招伤害由×${before.multiplier.toFixed(2)}${up ? '提高' : '降低'}至×${after.multiplier.toFixed(2)}`,
    );
  }
  if (after.qiCost !== before.qiCost) {
    lines.push(
      `耗能由${before.qiCost}${after.qiCost < before.qiCost ? '降至' : '增至'}${after.qiCost}`,
    );
  }
  const beforeIds = before.applyStatus.map((s) => s.statusId).join(',');
  const afterIds = after.applyStatus.map((s) => s.statusId).join(',');
  if (beforeIds !== afterIds) {
    const added = after.applyStatus
      .filter((s) => !before.applyStatus.some((b) => b.statusId === s.statusId))
      .map((s) => summarizeApplyStatus(s));
    if (added.length) lines.push(`并附加${added.join('，')}`);
  }
  for (const a of after.applyStatus) {
    const b = before.applyStatus.find((s) => s.statusId === a.statusId);
    if (!b) continue;
    const bits: string[] = [];
    if ((a.duration ?? 0) !== (b.duration ?? 0)) {
      bits.push(
        `由${b.duration ?? 0}回${(a.duration ?? 0) > (b.duration ?? 0) ? '延长' : '缩短'}至${a.duration ?? 0}回`,
      );
    }
    if ((a.layers ?? 0) !== (b.layers ?? 0)) {
      bits.push(
        `由${b.layers ?? 0}层${(a.layers ?? 0) > (b.layers ?? 0) ? '增' : '减'}至${a.layers ?? 0}层`,
      );
    }
    if ((a.value ?? 0) !== (b.value ?? 0) && a.value != null) {
      bits.push(`强度由${b.value ?? 0}${(a.value ?? 0) > (b.value ?? 0) ? '提高' : '降低'}至${a.value}`);
    }
    if (bits.length) lines.push(`${statusLabel(a.statusId)}${bits.join('，')}`);
  }
  const beforeFx = before.effects ?? [];
  const afterFx = after.effects ?? [];
  const addedFx = afterFx
    .filter((e) => !beforeFx.some((b) => b.kind === e.kind))
    .map((e) => proseSkillEffect(e));
    if (addedFx.length) lines.push(addedFx.join('。'));
  for (const a of afterFx) {
    const b = beforeFx.find((e) => e.kind === a.kind);
    if (!b) continue;
    if (a.multiplier === b.multiplier && a.value === b.value && a.chance === b.chance) continue;
    lines.push(proseSkillEffectDelta(b, a));
  }
  if (!before.followUp && after.followUp) {
    lines.push(
      `有${Math.round(after.followUp.chance * 100)}%几率追加一击（×${after.followUp.multiplier ?? 1}）`,
    );
  } else if (
    before.followUp &&
    after.followUp &&
    (before.followUp.chance !== after.followUp.chance ||
      before.followUp.multiplier !== after.followUp.multiplier)
  ) {
    lines.push(
      `有${Math.round(after.followUp.chance * 100)}%几率追加一击（×${after.followUp.multiplier ?? 1}）`,
    );
  }
  return lines;
}

export function composeSkillFor(
  template: UnitTemplate,
  progress: CharacterProgress,
  ctx?: SkillComposeContext,
): SkillDef {
  const base = getSkill(template.skillId);
  return composeSkill(base, listSkillModifiers(template, progress, ctx));
}
