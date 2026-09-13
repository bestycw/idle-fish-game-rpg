import type { Equipment, PlayerState } from '../shared/types.js';
import { createRng } from '../shared/rng.js';
import { rerollAffixLine, rerollConditionLine, rerollRareLine } from './generate.js';

const REROLL_STONE_COST = 1;

export { REROLL_STONE_COST };

export type RerollLayer = 'random' | 'condition' | 'rare';

function replaceItem(state: PlayerState, item: Equipment): PlayerState {
  return {
    ...state,
    inventory: state.inventory.map((e) => (e.id === item.id ? item : e)),
    enhanceStones: (state.enhanceStones ?? 0) - REROLL_STONE_COST,
    seed: state.seed + 1,
  };
}

export function rerollEquipmentLine(
  state: PlayerState,
  itemId: string,
  layer: RerollLayer,
  index: number,
): { ok: boolean; state: PlayerState; message: string } {
  const item = state.inventory.find((e) => e.id === itemId);
  if (!item) return { ok: false, state, message: '物品不存在' };
  if ((state.enhanceStones ?? 0) < REROLL_STONE_COST) {
    return { ok: false, state, message: '强化石不足' };
  }
  const rng = createRng(state.seed + index * 31 + layer.length);

  if (layer === 'random') {
    const locked = item.rerollAffixIndex;
    if (locked != null && locked !== index) {
      return { ok: false, state, message: '该件已锁定另一条随机词' };
    }
    const next = rerollAffixLine(rng, item, index);
    if (!next) return { ok: false, state, message: '没有这条随机词' };
    const affixes = item.affixes.map((a, i) => (i === index ? next : a));
    return {
      ok: true,
      state: replaceItem(state, { ...item, affixes, rerollAffixIndex: index }),
      message: `洗练：${next.name} ${next.value}`,
    };
  }

  if (layer === 'condition') {
    const locked = item.rerollConditionIndex;
    if (locked != null && locked !== index) {
      return { ok: false, state, message: '该件已锁定另一条条件词' };
    }
    const next = rerollConditionLine(rng, item, index);
    if (!next) return { ok: false, state, message: '没有这条条件词' };
    const conditions = (item.conditions ?? []).map((c, i) => (i === index ? next : c));
    return {
      ok: true,
      state: replaceItem(state, { ...item, conditions, rerollConditionIndex: index }),
      message: `洗练：${next.name}`,
    };
  }

  const next = rerollRareLine(rng, item, index);
  if (!next) return { ok: false, state, message: '没有这条稀有词' };
  const rareAffixes = (item.rareAffixes ?? []).map((a, i) => (i === index ? next : a));
  return {
    ok: true,
    state: replaceItem(state, { ...item, rareAffixes }),
    message: `洗练：${next.name}`,
  };
}
