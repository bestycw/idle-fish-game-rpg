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
  /** 开战体力；缺省由 stamina 按 kind 回落 */
  staminaCost: number;
  /**
   * 遭遇压力系数（乘敌人攻/防/血等）。
   * 早期本 ~1.0；高压本 >1，逼养成后仍要换解法，而不是同一张表两头不靠。
   */
  pressure?: number;
}

export const DUNGEONS: DungeonDef[] = [
  {
    id: 'gear_trial',
    name: '猎装试炼',
    kind: 'gear',
    runMode: 'battle',
    // 早期本不含铁壁灵阵（力队吃瘪），避免开局软锁；灵阵进镜渊
    encounterPool: ['wall', 'archers', 'raiders'],
    lootTableId: 'loot_gear_trial',
    blurb: '刷装备；套装碎片倾向更高',
    staminaCost: 10,
    pressure: 1,
  },
  {
    id: 'abyss_mirror',
    name: '镜渊试炼',
    kind: 'material',
    runMode: 'battle',
    encounterPool: ['chaos_rite', 'spirit_wall', 'boss_warden'],
    lootTableId: 'loot_abyss_mirror',
    blurb: '高压遭遇；经验向（修为仅塔）',
    staminaCost: 12,
    // 养成后默认队仍应在铁壁/Boss 感到卡关；破甲辅明显抬胜率
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
