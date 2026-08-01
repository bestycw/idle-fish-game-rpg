/** 突破显示：与等级上限 / 消耗公式分表（皮可覆盖显示名） */

export const BREAKTHROUGH_LABELS = ['炼气', '筑基', '金丹', '元婴', '化神'] as const;

export function breakthroughLabel(tier: number): string {
  return BREAKTHROUGH_LABELS[Math.min(tier, BREAKTHROUGH_LABELS.length - 1)] ?? `境界${tier}`;
}

export function nextBreakthroughLabel(tier: number): string | null {
  if (tier >= BREAKTHROUGH_LABELS.length - 1) return null;
  return breakthroughLabel(tier + 1);
}
