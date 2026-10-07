import {
  RARITY_LABELS,
  type CharacterProgress,
  type PlayerCurrencies,
  type PlayerState,
  type SkillDef,
  type UnitTemplate,
} from '../shared/types.js';
import { breakthroughLabel, isMaxRealm, LEVEL_CAP_BY_TIER } from './breakthroughDisplay.js';
import { listBreakthroughPerks } from './breakthroughPerks.js';
import {
  accumulateSkillMods,
  emptySkillMods,
  summarizeStarEffect,
  type SkillGrowthMods,
  type StarNodeEffect,
  type StarRatingStat,
} from './starTypes.js';
import {
  IDENTITY_CLIMAX_STAR,
  IDENTITY_PICK_STAR,
  MAX_STAR,
  climaxBranchId,
  getStarBranches,
  identityChoice,
  isBranchStar,
  listIdentityTracks,
  maxStarForRarity,
  resolveStarNode,
  unlockedStarNodes,
} from './starTracks.js';
import {
  composeSkillFor,
  type SkillComposeContext,
} from './skillCompose.js';
import { STARTER_OWNED_IDS } from './starterRoster.js';
import { getTemplate, UNIT_TEMPLATES } from './templates.js';

export {
  breakthroughLabel,
  nextBreakthroughLabel,
  BREAKTHROUGH_LABELS,
  LEVEL_CAP_BY_TIER,
  REALM_LADDER,
  clampRealmTier,
  isMaxRealm,
  maxRealmTier,
  migrateLegacyRealmTier,
} from './breakthroughDisplay.js';
export {
  listBreakthroughPerks,
  nextBreakthroughPerk,
  listNextBreakthroughPerks,
  BREAKTHROUGH_OVERRIDES,
  ROLE_BREAKTHROUGH_LADDERS,
} from './breakthroughPerks.js';
export {
  IDENTITY_CLIMAX_STAR,
  IDENTITY_PICK_STAR,
  MAX_STAR,
  MAX_STAR_BY_RARITY,
  maxStarForRarity,
  SHARED_STAR_NODES,
  STAR_OVERRIDES,
  climaxBranchId,
  getStarBranches,
  identityChoice,
  isBranchStar,
  listIdentityTracks,
  branchChoiceForStar,
  registerStarTrack,
  resolveStarNode,
  unlockedStarNodes,
} from './starTracks.js';
export { ABILITY_ATOMS } from './abilityAtoms.js';
export { ROLE_STAR_LADDERS, roleStarNode } from './roleStarTracks.js';

/** 该卡可玩星级上限（按模板稀有度） */
export function maxStarForTemplate(templateId: string): number {
  const t = getTemplate(templateId);
  if (!t) return MAX_STAR;
  return maxStarForRarity(t.rarity);
}
export type { StarNodeDef, StarNodeEffect, SkillGrowthMods } from './starTypes.js';
export {
  proseSkillEffect,
  proseSkillEffectDelta,
  summarizeApplyStatus,
  summarizeSkillEffect,
  summarizeStarEffect,
} from './starTypes.js';
export {
  composeSkill,
  composeSkillFor,
  listSkillModifiers,
  skillDiffLines,
  type SkillComposeContext,
  type SkillModifier,
  type SkillModifierSource,
} from './skillCompose.js';

export { STARTER_OWNED_IDS };

/** 每境小节点数（修为点；满后才能破境） */
export const CULTIVATION_NODES_PER_TIER = 10;

/** 每个已完成小节点折合主属性 */
export const CULTIVATION_NODE_MAIN_PCT = 0.012;

/** 每破一境的底子（攻防血灵） */
export const REALM_TIER_MAIN_PCT = 0.04;

export function formatMainPct(pct: number): string {
  const n = Math.round(pct * 1000) / 10;
  return Number.isInteger(n) ? `主属性+${n}%` : `主属性+${n}%`;
}

export const SAVE_ROSTER_VERSION = 11 as const;

export function levelCapForTier(tier: number): number {
  const idx = Math.max(0, Math.min(LEVEL_CAP_BY_TIER.length - 1, tier));
  return LEVEL_CAP_BY_TIER[idx]!;
}

/**
 * 伙伴升级曲线（非线形）：前期友好，中后加速。
 * Lv1→2≈40，Lv10→11≈130，Lv20→21≈340
 */
