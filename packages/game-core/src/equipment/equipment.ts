import { EQUIP_SLOTS } from '../shared/types.js';
import type { Equipment, EquipSlot, PlayerState } from '../shared/types.js';
import { itemPower } from './power.js';
import { canWearEquipment } from './wear.js';

export { generateEquipment, createEquipmentId } from './generate.js';
export type { GenerateEquipmentOptions } from './generate.js';
export {
  applyBonusesToUnit,
  emptyBonuses,
  equippedItems,
  itemBonuses,
  sumEquipmentBonuses,
} from './bonuses.js';
export type { EquipmentBonuses } from './bonuses.js';
export { canWearEquipment, wearBlockedReason } from './wear.js';

export function equipItem(state: PlayerState, itemId: string, templateId: string): PlayerState {
  if (!templateId) return state;
  const item = state.inventory.find((e) => e.id === itemId);
  if (!item) return state;
  if (!EQUIP_SLOTS.includes(item.slot)) return state;

  const tier = state.roster?.[templateId]?.breakthroughTier ?? 0;
  if (!canWearEquipment(item, tier)) return state;
  if (itemIdsWornByOthers(state, templateId).has(itemId)) return state;
  const charEquip = { ...(state.characterEquip ?? {}) };
  const slots = { ...(charEquip[templateId] ?? {}) };
  slots[item.slot] = item.id;
  charEquip[templateId] = slots;
  return { ...state, characterEquip: charEquip };
}

export function unequipSlot(state: PlayerState, slot: EquipSlot, templateId: string): PlayerState {
  if (!templateId) return state;
  const charEquip = { ...(state.characterEquip ?? {}) };
  const slots = { ...(charEquip[templateId] ?? {}) };
  if (!slots[slot]) return state;
  delete slots[slot];
  charEquip[templateId] = slots;
  return { ...state, characterEquip: charEquip };
}

export function itemsForSlot(
  state: PlayerState,
  slot: EquipSlot,
  /** 传入时排除其他角色已穿的同槽装备 */
  templateId?: string,
): Equipment[] {
  const base = state.inventory.filter((e) => e.slot === slot);
  if (!templateId) return base;
  const taken = itemIdsWornByOthers(state, templateId);
  return base.filter((e) => !taken.has(e.id));
}

/** 不写存档：按槽位预览穿上 / 卸下后的人物状态。 */
export function previewLoadout(
  state: PlayerState,
  templateId: string,
  patch: Partial<Record<EquipSlot, string | null>>,
): PlayerState {
  const slots: Partial<Record<EquipSlot, string>> = {
    ...(state.characterEquip?.[templateId] ?? {}),
  };
  for (const slot of EQUIP_SLOTS) {
    if (!(slot in patch)) continue;
    const id = patch[slot];
    if (id == null) delete slots[slot];
    else slots[slot] = id;
  }
  return {
    ...state,
    characterEquip: { ...(state.characterEquip ?? {}), [templateId]: slots },
  };
}

function itemIdsWornByOthers(state: PlayerState, templateId: string): Set<string> {
  const ids = new Set<string>();
  for (const [tid, slots] of Object.entries(state.characterEquip ?? {})) {
    if (tid === templateId) continue;
    for (const id of Object.values(slots ?? {})) {
      if (id) ids.add(id);
    }
  }
  return ids;
}

export type AutoEquipBestResult = {
  state: PlayerState;
  changed: number;
};

/**
 * 当前角色 12 槽各穿可穿且战力最高的一件。
 * 不抢其他角色已穿的件；装等超过破境档的跳过。
 */
export function autoEquipBest(state: PlayerState, templateId: string): AutoEquipBestResult {
  const tier = state.roster?.[templateId]?.breakthroughTier ?? 0;
  const taken = itemIdsWornByOthers(state, templateId);
  const mine: Partial<Record<EquipSlot, string>> = { ...(state.characterEquip?.[templateId] ?? {}) };
  let changed = 0;

  for (const slot of EQUIP_SLOTS) {
    const candidates = state.inventory.filter(
      (e) => e.slot === slot && !taken.has(e.id) && canWearEquipment(e, tier),
    );
    if (candidates.length === 0) continue;
    candidates.sort((a, b) => {
      const d = itemPower(b) - itemPower(a);
      if (d !== 0) return d;
      return (b.itemLevel ?? 1) - (a.itemLevel ?? 1);
    });
    const best = candidates[0]!;
    if (mine[slot] === best.id) continue;
    mine[slot] = best.id;
    changed += 1;
  }

  if (changed === 0) return { state, changed: 0 };
  return {
    state: {
      ...state,
      characterEquip: { ...(state.characterEquip ?? {}), [templateId]: mine },
    },
    changed,
  };
}
