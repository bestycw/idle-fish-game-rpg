import {
  markPreyValueWithMastery,
  shredValueWithMastery,
  statusLandChance,
} from '../combat/mastery.js';
import { getStatusDef, statusLabel } from '../combat/statusFx.js';
import { sumEquipmentBonuses } from '../equipment/equipment.js';
import { characterPower } from '../equipment/power.js';
import { listEquipmentSkillModifiers } from '../equipment/morphs.js';
import { buildPlayerParty } from '../formation/formation.js';
import { rowLabel, rowOf } from '../formation/grid.js';
import { resolveFormationResonances } from '../formation/resonance.js';
import type {
  ApplyStatusDef,
  GridSlot,
  PlayerState,
  Role,
  SkillDef,
  SkillEffect,
  SoftModeDef,
  UnitTemplate,
} from '../shared/types.js';
import {
  CULTIVATION_NODE_MAIN_PCT,
  deriveGrowthStats,
  formatMainPct,
  getProgress,
  isOwned,
  levelCapForTier,
  listBreakthroughPerks,
  listNextBreakthroughPerks,
  maxStarForTemplate,
  REALM_TIER_MAIN_PCT,
  resolveStarNode,
  isBranchStar,
  listIdentityTracks,
  identityChoice,
  branchChoiceForStar,
  IDENTITY_PICK_STAR,
  IDENTITY_CLIMAX_STAR,
  skillWithGrowth,
  starShardCost,
  proseSkillEffect,
  summarizeSkillEffect,
  summarizeStarEffect,
  type DerivedGrowthStats,
  type StarNodeDef,
  type StarNodeEffect,
} from './growth.js';
import { nextBreakthroughLabel } from './breakthroughDisplay.js';
import { jobLabel, roleLabel, targetPatternLabel } from './labels.js';
import { getSkill } from './skills.js';
import { getTemplate, UNIT_TEMPLATES } from './templates.js';
import { previewStardustExchange } from './stardustExchange.js';

export interface StarBranchPreview {
  id: string;
  label: string;
  effectLine: string;
  identityLabel?: string;
}

export interface StarUpPreview {
  nextStar: number;
  node?: StarNodeDef;
  /** 下一星是否为岔路 */
  isBranch?: boolean;
  /** 岔路两支摘要（仅 isBranch 时有） */
  branches?: StarBranchPreview[];
  /** 升星只吃碎片；不足为 need_shard */
  costKind: 'shard' | 'need_shard' | 'max' | 'unowned';
  shardsHave: number;
  shardsNeed: number;
  /** 属性 diff 一句 */
  attrDiffLine: string;
  /** 节点能力一句 */
  nodeLine: string;
  ready: boolean;
}

function summarizeAttrDiff(before: DerivedGrowthStats, after: DerivedGrowthStats): string {
  const parts: string[] = [];
  const push = (label: string, a: number, b: number) => {
    const d = b - a;
    if (d !== 0) parts.push(`${label}+${d}`);
  };
  push('攻', before.atk, after.atk);
  push('防', before.def, after.def);
  push('抗', before.res, after.res);
  push('生命', before.maxHp, after.maxHp);
  if (after.block - before.block > 0.0001) {
    parts.push(`格挡+${Math.round((after.block - before.block) * 100)}%`);
  }
  if (after.lifesteal - before.lifesteal > 0.0001) {
    parts.push(`吸血+${Math.round((after.lifesteal - before.lifesteal) * 100)}%`);
  }
  if (after.dodge - before.dodge > 0.0001) {
    parts.push(`闪避+${Math.round((after.dodge - before.dodge) * 100)}%`);
  }
  if (!before.followUp && after.followUp) {
    parts.push(`连击${Math.round(after.followUp.chance * 100)}%`);
  } else if (
    before.followUp &&
    after.followUp &&
    (before.followUp.chance !== after.followUp.chance ||
      before.followUp.multiplier !== after.followUp.multiplier)
  ) {
    parts.push(`连击${Math.round(after.followUp.chance * 100)}%`);
  }
  return parts.length > 0 ? parts.join(' · ') : '属性微幅提升';
}

