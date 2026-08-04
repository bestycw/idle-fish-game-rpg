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
import { EFFECT_KIND_LABELS, type StarNodeDef, type StarNodeEffect } from './starTypes.js';
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
    }
  }
  return any ? mod : null;
}

function nodeToModifier(source: SkillModifierSource, node: StarNodeDef): SkillModifier | null {
  const label =
    source === 'star' ? `★${node.star} ${node.label}` : node.label;
  return effectsToModifier(source, label, node.effects);
}

/** 收集升星 / 破境 / 额外（装）修正；不改 targetPattern / tags */
export function listSkillModifiers(
  template: UnitTemplate,
  progress: CharacterProgress,
  ctx?: SkillComposeContext,
): SkillModifier[] {
  const mods: SkillModifier[] = [];
  for (const node of unlockedStarNodes(template.id, progress.star)) {
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

  let boostDuration = 0;
  let boostLayers = 0;
  let boostValueMult = 1;

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
        if (!effects.some((x) => x.kind === e.kind)) {
          effects.push({ ...e });
        }
      }
    }
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
    const d = after.multiplier - before.multiplier;
    lines.push(`倍率${d >= 0 ? '+' : ''}${d.toFixed(2)} → ${after.multiplier.toFixed(2)}`);
  }
  if (after.qiCost !== before.qiCost) {
    const d = after.qiCost - before.qiCost;
    lines.push(`耗能${d >= 0 ? '+' : ''}${d} → ${after.qiCost}`);
  }
  const beforeIds = before.applyStatus.map((s) => s.statusId).join(',');
  const afterIds = after.applyStatus.map((s) => s.statusId).join(',');
  if (beforeIds !== afterIds) {
    const added = after.applyStatus
      .filter((s) => !before.applyStatus.some((b) => b.statusId === s.statusId))
      .map((s) => statusLabel(s.statusId));
    if (added.length) lines.push(`新状态 ${added.join('·')}`);
  }
  for (const a of after.applyStatus) {
    const b = before.applyStatus.find((s) => s.statusId === a.statusId);
    if (!b) continue;
    const bits: string[] = [];
    if ((a.duration ?? 0) !== (b.duration ?? 0)) {
      bits.push(`时长${b.duration ?? 0}→${a.duration ?? 0}`);
    }
    if ((a.layers ?? 0) !== (b.layers ?? 0)) {
      bits.push(`层${b.layers ?? 0}→${a.layers ?? 0}`);
    }
    if ((a.value ?? 0) !== (b.value ?? 0) && a.value != null) {
      bits.push(`强度→${a.value}`);
    }
    if (bits.length) lines.push(`${statusLabel(a.statusId)} ${bits.join('·')}`);
  }
  const beforeFx = new Set((before.effects ?? []).map((e) => e.kind));
  const addedFx = (after.effects ?? [])
    .filter((e) => !beforeFx.has(e.kind))
    .map((e) => EFFECT_KIND_LABELS[e.kind] ?? e.kind);
  if (addedFx.length) lines.push(`效果 ${addedFx.join('·')}`);
  if (!before.followUp && after.followUp) {
    lines.push(
      `连击${Math.round(after.followUp.chance * 100)}%×${after.followUp.multiplier ?? 1}`,
    );
  } else if (
    before.followUp &&
    after.followUp &&
    (before.followUp.chance !== after.followUp.chance ||
      before.followUp.multiplier !== after.followUp.multiplier)
  ) {
    lines.push(
      `连击${Math.round(after.followUp.chance * 100)}%×${after.followUp.multiplier ?? 1}`,
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
