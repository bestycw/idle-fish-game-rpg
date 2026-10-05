import type { Equipment, WorldPreset } from '../shared/types.js';
import { tEquipSlot, tRarityEquip, tSetName } from './equipLocale.js';

export type ComposeEquipmentNameInput = Pick<
  Equipment,
  'rarity' | 'slot' | 'setId' | 'effectAffixId' | 'enhanceLevel'
>;

/**
 * 装备显示名（Spine 组合 · Skin 表翻译）。
 * 装等/战力不进名；强化用 UI「+N」展示。
 */
export function composeEquipmentName(
  eq: ComposeEquipmentNameInput,
  preset: WorldPreset = 'xianxia',
): string {
  const setPrefix = eq.setId ? `${tSetName(eq.setId, preset)}·` : '';
  const core = `${tRarityEquip(eq.rarity, preset)}${tEquipSlot(eq.slot, preset)}`;
  return `${setPrefix}${core}`;
}