function starEffectPriority(fx: StarNodeEffect): number {
  switch (fx.kind) {
    case 'stat_pct':
    case 'split_stat':
    case 'rare_stat':
    case 'rating':
      return 2;
    case 'skill_mult':
    case 'qi_cost':
    case 'tag_mult':
      return 1;
    default:
      return 0;
  }
}

function statusIdsForStar(templateId: string, node: StarNodeDef): string[] {
  const tpl = getTemplate(templateId);
  const fromSkill = tpl ? getSkill(tpl.skillId).applyStatus.map((s) => s.statusId) : [];
  if (fromSkill.length) return [...new Set(fromSkill)];
  return [
    ...new Set(
      node.effects
        .filter((e): e is Extract<StarNodeEffect, { kind: 'status_unlock' }> => e.kind === 'status_unlock')
        .map((e) => e.status.statusId),
    ),
  ];
}

function effectSummary(node: StarNodeDef, templateId?: string): string {
  const ordered = [...node.effects].sort(
    (a, b) => starEffectPriority(a) - starEffectPriority(b),
  );
  const statusIds = templateId ? statusIdsForStar(templateId, node) : undefined;
  const bits = ordered.map((fx) => summarizeStarEffect(fx, { statusIds })).filter(Boolean);
  if (!bits.length) return node.label;
  return `${bits.map((s) => s.replace(/[。]+$/, '')).join('。')}。`;
}

/** 升星只读预览：消耗 + 属性/节点 diff */
export function previewStarUp(state: PlayerState, templateId: string): StarUpPreview {
  const template = getTemplate(templateId);
  const progress = getProgress(state, templateId);
  const maxStar = maxStarForTemplate(templateId);
  const shardsHave = progress.cardShards ?? 0;
  const shardsNeed = starShardCost(progress.star);

  if (!isOwned(state, templateId) || !template) {
    return {
      nextStar: progress.star + 1,
      costKind: 'unowned',
      shardsHave,
      shardsNeed,
      attrDiffLine: '',
      nodeLine: '召唤解锁后可升星',
      ready: false,
    };
  }
  if (progress.star >= maxStar) {
    return {
      nextStar: progress.star,
      costKind: 'max',
      shardsHave,
      shardsNeed: 0,
      attrDiffLine: '',
      nodeLine: `已达品级星级上限（★${maxStar}）`,
      ready: false,
    };
  }

  const nextStar = progress.star + 1;
  const isBranch = isBranchStar(templateId, nextStar);
  const tracks = listIdentityTracks(templateId);
  const branches: StarBranchPreview[] | undefined = isBranch
    ? identityBranchPreviews(templateId, nextStar, tracks)
    : undefined;
  const node = resolveStarNode(
    templateId,
    nextStar,
    branchChoiceForStar(templateId, nextStar, progress.starBranch),
  );
  const before = deriveGrowthStats(template, progress);
  const after = deriveGrowthStats(template, { ...progress, star: nextStar });
  const useShard = shardsHave >= shardsNeed;
  let nodeLine = node ? effectSummary(node, templateId) : `升至 ★${nextStar}`;
  if (isBranch) {
    nodeLine = '选定分支';
  } else if (nextStar === IDENTITY_CLIMAX_STAR && tracks.length >= 2) {
    const identityId = identityChoice(templateId, progress.starBranch);
    const climax = tracks.find((t) => t.id === identityId)?.star6;
    nodeLine = climax
      ? effectSummary(resolveStarNode(templateId, nextStar, climax.id)!, templateId)
      : '先在 ★3 选定分支';
  }

  return {
    nextStar,
    node,
    isBranch,
    branches,
    costKind: useShard ? 'shard' : 'need_shard',
    shardsHave,
    shardsNeed,
    attrDiffLine: summarizeAttrDiff(before, after),
    nodeLine,
    ready: useShard,
  };
}

export { previewStardustExchange };

