import { generateEquipment, type GenerateEquipmentOptions } from '../equipment/equipment.js';
import { itemLevelFromProgress } from '../equipment/catalog/rarity.js';
import { deployedT3Ids } from '../equipment/loadout.js';
import { createRng } from '../shared/rng.js';
import type { Equipment, PlayerState, Rng } from '../shared/types.js';
import {
  ensureRoster,
  grantCharacterExp,
  grantCurrency,
} from '../character/growth.js';
import { getDungeon, type DungeonId } from './defs.js';

export interface LootTable {
  id: string;
  /** 是否必出一件装备 */
  guaranteeEquipment: boolean;
  /** 非必出时仍可能掉装的概率；缺省 0 */
  equipmentChance?: number;
  setIdChance: number;
  setIdWeights: { id: string; weight: number }[];
  gold: [number, number];
  xiuwei: [number, number];
  stardust: [number, number];
  characterExp: [number, number];
}

/** 猎装：高 setId 倾向；修为微量（主修为走塔） */
export const LOOT_TABLES: Record<string, LootTable> = {
  loot_gear_trial: {
    id: 'loot_gear_trial',
    guaranteeEquipment: true,
    setIdChance: 0.55,
    setIdWeights: [
      { id: 'set_pojun', weight: 2 },
      { id: 'set_tiebi', weight: 2 },
      { id: 'set_jishi', weight: 1 },
    ],
    gold: [5, 15],
    xiuwei: [0, 0],
    stardust: [0, 2],
    characterExp: [18, 32],
  },
  /** 镜渊：经验向；修为仅塔产 */
  loot_abyss_mirror: {
    id: 'loot_abyss_mirror',
    guaranteeEquipment: false,
    equipmentChance: 0.4,
    setIdChance: 0.35,
    setIdWeights: [
      { id: 'set_pojun', weight: 1 },
      { id: 'set_tiebi', weight: 1 },
      { id: 'set_jishi', weight: 2 },
    ],
    gold: [8, 18],
    xiuwei: [0, 0],
    stardust: [1, 4],
    characterExp: [36, 55],
  },
  /** 塔奖励由 climbTower 结算；表仅占位说明 */
  loot_tower: {
    id: 'loot_tower',
    guaranteeEquipment: false,
    setIdChance: 0,
    setIdWeights: [],
    gold: [0, 0],
    xiuwei: [0, 0],
    stardust: [0, 0],
    characterExp: [0, 0],
  },
  /** 星尘秘境由 runStardustRealm 结算；表仅占位 */
  loot_stardust_realm: {
    id: 'loot_stardust_realm',
    guaranteeEquipment: false,
    setIdChance: 0,
    setIdWeights: [],
    gold: [0, 0],
    xiuwei: [0, 0],
    stardust: [0, 0],
    characterExp: [0, 0],
  },
};

export function getLootTable(id: string): LootTable {
  const t = LOOT_TABLES[id];
  if (!t) throw new Error(`Unknown loot table: ${id}`);
  return t;
}

function rangeRoll(rng: Rng, range: [number, number]): number {
  const [a, b] = range;
  if (a === 0 && b === 0) return 0;
  return rng.int(a, b);
}

export type DungeonRewardResult = {
  state: PlayerState;
  loot: Equipment | null;
  dungeonId: DungeonId;
};

/**
 * 战斗本胜利结算：读本种 → 奖励表。
 * instant 本（塔）请走 climbTower，勿走本函数。
 */
export function grantDungeonReward(
  state: PlayerState,
  dungeonId: DungeonId,
): DungeonRewardResult {
  const dungeon = getDungeon(dungeonId);
  if (dungeon.runMode !== 'battle') {
    throw new Error(`Dungeon ${dungeonId} is instant; use climbTower / runStardustRealm`);
  }
  const table = getLootTable(dungeon.lootTableId);
  const rng = createRng(state.seed + state.wins * 13 + state.inventory.length * 7 + dungeonId.length);

  const equipOpts: GenerateEquipmentOptions = {
    setIdChance: table.setIdChance,
    setIdWeights: table.setIdWeights,
    itemLevel: itemLevelFromProgress(state.chapterCleared ?? 0, state.chapterNodeIndex ?? 0),
  };

  let loot: Equipment | null = null;
  const rollEquip =
    table.guaranteeEquipment || rng.next() < (table.equipmentChance ?? 0);
  if (rollEquip) {
    loot = generateEquipment(rng, undefined, equipOpts);
  }

  let next: PlayerState = {
    ...ensureRoster(state),
    wins: state.wins + 1,
    gold: state.gold + rangeRoll(rng, table.gold),
    inventory: loot ? [...state.inventory, loot] : [...state.inventory],
    seed: state.seed + 1,
    encounterIndex: state.encounterIndex + 1,
  };

  const deployed = Object.keys(next.formation);
  const t3Ids = deployedT3Ids(state);
  if (t3Ids.has('fx_lucky_stone')) {
    next = { ...next, enhanceStones: (next.enhanceStones ?? 0) + 1 };
  }
  if (t3Ids.has('fx_gold_find')) {
    const extra = Math.floor((next.gold - state.gold) * 0.12);
    next = { ...next, gold: next.gold + extra };
  }
  if (t3Ids.has('fx_dust_find') && rng.next() < 0.08) {
    next = { ...next, rerollDust: (next.rerollDust ?? 0) + 1 };
  }
  const exp = rangeRoll(rng, table.characterExp);
  if (exp > 0) {
    for (const id of deployed) {
      next = grantCharacterExp(next, id, exp);
    }
  }
  const xiuwei = rangeRoll(rng, table.xiuwei);
  if (xiuwei > 0) next = grantCurrency(next, 'xiuwei', xiuwei);
  const stardust = rangeRoll(rng, table.stardust);
  if (stardust > 0) next = grantCurrency(next, 'stardust', stardust);

  return { state: next, loot, dungeonId };
}
