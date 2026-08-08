import {
  markPreyValueWithMastery,
  shredValueWithMastery,
  statusLandChance,
} from '../combat/mastery.js';
import { getStatusDef, statusLabel } from '../combat/statusFx.js';
import { sumEquipmentBonuses } from '../equipment/equipment.js';
import { listEquipmentSkillModifiers } from '../equipment/morphs.js';
import { rowLabel, rowOf } from '../formation/grid.js';
import type {
  ApplyStatusDef,
  GridSlot,
  PlayerState,
  Role,
  SkillDef,
  UnitTemplate,
} from '../shared/types.js';
import {
  deriveGrowthStats,
  getProgress,
  isOwned,
  listBreakthroughPerks,
  maxStarForTemplate,
  nextBreakthroughPerk,
  getStarBranches,
  resolveStarNode,
  skillDiffLines,
  skillWithGrowth,
  starShardCost,
  summarizeStarEffect,
  type DerivedGrowthStats,
  type StarNodeDef,
} from './growth.js';
import { getSkill } from './skills.js';
import { jobLabel, roleLabel, targetPatternLabel } from './labels.js';
import { getTemplate, UNIT_TEMPLATES } from './templates.js';
import { previewStardustExchange } from './stardustExchange.js';

export interface StarBranchPreview {
  id: string;
  label: string;
  effectLine: string;
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
  push('攻', before.physAtk, after.physAtk);
  push('灵', before.spiritAtk, after.spiritAtk);
  push('防', before.physDef, after.physDef);
  push('灵防', before.spiritDef, after.spiritDef);
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

function effectSummary(node: StarNodeDef): string {
  const bits = node.effects.map(summarizeStarEffect).filter(Boolean);
  return bits.join(' · ') || node.label;
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
  const branchDefs = getStarBranches(templateId, nextStar);
  const isBranch = branchDefs.length >= 2;
  const branches: StarBranchPreview[] | undefined = isBranch
    ? branchDefs.map((b) => {
        const resolved = resolveStarNode(templateId, nextStar, b.id);
        return {
          id: b.id,
          label: b.label,
          effectLine: resolved ? effectSummary(resolved) : b.label,
        };
      })
    : undefined;
  const node = resolveStarNode(templateId, nextStar);
  const before = deriveGrowthStats(template, progress);
  const after = deriveGrowthStats(template, { ...progress, star: nextStar });
  const useShard = shardsHave >= shardsNeed;
  const nodeLine = isBranch
    ? `解锁岔路「${node?.label ?? `★${nextStar}`}」· 升星后二选一`
    : node
      ? `解锁「${node.label}」· ${effectSummary(node)}`
      : `升至 ★${nextStar}`;

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
  statusLine: string;
  effectsLine: string | null;
  followUpLine: string | null;
  nextFollowUpLine: string | null;
  /** 相对底板的养成修正（多行拼一句） */
  growthModLine: string | null;
  /** 下一星相对当前的技能变化 */
  nextStarDiffLine: string | null;
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
  /** 若此星是岔路，列出可选分支 */
  branches?: StarBranchPreview[];
  /** 已选分支 id（未选则 undefined） */
  chosenBranch?: string;
}

/** ★1–品级上限 星轨预览（未解锁也列出；超品级星章不展示） */
export function listStarTrackRows(
  templateId: string,
  star: number,
  starBranch?: Record<number, string>,
): StarTrackRow[] {
  const rows: StarTrackRow[] = [];
  const cap = maxStarForTemplate(templateId);
  for (let s = 1; s <= cap; s += 1) {
    const choice = starBranch?.[s];
    const node = resolveStarNode(templateId, s, choice);
    if (!node) continue;
    const branchDefs = getStarBranches(templateId, s);
    const branches: StarBranchPreview[] | undefined =
      branchDefs.length >= 2
        ? branchDefs.map((b) => {
            const resolved = resolveStarNode(templateId, s, b.id);
            return {
              id: b.id,
              label: b.label,
              effectLine: resolved ? effectSummary(resolved) : b.label,
            };
          })
        : undefined;
    rows.push({
      star: s,
      label: node.label,
      effectLine: effectSummary(node),
      unlocked: s <= star,
      branches,
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
    effectLine: p.effects.map(summarizeStarEffect).filter(Boolean).join(' · '),
    unlocked: true as const,
  }));
  const nextPerk = nextBreakthroughPerk(templateId, tier);
  const next = nextPerk
    ? {
        tier: nextPerk.tier,
        label: nextPerk.label,
        effectLine: nextPerk.effects.map(summarizeStarEffect).filter(Boolean).join(' · '),
        unlocked: false,
      }
    : null;
  return { unlocked, next };
}

function followUpText(fu: { chance: number; multiplier?: number } | undefined): string | null {
  if (!fu) return null;
  return `连击 ${Math.round(fu.chance * 100)}% · 倍率×${fu.multiplier ?? 1}`;
}

type StatusDisplayCtx = {
  role: Role;
  masteryRating: number;
};

/** 状态强度一句（与命中分开；含精通预览） */
function statusPotencyText(s: ApplyStatusDef, ctx: StatusDisplayCtx): string | null {
  const meta = getStatusDef(s.statusId);
  if (!meta) return null;
  const carrier = { role: ctx.role, masteryRating: ctx.masteryRating };
  if (meta.incomingDefMultFromValue && s.value != null) {
    const v = shredValueWithMastery(carrier, s.value);
    return `防御×${Math.round(v * 100)}%`;
  }
  if (meta.incomingDamageTakenFromValue && s.value != null) {
    const v = markPreyValueWithMastery(carrier, s.value);
    return `承伤×${Math.round(v * 100)}%`;
  }
  if (meta.actionWeightMult != null && meta.actionWeightMult !== 1) {
    return `行动权重×${Math.round(meta.actionWeightMult * 100)}%`;
  }
  if (meta.outgoingDamageMult != null && meta.outgoingDamageMult !== 1) {
    return `出手伤害×${Math.round(meta.outgoingDamageMult * 100)}%`;
  }
  return null;
}

function statusBody(s: ApplyStatusDef, ctx: StatusDisplayCtx): string {
  const meta = getStatusDef(s.statusId);
  const name = statusLabel(s.statusId);
  const bits: string[] = [name];
  if (s.layers != null && s.layers > 1) bits.push(`×${s.layers}`);
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

function buildCoeffLine(skill: SkillDef): { coeffLine: string; multiplier: number } {
  const mult = Math.round(skill.multiplier * 100) / 100;
  const isHeal = skill.tags.includes('heal');
  const isGuard = skill.tags.includes('guard');
  const school = skill.damageSchool ?? (isHeal || isGuard ? 'spirit' : 'phys');
  const schoolLabel = school === 'spirit' ? '灵系' : '力系';
  if (isHeal) return { multiplier: mult, coeffLine: `治疗 = ${schoolLabel}×${mult}` };
  if (isGuard) return { multiplier: mult, coeffLine: `护盾 = ${schoolLabel}×${mult}` };
  return { multiplier: mult, coeffLine: `伤害 = ${schoolLabel}×${mult}` };
}

export function skillDisplayFor(templateId: string, state: PlayerState): SkillDisplayInfo | null {
  const template = getTemplate(templateId);
  if (!template) return null;
  const progress = getProgress(state, templateId);
  const equipMods = listEquipmentSkillModifiers(state);
  const composeCtx = { extraModifiers: equipMods };
  const base = getSkill(template.skillId);
  const skill = skillWithGrowth(template, progress, composeCtx);
  const growthOnly = skillWithGrowth(template, progress);
  const diffVsBase = skillDiffLines(base, growthOnly);
  const morphBits = equipMods.map((m) => m.label).filter(Boolean) as string[];

  let nextFollowUpLine: string | null = null;
  let nextStarDiffLine: string | null = null;
  const nextNode = resolveStarNode(templateId, progress.star + 1);
  if (nextNode && progress.star < maxStarForTemplate(templateId)) {
    const nextProgress = { ...progress, star: progress.star + 1 };
    const nextSkill = skillWithGrowth(template, nextProgress, composeCtx);
    const nextDiff = skillDiffLines(skill, nextSkill);
    if (nextDiff.length) {
      nextStarDiffLine = `下一星 · ${nextDiff.join(' · ')}`;
    }
    if (!skill.followUp && nextSkill.followUp) {
      nextFollowUpLine = `下一星 · ${followUpText(nextSkill.followUp)}`;
    } else if (
      skill.followUp &&
      nextSkill.followUp &&
      (skill.followUp.chance !== nextSkill.followUp.chance ||
        skill.followUp.multiplier !== nextSkill.followUp.multiplier)
    ) {
      nextFollowUpLine = `下一星 · ${followUpText(nextSkill.followUp)}`;
    }
  }

  const { coeffLine, multiplier } = buildCoeffLine(skill);
  const derived = deriveGrowthStats(template, progress);
  const equipBonus = sumEquipmentBonuses(state);
  const masteryRating = derived.masteryRating + equipBonus.masteryRating;
  const st = statusText(skill, {
    role: template.role,
    masteryRating,
  });

  return {
    name: skill.name,
    blurb: skill.blurb ?? null,
    qiCost: skill.qiCost,
    targetPattern: targetPatternLabel(skill.targetPattern),
    damageSchool: skill.damageSchool,
    multiplier,
    coeffLine,
    statusLine: st,
    effectsLine: null,
    followUpLine: followUpText(skill.followUp),
    nextFollowUpLine,
    growthModLine: diffVsBase.length > 0 ? diffVsBase.join(' · ') : null,
    nextStarDiffLine,
    morphLine: morphBits.length > 0 ? morphBits.join(' · ') : null,
    roleLine: roleLabel(template.role),
    jobLine: jobLabel(template.job),
  };
}

export interface FormationHints {
  /** 缺职能一句；无则 null */
  missingRoleLine: string | null;
  /** templateId → 推荐排名 */
  preferredRowById: Record<string, string>;
  /** 推荐格位集合（空位高亮） */
  preferredSlots: GridSlot[];
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

  return {
    missingRoleLine:
      missing.length > 0 && onField.length > 0
        ? `出战缺：${missing.join('、')}`
        : missing.length > 0 && onField.length === 0
          ? '尚未上阵；建议先上坦克与治疗'
          : null,
    preferredRowById,
    preferredSlots: [...new Set(preferredSlots)],
  };
}

/** 列表排序：稀有度 → 等级 → 名称 */
const RARITY_RANK: Record<string, number> = {
  legendary: 0,
  epic: 1,
  rare: 2,
  common: 3,
};

export function compareRosterTemplates(
  a: UnitTemplate,
  b: UnitTemplate,
  state: PlayerState,
): number {
  const ra = RARITY_RANK[a.rarity] ?? 9;
  const rb = RARITY_RANK[b.rarity] ?? 9;
  if (ra !== rb) return ra - rb;
  const la = getProgress(state, a.id).level;
  const lb = getProgress(state, b.id).level;
  if (la !== lb) return lb - la;
  return a.name.localeCompare(b.name, 'zh');
}
