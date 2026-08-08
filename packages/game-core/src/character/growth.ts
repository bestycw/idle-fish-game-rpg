import {
  RARITY_LABELS,
  type CharacterProgress,
  type PlayerCurrencies,
  type PlayerState,
  type SkillDef,
  type UnitTemplate,
} from '../shared/types.js';
import { breakthroughLabel } from './breakthroughDisplay.js';
import { listBreakthroughPerks } from './breakthroughPerks.js';
import {
  accumulateSkillMods,
  emptySkillMods,
  type SkillGrowthMods,
  type StarNodeEffect,
  type StarRatingStat,
} from './starTypes.js';
import {
  MAX_STAR,
  getStarBranches,
  isBranchStar,
  maxStarForRarity,
  resolveStarNode,
  unlockedStarNodes,
} from './starTracks.js';
import {
  composeSkillFor,
  type SkillComposeContext,
} from './skillCompose.js';
import { getTemplate, UNIT_TEMPLATES } from './templates.js';

export { breakthroughLabel, nextBreakthroughLabel, BREAKTHROUGH_LABELS } from './breakthroughDisplay.js';
export {
  listBreakthroughPerks,
  nextBreakthroughPerk,
  BREAKTHROUGH_PERKS,
  BREAKTHROUGH_OVERRIDES,
} from './breakthroughPerks.js';
export {
  MAX_STAR,
  MAX_STAR_BY_RARITY,
  maxStarForRarity,
  SHARED_STAR_NODES,
  STAR_OVERRIDES,
  getStarBranches,
  isBranchStar,
  registerStarTrack,
  resolveStarNode,
  unlockedStarNodes,
} from './starTracks.js';

/** 该卡可玩星级上限（按模板稀有度） */
export function maxStarForTemplate(templateId: string): number {
  const t = getTemplate(templateId);
  if (!t) return MAX_STAR;
  return maxStarForRarity(t.rarity);
}
export type { StarNodeDef, StarNodeEffect, SkillGrowthMods } from './starTypes.js';
export { summarizeStarEffect } from './starTypes.js';
export {
  composeSkill,
  composeSkillFor,
  listSkillModifiers,
  skillDiffLines,
  type SkillComposeContext,
  type SkillModifier,
  type SkillModifierSource,
} from './skillCompose.js';

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

/** 每境小节点数（修为点；满后才能破境） */
export const CULTIVATION_NODES_PER_TIER = 4;

/** 每个已完成小节点折合主属性 */
export const CULTIVATION_NODE_MAIN_PCT = 0.012;

export const SAVE_ROSTER_VERSION = 10 as const;

export function levelCapForTier(tier: number): number {
  const idx = Math.max(0, Math.min(LEVEL_CAP_BY_TIER.length - 1, tier));
  return LEVEL_CAP_BY_TIER[idx]!;
}

export function expToNextLevel(level: number): number {
  return 30 + level * 12;
}

/** 当前境第 nodeIndex 个小节点消耗（nodeIndex 0..3） */
export function cultivationNodeCost(tier: number, nodeIndex: number): number {
  return 12 + tier * 10 + nodeIndex * 5;
}

/** 破境大节点消耗（须小节点已满） */
export function breakthroughCost(tier: number): number {
  return 100 + tier * 70;
}

/** 已完成小节点总数（含往境） */
export function completedCultivationNodes(progress: CharacterProgress): number {
  const tier = Math.max(0, progress.breakthroughTier);
  const nodes = Math.max(0, progress.cultivationNodes ?? 0);
  return tier * CULTIVATION_NODES_PER_TIER + nodes;
}

/**
 * 升到下一星所需同名碎片数（对齐「新的开始」加码，非 1:1）。
 * currentStar: 当前星（0～5）；升到 currentStar+1。
 * 表：★1/2/3 →1 · ★4/5 →2 · ★6 →3（满星共 10 碎片）
 */
export function starShardCost(currentStar: number): number {
  const next = currentStar + 1;
  if (next <= 3) return 1;
  if (next <= 5) return 2;
  return 3;
}

/**
 * @deprecated 星尘不再直接升星；保留供旧调用兼容。
 * 请用 stardustExchange.STARDUST_PER_SHARD。
 */
export function starCost(_currentStar: number): number {
  return 200;
}

