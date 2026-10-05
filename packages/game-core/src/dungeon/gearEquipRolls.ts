import type { GearDungeonTier } from './gearDungeons.js';
import { getGearDungeon } from './gearDungeons.js';
import type { LootTable } from './lootTables.js';
import type { DungeonId } from './defs.js';

/**
 * 猎装装备递减掉落（对标手游「首件必得 + 追加掉率递减」）。
 * 下标 0 = 第 1 件，1 = 第 2 件… 值为该件额外判定的成功概率（第 1 件通常 1）。
 */
export const GEAR_EQUIP_ROLL_CHANCES: Record<GearDungeonTier, number[]> = {
  normal: [1, 0.22, 0.06],
  hard: [1, 0.38, 0.12, 0.03],
  hell: [1, 0.48, 0.18, 0.06],
  rift: [1, 0.55, 0.22, 0.08],
};

export function resolveEquipmentRollChances(
  table: LootTable,
  dungeonId: DungeonId,
): number[] {
  if (table.equipmentRollChances && table.equipmentRollChances.length > 0) {
    return table.equipmentRollChances;
  }
  const gear = getGearDungeon(dungeonId);
  if (gear) return [...GEAR_EQUIP_ROLL_CHANCES[gear.tier]];
  if (table.guaranteeEquipment) return [1];
  const single = table.equipmentChance ?? 0;
  return single > 0 ? [single] : [];
}

export function rollEquipmentDropCount(rng: { next: () => number }, chances: number[]): number {
  let n = 0;
  for (let i = 0; i < chances.length; i++) {
    const p = chances[i]!;
    if (p <= 0) break;
    if (i === 0) {
      if (p >= 1 || rng.next() < p) n += 1;
      else break;
    } else if (rng.next() < p) {
      n += 1;
    }
  }
  return n;
}
