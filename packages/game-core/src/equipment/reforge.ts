/**
 * T3 重铸：消耗强化石+金币，重新随机装备的 T3 效果词缀。
 */
import type { PlayerState } from '../shared/types.js';
import { createRng } from '../shared/rng.js';

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
  which: 1 | 2 = 1,
): { ok: boolean; state: PlayerState; message: string } {
  const item = state.inventory.find((e) => e.id === itemId);
  if (!item) return { ok: false, state, message: '物品不存在' };

  const currentId = which === 1 ? item.effectAffixId : item.effectAffixId2;
  if (!currentId) return { ok: false, state, message: '该位置没有T3效果' };
  if ((state.enhanceStones ?? 0) < REFORGE_STONE_COST)
    return { ok: false, state, message: '强化石不足' };
  if (state.gold < REFORGE_GOLD_COST) return { ok: false, state, message: '金币不足' };

  // Simple pool: reroll among a fixed set of effect ids
  const EFFECT_POOL = [
    { id: 'fx_crit_bleed', name: '噬血锋' },
    { id: 'fx_kill_qi', name: '杀意回元' },
    { id: 'fx_kill_heal', name: '嗜杀汲命' },
    { id: 'fx_first_hit', name: '先发制人' },
    { id: 'fx_low_execute', name: '断命' },
    { id: 'fx_splash', name: '震荡' },
    { id: 'fx_pen_shred', name: '透甲蚀骨' },
    { id: 'fx_crit_qi', name: '会心蓄势' },
    { id: 'fx_hit_shield', name: '临危结界' },
    { id: 'fx_low_regen', name: '绝境回春' },
    { id: 'fx_block_qi', name: '铁壁蓄能' },
    { id: 'fx_cc_cut', name: '不动心' },
    { id: 'fx_death_save', name: '逆天改命' },
    { id: 'fx_start_shield', name: '先手结界' },
    { id: 'fx_heal_cleanse', name: '净疗' },
    { id: 'fx_qi_start', name: '先天蓄能' },
    { id: 'fx_purge_hit', name: '破灵一击' },
  ];

  const pool = EFFECT_POOL.filter((e) => e.id !== currentId);
  if (pool.length === 0) return { ok: false, state, message: '效果池太小，无法重铸' };

  const rng = createRng(state.seed + Date.now());
  const newEffect = rng.pick(pool);

  const oldName =
    EFFECT_POOL.find((e) => e.id === currentId)?.name ?? currentId;

  const newInventory = state.inventory.map((e) => {
    if (e.id !== itemId) return e;
    if (which === 1) return { ...e, effectAffixId: newEffect.id };
    return { ...e, effectAffixId2: newEffect.id };
  });

  return {
    ok: true,
    state: {
      ...state,
      inventory: newInventory,
      enhanceStones: (state.enhanceStones ?? 0) - REFORGE_STONE_COST,
      gold: state.gold - REFORGE_GOLD_COST,
    },
    message: `重铸成功：${oldName} → ${newEffect.name}`,
  };
}
