import {
  ensureRoster,
  expToNextLevel,
  getProgress,
  grantCharacterExpAndLevel,
  isOwned,
  levelCapForTier,
} from '../character/growth.js';
import { grantItem } from '../items/grants.js';
import type { PlayerState, Rng } from '../shared/types.js';

export type ExpPillTier = 1 | 2 | 3 | 4;

export interface ExpPillDef {
  id: string;
  tier: ExpPillTier;
  /** 服用后立刻获得的经验 */
  exp: number;
}

/** 低 → 特；伙伴页优先消耗低档 */
export const EXP_PILL_DEFS: readonly ExpPillDef[] = [
  { id: 'exp_pill_1', tier: 1, exp: 25 },
  { id: 'exp_pill_2', tier: 2, exp: 80 },
  { id: 'exp_pill_3', tier: 3, exp: 220 },
  { id: 'exp_pill_4', tier: 4, exp: 600 },
] as const;

export const EXP_PILL_IDS = EXP_PILL_DEFS.map((d) => d.id);

export function getExpPillDef(itemId: string): ExpPillDef | undefined {
  return EXP_PILL_DEFS.find((d) => d.id === itemId);
}

export function materialCount(state: PlayerState, itemId: string): number {
  return Math.max(0, state.materials?.[itemId] ?? 0);
}

function spendMaterial(state: PlayerState, itemId: string, count: number): PlayerState | null {
  const have = materialCount(state, itemId);
  if (count <= 0) return state;
  if (have < count) return null;
  const materials = { ...(state.materials ?? {}) };
  const left = have - count;
  if (left <= 0) delete materials[itemId];
  else materials[itemId] = left;
  return { ...state, materials };
}

/** 升 `levels` 级所需总经验（从当前等级起） */
export function expNeededForLevels(state: PlayerState, templateId: string, levels: number): number {
  const progress = getProgress(state, templateId);
  const cap = levelCapForTier(progress.breakthroughTier);
  const maxGain = Math.max(0, cap - progress.level);
  const n = Math.min(Math.max(0, Math.floor(levels)), maxGain);
  let need = 0;
  let lv = progress.level;
  let exp = progress.exp;
  for (let i = 0; i < n; i += 1) {
    const step = expToNextLevel(lv);
    need += Math.max(0, step - exp);
    exp = 0;
    lv += 1;
  }
  return need;
}

export type LevelWithPillsResult =
  | { ok: true; state: PlayerState; message: string; levelsGained: number; pillsUsed: Record<string, number> }
  | { ok: false; message: string };

/**
 * 用低档优先的经验丹升指定级数（可 1 / 10）。
 * 丹药 → 经验 → 自动连升。
 */
