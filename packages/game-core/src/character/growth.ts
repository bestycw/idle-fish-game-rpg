import type {
  CharacterProgress,
  PlayerCurrencies,
  PlayerState,
  UnitTemplate,
} from '../shared/types.js';
import { breakthroughLabel } from './breakthroughDisplay.js';
import { getSkill } from './skills.js';
import { UNIT_TEMPLATES } from './templates.js';

export { breakthroughLabel, nextBreakthroughLabel, BREAKTHROUGH_LABELS } from './breakthroughDisplay.js';

/** 开局已拥有（与 DEFAULT_DEPLOYED_IDS 对齐；主角必有） */
export const STARTER_OWNED_IDS = [
  'hero',
  'zhangfei',
  'zhaoyun',
  'wukong',
  'huatuo',
] as const;

/** 突破阶 → 等级上限（可配置替换） */
export const LEVEL_CAP_BY_TIER = [20, 40, 60, 80, 100] as const;

export type StarNodeEffect =
  | { kind: 'stat_pct'; mainPct: number }
  | { kind: 'rare_stat'; stat: 'lifesteal' | 'dodge' | 'block'; value: number }
  | { kind: 'enable_follow_up'; chance: number; multiplier?: number };

export interface StarNodeDef {
  star: number;
  label: string;
  effects: StarNodeEffect[];
  /** true：与共用节点 effects 叠加；默认 false = 整节点替换 */
  stack?: boolean;
}