export function expToNextLevel(level: number): number {
  const lv = Math.max(1, Math.floor(level));
  return Math.max(20, Math.floor(28 * Math.pow(lv, 1.45) + 12));
}

/** 当前境第 nodeIndex 个小节点消耗（nodeIndex 0..9） */
export function cultivationNodeCost(tier: number, nodeIndex: number): number {
  return 12 + tier * 10 + nodeIndex * 5;
}

/** 破境大节点消耗（须小节点已满；约等于本境十层总价的 1.3 倍） */
export function breakthroughCost(tier: number): number {
  let small = 0;
  for (let n = 0; n < CULTIVATION_NODES_PER_TIER; n += 1) {
    small += cultivationNodeCost(tier, n);
  }
  return Math.round(small * 1.3);
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
  atk: number;
  def: number;
  res: number;
  maxHp: number;
  spd: number;
  critRating: number;
  critDmgRating: number;
  penRating: number;
  masteryRating: number;
  tenacityRating: number;
  fortuneRating: number;
  dodge: number;
  lifesteal: number;
  critResist: number;
  block: number;
  counter: number;
  resilience: number;
  nirvanaHpRatio?: number;
  echo: number;
  thorns: number;
  steal: number;
  finalDmgBonus: number;
  startQiBonus: number;
  qiOnHit: number;
  basicQiBonus: number;
  secondWind: boolean;
  counterFollow: boolean;
  linkHeal: boolean;
  damageSchool: 'phys' | 'spirit';
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
    counter: number;
    resilience: number;
    nirvanaHpRatio?: number;
    echo: number;
    thorns: number;
    steal: number;
    finalDmgBonus: number;
    critResist: number;
    startQiBonus: number;
    qiOnHit: number;
    basicQiBonus: number;
    secondWind: boolean;
    counterFollow: boolean;
    linkHeal: boolean;
    hpPct: number;
    atkPct: number;
    defPct: number;
    resPct: number;
    spdPct: number;
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
    if (fx.stat === 'counter') acc.counter += fx.value;
    if (fx.stat === 'resilience') acc.resilience += fx.value;
    if (fx.stat === 'echo') acc.echo += fx.value;
    if (fx.stat === 'thorns') acc.thorns += fx.value;
    if (fx.stat === 'steal') acc.steal += fx.value;
    if (fx.stat === 'critResist') acc.critResist += fx.value;
  }
  if (fx.kind === 'split_stat') {
    if (fx.stat === 'hp') acc.hpPct += fx.pct;
    if (fx.stat === 'atk') acc.atkPct += fx.pct;
    if (fx.stat === 'def') acc.defPct += fx.pct;
    if (fx.stat === 'res') acc.resPct += fx.pct;
    if (fx.stat === 'spd') acc.spdPct += fx.pct;
  }
  if (fx.kind === 'final_dmg') acc.finalDmgBonus += fx.value;
  if (fx.kind === 'qi_passive') {
    acc.startQiBonus += fx.start ?? 0;
    acc.qiOnHit += fx.onHit ?? 0;
    acc.basicQiBonus += fx.basic ?? 0;
  }
  if (fx.kind === 'unit_flag') {
    if (fx.flag === 'secondWind') acc.secondWind = true;
    if (fx.flag === 'counterFollow') acc.counterFollow = true;
    if (fx.flag === 'linkHeal') acc.linkHeal = true;
  }
  if (fx.kind === 'rating') {
    acc.ratings[fx.stat] = (acc.ratings[fx.stat] ?? 0) + fx.value;
  }
  if (fx.kind === 'enable_follow_up') {
    acc.followUp = { chance: fx.chance, multiplier: fx.multiplier };
  }
  if (fx.kind === 'nirvana') {
    acc.nirvanaHpRatio = Math.max(acc.nirvanaHpRatio ?? 0, fx.hpRatio ?? 0.3);
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
  const tierBonus = 1 + tier * REALM_TIER_MAIN_PCT;
  const cultPct = completedCultivationNodes(progress) * CULTIVATION_NODE_MAIN_PCT;

  const acc = {
    mainPct: cultPct,
    lifesteal: template.lifesteal ?? 0,
    dodge: template.dodge ?? 0,
    block: template.block ?? 0,
    counter: 0,
    resilience: 0,
    nirvanaHpRatio: undefined as number | undefined,
    echo: 0,
    thorns: 0,
    steal: 0,
    finalDmgBonus: 0,
    critResist: 0,
    startQiBonus: 0,
    qiOnHit: 0,
    basicQiBonus: 0,
    secondWind: false,
    counterFollow: false,
    linkHeal: false,
    hpPct: 0,
    atkPct: 0,
    defPct: 0,
    resPct: 0,
    spdPct: 0,
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
    atk: Math.max(1, Math.round(template.baseAtk * scale * (1 + acc.atkPct))),
    def: Math.max(1, Math.round(template.baseDef * scale * (1 + acc.defPct))),
    res: Math.max(1, Math.round(template.baseRes * scale * (1 + acc.resPct))),
    maxHp: Math.max(1, Math.round(template.baseMaxHp * scale * (1 + acc.hpPct))),
    spd: Math.max(1, Math.round(template.baseSpd * (1 + (lv - 1) * 0.01 + tier * 0.01) * (1 + acc.spdPct))),
    critRating: template.critRating + Math.floor((lv - 1) * 0.4) + r('critRating'),
    critDmgRating: template.critDmgRating + Math.floor((lv - 1) * 0.3) + r('critDmgRating'),
    penRating: template.penRating + Math.floor((lv - 1) * 0.25) + r('penRating'),
    masteryRating: template.masteryRating + Math.floor((lv - 1) * 0.35) + r('masteryRating'),
    tenacityRating: template.tenacityRating + Math.floor((lv - 1) * 0.2) + r('tenacityRating'),
    fortuneRating: template.fortuneRating + r('fortuneRating'),
    dodge: acc.dodge,
    lifesteal: acc.lifesteal,
    critResist: (template.critResist ?? 0) + acc.critResist,
    block: acc.block,
    counter: acc.counter ?? 0,
    resilience: acc.resilience ?? 0,
    nirvanaHpRatio: acc.nirvanaHpRatio,
    echo: acc.echo ?? 0,
    thorns: acc.thorns ?? 0,
    steal: acc.steal ?? 0,
    finalDmgBonus: acc.finalDmgBonus ?? 0,
    startQiBonus: acc.startQiBonus,
    qiOnHit: acc.qiOnHit,
    basicQiBonus: acc.basicQiBonus,
    secondWind: acc.secondWind,
    counterFollow: acc.counterFollow,
    linkHeal: acc.linkHeal,
    damageSchool: template.damageSchool,
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
  if (isMaxRealm(progress.breakthroughTier) && nodes >= CULTIVATION_NODES_PER_TIER) {
    return { ok: false, message: '已达当前最高境界。' };
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
    message: `修炼小成（${progress.cultivationNodes}/${CULTIVATION_NODES_PER_TIER}），${formatMainPct(CULTIVATION_NODE_MAIN_PCT)}`,
  };
}

export function tryBreakthrough(state: PlayerState, templateId: string): GrowthActionResult {
  const s = ensureRoster(state);
  const progress = { ...getProgress(s, templateId) };
  if (isMaxRealm(progress.breakthroughTier)) {
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
  const unlocked = listBreakthroughPerks(templateId, progress.breakthroughTier).filter(
    (p) => p.tier === progress.breakthroughTier,
  );
  const perkBit = unlocked.length
    ? `，解锁「${unlocked.map((p) => p.label).join('、')}」（${unlocked
        .flatMap((p) => p.effects.map((fx) => summarizeStarEffect(fx)))
        .filter(Boolean)
        .join(' · ')}）`
    : '';
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
  let message = node
    ? `升至 ★${next}，解锁「${node.label}」`
    : `升至 ★${next}`;
  if (needBranch) {
    message = `升至 ★${next}，选定分支`;
  } else if (next === IDENTITY_CLIMAX_STAR) {
    const identityId = identityChoice(templateId, progress.starBranch);
    const climax = listIdentityTracks(templateId).find((t) => t.id === identityId)?.star6;
    message = climax
      ? `升至 ★${next}，点亮「${climax.label}」`
      : `升至 ★${next}`;
  }
  return {
    ok: true,
    state: {
      ...s,
      roster: { ...s.roster, [templateId]: progress },
    },
    message,
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

function writeIdentityBranch(
  templateId: string,
  starBranch: Record<number, string> | undefined,
  identityId: string,
): Record<number, string> {
  const next: Record<number, string> = { ...starBranch, [IDENTITY_PICK_STAR]: identityId };
  const climax = climaxBranchId(templateId, identityId);
  if (climax) next[IDENTITY_CLIMAX_STAR] = climax;
  return next;
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
  if (listIdentityTracks(templateId).length >= 2 && star === IDENTITY_CLIMAX_STAR) {
    return { ok: false, state: s, message: '分支在 ★3 选定' };
  }
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
    const existing = identityChoice(templateId, progress.starBranch);
  if (existing) {
    const track = listIdentityTracks(templateId).find((t) => t.id === existing);
    return { ok: false, state: s, message: `已选定「${track?.label ?? existing}」，更换请重洗` };
  }
  progress.starBranch = writeIdentityBranch(templateId, progress.starBranch, branchId);
  const track = listIdentityTracks(templateId).find((t) => t.id === branchId);
  const branch = branches.find((b) => b.id === branchId)!;
  const name = track?.label ?? branch.label;
  return {
    ok: true,
    state: { ...s, roster: { ...s.roster, [templateId]: progress } },
    message: `选定「${name}」`,
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
  if (listIdentityTracks(templateId).length >= 2 && star === IDENTITY_CLIMAX_STAR) {
    return { ok: false, state: s, message: '分支在 ★3 选定' };
  }
  if (progress.star < star) {
    return { ok: false, state: s, message: `未升至 ★${star}，无法重洗` };
  }
  const branches = getStarBranches(templateId, IDENTITY_PICK_STAR).length
    ? getStarBranches(templateId, IDENTITY_PICK_STAR)
    : getStarBranches(templateId, star);
  if (!branches.length) {
    return { ok: false, state: s, message: `★${star} 不是岔路节点` };
  }
  if (!branches.find((b) => b.id === newBranchId)) {
    return { ok: false, state: s, message: `无效分支 ${newBranchId}` };
  }
  const existing = identityChoice(templateId, progress.starBranch);
  if (!existing) {
    return { ok: false, state: s, message: `尚未选择，请直接选择而非重洗` };
  }
  if (existing === newBranchId) {
    return { ok: false, state: s, message: `已是此分支` };
  }
  const cost = starBranchRespecCost(s);
  const dust = s.currencies.stardust ?? 0;
  if (dust < cost) {
    return { ok: false, state: s, message: `星尘不足（需 ${cost}，有 ${dust}）` };
  }
  const today = new Date().toISOString().slice(0, 10);
  const todayCount =
    s.starBranchRespecDay === today ? (s.starBranchRespecToday ?? 0) : 0;
  progress.starBranch = writeIdentityBranch(templateId, progress.starBranch, newBranchId);
  const track = listIdentityTracks(templateId).find((t) => t.id === newBranchId);
  const branch = branches.find((b) => b.id === newBranchId)!;
  const name = track?.label ?? branch.label;
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
      ? `改为「${name}」，消耗 ${cost} 星尘`
      : `改为「${name}」（今日首次免费）`,
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
  progress.exp += Math.max(0, Math.floor(amount));
  return { ...s, roster: { ...s.roster, [templateId]: progress } };
}

/** 用已攒经验连升，直到不够一级或触及境界等级上限 */
export function applyPendingLevelUps(
  state: PlayerState,
  templateId: string,
): { state: PlayerState; levelsGained: number } {
  let next = ensureRoster(state);
  let levelsGained = 0;
  for (;;) {
    const r = tryLevelUp(next, templateId);
    if (!r.ok) break;
    next = r.state;
    levelsGained += 1;
  }
  return { state: next, levelsGained };
}

/** 战斗结算：加经验并自动连升 */
export function grantCharacterExpAndLevel(
  state: PlayerState,
  templateId: string,
  amount: number,
): { state: PlayerState; levelsGained: number } {
  const withExp = grantCharacterExp(state, templateId, amount);
  return applyPendingLevelUps(withExp, templateId);
}

/** 战斗技能：走 compose 管道（升星/破境/装特技） */
export function skillWithGrowth(
  template: UnitTemplate,
  progress: CharacterProgress,
  ctx?: SkillComposeContext,
): SkillDef {
  return composeSkillFor(template, progress, ctx);
}