export interface SkillDisplayInfo {
  name: string;
  /** 母题一句（深做卡优先） */
  blurb: string | null;
  qiCost: number;
  targetPattern: string;
  damageSchool?: string;
  multiplier: number;
  /** 伤害/治疗/护盾 = 力系|灵系×系数 */
  coeffLine: string;
  /** 约伤 / 约疗 / 约盾 */
  previewKind: 'damage' | 'heal' | 'shield';
  previewLabel: string;
  /** 当前攻 × 倍率，未计防御/暴击/站位 */
  previewAmount: number;
  /** 魔兽/新的开始式一段话 */
  rulesLine: string;
  statusLine: string;
  effectsLine: string | null;
  followUpLine: string | null;
  /** 软模式变招短句（条件→效果），玩家向 */
  softModeLine: string | null;
  /** 装备形态修正一句 */
  morphLine: string | null;
  roleLine: string;
  jobLine: string;
}

export interface StarTrackRow {
  star: number;
  label: string;
  effectLine: string;
  unlocked: boolean;
  /** ★3 / ★6 各展示该星分支技能；只在 ★3 可点选 */
  branches?: StarBranchPreview[];
  /** 已选分支 id */
  chosenBranch?: string;
  /** ★6 跟跑，卡片只展示不挑选 */
  followsIdentity?: boolean;
}

function identityBranchPreviews(
  templateId: string,
  star: number,
  tracks: ReturnType<typeof listIdentityTracks>,
): StarBranchPreview[] {
  return tracks.map((t) => {
    const branch = star === IDENTITY_CLIMAX_STAR ? t.star6 : t.star3;
    const resolved = resolveStarNode(templateId, star, branch?.id ?? t.id);
    return {
      id: t.id,
      label: branch?.label ?? t.label,
      identityLabel: t.label,
      effectLine: resolved ? effectSummary(resolved, templateId) : (branch?.label ?? t.label),
    };
  });
}

/** ★1–品级上限 星轨预览（未解锁也列出；超品级星章不展示） */
export function listStarTrackRows(
  templateId: string,
  star: number,
  starBranch?: Record<number, string>,
): StarTrackRow[] {
  const rows: StarTrackRow[] = [];
  const cap = maxStarForTemplate(templateId);
  const tracks = listIdentityTracks(templateId);
  const identityId = identityChoice(templateId, starBranch);
  for (let s = 1; s <= cap; s += 1) {
    const isIdentity =
      tracks.length >= 2 && (s === IDENTITY_PICK_STAR || s === IDENTITY_CLIMAX_STAR);
    const choice = branchChoiceForStar(templateId, s, starBranch);
    const node = resolveStarNode(templateId, s, choice);
    const base = resolveStarNode(templateId, s);
    if (!node && !base) continue;
    if (isIdentity) {
      const shown = identityId ? node : base;
      rows.push({
        star: s,
        label: base?.label ?? (s === IDENTITY_CLIMAX_STAR ? '满星' : '分支'),
        effectLine: shown ? effectSummary(shown, templateId) : (base?.label ?? '分支'),
        unlocked: s <= star,
        branches: identityBranchPreviews(templateId, s, tracks),
        chosenBranch: identityId,
        followsIdentity: s === IDENTITY_CLIMAX_STAR,
      });
      continue;
    }
    if (!node) continue;
    rows.push({
      star: s,
      label: node.label,
      effectLine: effectSummary(node, templateId),
      unlocked: s <= star,
      chosenBranch: choice,
    });
  }
  return rows;
}

export interface BreakthroughPerkRow {
  tier: number;
  label: string;
  effectLine: string;
  unlocked: boolean;
}

