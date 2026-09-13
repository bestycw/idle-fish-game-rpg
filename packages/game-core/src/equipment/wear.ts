import type { Equipment } from '../shared/types.js';
import { wearTierForItemLevel } from './catalog/rarity.js';

export const WEAR_TIER_LABELS = ['炼气', '筑基', '金丹', '元婴', '化神'] as const;

export function wearTierLabel(tier: number): string {
  return WEAR_TIER_LABELS[tier] ?? '更高破境';
}

/** 天梯对齐 5 装档：炼气 / 筑基起 / 金丹起 / 元婴起 / 化神起（往后加境不改穿戴） */
export function wearBandFromRealm(breakthroughTier: number): number {
  const t = Math.max(0, breakthroughTier);
  if (t >= 6) return 4;
  if (t >= 5) return 3;
  if (t >= 4) return 2;
  if (t >= 1) return 1;
  return 0;
}

export function canWearEquipment(item: Equipment, breakthroughTier: number): boolean {
  return wearTierForItemLevel(item.itemLevel ?? 1) <= wearBandFromRealm(breakthroughTier);
}

export function wearBlockedReason(item: Equipment, breakthroughTier: number): string | undefined {
  if (canWearEquipment(item, breakthroughTier)) return undefined;
  const need = wearTierForItemLevel(item.itemLevel ?? 1);
  return `需${wearTierLabel(need)}方可穿戴（装等 ${item.itemLevel}）`;
}
