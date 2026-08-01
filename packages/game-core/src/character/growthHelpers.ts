import { rowLabel, rowOf } from '../formation/grid.js';
import type { GridSlot, PlayerState, UnitTemplate } from '../shared/types.js';
import {
  deriveGrowthStats,
  getProgress,
  isOwned,
  resolveStarNode,
  SHARED_STAR_NODES,
  skillWithGrowth,
  starCost,
  type DerivedGrowthStats,
  type StarNodeDef,
} from './growth.js';
import { jobLabel, roleLabel } from './labels.js';
import { getTemplate, UNIT_TEMPLATES } from './templates.js';

export interface StarUpPreview {
  nextStar: number;
  node?: StarNodeDef;
  /** 碎片优先 */
  costKind: 'shard' | 'stardust' | 'max' | 'unowned';
  shardsHave: number;
  stardustHave: number;
  stardustNeed: number;
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
  const bits: string[] = [];
  for (const fx of node.effects) {
    if (fx.kind === 'stat_pct') bits.push(`主属性+${Math.round(fx.mainPct * 100)}%`);
    if (fx.kind === 'rare_stat') {
      const name =
        fx.stat === 'lifesteal' ? '吸血' : fx.stat === 'dodge' ? '闪避' : '格挡';
      bits.push(`${name}+${Math.round(fx.value * 100)}%`);
    }
    if (fx.kind === 'enable_follow_up') {
      bits.push(`连击${Math.round(fx.chance * 100)}%×${fx.multiplier ?? 1}`);
    }
  }
  return bits.join(' · ') || node.label;
}

/** 升星只读预览：消耗 + 属性/节点 diff */
export function previewStarUp(state: PlayerState, templateId: string): StarUpPreview {
  const template = getTemplate(templateId);
  const progress = getProgress(state, templateId);
  const maxStar = Math.max(...SHARED_STAR_NODES.map((n) => n.star));
  const shardsHave = progress.cardShards ?? 0;
  const stardustHave = state.currencies?.stardust ?? 0;
  const stardustNeed = starCost(progress.star);

  if (!isOwned(state, templateId) || !template) {
    return {
      nextStar: progress.star + 1,
      costKind: 'unowned',
      shardsHave,
      stardustHave,
      stardustNeed,
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
      stardustHave,
      stardustNeed,
      attrDiffLine: '',
      nodeLine: '已达星级上限',
      ready: false,
    };
  }

  const nextStar = progress.star + 1;
  const node = resolveStarNode(templateId, nextStar);
  const before = deriveGrowthStats(template, progress);
  const after = deriveGrowthStats(template, { ...progress, star: nextStar });
  const useShard = shardsHave >= 1;

  return {
    nextStar,
    node,
    costKind: useShard ? 'shard' : 'stardust',
    shardsHave,
    stardustHave,
    stardustNeed,
    attrDiffLine: summarizeAttrDiff(before, after),
    nodeLine: node ? `解锁「${node.label}」· ${effectSummary(node)}` : `升至 ★${nextStar}`,
    ready: useShard || stardustHave >= stardustNeed,
  };
}

export interface SkillDisplayInfo {
  name: string;
  qiCost: number;
  targetPattern: string;
  damageSchool?: string;
  multiplier: number;
  statusLine: string;
  followUpLine: string | null;
  nextFollowUpLine: string | null;
  roleLine: string;
  jobLine: string;
}

function followUpText(fu: { chance: number; multiplier?: number } | undefined): string | null {
  if (!fu) return null;
  return `连击 ${Math.round(fu.chance * 100)}% · 倍率×${fu.multiplier ?? 1}`;
}

export function skillDisplayFor(templateId: string, state: PlayerState): SkillDisplayInfo | null {
  const template = getTemplate(templateId);
  if (!template) return null;
  const progress = getProgress(state, templateId);
  const skill = skillWithGrowth(template, progress);
  const derived = deriveGrowthStats(template, progress);
  const nextNode = resolveStarNode(templateId, progress.star + 1);
  let nextFollowUpLine: string | null = null;
  if (nextNode) {
    const nextProgress = { ...progress, star: progress.star + 1 };
    const nextDerived = deriveGrowthStats(template, nextProgress);
    if (
      nextDerived.followUp &&
      (!derived.followUp ||
        nextDerived.followUp.chance !== derived.followUp.chance ||
        nextDerived.followUp.multiplier !== derived.followUp.multiplier)
    ) {
      nextFollowUpLine = `下一星 · ${followUpText(nextDerived.followUp)}`;
    }
  }
  return {
    name: skill.name,
    qiCost: skill.qiCost,
    targetPattern: skill.targetPattern,
    damageSchool: skill.damageSchool,
    multiplier: skill.multiplier,
    statusLine: skill.applyStatus[0] ? `附带 ${skill.applyStatus[0].statusId}` : '',
    followUpLine: followUpText(derived.followUp ?? skill.followUp),
    nextFollowUpLine,
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