/** 共用升星阶梯（可扩） */
export const SHARED_STAR_NODES: StarNodeDef[] = [
  { star: 1, label: '主属性强化', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
  { star: 2, label: '吸血微光', effects: [{ kind: 'rare_stat', stat: 'lifesteal', value: 0.03 }] },
  {
    star: 3,
    label: '连击契机',
    effects: [{ kind: 'enable_follow_up', chance: 0.25, multiplier: 0.55 }],
  },
  { star: 4, label: '主属性强化', effects: [{ kind: 'stat_pct', mainPct: 0.04 }] },
  {
    star: 5,
    label: '连击强化',
    effects: [{ kind: 'enable_follow_up', chance: 0.35, multiplier: 0.7 }],
  },
];

/**
 * 特例节点。
 * - 默认 override：整节点替换共用
 * - stack: true：标签用特例，effects = 共用 + 特例
 */
export const STAR_OVERRIDES: Record<string, Partial<Record<number, StarNodeDef>>> = {
  zhaoyun: {
    3: {
      star: 3,
      label: '七进七出',
      effects: [{ kind: 'enable_follow_up', chance: 0.32, multiplier: 0.65 }],
    },
  },
  wukong: {
    3: {
      star: 3,
      label: '筋斗',
      stack: true,
      effects: [{ kind: 'rare_stat', stat: 'dodge', value: 0.05 }],
    },
  },
};

export function levelCapForTier(tier: number): number {
  const idx = Math.max(0, Math.min(LEVEL_CAP_BY_TIER.length - 1, tier));
  return LEVEL_CAP_BY_TIER[idx]!;
}

export function expToNextLevel(level: number): number {
  return 30 + level * 12;
}

export function breakthroughCost(tier: number): number {
  return 40 + tier * 35;
}

export function starCost(star: number): number {
  return 8 + star * 8;
}

export function defaultProgress(templateId: string): CharacterProgress {
  const starter = (STARTER_OWNED_IDS as readonly string[]).includes(templateId);
  return {
    templateId,
    level: 1,
    exp: 0,
    breakthroughTier: 0,
    star: 0,
    owned: starter,
    cardShards: 0,
  };
}

export function defaultCurrencies(): PlayerCurrencies {
  return { xiuwei: 0, stardust: 0, ticket: 0 };
}

export function isOwned(state: PlayerState, templateId: string): boolean {
  const p = state.roster?.[templateId];
  if (p?.owned != null) return p.owned;
  return (STARTER_OWNED_IDS as readonly string[]).includes(templateId);
}

export function ensureRoster(state: PlayerState): PlayerState {
  const roster = { ...(state.roster ?? {}) };
  let changed = false;
  for (const t of UNIT_TEMPLATES) {
    const existing = roster[t.id];
    if (!existing) {
      roster[t.id] = defaultProgress(t.id);
      changed = true;
      continue;
    }
    let row = existing;
    if (row.owned == null) {
      const starter = (STARTER_OWNED_IDS as readonly string[]).includes(t.id);
      const onField = state.formation?.[t.id] != null;
      row = { ...row, owned: starter || onField || Boolean(t.isHero) };
      changed = true;
    }
    if (row.cardShards == null) {
      row = { ...row, cardShards: 0 };
      changed = true;
    }
    roster[t.id] = row;
  }
  const currencies = { ...defaultCurrencies(), ...(state.currencies ?? {}) };
  if (currencies.ticket == null) currencies.ticket = 0;
  const currencyMissing =
    state.currencies == null ||
    state.currencies.xiuwei == null ||
    state.currencies.stardust == null ||
    state.currencies.ticket == null;
  const towerFloor = Math.max(1, state.towerFloor ?? 1);
  const towerMissing = state.towerFloor == null || state.towerFloor < 1;
  const gachaPity = Math.max(0, state.gachaPity ?? 0);
  const pityMissing = state.gachaPity == null;
  const chapterCleared = Math.max(0, state.chapterCleared ?? 0);
  const chapterNodeIndex = Math.max(0, state.chapterNodeIndex ?? 0);
  const chapterMissing = state.chapterCleared == null || state.chapterNodeIndex == null;
  const versionOk = state.version === 9;
  if (
    !changed &&
    !currencyMissing &&
    !towerMissing &&
    !pityMissing &&
    !chapterMissing &&
    versionOk
  ) {
    return state;
  }
  return {
    ...state,
    version: 9,
    roster,
    currencies,
    towerFloor,
    gachaPity,
    chapterCleared,
    chapterNodeIndex,
  };
}

export function getProgress(state: PlayerState, templateId: string): CharacterProgress {
  const p = state.roster[templateId];
  if (!p) return defaultProgress(templateId);
  const base = defaultProgress(templateId);
  return {
    ...base,
    ...p,
    owned: p.owned ?? base.owned,
    cardShards: p.cardShards ?? 0,
  };
}

export function resolveStarNode(templateId: string, star: number): StarNodeDef | undefined {
  const shared = SHARED_STAR_NODES.find((n) => n.star === star);
  const override = STAR_OVERRIDES[templateId]?.[star];
  if (!override) return shared;
  if (override.stack && shared) {
    return {
      star,
      label: override.label,
      stack: true,
      effects: [...shared.effects, ...override.effects],
    };
  }
  return override;
}

export function unlockedStarNodes(templateId: string, star: number): StarNodeDef[] {
  const nodes: StarNodeDef[] = [];
  for (let s = 1; s <= star; s += 1) {
    const n = resolveStarNode(templateId, s);
    if (n) nodes.push(n);
  }
  return nodes;
}

export interface DerivedGrowthStats {
  physAtk: number;
  spiritAtk: number;
  physDef: number;
  spiritDef: number;
  maxHp: number;
  spd: number;
  critRating: number;
  critDmgRating: number;
  hasteRating: number;
  versRating: number;
  masteryRating: number;
  finalDmgRating: number;
  fortune: number;
  dodge: number;
  lifesteal: number;
  critResist: number;
  block: number;
  followUp?: { chance: number; multiplier?: number };
  unlockedLabels: string[];
}

/** 模板底数 × 等级/突破/升星（装备在外层叠加） */
export function deriveGrowthStats(
  template: UnitTemplate,
  progress: CharacterProgress,
): DerivedGrowthStats {
  const lv = Math.max(1, progress.level);
  const tier = Math.max(0, progress.breakthroughTier);
  const levelFactor = 1 + (lv - 1) * 0.035;
  const tierBonus = 1 + tier * 0.04;

  let mainPct = 0;
  let lifesteal = template.lifesteal ?? 0;
  let dodge = template.dodge ?? 0;
  let block = template.block ?? 0;
  let followUp: DerivedGrowthStats['followUp'];
  const unlockedLabels: string[] = [];

  for (const node of unlockedStarNodes(template.id, progress.star)) {
    unlockedLabels.push(node.label);
    for (const fx of node.effects) {
      if (fx.kind === 'stat_pct') mainPct += fx.mainPct;
      if (fx.kind === 'rare_stat') {
        if (fx.stat === 'lifesteal') lifesteal += fx.value;
        if (fx.stat === 'dodge') dodge += fx.value;
        if (fx.stat === 'block') block += fx.value;
      }
      if (fx.kind === 'enable_follow_up') {
        followUp = { chance: fx.chance, multiplier: fx.multiplier };
      }
    }
  }

  const starFactor = 1 + mainPct;
  const scale = levelFactor * tierBonus * starFactor;

  return {
    physAtk: Math.max(1, Math.round(template.basePhysAtk * scale)),
    spiritAtk: Math.max(1, Math.round(template.baseSpiritAtk * scale)),
    physDef: Math.max(1, Math.round(template.basePhysDef * scale)),
    spiritDef: Math.max(1, Math.round(template.baseSpiritDef * scale)),
    maxHp: Math.max(1, Math.round(template.baseMaxHp * scale)),
    spd: Math.max(1, Math.round(template.baseSpd * (1 + (lv - 1) * 0.01 + tier * 0.01))),
    critRating: template.critRating + Math.floor((lv - 1) * 0.4),
    critDmgRating: template.critDmgRating + Math.floor((lv - 1) * 0.3),
    hasteRating: template.hasteRating + Math.floor((lv - 1) * 0.25),
    versRating: template.versRating,
    masteryRating: template.masteryRating + Math.floor((lv - 1) * 0.35),
    finalDmgRating: template.finalDmgRating,
    fortune: template.fortune,
    dodge,
    lifesteal,
    critResist: template.critResist ?? 0,
    block,
    followUp,
    unlockedLabels,
  };
}

export type GrowthActionResult =
  | { ok: true; state: PlayerState; message: string }
  | { ok: false; message: string };

export function tryLevelUp(state: PlayerState, templateId: string): GrowthActionResult {
  const s = ensureRoster(state);
  const progress = { ...getProgress(s, templateId) };
  const cap = levelCapForTier(progress.breakthroughTier);
  if (progress.level >= cap) {
    return { ok: false, message: '已达当前境界等级上限，请先破境。' };
  }
  const need = expToNextLevel(progress.level);
  if (progress.exp < need) {
    return { ok: false, message: `经验不足（${progress.exp}/${need}）。` };
  }
  progress.exp -= need;
  progress.level += 1;
  return {
    ok: true,
    state: {
      ...s,
      roster: { ...s.roster, [templateId]: progress },
    },
    message: `升级至 Lv ${progress.level}`,
  };
}

export function tryBreakthrough(state: PlayerState, templateId: string): GrowthActionResult {
  const s = ensureRoster(state);
  const progress = { ...getProgress(s, templateId) };
  if (progress.breakthroughTier >= LEVEL_CAP_BY_TIER.length - 1) {
    return { ok: false, message: '已达当前最高境界（草案上限）。' };
  }
  if (progress.level < levelCapForTier(progress.breakthroughTier)) {
    return { ok: false, message: '需先将等级升至当前上限再破境。' };
  }
  const cost = breakthroughCost(progress.breakthroughTier);
  const xiuwei = s.currencies.xiuwei ?? 0;
  if (xiuwei < cost) {
    return { ok: false, message: `修为不足（${xiuwei}/${cost}）。可从爬塔获取。` };
  }
  progress.breakthroughTier += 1;
  return {
    ok: true,
    state: {
      ...s,
      currencies: { ...s.currencies, xiuwei: xiuwei - cost },
      roster: { ...s.roster, [templateId]: progress },
    },
    message: `破境成功：${breakthroughLabel(progress.breakthroughTier)}`,
  };
}

export function tryStarUp(state: PlayerState, templateId: string): GrowthActionResult {
  const s = ensureRoster(state);
  if (!isOwned(s, templateId)) {
    return { ok: false, message: '尚未拥有该角色。' };
  }
  const progress = { ...getProgress(s, templateId) };
  const maxStar = Math.max(...SHARED_STAR_NODES.map((n) => n.star));
  if (progress.star >= maxStar) {
    return { ok: false, message: '已达当前星级上限（草案）。' };
  }
  const next = progress.star + 1;
  const shards = progress.cardShards ?? 0;
  let currencies = s.currencies;
  if (shards >= 1) {
    progress.cardShards = shards - 1;
  } else {
    const cost = starCost(progress.star);
    const stardust = s.currencies.stardust ?? 0;
    if (stardust < cost) {
      return { ok: false, message: `需要重复卡或星尘（星尘 ${stardust}/${cost}）。` };
    }
    currencies = { ...s.currencies, stardust: stardust - cost };
  }
  progress.star = next;
  const node = resolveStarNode(templateId, next);
  return {
    ok: true,
    state: {
      ...s,
      currencies,
      roster: { ...s.roster, [templateId]: progress },
    },
    message: node ? `升至 ★${next}，解锁「${node.label}」` : `升至 ★${next}`,
  };
}

/** 调试/薄壳：发放货币 */
export function grantCurrency(
  state: PlayerState,
  currencyId: string,
  amount: number,
): PlayerState {
  const s = ensureRoster(state);
  const cur = s.currencies[currencyId] ?? 0;
  return {
    ...s,
    currencies: { ...s.currencies, [currencyId]: cur + amount },
  };
}

export function grantCharacterExp(
  state: PlayerState,
  templateId: string,
  amount: number,
): PlayerState {
  const s = ensureRoster(state);
  const progress = { ...getProgress(s, templateId) };
  progress.exp += amount;
  return { ...s, roster: { ...s.roster, [templateId]: progress } };
}

/** 战斗技能：按升星点亮 followUp 钩子 */
export function skillWithGrowth(template: UnitTemplate, progress: CharacterProgress) {
  const skill = getSkill(template.skillId);
  const derived = deriveGrowthStats(template, progress);
  if (!derived.followUp) return skill;
  return {
    ...skill,
    followUp: {
      chance: derived.followUp.chance,
      multiplier: derived.followUp.multiplier,
      targetPattern: skill.targetPattern,
    },
  };
}
