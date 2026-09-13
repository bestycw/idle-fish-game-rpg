/**
 * 挖矿系统：每日 5 次，消耗体力 6/次。
 * 主产：强化石。副产：宝石（概率，受气运影响）。
 */
import type { PlayerState } from '../shared/types.js';
import { createRng } from '../shared/rng.js';
import { characterHasT3, deployedHasT3 } from '../equipment/loadout.js';

export const MINE_STAMINA_COST = 6;
export const MINE_DAILY_LIMIT = 5;

export interface MineDef {
  id: string;
  name: string;
  /** 章节解锁要求 */
  unlockChapter: number;
  /** 强化石产量 [min, max] */
  stoneRange: [number, number];
  /** 宝石池 */
  gemPool: string[];
  /** 基础宝石概率 */
  gemBaseChance: number;
}

export const MINE_DEFS: MineDef[] = [
  {
    id: 'mine_iron',
    name: '铁矿',
    unlockChapter: 0,
    stoneRange: [1, 2],
    gemPool: ['gem_def', 'gem_hp', 'gem_res'],
    gemBaseChance: 0.15,
  },
  {
    id: 'mine_spirit',
    name: '灵矿',
    unlockChapter: 2,
    stoneRange: [1, 2],
    gemPool: ['gem_atk', 'gem_crit', 'gem_pen'],
    gemBaseChance: 0.15,
  },
  {
    id: 'mine_secret',
    name: '秘矿',
    unlockChapter: 4,
    stoneRange: [2, 3],
    gemPool: ['gem_mastery', 'gem_tenacity', 'gem_atk', 'gem_def', 'gem_res', 'gem_hp', 'gem_crit', 'gem_pen'],
    gemBaseChance: 0.20,
  },
];

export function getAvailableMines(chapterCleared: number): MineDef[] {
  return MINE_DEFS.filter((m) => chapterCleared >= m.unlockChapter);
}

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getMineCount(state: PlayerState): number {
  const today = todayString();
  if (state.mineDay !== today) return 0;
  return state.mineCountToday ?? 0;
}

function getMineLimit(state: PlayerState): number {
  return MINE_DAILY_LIMIT + (state.mineExtraLimit ?? 0);
}

export function canMine(state: PlayerState): boolean {
  return getMineCount(state) < getMineLimit(state) && state.stamina >= MINE_STAMINA_COST;
}

export interface MineResult {
  ok: boolean;
  state: PlayerState;
  stones: number;
  gem?: string;
  message: string;
}

export function doMine(state: PlayerState, mineId: string, templateId?: string): MineResult {
  const mine = MINE_DEFS.find((m) => m.id === mineId);
  if (!mine) return { ok: false, state, stones: 0, message: '矿脉不存在' };
  if (state.chapterCleared < mine.unlockChapter) {
    return { ok: false, state, stones: 0, message: '未解锁该矿脉' };
  }
  if (state.stamina < MINE_STAMINA_COST) {
    return { ok: false, state, stones: 0, message: '体力不足' };
  }
  const today = todayString();
  const count = state.mineDay === today ? (state.mineCountToday ?? 0) : 0;
  const limit = getMineLimit(state);
  if (count >= limit) {
    return { ok: false, state, stones: 0, message: '今日挖矿次数已满' };
  }

  const rng = createRng(state.seed + count * 7 + mineId.length);
  const stones = rng.int(mine.stoneRange[0], mine.stoneRange[1]);

  const fortunePct = 0;
  const probe =
    templateId != null
      ? characterHasT3(state, templateId, 'fx_mine_gem')
      : deployedHasT3(state, 'fx_mine_gem');
  const actualGemChance = mine.gemBaseChance * (1 + fortunePct * 0.8) * (probe ? 1.25 : 1);
  let gem: string | undefined;
  if (rng.next() < actualGemChance && mine.gemPool.length > 0) {
    gem = rng.pick(mine.gemPool);
  }

  let next: PlayerState = {
    ...state,
    stamina: state.stamina - MINE_STAMINA_COST,
    enhanceStones: (state.enhanceStones ?? 0) + stones,
    mineCountToday: count + 1,
    mineDay: today,
    seed: state.seed + 1,
  };

  if (gem) {
    const gems = [...(next.gems ?? [])];
    const existing = gems.find((g) => g.gemId === gem);
    if (existing) {
      existing.count += 1;
    } else {
      gems.push({ gemId: gem!, count: 1 });
    }
    next = { ...next, gems };
  }

  return {
    ok: true,
    state: next,
    stones,
    gem,
    message: `获得强化石×${stones}${gem ? ` + 宝石` : ''}`,
  };
}
