/**
 * 宝石镶嵌：将宝石装入装备孔位（每件装备最多 1 孔）。
 */
import type { PlayerState } from '../shared/types.js';
import { GEM_DEFS } from './gems.js';

export function canSocketGem(
  state: PlayerState,
  itemId: string,
): { ok: boolean; message?: string } {
  const item = state.inventory.find((e) => e.id === itemId);
  if (!item) return { ok: false, message: '物品不存在' };
  if (!item.socketCount || item.socketCount < 1)
    return { ok: false, message: '该装备没有孔位' };
  return { ok: true };
}

export function socketGem(
  state: PlayerState,
  itemId: string,
  gemId: string,
): { ok: boolean; state: PlayerState; message: string } {
  const item = state.inventory.find((e) => e.id === itemId);
  if (!item) return { ok: false, state, message: '物品不存在' };
  if (!item.socketCount) return { ok: false, state, message: '该装备没有孔位' };

  const gemDef = GEM_DEFS.find((g) => g.id === gemId);
  if (!gemDef) return { ok: false, state, message: '宝石不存在' };

  // Check player has this gem
  const gems = [...(state.gems ?? [])];
  const owned = gems.find((g) => g.gemId === gemId);
  if (!owned || owned.count <= 0) return { ok: false, state, message: '宝石数量不足' };

  // Consume gem
  owned.count -= 1;

  // Return old gem if any
  if (item.gemId) {
    const oldGem = gems.find((g) => g.gemId === item.gemId);
    if (oldGem) oldGem.count += 1;
    else gems.push({ gemId: item.gemId, count: 1 });
  }

  // Socket new gem
  const newInventory = state.inventory.map((e) =>
    e.id === itemId ? { ...e, gemId } : e,
  );

  return {
    ok: true,
    state: { ...state, inventory: newInventory, gems: gems.filter((g) => g.count > 0) },
    message: `镶嵌${gemDef.name}成功${item.gemId ? '（旧宝石已返还）' : ''}`,
  };
}
