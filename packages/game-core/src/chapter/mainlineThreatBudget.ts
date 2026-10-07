/**
 * 主线遭遇规模 · 威胁预算（人数 ↔ 单兵强度）
 *
 * 设计原则：
 * - **章档**定「这场该有多难」（对齐 CHAPTER_BANDS.recommendedPower），不跟玩家实时战力追着跑。
 * - **波次角色**定预算比例（小怪 / 混搭精锐 / 整题 / 首领）。
 * - **人数**在角色允许的区间内，用种子稳定抽取；少人则单体略强，多人则略弱（总量守恒）。
 */
import { COMBAT_POWER_SCALE } from '../equipment/power.js';
import type { EnemySpec } from '../dungeon/encounters.js';
import type { ChapterBand } from './bands.js';

/** 九宫格上限；与格位系统一致 */
export const MAINLINE_MAX_ENEMY_SLOTS = 9;

export type MainlineWaveRole = 'skirmish' | 'blend_elite' | 'cap_recipe' | 'boss';

/** 各波次相对章建议战力的威胁占比（单场，非整节） */
export const MAINLINE_WAVE_THREAT_SHARE: Record<MainlineWaveRole, number> = {
  skirmish: 0.32,
  blend_elite: 0.52,
  cap_recipe: 0.72,
  boss: 1,
};

/** 同阵三连：第 1/2/3 波递进 */
export const MAINLINE_WAVE_IN_UNIT_RAMP = [0.92, 1, 1.12] as const;

/** 人数区间：剧情可读性优先，再落到预算 */
export const MAINLINE_HEADCOUNT_RANGE: Record<MainlineWaveRole, { min: number; max: number }> = {
  skirmish: { min: 2, max: 7 },
  blend_elite: { min: 3, max: 6 },
  cap_recipe: { min: 3, max: 5 },
  boss: { min: 1, max: 4 },
};

/** 粗算单敌威胁（与玩家战力同型权重 + `COMBAT_POWER_SCALE`，可与章档对照） */
export function estimateEnemyThreat(spec: Pick<EnemySpec, 'atk' | 'def' | 'res' | 'maxHp' | 'rank'>): number {
  const elite = spec.rank === 'elite' || spec.rank === 'boss' ? 1.35 : 1;
  const raw = (spec.atk * 8 + spec.def * 6 + spec.res * 6 + spec.maxHp) * elite;
  return Math.max(0, Math.round(raw * COMBAT_POWER_SCALE));
}

export function encounterThreatSum(enemies: EnemySpec[], pressure = 1): number {
  let s = 0;
  for (const e of enemies) {
    s += estimateEnemyThreat(e) * pressure;
  }
  return s;
}

/**
 * 本场目标威胁（读数用；实战仍靠 pressure × 底稿）。
 */
export function mainlineWaveThreatTarget(
  band: ChapterBand,
  role: MainlineWaveRole,
  waveInUnit: 0 | 1 | 2,
): number {
  const share = MAINLINE_WAVE_THREAT_SHARE[role];
  const ramp = MAINLINE_WAVE_IN_UNIT_RAMP[waveInUnit] ?? 1;
  return Math.round(band.recommendedPower * share * ramp);
}

/**
 * 人数守恒：相对编制表「标准人数」补缩放，避免 3 人场 = 5 人场一半难度。
 * @param baselineCount 编排表设计的参考人数（通常 4～5）
 */
export function squadScaleForHeadcount(actualCount: number, baselineCount: number): number {
  const a = Math.max(1, actualCount);
  const b = Math.max(1, baselineCount);
  if (a === b) return 1;
  const ratio = b / a;
  return Math.min(1.45, Math.max(0.78, Math.sqrt(ratio)));
}

/** 稳定取人数（同节点同波同种子可复现） */
export function pickMainlineHeadcount(
  seed: number,
  role: MainlineWaveRole,
  rosterSize: number,
): number {
  const { min, max } = MAINLINE_HEADCOUNT_RANGE[role];
  const hi = Math.min(max, rosterSize, MAINLINE_MAX_ENEMY_SLOTS);
  const lo = Math.min(min, hi);
  if (lo >= hi) return lo;
  const span = hi - lo + 1;
  const n = lo + (Math.abs(seed) % span);
  return n;
}

export function assertMainlineHeadcount(role: MainlineWaveRole, count: number): boolean {
  const { min, max } = MAINLINE_HEADCOUNT_RANGE[role];
  return count >= min && count <= max && count <= MAINLINE_MAX_ENEMY_SLOTS;
}