export function listBreakthroughPerkRows(
  templateId: string,
  tier: number,
): { unlocked: BreakthroughPerkRow[]; next: BreakthroughPerkRow | null } {
  const unlocked = listBreakthroughPerks(templateId, tier).map((p) => ({
    tier: p.tier,
    label: p.label,
    effectLine: p.effects.map((fx) => summarizeStarEffect(fx)).filter(Boolean).join('。'),
    unlocked: true as const,
  }));
  const upcoming = listNextBreakthroughPerks(templateId, tier);
  const next = upcoming.length
    ? {
        tier: upcoming[0]!.tier,
        label: upcoming.map((p) => p.label).join(' · '),
        effectLine: upcoming
          .flatMap((p) => p.effects.map((fx) => summarizeStarEffect(fx)))
          .filter(Boolean)
          .join('。'),
        unlocked: false,
      }
    : null;
  return { unlocked, next };
}

export function cultivationGainLine(): string {
  return formatMainPct(CULTIVATION_NODE_MAIN_PCT);
}

export interface BreakthroughStepPreview {
  toLabel: string;
  levelCap: number;
  mainLine: string;
  perkLabel: string;
  perkLine: string;
}

export function previewBreakthroughStep(
  templateId: string,
  currentTier: number,
): BreakthroughStepPreview | null {
  const toLabel = nextBreakthroughLabel(currentTier);
  if (!toLabel) return null;
  const perks = listNextBreakthroughPerks(templateId, currentTier);
  return {
    toLabel,
    levelCap: levelCapForTier(currentTier + 1),
    mainLine: formatMainPct(REALM_TIER_MAIN_PCT),
    perkLabel: perks.map((p) => p.label).join(' · '),
    perkLine: perks
      .flatMap((p) => p.effects.map((fx) => summarizeStarEffect(fx)))
      .filter(Boolean)
      .join('。'),
  };
}

function followUpText(fu: { chance: number; multiplier?: number } | undefined): string | null {
  if (!fu) return null;
  return `连击 ${Math.round(fu.chance * 100)}% · 倍率×${fu.multiplier ?? 1}`;
}

type StatusDisplayCtx = {
  role: Role;
  masteryRating: number;
};

const TICK_HP_PCT_DEFAULT: Record<string, number> = {
  bleed_hp_pct: 0.03,
  regen_hp_pct: 0.04,
};

/** 状态强度一句（与命中分开；含精通预览） */
function statusPotencyText(s: ApplyStatusDef, ctx: StatusDisplayCtx): string | null {
  const meta = getStatusDef(s.statusId);
  if (!meta) return null;
  const carrier = { role: ctx.role, masteryRating: ctx.masteryRating };
  const bits: string[] = [];
  if (meta.incomingDefMultFromValue && s.value != null) {
    const v = shredValueWithMastery(carrier, s.value);
    bits.push(`防御×${Math.round(v * 100)}%`);
  }
  if (meta.incomingDamageTakenFromValue && s.value != null) {
    const v = markPreyValueWithMastery(carrier, s.value);
    bits.push(`承伤×${Math.round(v * 100)}%`);
  }
  if (meta.tickKind && TICK_HP_PCT_DEFAULT[meta.tickKind] != null) {
    const pct = s.value ?? TICK_HP_PCT_DEFAULT[meta.tickKind]!;
    const layers = s.layers ?? 1;
    bits.push(`每回生命上限${Math.round(pct * layers * 100)}%`);
  }
  if (meta.actionWeightMult != null && meta.actionWeightMult !== 1) {
    bits.push(`行动权重×${Math.round(meta.actionWeightMult * 100)}%`);
  }
  if (meta.outgoingDamageMult != null && meta.outgoingDamageMult !== 1) {
    bits.push(`出手伤害×${Math.round(meta.outgoingDamageMult * 100)}%`);
  }
  return bits.length > 0 ? bits.join('、') : null;
}

function statusBody(s: ApplyStatusDef, ctx: StatusDisplayCtx): string {
  const meta = getStatusDef(s.statusId);
  const name = statusLabel(s.statusId);
  const bits: string[] = [name];
  if (s.layers != null && s.layers > 1) bits.push(`${s.layers}层`);
  if (s.duration != null && !meta?.appliesAsShield) bits.push(`${s.duration}回`);
  const potency = statusPotencyText(s, ctx);
  if (potency) bits.push(`（${potency}）`);
  return bits.join('');
}

