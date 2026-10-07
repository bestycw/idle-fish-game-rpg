import {
  generateEquipment,
  type GenerateEquipmentOptions,
} from '../equipment/equipment.js';

import { gearDungeonScaleChapterCleared } from '../chapter/powerSpine.js';
import { getGearDungeon, itemLevelForGearTier, SOLUTION_T3_WEIGHTS } from './gearDungeons.js';
import { resolveGearRarityWeights } from './gearRarityByTier.js';
import { resolveEquipmentRollChances, rollEquipmentDropCount } from './gearEquipRolls.js';

/** @deprecated 用 SOLUTION_T3_WEIGHTS */
export const ABYSS_SOLUTION_T3_WEIGHTS = SOLUTION_T3_WEIGHTS;

function buildGearEquipOptions(
  _state: PlayerState,
  dungeonId: DungeonId,
): GenerateEquipmentOptions | null {
  const gear = getGearDungeon(dungeonId);
  if (!gear) return null;
  const table = LOOT_TABLES[gear.lootTableId];
  if (!table) throw new Error(`Unknown loot table: ${gear.lootTableId}`);
  // 装等跟「解锁档」走，不跟当前章/主线节点——通关 ch1 开第一本时仍是炼气可穿（≤20）
  const scaleCleared = gearDungeonScaleChapterCleared(dungeonId);
  const opts: GenerateEquipmentOptions = {
    setIdChance: table.setIdChance,
    setIdWeights: table.setIdWeights,
    itemLevel: itemLevelForGearTier(scaleCleared, 0, gear.tier),
  };
  opts.rarityWeights = resolveGearRarityWeights(gear);
  if (gear.t3IdWeights) opts.t3IdWeights = gear.t3IdWeights;
  return opts;
}

function buildLegacyAbyssEquipOptions(dungeonId: DungeonId): Partial<GenerateEquipmentOptions> {
  if (dungeonId !== 'abyss_mirror') return {};
  return {
    rarityWeights: { rare: 28, epic: 45, legendary: 12 },
    t3IdWeights: SOLUTION_T3_WEIGHTS,
  };
}
import { itemLevelFromProgress } from '../equipment/catalog/rarity.js';
import { deployedT3Ids } from '../equipment/loadout.js';
import { createRng } from '../shared/rng.js';
import type { Equipment, PlayerState, Rng } from '../shared/types.js';
import { ensureRoster, grantCurrency } from '../character/growth.js';
import { grantDeployedBattleExp, type PartyExpGainRow } from '../reward/battleExp.js';
import { grantExpPillDrop, rollExpPillDrop } from '../reward/expPills.js';
import { getDungeon, type DungeonId } from './defs.js';
import { normalizeFormation } from '../formation/formation.js';

export interface LootTable {
  id: string;
  /** 是否必出一件装备 */
  guaranteeEquipment: boolean;
  /** 非必出时仍可能掉装的概率；缺省 0 */
  equipmentChance?: number;
  /** 覆盖递减掉率；猎装默认按难度档见 gearEquipRolls */
  equipmentRollChances?: number[];
  setIdChance: number;
  setIdWeights: { id: string; weight: number }[];
  gold: [number, number];
  xiuwei: [number, number];
  stardust: [number, number];
  characterExp: [number, number];
}

