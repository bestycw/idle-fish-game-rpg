import { getTemplate } from './templates.js';

/**
 * 开局赠送 · **不改**手填/表内稀有度（张飞/悟空/华佗等仍是绝品，只进卡池抽）。
 *
 * 新档默认上阵：
 * - 主角（绝品）
 * - 1 名随机珍品（紫）伙伴 · 从 `STARTER_EPIC_POOL` 按 seed 抽取，序章绑定段点名出场
 *
 * 调开局紫池只改 `STARTER_EPIC_POOL`；稀有度以模板为准，禁止在这里「降级」绝品卡。
 */

/** 开局可随机到的珍品池（角色多样、偏早期圈） */
export const STARTER_EPIC_POOL = [
  'machao',
  'huangzhong',
  'huangyueying',
  'jiangwei',
  'bajie',
  'honghaier',
  'daqiao',
  'xuchu',
] as const;

export type StarterEpicId = (typeof STARTER_EPIC_POOL)[number];

const POOL_SET = new Set<string>(STARTER_EPIC_POOL);

/** 按存档 seed 抽一名开局紫（同 seed 稳定） */
export function pickStarterCompanionId(seed: number): StarterEpicId {
  const n = STARTER_EPIC_POOL.length;
  const i = ((seed % n) + n) % n;
  return STARTER_EPIC_POOL[i]!;
}

export function isStarterEpicPoolId(id: string): id is StarterEpicId {
  return POOL_SET.has(id);
}

/** 解析存档上的开局紫；非法/缺失则按 seed 重抽 */
export function resolveStarterCompanionId(seed: number, stored?: string | null): string {
  if (stored && isStarterEpicPoolId(stored) && getTemplate(stored)) return stored;
  return pickStarterCompanionId(seed);
}

/** 开局赠送 / 默认上阵 id 列表：主角 + 开局紫 */
export function starterGiftIds(companionId: string): readonly string[] {
  return ['hero', companionId];
}

/**
 * @deprecated 旧测试/审计用固定样例（hero + 池首马超）。新逻辑请用 `starterGiftIds` + seed。
 */
export const DEFAULT_STARTER_GIFT_IDS = starterGiftIds(STARTER_EPIC_POOL[0]!) as readonly string[];

/** 静态「始终视为开局拥有」的底线（仅主角）；紫伙伴靠 `starterCompanionId` / roster.owned */
export const STARTER_OWNED_IDS: readonly string[] = ['hero'];

/** 试玩/文档用样例阵容 */
export const STARTER_TRIAL_LINEUP: readonly string[] = [...DEFAULT_STARTER_GIFT_IDS];

export function starterCompanionDisplayName(companionId: string): string {
  return getTemplate(companionId)?.name ?? companionId;
}