function statusEntryText(s: ApplyStatusDef, ctx: StatusDisplayCtx): string {
  const meta = getStatusDef(s.statusId);
  const body = statusBody(s, ctx);
  const isHostile = meta?.kind === 'debuff' || meta?.kind === 'cc';
  if (!isHostile) return body;
  // 铺垫类不写「必中」；硬控/扰乱写命中率（按状态 landBase）
  if (meta?.guaranteedLand) {
    if (s.chance != null && s.chance < 1) {
      return `${Math.round(s.chance * 100)}%附加${body}`;
    }
    return `附加${body}`;
  }
  const land = Math.round(
    statusLandChance(ctx.role, ctx.masteryRating, 0, s.statusId) * 100,
  );
  if (s.chance != null && s.chance < 1) {
    return `${Math.round(s.chance * 100)}%附加${body} · 命中率${land}%`;
  }
  return `附加${body} · 命中率${land}%`;
}

/** 导出供单测；技能页状态一句 */
export function statusText(
  skill: { applyStatus: ApplyStatusDef[] },
  ctx: StatusDisplayCtx = { role: 'flex', masteryRating: 0 },
): string {
  if (skill.applyStatus.length === 0) return '';
  return skill.applyStatus.map((s) => statusEntryText(s, ctx)).join(' · ');
}

function skillPreviewKind(skill: SkillDef): 'damage' | 'heal' | 'shield' {
  if (skill.tags.includes('heal')) return 'heal';
  if (skill.tags.includes('guard')) return 'shield';
  return 'damage';
}

function previewLabelOf(kind: 'damage' | 'heal' | 'shield'): string {
  if (kind === 'heal') return '约疗';
  if (kind === 'shield') return '约盾';
  return '约伤';
}

function targetClause(patternLabel: string, kind: 'damage' | 'heal' | 'shield'): string {
  if (kind === 'damage') {
    return patternLabel === '单体' ? '对敌方单体' : `对敌方${patternLabel}`;
  }
  return patternLabel === '单体' ? '为己方单体' : `为己方${patternLabel}`;
}

function fmtTimes(n: number): string {
  return `×${Math.round(n * 100) / 100}`;
}

function fmtPct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

function thenFromCopy(copy: string): string {
  const i = copy.indexOf('：');
  return (i >= 0 ? copy.slice(i + 1) : copy).trim();
}

function sameGate(a: number | undefined, b: number | undefined): boolean {
  if (a == null || b == null) return true;
  return Math.abs(a - b) < 0.005;
}

/** 效果句与软模式同一门槛时合成一句，避免「低于40%」说两遍 */
function effectMatchingSoftMode(mode: SoftModeDef, effects: SkillEffect[]): SkillEffect | undefined {
  const w = mode.when;
  if (w.kind === 'first_cast') return effects.find((e) => e.kind === 'first_cast');
  if (w.kind === 'self_hp_below') {
    return effects.find((e) => e.kind === 'self_low_hp' && sameGate(e.value, w.value));
  }
  if (w.kind === 'target_hp_below') {
    return effects.find(
      (e) =>
        (e.kind === 'execute' || e.kind === 'heal_low_hp') && sameGate(e.value, w.value),
    );
  }
  if (w.kind === 'target_under_cc') return effects.find((e) => e.kind === 'vs_cc');
  if (w.kind === 'target_has_shield') return effects.find((e) => e.kind === 'vs_shield');
  return undefined;
}

const CONDITION_PREFIX =
  /^(自身生命低于[^，]+时|目标生命低于[^，]+时|目标生命高于[^，]+时|本场首次施放时|若目标带有[^，]+|若目标已被硬控|若目标有护盾|己方有人倒下时)/;

function foldSameConditionSentences(parts: string[]): string[] {
  const out: string[] = [];
  for (const raw of parts) {
    const s = raw.replace(/[。]+$/, '');
    const key = s.match(CONDITION_PREFIX)?.[1];
    if (!key) {
      out.push(s);
      continue;
    }
    const rest = s.slice(key.length).replace(/^，|^则/, '').replace(/^并/, '');
    const idx = out.findIndex((x) => x.startsWith(key));
    if (idx >= 0) {
      out[idx] = `${out[idx]}，并${rest}`;
    } else {
      out.push(s);
    }
  }
  return out;
}

