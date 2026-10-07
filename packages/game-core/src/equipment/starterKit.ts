import { deployedOrStarterIds } from '../formation/formation.js';
import { createRng } from '../shared/rng.js';
import type { Equipment, EquipSlot, PlayerState } from '../shared/types.js';
import { SLOT_NAMES } from './catalog/slots.js';
import { equipItem } from './equipment.js';
import { generateEquipment } from './generate.js';

/** 入门六件：武器 + 头 / 胸 / 手 / 裤 / 鞋 */
export const STARTER_KIT_SLOTS: EquipSlot[] = [
  'weapon',
  'head',
  'chest',
  'hands',
  'legs',
  'feet',
];

function starterKitItemId(templateId: string, slot: EquipSlot): string {
  return `kit_${templateId}_${slot}`;
}

/** 入门装只保槽位与流程，战力贡献压低（真实战斗属性同比例） */
const STARTER_GEAR_STAT_MULT = 0.36;

export function softenStarterItem(item: Equipment): Equipment {
  const baseStats = { ...item.baseStats };
  for (const key of Object.keys(baseStats) as (keyof typeof baseStats)[]) {
    const v = baseStats[key];
    if (v != null) baseStats[key] = Math.max(1, Math.round(v * STARTER_GEAR_STAT_MULT));
  }
  return { ...item, baseStats, affixes: [] };
}

/** 为默认上阵角色补齐缺失的入门凡品（不覆盖已有穿戴） */
export function grantStarterEquipmentKit(state: PlayerState): PlayerState {
  const rng = createRng(state.seed + 9001);
  let next: PlayerState = { ...state, inventory: [...state.inventory] };
  const deployed = deployedOrStarterIds(next);

  for (const templateId of deployed) {
    for (const slot of STARTER_KIT_SLOTS) {
      const equippedId = next.characterEquip?.[templateId]?.[slot];
      if (equippedId) continue;

      const kitId = starterKitItemId(templateId, slot);
      const existing = next.inventory.find((i) => i.id === kitId);
      if (existing) {
        next = equipItem(next, kitId, templateId);
        continue;
      }

      let item = generateEquipment(rng, slot, {
        rarity: 'common',
        itemLevel: 1,
        setIdChance: 0,
        skipEarlyBaseSoft: true,
      });
      item = softenStarterItem(item);
      item.id = kitId;
      item.name = `入门${SLOT_NAMES[slot]}`;
      next.inventory.push(item);
      next = equipItem(next, item.id, templateId);
    }
  }
  return next;
}

export function playerNeedsStarterKit(state: PlayerState): boolean {
  const deployed = deployedOrStarterIds(state);
  for (const id of deployed) {
    const slots = state.characterEquip?.[id];
    if (slots && Object.values(slots).some(Boolean)) return false;
  }
  return state.inventory.length === 0;
}

/** 读档后补全头/裤/鞋等缺失入门槽 */
export function ensureStarterEquipmentKit(state: PlayerState): PlayerState {
  for (const templateId of deployedOrStarterIds(state)) {
    for (const slot of STARTER_KIT_SLOTS) {
      if (state.characterEquip?.[templateId]?.[slot]) continue;
      const kitId = starterKitItemId(templateId, slot);
      if (state.inventory.some((i) => i.id === kitId)) return grantStarterEquipmentKit(state);
    }
  }
  return state;
}

/** 旧档入门装属性对齐当前削弱系数 */
export function rebalanceStarterKitInventory(state: PlayerState): PlayerState {
  let changed = false;
  const inventory = state.inventory.map((item) => {
    if (!item.id.startsWith('kit_')) return item;
    const next = softenStarterItem(item);
    const before = JSON.stringify(item.baseStats);
    const after = JSON.stringify(next.baseStats);
    if (before !== after || (item.affixes?.length ?? 0) > 0) changed = true;
    return next;
  });
  return changed ? { ...state, inventory } : state;
}