/** 猎装：高 setId 倾向；修为微量（主修为走塔） */
export const LOOT_TABLES: Record<string, LootTable> = {
  loot_gear_normal: {
    id: 'loot_gear_normal',
    guaranteeEquipment: true,
    setIdChance: 0.08,
    setIdWeights: [
      { id: 'set_pojun', weight: 2 },
      { id: 'set_tiebi', weight: 2 },
      { id: 'set_jishi', weight: 1 },
    ],
    gold: [5, 15],
    xiuwei: [0, 0],
    stardust: [0, 0],
    /** 同本固定经验（灵石仍可浮动） */
    characterExp: [24, 24],
  },
  loot_gear_hard: {
    id: 'loot_gear_hard',
    guaranteeEquipment: true,
    setIdChance: 0.08,
    setIdWeights: [
      { id: 'set_pojun', weight: 2 },
      { id: 'set_tiebi', weight: 2 },
      { id: 'set_jishi', weight: 1 },
    ],
    gold: [7, 16],
    xiuwei: [0, 0],
    stardust: [0, 0],
    characterExp: [34, 34],
  },
  loot_gear_hell: {
    id: 'loot_gear_hell',
    guaranteeEquipment: true,
    setIdChance: 0.08,
    setIdWeights: [
      { id: 'set_pojun', weight: 1 },
      { id: 'set_tiebi', weight: 1 },
      { id: 'set_jishi', weight: 1 },
    ],
    gold: [8, 18],
    xiuwei: [0, 0],
    stardust: [0, 0],
    characterExp: [45, 45],
  },
  loot_gear_rift: {
    id: 'loot_gear_rift',
    guaranteeEquipment: true,
    setIdChance: 0.1,
    setIdWeights: [
      { id: 'set_pojun', weight: 1 },
      { id: 'set_tiebi', weight: 1 },
      { id: 'set_jishi', weight: 1 },
    ],
    gold: [10, 22],
    xiuwei: [0, 0],
    stardust: [0, 1],
    characterExp: [52, 52],
  },
  /** 兼容旧 id；逻辑同 loot_gear_normal */
  loot_gear_trial: {
    id: 'loot_gear_trial',
    guaranteeEquipment: true,
    setIdChance: 0.08,
    setIdWeights: [
      { id: 'set_pojun', weight: 2 },
      { id: 'set_tiebi', weight: 2 },
      { id: 'set_jishi', weight: 1 },
    ],
    gold: [5, 15],
    xiuwei: [0, 0],
    stardust: [0, 0],
    characterExp: [24, 24],
  },
  /** 兼容旧 id；逻辑同 loot_gear_hell */
  loot_abyss_mirror: {
    id: 'loot_abyss_mirror',
    guaranteeEquipment: true,
    setIdChance: 0.08,
    setIdWeights: [
      { id: 'set_pojun', weight: 1 },
      { id: 'set_tiebi', weight: 1 },
      { id: 'set_jishi', weight: 1 },
    ],
    gold: [8, 18],
    xiuwei: [0, 0],
    stardust: [0, 0],
    characterExp: [45, 45],
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
  /** 第 1 件（主展示） */
  loot: Equipment | null;
  /** 第 2 件起 */
  bonusLoot: Equipment[];
  dungeonId: DungeonId;
  characterExpPerMember: number;
  partyExpRows: PartyExpGainRow[];
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

  const gearOpts = buildGearEquipOptions(state, dungeonId);
  const equipOpts: GenerateEquipmentOptions = gearOpts ?? {
    setIdChance: table.setIdChance,
    setIdWeights: table.setIdWeights,
    itemLevel: itemLevelFromProgress(state.chapterCleared ?? 0, state.chapterNodeIndex ?? 0),
    ...buildLegacyAbyssEquipOptions(dungeonId),
  };

  const rollChances = resolveEquipmentRollChances(table, dungeonId);
  const dropCount = rollEquipmentDropCount(rng, rollChances);
  const drops: Equipment[] = [];
  for (let i = 0; i < dropCount; i++) {
    drops.push(generateEquipment(rng, undefined, equipOpts));
  }
  const loot = drops[0] ?? null;
  const bonusLoot = drops.slice(1);

  let next: PlayerState = {
    ...ensureRoster(state),
    wins: state.wins + 1,
    gold: state.gold + rangeRoll(rng, table.gold),
    inventory: drops.length > 0 ? [...state.inventory, ...drops] : [...state.inventory],
    seed: state.seed + 1,
    encounterIndex: state.encounterIndex + 1,
  };

  const deployed = Object.keys(normalizeFormation(next.formation));
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
  const expGrant = grantDeployedBattleExp(next, exp);
  next = expGrant.state;
  const characterExpPerMember = exp;
  const pill = rollExpPillDrop(rng, state.chapterCleared ?? 0);
  next = grantExpPillDrop(next, pill);
  const xiuwei = rangeRoll(rng, table.xiuwei);
  if (xiuwei > 0) next = grantCurrency(next, 'xiuwei', xiuwei);
  const stardust = rangeRoll(rng, table.stardust);
  if (stardust > 0) next = grantCurrency(next, 'stardust', stardust);

  return {
    state: next,
    loot,
    bonusLoot,
    dungeonId,
    characterExpPerMember,
    partyExpRows: expGrant.partyRows,
  };
}