/** 软模式写成魔兽/新的开始式条件句，不用「变招」标签 */
export function softModeSentence(mode: SoftModeDef): string {
  const then = thenFromCopy(mode.copy);
  const w = mode.when;
  if (w.kind === 'target_has_status') {
    return `若目标带有${statusLabel(w.statusId)}，则${then}`;
  }
  if (w.kind === 'target_under_cc') {
    return `若目标已被硬控，则${then}`;
  }
  if (w.kind === 'self_hp_below') {
    return `自身生命低于${fmtPct(w.value)}时，${then}`;
  }
  if (w.kind === 'target_hp_below') {
    return `目标生命低于${fmtPct(w.value)}时，${then}`;
  }
  if (w.kind === 'first_cast') {
    return `本场首次施放时，${then}`;
  }
  if (w.kind === 'target_has_shield') {
    return `若目标有护盾，则${then}`;
  }
  return `己方有人倒下时，${then}`;
}

function tooltipStatusClause(s: ApplyStatusDef, ctx: StatusDisplayCtx): string {
  const meta = getStatusDef(s.statusId);
  const name = statusLabel(s.statusId);
  const bits: string[] = [name];
  if (s.layers != null && s.layers > 1) bits.push(`${s.layers}层`);
  if (s.duration != null && !meta?.appliesAsShield) bits.push(`${s.duration}回`);
  const potency = statusPotencyText(s, ctx);
  if (potency) bits.push(potency);
  const body = bits[0] + (bits.length > 1 ? `（${bits.slice(1).join('，')}）` : '');
  const isHostile = meta?.kind === 'debuff' || meta?.kind === 'cc';
  if (!isHostile) return `并获得${body}`;
  if (meta?.guaranteedLand) {
    if (s.chance != null && s.chance < 1) {
      return `有${Math.round(s.chance * 100)}%几率附加${body}`;
    }
    return `并附加${body}`;
  }
  const land = Math.round(statusLandChance(ctx.role, ctx.masteryRating, 0, s.statusId) * 100);
  const p = s.chance != null && s.chance < 1 ? Math.round(s.chance * 100) : land;
  return `并有${p}%几率使其${body}`;
}

function tooltipEffectClause(e: SkillEffect): string {
  return proseSkillEffect(e);
}

function buildCoeffLine(skill: SkillDef): { coeffLine: string; multiplier: number; schoolLabel: string } {
  const mult = Math.round(skill.multiplier * 100) / 100;
  const kind = skillPreviewKind(skill);
  const school = skill.damageSchool ?? (kind === 'damage' ? 'phys' : 'spirit');
  const schoolLabel = school === 'spirit' ? '灵系' : '力系';
  if (kind === 'heal') return { multiplier: mult, schoolLabel, coeffLine: `治疗 = ${schoolLabel}×${mult}` };
  if (kind === 'shield') return { multiplier: mult, schoolLabel, coeffLine: `护盾 = ${schoolLabel}×${mult}` };
  return { multiplier: mult, schoolLabel, coeffLine: `伤害 = ${schoolLabel}×${mult}` };
}

