import type { PlayerState } from '../shared/types.js';
import { createRng } from '../shared/rng.js';
import { listT3ForSlot, getT3Def } from './catalog/t3.js';

const REFORGE_STONE_COST = 8;
const REFORGE_GOLD_COST = 800;

export function canReforgeT3(
  state: PlayerState,
  itemId: string,
): { ok: boolean; message?: string } {
  const item = state.inventory.find((e) => e.id === itemId);
  if (!item) return { ok: false, message: '物品不存在' };
  if (!item.effectAffixId) return { ok: false, message: '该装备没有T3效果' };
  if ((state.enhanceStones ?? 0) < REFORGE_STONE_COST)
    return { ok: false, message: `强化石不足（需要${REFORGE_STONE_COST}）` };
  if (state.gold < REFORGE_GOLD_COST)
    return { ok: false, message: `金币不足（需要${REFORGE_GOLD_COST}）` };
  return { ok: true };
}

export function reforgeT3(
  state: PlayerState,
  itemId: string,
): { ok: boolean; state: PlayerState; message: string } {
  const item = state.inventory.find((e) => e.id === itemId);
  if (!item) return { ok: false, state, message: '物品不存在' };
  if (!item.effectAffixId) return { ok: false, state, message: '该装备没有T3效果' };
  if ((state.enhanceStones ?? 0) < REFORGE_STONE_COST)
    return { ok: false, state, message: '强化石不足' };
  if (state.gold < REFORGE_GOLD_COST) return { ok: false, state, message: '金币不足' };

  const pool = listT3ForSlot(item.slot).filter((d) => d.id !== item.effectAffixId);
  if (pool.length === 0) return { ok: false, state, message: '效果池太小，无法重铸' };

  const rng = createRng(state.seed + state.inventory.length * 17);
  const next = rng.pick(pool);
  const oldName = getT3Def(item.effectAffixId)?.name ?? item.effectAffixId;

  return {
    ok: true,
    state: {
      ...state,
      inventory: state.inventory.map((e) =>
        e.id === itemId ? { ...e, effectAffixId: next.id } : e,
      ),
      enhanceStones: (state.enhanceStones ?? 0) - REFORGE_STONE_COST,
      gold: state.gold - REFORGE_GOLD_COST,
      seed: state.seed + 1,
    },
    message: `重铸成功：${oldName} → ${next.name}`,
  };
}
