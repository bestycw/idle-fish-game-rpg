/**
 * 装备分解：金币 / 强化石 / 洗练尘 / T4 石。拆骨看当前角色的 T3。
 */
import type { Equipment, PlayerState, Rarity, Rng } from '../shared/types.js';
import { createRng } from '../shared/rng.js';
import { MORPH_STONE_DEFS } from './morphs.js';
import { characterHasT3, isItemWorn } from './loadout.js';

export interface DisassembleResult {
  gold: number;
  stones: number;
  gem?: string;
  dust?: number;
  morphStone?: string;
}

function rollReward(item: Equipment, rng: Rng, extraStone: boolean): DisassembleResult {
  const rarity: Rarity = item.rarity;
  const enhanceStones = Math.floor((item.enhanceLevel ?? 0) * 0.8);
  let gold = 0;
  let stones = enhanceStones;
  let gem: string | undefined;
  let dust: number | undefined;
  let morphStone: string | undefined;

  switch (rarity) {
    case 'common':
      gold = rng.int(10, 20);
      break;
    case 'uncommon':
      gold = rng.int(30, 50);
      if (rng.next() < 0.5) stones += 1;
      break;
    case 'rare':
      gold = rng.int(80, 120);
      stones += rng.int(1, 2);
      dust = 1;
      break;
    case 'epic':
      gold = rng.int(150, 200);
      stones += rng.int(2, 3);
      if (rng.next() < 0.1) gem = 'gem_atk';
      break;
    case 'legendary':
      gold = rng.int(300, 380);
      stones += 4;
      morphStone = rng.pick(MORPH_STONE_DEFS).id;
      break;
  }
  if (extraStone) stones += 1;
  return { gold, stones, gem, dust, morphStone };
}

export function tryDisassemble(
  state: PlayerState,
  itemId: string,
  templateId?: string,
): { ok: boolean; state: PlayerState; message: string; reward?: DisassembleResult } {
  const item = state.inventory.find((e) => e.id === itemId);
  if (!item) return { ok: false, state, message: '物品不存在' };
  if (isItemWorn(state, itemId)) return { ok: false, state, message: '该装备已穿戴，请先卸下' };

  const extraStone = Boolean(templateId && characterHasT3(state, templateId, 'fx_disassemble'));
  const rng = createRng(state.seed + itemId.length * 13);
  const reward = rollReward(item, rng, extraStone);

  const newState: PlayerState = {
    ...state,
    gold: state.gold + reward.gold,
    enhanceStones: (state.enhanceStones ?? 0) + reward.stones,
    inventory: state.inventory.filter((e) => e.id !== itemId),
    seed: state.seed + 1,
  };

  if (reward.gem) {
    const gems = [...(newState.gems ?? [])];
    const existing = gems.find((g) => g.gemId === reward.gem);
    if (existing) existing.count += 1;
    else gems.push({ gemId: reward.gem, count: 1 });
    newState.gems = gems;
  }
  if (reward.dust) {
    newState.rerollDust = (newState.rerollDust ?? 0) + reward.dust;
  }
  if (reward.morphStone) {
    newState.morphStones = [...(newState.morphStones ?? []), reward.morphStone];
  }

  const extras: string[] = [];
  if (reward.dust) extras.push(`洗练尘×${reward.dust}`);
  if (reward.gem) extras.push('宝石×1');
  if (reward.morphStone) extras.push('形态石×1');

  return {
    ok: true,
    state: newState,
    message: `分解获得：${reward.gold}金 + ${reward.stones}强化石${extras.length ? ` + ${extras.join(' + ')}` : ''}`,
    reward,
  };
}