/** 给玩家看的技能正文：魔兽/新的开始式一段话，数字嵌在句子里 */
export function buildSkillRulesLine(
  skill: SkillDef,
  preview: { kind: 'damage' | 'heal' | 'shield'; amount: number; schoolLabel: string; multiplier: number },
  extras: {
    statusCtx: StatusDisplayCtx;
  },
): string {
  const tgt = targetClause(targetPatternLabel(skill.targetPattern), preview.kind);
  const amount = `（约${preview.amount}）`;
  const pierce = preview.kind === 'damage' && skill.tags.includes('pierce') ? '穿透' : '';
  let head: string;
  if (preview.kind === 'heal') {
    head = `${tgt}恢复${preview.schoolLabel}×${preview.multiplier}的气血${amount}`;
  } else if (preview.kind === 'shield') {
    head = `${tgt}施加${preview.schoolLabel}×${preview.multiplier}的护盾${amount}`;
  } else {
    head = `${tgt}造成${preview.schoolLabel}×${preview.multiplier}的${pierce}伤害${amount}`;
  }

  const attach = skill.applyStatus.map((s) => tooltipStatusClause(s, extras.statusCtx));
  if (attach.length === 1) {
    head = `${head}，${attach[0]}`;
  } else if (attach.length > 1) {
    head = `${head}，${attach.join('，')}`;
  }

  const sentences = [head];
  const modes = skill.softModes ?? [];
  const effects = skill.effects ?? [];
  const folded = new Set<SkillEffect>();
  const foldedModes = new Set<SoftModeDef>();
  for (const mode of modes) {
    const fx = effectMatchingSoftMode(mode, effects);
    if (!fx || folded.has(fx)) continue;
    folded.add(fx);
    foldedModes.add(mode);
    const extras = modes
      .filter((m) => effectMatchingSoftMode(m, [fx]) === fx)
      .map((m) => {
        foldedModes.add(m);
        return thenFromCopy(m.copy);
      })
      .join('，');
    sentences.push(`${tooltipEffectClause(fx)}，并${extras}`);
  }
  for (const e of effects) {
    if (folded.has(e)) continue;
    sentences.push(tooltipEffectClause(e));
  }
  if (skill.followUp) {
    sentences.push(
      `有${Math.round(skill.followUp.chance * 100)}%几率追加一击（${fmtTimes(skill.followUp.multiplier ?? 1)}）`,
    );
  }
  for (const mode of modes) {
    if (foldedModes.has(mode)) continue;
    sentences.push(softModeSentence(mode));
  }
  return `${foldSameConditionSentences(sentences).join('。')}。`;
}

export function skillDisplayFor(templateId: string, state: PlayerState): SkillDisplayInfo | null {
  const template = getTemplate(templateId);
  if (!template) return null;
  const progress = getProgress(state, templateId);
  const equipMods = listEquipmentSkillModifiers(state, templateId);
  const composeCtx = { extraModifiers: equipMods };
  const skill = skillWithGrowth(template, progress, composeCtx);
  const morphBits = equipMods.map((m) => m.label).filter(Boolean) as string[];

  const { coeffLine, multiplier, schoolLabel } = buildCoeffLine(skill);
  const derived = deriveGrowthStats(template, progress);
  const equipBonus = sumEquipmentBonuses(state, templateId);
  const masteryRating = derived.masteryRating + equipBonus.masteryRating;
  const atk = Math.max(1, derived.atk + equipBonus.atk);
  const previewKind = skillPreviewKind(skill);
  const previewLabel = previewLabelOf(previewKind);
  const previewAmount = Math.max(1, Math.floor(atk * multiplier));
  const st = statusText(skill, {
    role: template.role,
    masteryRating,
  });
  const effectsLine =
    skill.effects && skill.effects.length > 0
      ? skill.effects.map(summarizeSkillEffect).join(' · ')
      : null;
  const followUpLine = followUpText(skill.followUp);
  const softModeLine =
    skill.softModes && skill.softModes.length > 0
      ? skill.softModes.map(softModeSentence).join(' ')
      : null;
  const rulesLine = buildSkillRulesLine(
    skill,
    { kind: previewKind, amount: previewAmount, schoolLabel, multiplier },
    {
      statusCtx: { role: template.role, masteryRating },
    },
  );

  return {
    name: skill.name,
    blurb: skill.blurb ?? null,
    qiCost: skill.qiCost,
    targetPattern: targetPatternLabel(skill.targetPattern),
    damageSchool: skill.damageSchool,
    multiplier,
    coeffLine,
    previewKind,
    previewLabel,
    previewAmount,
    rulesLine,
    statusLine: st,
    effectsLine,
    followUpLine,
    softModeLine,
    morphLine: morphBits.length > 0 ? morphBits.join(' · ') : null,
    roleLine: roleLabel(template.role),
    jobLine: jobLabel(template.job),
  };
}