export function levelUpWithExpPills(
  state: PlayerState,
  templateId: string,
  levels: number,
): LevelWithPillsResult {
  const s = ensureRoster(state);
  if (!isOwned(s, templateId)) {
    return { ok: false, message: '尚未拥有该角色。' };
  }
  const progress = getProgress(s, templateId);
  const cap = levelCapForTier(progress.breakthroughTier);
  if (progress.level >= cap) {
    return { ok: false, message: '已达当前境界等级上限，请先破境。' };
  }
  const want = Math.max(1, Math.floor(levels));
  const maxGain = cap - progress.level;
  const targetLevels = Math.min(want, maxGain);
  if (targetLevels <= 0) {
    return { ok: false, message: '已达当前境界等级上限，请先破境。' };
  }

  let need = expNeededForLevels(s, templateId, targetLevels);
  if (need <= 0) {
    const leveled = grantCharacterExpAndLevel(s, templateId, 0);
    return {
      ok: true,
      state: leveled.state,
      message: `升级至 Lv ${getProgress(leveled.state, templateId).level}`,
      levelsGained: leveled.levelsGained,
      pillsUsed: {},
    };
  }

  let next = s;
  const pillsUsed: Record<string, number> = {};
  let gained = 0;

  for (const pill of EXP_PILL_DEFS) {
    if (need <= 0) break;
    let have = materialCount(next, pill.id);
    while (have > 0 && need > 0) {
      const spent = spendMaterial(next, pill.id, 1);
      if (!spent) break;
      next = spent;
      have -= 1;
      pillsUsed[pill.id] = (pillsUsed[pill.id] ?? 0) + 1;
      gained += pill.exp;
      need -= pill.exp;
    }
  }

  if (gained <= 0) {
    return { ok: false, message: '经验丹不足。去主线或猎装碰碰运气。' };
  }

  const leveled = grantCharacterExpAndLevel(next, templateId, gained);
  const after = getProgress(leveled.state, templateId);
  const usedLine = EXP_PILL_DEFS.filter((d) => (pillsUsed[d.id] ?? 0) > 0)
    .map((d) => `${d.id.replace('exp_pill_', 'T') }×${pillsUsed[d.id]}`)
    .join(' ');
  return {
    ok: true,
    state: leveled.state,
    message:
      leveled.levelsGained > 0
        ? `服用经验丹升至 Lv ${after.level}${usedLine ? `（${usedLine}）` : ''}`
        : `已服用经验丹，经验 +${gained}`,
    levelsGained: leveled.levelsGained,
    pillsUsed,
  };
}

export function previewPillLevelUp(
  state: PlayerState,
  templateId: string,
  levels: number,
): { ready: boolean; costLine: string; effectLine: string; needExp: number; haveExpFromPills: number } {
  const progress = getProgress(state, templateId);
  const cap = levelCapForTier(progress.breakthroughTier);
  if (progress.level >= cap) {
    return {
      ready: false,
      costLine: `已达上限 Lv${cap}`,
      effectLine: '请先破境',
      needExp: 0,
      haveExpFromPills: 0,
    };
  }
  const target = Math.min(levels, cap - progress.level);
  const needExp = expNeededForLevels(state, templateId, target);
  let pool = 0;
  for (const pill of EXP_PILL_DEFS) {
    pool += materialCount(state, pill.id) * pill.exp;
  }
  return {
    ready: pool >= needExp && needExp > 0,
    costLine: `需经验 ${needExp} · 丹药存量约 ${pool}`,
    effectLine: `Lv ${progress.level} → ${progress.level + target}`,
    needExp,
    haveExpFromPills: pool,
  };
}

/**
 * 非必掉经验丹。章越高档位权重越大。
 * @returns 掉落件数（0 = 未掉）
 */
export function rollExpPillDrop(
  rng: Rng,
  chapterCleared: number,
): { itemId: string; count: number } | null {
  const ch = Math.max(0, chapterCleared);
  const chance = Math.min(0.32, 0.14 + ch * 0.018);
  if (rng.next() >= chance) return null;

  // 权重：低档起步，后期抬中高档
  const w1 = Math.max(8, 40 - ch * 3);
  const w2 = 12 + ch * 4;
  const w3 = ch >= 2 ? 4 + (ch - 2) * 3 : 0;
  const w4 = ch >= 5 ? 1 + (ch - 5) : 0;
  const weights = [
    { id: 'exp_pill_1', w: w1 },
    { id: 'exp_pill_2', w: w2 },
    { id: 'exp_pill_3', w: w3 },
    { id: 'exp_pill_4', w: w4 },
  ].filter((r) => r.w > 0);
  const total = weights.reduce((s, r) => s + r.w, 0);
  let roll = rng.int(1, total);
  for (const row of weights) {
    roll -= row.w;
    if (roll <= 0) return { itemId: row.id, count: 1 };
  }
  return { itemId: 'exp_pill_1', count: 1 };
}

export function grantExpPillDrop(
  state: PlayerState,
  drop: { itemId: string; count: number } | null,
): PlayerState {
  if (!drop) return state;
  const r = grantItem(state, drop.itemId, drop.count);
  return r.ok ? r.state : state;
}
