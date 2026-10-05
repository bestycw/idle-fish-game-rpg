import type { Rarity } from '../shared/types.js';
import type { GearDungeonDef } from './gearDungeons.js';
import { getLootTable } from './lootTables.js';
import { resolveEquipmentRollChances } from './gearEquipRolls.js';
import { maxRarityInWeights, resolveGearRarityWeights } from './gearRarityByTier.js';

export type LootPreviewEquipTile = {
  kind: 'equip_random';
  equipSlot: number;
  dropChance: number;
  rarityFrame: Rarity;
  showT3Dot: boolean;
  showSetDot: boolean;
};

export type LootPreviewItemTile = {
  kind: 'item';
  itemId: string;
};

export type LootPreviewTile = LootPreviewEquipTile | LootPreviewItemTile;

/** 猎装副本右侧「掉落预览条」数据（非真实 roll） */
export function buildGearLootPreview(def: GearDungeonDef): LootPreviewTile[] {
  const table = getLootTable(def.lootTableId);
  const tiles: LootPreviewTile[] = [];

  const rollChances = resolveEquipmentRollChances(table, def.id);
  if (rollChances.length > 0) {
    const rarityFrame = maxRarityInWeights(resolveGearRarityWeights(def));
    const showT3Dot = Boolean(def.t3IdWeights && def.t3IdWeights.length > 0);
    const showSetDot = table.setIdChance > 0.02;
    for (let i = 0; i < rollChances.length; i++) {
      const p = rollChances[i]!;
      if (p <= 0) continue;
      tiles.push({
        kind: 'equip_random',
        equipSlot: i,
        dropChance: p,
        rarityFrame,
        showT3Dot,
        showSetDot,
      });
    }
  }

  if (table.gold[0] > 0 || table.gold[1] > 0) {
    tiles.push({ kind: 'item', itemId: 'gold' });
  }
  if (table.characterExp[0] > 0 || table.characterExp[1] > 0) {
    tiles.push({ kind: 'item', itemId: 'character_exp' });
  }

  return tiles;
}