export interface FormationHints {
  /** 缺职能一句；无则 null */
  missingRoleLine: string | null;
  /** 已触发共鸣或差一步提示；无则 null */
  resonanceLine: string | null;
  /** templateId → 推荐排名 */
  preferredRowById: Record<string, string>;
  /** 推荐格位集合（空位高亮） */
  preferredSlots: GridSlot[];
}

const FRONT_SLOTS: GridSlot[] = [1, 2, 3];

function formationResonanceLine(party: ReturnType<typeof buildPlayerParty>): string | null {
  if (party.length === 0) return null;
  const active = resolveFormationResonances(party);
  if (active.length > 0) {
    return active.map((d) => `共鸣：${d.label}`).join(' · ');
  }
  const frontFilled = FRONT_SLOTS.filter((s) => party.some((u) => u.slot === s)).length;
  if (frontFilled === 2) return '前排再填 1 人 → 铁壁共鸣（全队防↑）';
  const backCount = party.filter((u) => rowOf(u.slot) === 'back').length;
  if (backCount === 1) return '后排再填 1 人 → 守望共鸣（全队抗↑）';
  return null;
}

export function formationHints(state: PlayerState): FormationHints {
  const onField = UNIT_TEMPLATES.filter((t) => state.formation[t.id] != null);
  const roles = new Set(onField.map((t) => t.role));
  const hasHeal = roles.has('st_heal') || roles.has('aoe_heal');
  const missing: string[] = [];
  if (!roles.has('tank')) missing.push('坦克');
  if (!hasHeal) missing.push('治疗');

  const preferredRowById: Record<string, string> = {};
  const preferredSlots: GridSlot[] = [];
  for (const t of UNIT_TEMPLATES) {
    if (!isOwned(state, t.id)) continue;
    const row = rowOf(t.preferredSlot);
    preferredRowById[t.id] = rowLabel(row);
    if (!state.formation[t.id]) {
      preferredSlots.push(t.preferredSlot);
    }
  }

  const party = buildPlayerParty(state);

  return {
    missingRoleLine:
      missing.length > 0 && onField.length > 0
        ? `出战缺：${missing.join('、')}`
        : missing.length > 0 && onField.length === 0
          ? '尚未上阵；建议先上坦克与治疗'
          : null,
    resonanceLine: formationResonanceLine(party),
    preferredRowById,
    preferredSlots: [...new Set(preferredSlots)],
  };
}

/** Hub/布阵外简短共鸣预览 */
export function formationResonancePreview(state: PlayerState): string | null {
  return formationResonanceLine(buildPlayerParty(state));
}

/** 名录排序：已拥有优先，已拥有按战力，未拥有按品级 */
const RARITY_RANK: Record<string, number> = {
  legendary: 0,
  epic: 1,
  rare: 2,
  uncommon: 3,
  common: 4,
};

export function compareRosterTemplates(
  a: UnitTemplate,
  b: UnitTemplate,
  state: PlayerState,
): number {
  const ownedA = isOwned(state, a.id);
  const ownedB = isOwned(state, b.id);
  if (ownedA !== ownedB) return ownedA ? -1 : 1;
  if (ownedA && ownedB) {
    const pa = characterPower(state, a.id);
    const pb = characterPower(state, b.id);
    if (pa !== pb) return pb - pa;
    const sa = getProgress(state, a.id).star;
    const sb = getProgress(state, b.id).star;
    if (sa !== sb) return sb - sa;
    const la = getProgress(state, a.id).level;
    const lb = getProgress(state, b.id).level;
    if (la !== lb) return lb - la;
    return a.name.localeCompare(b.name, 'zh');
  }
  const ra = RARITY_RANK[a.rarity] ?? 9;
  const rb = RARITY_RANK[b.rarity] ?? 9;
  if (ra !== rb) return ra - rb;
  return a.name.localeCompare(b.name, 'zh');
}
