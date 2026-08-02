import { rowLabel, rowOf } from '../formation/grid.js';
import type { GridSlot, PlayerState, UnitTemplate } from '../shared/types.js';
import { listEquipmentSkillModifiers } from '../equipment/morphs.js';
import {
  deriveGrowthStats,
  getProgress,
  isOwned,
  listBreakthroughPerks,
  MAX_STAR,
  nextBreakthroughPerk,
  resolveStarNode,
  skillDiffLines,
  skillWithGrowth,
  starShardCost,
  summarizeStarEffect,
  type DerivedGrowthStats,
  type StarNodeDef,
} from './growth.js';
import { getSkill } from './skills.js';
import { jobLabel, roleLabel } from './labels.js';
import { getTemplate, UNIT_TEMPLATES } from './templates.js';
import { previewStardustExchange } from './stardustExchange.js';

export interface StarUpPreview {
  nextStar: number;
  node?: StarNodeDef;
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
  const maxStar = MAX_STAR;
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
      nodeLine: '已达星级上限',
      ready: false,
    };
  }

  const nextStar = progress.star + 1;
  const node = resolveStarNode(templateId, nextStar);
  const before = deriveGrowthStats(template, progress);
  const after = deriveGrowthStats(template, { ...progress, star: nextStar });
  const useShard = shardsHave >= shardsNeed;

  return {
    nextStar,
    node,
    costKind: useShard ? 'shard' : 'need_shard',
    shardsHave,
    shardsNeed,
    attrDiffLine: summarizeAttrDiff(before, after),
    nodeLine: node ? `解锁「${node.label}」· ${effectSummary(node)}` : `升至 ★${nextStar}`,
    ready: useShard,
  };
}

export { previewStardustExchange };

export interface SkillDisplayInfo {
  name: string;
  qiCost: number;
  targetPattern: string;
  damageSchool?: string;
  multiplier: number;
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
}

/** ★1–MAX 全轨预览（未解锁也列出，促抽/升星） */
export function listStarTrackRows(templateId: string, star: number): StarTrackRow[] {
  const rows: StarTrackRow[] = [];
  for (let s = 1; s <= MAX_STAR; s += 1) {
    const node = resolveStarNode(templateId, s);
    if (!node) continue;
    rows.push({
      star: s,
      label: node.label,
      effectLine: effectSummary(node),
      unlocked: s <= star,
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

function statusText(skill: { applyStatus: { statusId: string; layers?: number; duration?: number }[] }): string {
  if (skill.applyStatus.length === 0) return '';
  return skill.applyStatus
    .map((s) => {
      const bits = [s.statusId];
      if (s.layers != null) bits.push(`×${s.layers}`);
      if (s.duration != null) bits.push(`${s.duration}回`);
      return bits.join('');
    })
    .join(' · ');
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
  if (nextNode && progress.star < MAX_STAR) {
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

  const fx = skill.effects?.map((e) => e.kind).join(' · ') ?? null;

  return {
    name: skill.name,
    qiCost: skill.qiCost,
    targetPattern: skill.targetPattern,
    damageSchool: skill.damageSchool,
    multiplier: Math.round(skill.multiplier * 100) / 100,
    statusLine: statusText(skill) ? `附带 ${statusText(skill)}` : '',
    effectsLine: fx ? `效果 ${fx}` : null,
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
