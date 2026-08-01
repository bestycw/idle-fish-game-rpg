import type { EncounterDef } from './encounters.js';
import { ENCOUNTERS } from './encounters.js';

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
}

export const DUNGEONS: DungeonDef[] = [
  {
    id: 'gear_trial',
    name: '猎装试炼',
    kind: 'gear',
    runMode: 'battle',
    encounterPool: ['wall', 'archers', 'raiders'],
    lootTableId: 'loot_gear_trial',
    blurb: '刷装备；套装碎片倾向更高',
  },
  {
    id: 'tower',
    name: '修炼塔',
    kind: 'material',
    runMode: 'instant',
    encounterPool: [],
    lootTableId: 'loot_tower',
    blurb: '刷修为破境（本刀点一下）',
  },
  {
    id: 'stardust_realm',
    name: '星尘秘境',
    kind: 'material',
    runMode: 'instant',
    encounterPool: [],
    lootTableId: 'loot_stardust_realm',
    blurb: '刷星尘升星（instant 薄壳）',
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