export function defaultProgress(templateId: string): CharacterProgress {
  const starter = (STARTER_OWNED_IDS as readonly string[]).includes(templateId);
  return {
    templateId,
    level: 1,
    exp: 0,
    breakthroughTier: 0,
    cultivationNodes: 0,
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
    if (row.cultivationNodes == null) {
      row = { ...row, cultivationNodes: 0 };
      changed = true;
    }
    const starCap = maxStarForRarity(t.rarity);
    if ((row.star ?? 0) > starCap) {
      row = { ...row, star: starCap };
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
  const versionOk = state.version === SAVE_ROSTER_VERSION;
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
    version: SAVE_ROSTER_VERSION,
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
    cultivationNodes: p.cultivationNodes ?? 0,
  };
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
  skillMods: SkillGrowthMods;
  unlockedLabels: string[];
  breakthroughLabels: string[];
}

function applyEffectToAccum(
  fx: StarNodeEffect,
  acc: {
    mainPct: number;
    lifesteal: number;
    dodge: number;
    block: number;
    ratings: Partial<Record<StarRatingStat, number>>;
    followUp?: DerivedGrowthStats['followUp'];
    skillEffects: StarNodeEffect[];
  },
): void {
  if (fx.kind === 'stat_pct') acc.mainPct += fx.mainPct;
  if (fx.kind === 'rare_stat') {
    if (fx.stat === 'lifesteal') acc.lifesteal += fx.value;
    if (fx.stat === 'dodge') acc.dodge += fx.value;
    if (fx.stat === 'block') acc.block += fx.value;
  }
  if (fx.kind === 'rating') {
    acc.ratings[fx.stat] = (acc.ratings[fx.stat] ?? 0) + fx.value;
  }
  if (fx.kind === 'enable_follow_up') {
    acc.followUp = { chance: fx.chance, multiplier: fx.multiplier };
  }
  if (fx.kind === 'skill_mult' || fx.kind === 'qi_cost' || fx.kind === 'status_boost') {
    acc.skillEffects.push(fx);
  }
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
  const cultPct = completedCultivationNodes(progress) * CULTIVATION_NODE_MAIN_PCT;

  const acc = {
    mainPct: cultPct,
    lifesteal: template.lifesteal ?? 0,
    dodge: template.dodge ?? 0,
    block: template.block ?? 0,
    ratings: {} as Partial<Record<StarRatingStat, number>>,
    followUp: undefined as DerivedGrowthStats['followUp'],
    skillEffects: [] as StarNodeEffect[],
  };
  const unlockedLabels: string[] = [];
  const breakthroughLabels: string[] = [];

  for (const node of unlockedStarNodes(template.id, progress.star, progress.starBranch)) {
    unlockedLabels.push(node.label);
    for (const fx of node.effects) applyEffectToAccum(fx, acc);
  }

  for (const perk of listBreakthroughPerks(template.id, tier)) {
    breakthroughLabels.push(perk.label);
    for (const fx of perk.effects) applyEffectToAccum(fx, acc);
  }

  const starFactor = 1 + acc.mainPct;
  const scale = levelFactor * tierBonus * starFactor;
  const r = (stat: StarRatingStat) => acc.ratings[stat] ?? 0;

  return {
    physAtk: Math.max(1, Math.round(template.basePhysAtk * scale)),
    spiritAtk: Math.max(1, Math.round(template.baseSpiritAtk * scale)),
    physDef: Math.max(1, Math.round(template.basePhysDef * scale)),
    spiritDef: Math.max(1, Math.round(template.baseSpiritDef * scale)),
    maxHp: Math.max(1, Math.round(template.baseMaxHp * scale)),
    spd: Math.max(1, Math.round(template.baseSpd * (1 + (lv - 1) * 0.01 + tier * 0.01))),
    critRating: template.critRating + Math.floor((lv - 1) * 0.4) + r('critRating'),
    critDmgRating: template.critDmgRating + Math.floor((lv - 1) * 0.3) + r('critDmgRating'),
    hasteRating: template.hasteRating + Math.floor((lv - 1) * 0.25) + r('hasteRating'),
    versRating: template.versRating + r('versRating'),
    masteryRating: template.masteryRating + Math.floor((lv - 1) * 0.35) + r('masteryRating'),
    finalDmgRating: template.finalDmgRating + r('finalDmgRating'),
    fortune: template.fortune + r('fortune'),
    dodge: acc.dodge,
    lifesteal: acc.lifesteal,
    critResist: template.critResist ?? 0,
    block: acc.block,
    followUp: acc.followUp,
    skillMods: accumulateSkillMods(acc.skillEffects),
    unlockedLabels,
    breakthroughLabels,
  };
}

export type GrowthActionResult =
  | { ok: true; state: PlayerState; message: string; needBranch?: boolean }
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

/** 境界内小节点：修为 → 小幅永久属性 */
export function tryCultivateNode(state: PlayerState, templateId: string): GrowthActionResult {
  const s = ensureRoster(state);
  if (!isOwned(s, templateId)) {
    return { ok: false, message: '尚未拥有该角色。' };
  }
  const progress = { ...getProgress(s, templateId) };
  const nodes = progress.cultivationNodes ?? 0;
  if (nodes >= CULTIVATION_NODES_PER_TIER) {
    return { ok: false, message: '本境小节点已满，请破境。' };
  }
  if (progress.breakthroughTier >= LEVEL_CAP_BY_TIER.length - 1 && nodes >= CULTIVATION_NODES_PER_TIER) {
    return { ok: false, message: '已达最高境界。' };
  }
  const cost = cultivationNodeCost(progress.breakthroughTier, nodes);
  const xiuwei = s.currencies.xiuwei ?? 0;
  if (xiuwei < cost) {
    return { ok: false, message: `修为不足（${xiuwei}/${cost}）。仅修炼塔产出修为。` };
  }
  progress.cultivationNodes = nodes + 1;
  return {
    ok: true,
    state: {
      ...s,
      currencies: { ...s.currencies, xiuwei: xiuwei - cost },
      roster: { ...s.roster, [templateId]: progress },
    },
    message: `修炼小成（${progress.cultivationNodes}/${CULTIVATION_NODES_PER_TIER}），主属性微幅提升`,
  };
}

export function tryBreakthrough(state: PlayerState, templateId: string): GrowthActionResult {
  const s = ensureRoster(state);
  const progress = { ...getProgress(s, templateId) };
  if (progress.breakthroughTier >= LEVEL_CAP_BY_TIER.length - 1) {
    return { ok: false, message: '已达当前最高境界。' };
  }
  const nodes = progress.cultivationNodes ?? 0;
  if (nodes < CULTIVATION_NODES_PER_TIER) {
    return {
      ok: false,
      message: `需先点满本境小节点（${nodes}/${CULTIVATION_NODES_PER_TIER}）。`,
    };
  }
  const cost = breakthroughCost(progress.breakthroughTier);
  const xiuwei = s.currencies.xiuwei ?? 0;
  if (xiuwei < cost) {
    return { ok: false, message: `破境修为不足（${xiuwei}/${cost}）。仅修炼塔产出修为。` };
  }
  progress.breakthroughTier += 1;
  progress.cultivationNodes = 0;
  const unlocked = listBreakthroughPerks(templateId, progress.breakthroughTier)
    .filter((p) => p.tier === progress.breakthroughTier)
    .map((p) => p.label);
  const perkBit = unlocked.length ? `，解锁「${unlocked.join('、')}」` : '';
  return {
    ok: true,
    state: {
      ...s,
      currencies: { ...s.currencies, xiuwei: xiuwei - cost },
      roster: { ...s.roster, [templateId]: progress },
    },
    message: `破境成功：${breakthroughLabel(progress.breakthroughTier)}${perkBit}`,
  };
}

export function tryStarUp(state: PlayerState, templateId: string): GrowthActionResult {
  const s = ensureRoster(state);
  if (!isOwned(s, templateId)) {
    return { ok: false, message: '尚未拥有该角色。' };
  }
  const progress = { ...getProgress(s, templateId) };
  const starCap = maxStarForTemplate(templateId);
  if (progress.star >= starCap) {
    const rarity = getTemplate(templateId)?.rarity;
    const rarityBit = rarity ? `（${RARITY_LABELS[rarity]}上限）` : '';
    return { ok: false, message: `已达星级上限（★${starCap}）${rarityBit}` };
  }
  const next = progress.star + 1;
  const shardNeed = starShardCost(progress.star);
  const shards = progress.cardShards ?? 0;
  if (shards < shardNeed) {
    const assistCap = Math.min(4, starCap);
    return {
      ok: false,
      message: `同名碎片不足（${shards}/${shardNeed}）。可用星尘兑换碎片（最多助到 ★${assistCap}）。`,
    };
  }
  progress.cardShards = shards - shardNeed;
  progress.star = next;
  const node = resolveStarNode(templateId, next);
  const needBranch = isBranchStar(templateId, next);
  return {
    ok: true,
    state: {
      ...s,
      roster: { ...s.roster, [templateId]: progress },
    },
    message: node
      ? `升至 ★${next}，解锁「${node.label}」`
      : `升至 ★${next}`,
    needBranch,
  };
}

/* ─── 升星分支 ─── */

/** 重洗代价：每天首次免费，之后 50/100/150… 递增，次日重置 */
export function starBranchRespecCost(state: PlayerState): number {
  const today = new Date().toISOString().slice(0, 10);
  const count =
    state.starBranchRespecDay === today ? (state.starBranchRespecToday ?? 0) : 0;
  if (count === 0) return 0;
  return count * 50;
}

/** 选择升星分支（首次选择，免费） */
export function chooseStarBranch(
  state: PlayerState,
  templateId: string,
  star: number,
  branchId: string,
): { ok: boolean; state: PlayerState; message: string } {
  const s = ensureRoster(state);
  const progress = { ...getProgress(s, templateId) };
  if (progress.star < star) {
    return { ok: false, state: s, message: `未升至 ★${star}，无法选择分支` };
  }
  const branches = getStarBranches(templateId, star);
  if (!branches.length) {
    return { ok: false, state: s, message: `★${star} 不是岔路节点` };
  }
  if (!branches.find((b) => b.id === branchId)) {
    return { ok: false, state: s, message: `无效分支 ${branchId}` };
  }
  const existing = progress.starBranch?.[star];
  if (existing) {
    return { ok: false, state: s, message: `已选择「${existing}」，如需更换请走重洗` };
  }
  progress.starBranch = { ...progress.starBranch, [star]: branchId };
  const branch = branches.find((b) => b.id === branchId)!;
  return {
    ok: true,
    state: { ...s, roster: { ...s.roster, [templateId]: progress } },
    message: `选择分支「${branch.label}」`,
  };
}

/** 重洗升星分支：扣星尘，每天首免递增 */
export function respecStarBranch(
  state: PlayerState,
  templateId: string,
  star: number,
  newBranchId: string,
): { ok: boolean; state: PlayerState; message: string } {
  const s = ensureRoster(state);
  const progress = { ...getProgress(s, templateId) };
  if (progress.star < star) {
    return { ok: false, state: s, message: `未升至 ★${star}，无法重洗` };
  }
  const branches = getStarBranches(templateId, star);
  if (!branches.length) {
    return { ok: false, state: s, message: `★${star} 不是岔路节点` };
  }
  if (!branches.find((b) => b.id === newBranchId)) {
    return { ok: false, state: s, message: `无效分支 ${newBranchId}` };
  }
  const existing = progress.starBranch?.[star];
  if (!existing) {
    return { ok: false, state: s, message: `尚未选择，请直接选择而非重洗` };
  }
  if (existing === newBranchId) {
    return { ok: false, state: s, message: `已经是此分支` };
  }
  const cost = starBranchRespecCost(s);
  const dust = s.currencies.stardust ?? 0;
  if (dust < cost) {
    return { ok: false, state: s, message: `星尘不足（需 ${cost}，有 ${dust}）` };
  }
  const today = new Date().toISOString().slice(0, 10);
  const todayCount =
    s.starBranchRespecDay === today ? (s.starBranchRespecToday ?? 0) : 0;
  progress.starBranch = { ...progress.starBranch, [star]: newBranchId };
  const branch = branches.find((b) => b.id === newBranchId)!;
  return {
    ok: true,
    state: {
      ...s,
      roster: { ...s.roster, [templateId]: progress },
      currencies: { ...s.currencies, stardust: dust - cost },
      starBranchRespecDay: today,
      starBranchRespecToday: todayCount + 1,
    },
    message: cost > 0
      ? `重洗为「${branch.label}」，消耗 ${cost} 星尘`
      : `重洗为「${branch.label}」（今日首次免费）`,
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

/** 战斗技能：走 compose 管道（升星/破境/装特技） */
export function skillWithGrowth(
  template: UnitTemplate,
  progress: CharacterProgress,
  ctx?: SkillComposeContext,
): SkillDef {
  return composeSkillFor(template, progress, ctx);
}
