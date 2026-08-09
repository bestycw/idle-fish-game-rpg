/**
 * 强化系统：绑装备本身，上限 +15，100% 成功。
 * 每级 +5% 基础属性。
 */
import type { Equipment, EquipSlot, PlayerState } from '../shared/types.js';
import { EQUIP_SLOTS } from '../shared/types.js';

export const ENHANCE_MAX = 15;

export function enhanceCost(level: number): { gold: number; stones: number } {
  if (level < 5) return { gold: 50, stones: 1 };
  if (level < 10) return { gold: 100, stones: 2 };
  return { gold: 200, stones: 3 };
}

/** Total cost to reach a given level from 0 */
export function totalEnhanceCost(targetLevel: number): { gold: number; stones: number } {
  let gold = 0;
  let stones = 0;
  for (let i = 0; i < targetLevel; i++) {
    const c = enhanceCost(i);
    gold += c.gold;
    stones += c.stones;
  }
  return { gold, stones };
}

export function tryEnhance(
  state: PlayerState,
  equipId: string,
): { ok: boolean; state: PlayerState; message: string } {
  const itemIdx = state.inventory.findIndex((e) => e.id === equipId);
  if (itemIdx < 0) return { ok: false, state, message: '装备不存在' };
  const item = state.inventory[itemIdx]!;
  if (item.enhanceLevel >= ENHANCE_MAX) {
    return { ok: false, state, message: '已达最高强化等级' };
  }
  const cost = enhanceCost(item.enhanceLevel);
  const stones = state.enhanceStones ?? 0;
  if (stones < cost.stones) return { ok: false, state, message: '强化石不足' };
  if (state.gold < cost.gold) return { ok: false, state, message: '金币不足' };

  const newItem: Equipment = { ...item, enhanceLevel: item.enhanceLevel + 1 };
  const newInventory = [...state.inventory];
  newInventory[itemIdx] = newItem;

  return {
    ok: true,
    state: {
      ...state,
      inventory: newInventory,
      gold: state.gold - cost.gold,
      enhanceStones: stones - cost.stones,
    },
    message: `强化成功：+${newItem.enhanceLevel}`,
  };
}

/**
 * 继承：同槽位装备间转移强化等级。
 * 旧装备变+0，新装备变+N，花 50 金币。
 */
export function inheritEnhance(
  state: PlayerState,
  fromEquipId: string,
  toEquipId: string,
): { ok: boolean; state: PlayerState; message: string } {
  const fromIdx = state.inventory.findIndex((e) => e.id === fromEquipId);
  const toIdx = state.inventory.findIndex((e) => e.id === toEquipId);
  if (fromIdx < 0 || toIdx < 0) return { ok: false, state, message: '装备不存在' };
  const from = state.inventory[fromIdx]!;
  const to = state.inventory[toIdx]!;
  if (from.slot !== to.slot) return { ok: false, state, message: '槽位不同，无法继承' };
  if (from.enhanceLevel <= 0) return { ok: false, state, message: '源装备无强化等级' };
  if (state.gold < 50) return { ok: false, state, message: '金币不足' };

  const newInventory = [...state.inventory];
  newInventory[fromIdx] = { ...from, enhanceLevel: 0 };
  newInventory[toIdx] = { ...to, enhanceLevel: from.enhanceLevel };

  return {
    ok: true,
    state: { ...state, inventory: newInventory, gold: state.gold - 50 },
    message: `继承成功：${to.name} → +${from.enhanceLevel}`,
  };
}

/**
 * 连锁1（单角色）：10 件装备中最低强化等级。
 * 全属性 +(level × 1%)。
 */
export function getChainBonus(
  state: PlayerState,
  templateId: string,
): { level: number; bonus: number } {
  const equipMap = state.characterEquip?.[templateId];
  if (!equipMap) return { level: 0, bonus: 0 };

  const levels: number[] = [];
  for (const slot of EQUIP_SLOTS) {
    const eqId = equipMap[slot];
    if (!eqId) return { level: 0, bonus: 0 }; // must have all 10 equipped
    const item = state.inventory.find((e) => e.id === eqId);
    if (!item) return { level: 0, bonus: 0 };
    levels.push(item.enhanceLevel);
  }
  const minLevel = Math.min(...levels);
  if (minLevel <= 0) return { level: 0, bonus: 0 };
  return { level: minLevel, bonus: minLevel * 0.01 };
}

/**
 * 连锁2（全队）：5 个出战角色的连锁1等级中最低值。
 * 全队额外 +(level × 0.5%)。
 */
export function getTeamChainBonus(
  state: PlayerState,
): { level: number; bonus: number } {
  const deployed = Object.keys(state.formation);
  if (deployed.length < 5) return { level: 0, bonus: 0 };

  const chainLevels: number[] = [];
  for (const tid of deployed) {
    const chain = getChainBonus(state, tid);
    chainLevels.push(chain.level);
  }
  const minLevel = Math.min(...chainLevels);
  if (minLevel <= 0) return { level: 0, bonus: 0 };
  return { level: minLevel, bonus: minLevel * 0.005 };
}
