import { grantCurrency, grantCharacterExp } from '../character/growth.js';
import type { PlayerState } from '../shared/types.js';
import { getItemDef } from './registry.js';

export type GrantItemResult =
  | { ok: true; state: PlayerState }
  | { ok: false; state: PlayerState; message: string };

function addGem(state: PlayerState, gemId: string, count: number): PlayerState {
  const gems = [...(state.gems ?? [])];
  const idx = gems.findIndex((g) => g.gemId === gemId);
  if (idx >= 0) {
    gems[idx] = { ...gems[idx]!, count: gems[idx]!.count + count };
  } else {
    gems.push({ gemId, count });
  }
  return { ...state, gems };
}

function addMaterials(state: PlayerState, itemId: string, count: number): PlayerState {
  const materials = { ...(state.materials ?? {}) };
  materials[itemId] = (materials[itemId] ?? 0) + count;
  return { ...state, materials };
}

/**
 * 统一发放堆叠物（货币/材料/宝石等）。
 * `character_exp` 需传 `opts.templateId`（上阵角色）。
 */
export function grantItem(
  state: PlayerState,
  itemId: string,
  count: number,
  opts?: { templateId?: string; allowDisabled?: boolean },
): GrantItemResult {
  if (count <= 0) return { ok: true, state };
  const def = getItemDef(itemId);
  if (!def) {
    return { ok: false, state, message: `未知物品：${itemId}` };
  }
  if (!def.enabled && !opts?.allowDisabled) {
    return { ok: false, state, message: `物品未开放：${itemId}` };
  }

  const storage = def.storage;
  switch (storage.type) {
    case 'gold':
      return { ok: true, state: { ...state, gold: state.gold + count } };
    case 'currency':
      return { ok: true, state: grantCurrency(state, storage.key, count) };
    case 'enhance_stones':
      return {
        ok: true,
        state: { ...state, enhanceStones: (state.enhanceStones ?? 0) + count },
      };
    case 'reroll_dust':
      return {
        ok: true,
        state: { ...state, rerollDust: (state.rerollDust ?? 0) + count },
      };
    case 'gem':
      return { ok: true, state: addGem(state, storage.gemId, count) };
    case 'morph_stone': {
      const stones = [...(state.morphStones ?? [])];
      for (let i = 0; i < count; i++) stones.push(itemId);
      return { ok: true, state: { ...state, morphStones: stones } };
    }
    case 'character_exp': {
      const tid = opts?.templateId;
      if (!tid) {
        return { ok: false, state, message: '发放历练需指定角色 templateId' };
      }
      return { ok: true, state: grantCharacterExp(state, tid, count) };
    }
    case 'materials':
      return { ok: true, state: addMaterials(state, itemId, count) };
    default:
      return { ok: false, state, message: `未实现的存储类型：${itemId}` };
  }
}

export function grantItems(
  state: PlayerState,
  grants: { itemId: string; count: number }[],
): GrantItemResult {
  let next = state;
  for (const g of grants) {
    const r = grantItem(next, g.itemId, g.count);
    if (!r.ok) return r;
    next = r.state;
  }
  return { ok: true, state: next };
}
