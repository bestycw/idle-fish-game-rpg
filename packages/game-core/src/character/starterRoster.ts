/**
 * 开局赠送 · **不改**手填/表内稀有度（张飞/悟空/华佗等仍是绝品，只进卡池抽）。
 *
 * 试玩 / 序章进 Hub / 新档默认上阵（`DEFAULT_DEPLOYED_IDS`）：
 * - 主角（绝品档）
 * - 赵云（绝品）
 * - 马超（珍品 · 紫）· 徐庶（良品 · 蓝）· 孟获（凡品 · 白）
 *
 * 调开局队只改 `DEFAULT_STARTER_GIFT_IDS`；稀有度以模板为准，禁止在这里「降级」绝品卡。
 */
export const DEFAULT_STARTER_GIFT_IDS = [
  'hero',
  'zhaoyun',
  'machao',
  'xushu',
  'menghuo',
] as const;

export type StarterGiftId = (typeof DEFAULT_STARTER_GIFT_IDS)[number];

/** 开局即 owned（与默认上阵一致） */
export const STARTER_OWNED_IDS: readonly string[] = [...DEFAULT_STARTER_GIFT_IDS];

/** 试玩/文档用：与 Hub 默认布阵一致 */
export const STARTER_TRIAL_LINEUP: readonly string[] = [...DEFAULT_STARTER_GIFT_IDS];
