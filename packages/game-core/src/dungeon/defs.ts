import type { EncounterDef } from './encounters.js';
import { ENCOUNTERS } from './encounters.js';
import {
  GEAR_DUNGEON_DEFS,
  gearDungeonToDungeonDef,
} from './gearDungeons.js';

/** 副本本种 id（字符串可扩） */
export type DungeonId = string;

export type DungeonKind = 'gear' | 'material';

/** battle=进战斗；instant=薄壳直接结算（如修炼塔本刀） */
export type DungeonRunMode = 'battle' | 'instant';

/**
 * 副本定义（表驱动）。
 * 新本：加一行 + 奖励表；禁止在 Hub/战斗主循环按具体 id 写死业务分支。
 */
export interface DungeonDef {
  id: DungeonId;
  /** 中性默认名；显示可随皮 */
  name: string;
  kind: DungeonKind;
  runMode: DungeonRunMode;
  /** 引用 EncounterDef.id；instant 可空 */
  encounterPool: string[];
  lootTableId: string;
  blurb: string;
  /** 开战体力；缺省由 stamina 按 kind 回落 */
  staminaCost: number;
  /**
   * 本种压力（乘在章档 enemyMult 之上）。
   * 猎装 1；地狱档约 1.3。敌人跟正在打的章走，不按玩家当前战力缩放。
   */
  pressure?: number;
}

const GEAR_BATTLE_DUNGEONS = GEAR_DUNGEON_DEFS.map(gearDungeonToDungeonDef);

export const DUNGEONS: DungeonDef[] = [
  ...GEAR_BATTLE_DUNGEONS,
  /** 兼容旧存档/深链；Hub 不再主推 */
  {
    id: 'gear_trial',
    name: '猎装试炼（旧）',
    kind: 'gear',
    runMode: 'battle',
    encounterPool: ['wall', 'archers', 'raiders', 'oil_cask', 'shield_stack'],
    lootTableId: 'loot_gear_trial',
    blurb: '综合轮换；请从猎装副本列表选主题本',
    staminaCost: 10,
    pressure: 1,
  },
  {
    id: 'abyss_mirror',
    name: '镜渊试炼（旧）',
    kind: 'material',
    runMode: 'battle',
    encounterPool: ['chaos_rite', 'spirit_wall', 'boss_warden'],
    lootTableId: 'loot_abyss_mirror',
    blurb: '已并入「镇守试炼」地狱档',
    staminaCost: 12,
    pressure: 1.3,
  },
  {
    id: 'tower',
    name: '修炼塔',
    kind: 'material',
    runMode: 'instant',
    encounterPool: [],
    lootTableId: 'loot_tower',
    blurb: '修为唯一产口：小节点与破境',
    staminaCost: 5,
  },
  {
    id: 'stardust_realm',
    name: '星尘秘境',
    kind: 'material',
    runMode: 'instant',
    encounterPool: [],
    lootTableId: 'loot_stardust_realm',
    blurb: '刷星尘兑碎片（慢补；★5+仍靠抽卡）',
    staminaCost: 8,
  },
];

const byId = new Map(DUNGEONS.map((d) => [d.id, d]));

export function getDungeon(id: DungeonId): DungeonDef {
  const d = byId.get(id);
  if (!d) throw new Error(`Unknown dungeon: ${id}`);
  return d;
}

export function listDungeons(): DungeonDef[] {
  return [...DUNGEONS];
}

export function listBattleDungeons(): DungeonDef[] {
  return DUNGEONS.filter((d) => d.runMode === 'battle');
}

export function staminaCostForDungeon(dungeonId: DungeonId): number {
  return getDungeon(dungeonId).staminaCost;
}

/** 本种遭遇压力；未配置视为 1 */
export function pressureForDungeon(dungeonId: DungeonId): number {
  return getDungeon(dungeonId).pressure ?? 1;
}

/** 按本种遭遇池 + 游标，解析到 ENCOUNTERS 下标 */
export function pickEncounterIndex(dungeonId: DungeonId, cursor: number): number {
  const dungeon = getDungeon(dungeonId);
  if (dungeon.encounterPool.length === 0) return 0;
  const encId = dungeon.encounterPool[Math.abs(cursor) % dungeon.encounterPool.length]!;
  const idx = ENCOUNTERS.findIndex((e) => e.id === encId);
  return idx >= 0 ? idx : 0;
}

export function pickEncounter(dungeonId: DungeonId, cursor: number): EncounterDef {
  return ENCOUNTERS[pickEncounterIndex(dungeonId, cursor)] ?? ENCOUNTERS[0]!;
}
