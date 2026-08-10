/**
 * 装备分解：销毁装备换取金币 + 强化石 + 可能的宝石。
 */
import type { Equipment, PlayerState, Rarity } from '../shared/types.js';

export interface DisassembleResult {
  gold: number;
  stones: number;
  gem?: string;
}

export function disassembleReward(item: Equipment): DisassembleResult {
  const rarity: Rarity = item.rarity;
  const enhanceStones = Math.floor((item.enhanceLevel ?? 0) * 0.8);

  switch (rarity) {
    case 'common':
      return { gold: 15, stones: enhanceStones };
    case 'uncommon':
      return { gold: 40, stones: enhanceStones + (Math.random() < 0.5 ? 1 : 0) };
    case 'rare':
      return { gold: 100, stones: enhanceStones + 1 };
    case 'epic':
      return { gold: 175, stones: enhanceStones + 2, gem: Math.random() < 0.1 ? 'gem_atk' : undefined };
    case 'legendary':
      return { gold: 300, stones: enhanceStones + 4, gem: Math.random() < 0.3 ? 'gem_crit' : undefined };
  }
}

export function tryDisassemble(
  state: PlayerState,
  itemId: string,
): { ok: boolean; state: PlayerState; message: string; reward?: DisassembleResult } {
  const item = state.inventory.find((e) => e.id === itemId);
  if (!item) return { ok: false, state, message: '物品不存在' };

  // Check not equipped (shared equip)
  for (const eqId of Object.values(state.equipped)) {
    if (eqId === itemId) return { ok: false, state, message: '该装备已穿戴，请先卸下' };
  }

  // Check not equipped by any character
  if (state.characterEquip) {
    for (const equip of Object.values(state.characterEquip)) {
      for (const eqId of Object.values(equip)) {
        if (eqId === itemId) return { ok: false, state, message: '该装备已穿戴，请先卸下' };
      }
    }
  }

  const reward = disassembleReward(item);
  const newState: PlayerState = {
    ...state,
    gold: state.gold + reward.gold,
    enhanceStones: (state.enhanceStones ?? 0) + reward.stones,
    inventory: state.inventory.filter((e) => e.id !== itemId),
  };

  // Add gem if any
  if (reward.gem) {
    const gems = [...(newState.gems ?? [])];
    const existing = gems.find((g) => g.gemId === reward.gem);
    if (existing) existing.count += 1;
    else gems.push({ gemId: reward.gem!, count: 1 });
    newState.gems = gems;
  }

  return {
    ok: true,
    state: newState,
    message: `分解获得：${reward.gold}金 + ${reward.stones}强化石${reward.gem ? ' + 1宝石' : ''}`,
    reward,
  };
}
