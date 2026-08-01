/**
 * 章节内容表（B4 框架）。
 * 后续加章、改解锁、改节点 → 只改本文件；禁止在 Hub/战斗主循环写死章 id 业务。
 */

/** 解锁种类：各系统用 isContentUnlocked 查询 */
export type UnlockKind = 'dungeon' | 'gacha_unit' | 'encounter';

export interface ContentUnlock {
  kind: UnlockKind;
  id: string;
}

export type ChapterNodeKind = 'story' | 'battle';

export interface ChapterNodeDef {
  id: string;
  kind: ChapterNodeKind;
  title: string;
  /** 占位文案；故事皮可后换 */
  blurb: string;
  /** battle：EncounterDef.id */
  encounterId?: string;
}

export interface ChapterDef {
  id: string;
  /** 1-based 顺序 */
  order: number;
  name: string;
  blurb: string;
  nodes: ChapterNodeDef[];
  /** 通关本章（节点打完）后追加 */
  unlocksOnClear: ContentUnlock[];
}

/**
 * 开局即解锁。调开局内容池只改这里。
 * 注意：未列入的 gacha_unit / encounter / dungeon 默认锁定，直到某章 unlocksOnClear。
 */
export const START_UNLOCKS: ContentUnlock[] = [
  { kind: 'dungeon', id: 'gear_trial' },
  { kind: 'dungeon', id: 'tower' },
  { kind: 'dungeon', id: 'stardust_realm' },
  { kind: 'encounter', id: 'wall' },
  { kind: 'encounter', id: 'archers' },
  { kind: 'gacha_unit', id: 'zhangfei' },
  { kind: 'gacha_unit', id: 'zhaoyun' },
  { kind: 'gacha_unit', id: 'wukong' },
  { kind: 'gacha_unit', id: 'huatuo' },
  { kind: 'gacha_unit', id: 'houyi' },
  { kind: 'gacha_unit', id: 'heracles' },
];

/**
 * 主线章表。V1：6 章占位；文案可换，结构与解锁要真实。
 * 示例：第 1 章清完开 `raiders`；第 2 章开 `baigujing`。改解锁只改本表。
 */
export const CHAPTERS: ChapterDef[] = [
  {
    id: 'ch1',
    order: 1,
    name: '第一章 · 启程',
    blurb: '占位：踏入试炼之地。',
    nodes: [
      {
        id: 'ch1_n1',
        kind: 'story',
        title: '上路',
        blurb: '占位过场：你整理行装，前方有盾墙拦路。',
      },
      {
        id: 'ch1_n2',
        kind: 'battle',
        title: '初战盾墙',
        blurb: '占位：击败盾墙遭遇。',
        encounterId: 'wall',
      },
      {
        id: 'ch1_n3',
        kind: 'story',
        title: '落脚',
        blurb: '占位：初战结束；速攻遭遇将解锁。',
      },
    ],
    unlocksOnClear: [{ kind: 'encounter', id: 'raiders' }],
  },
  {
    id: 'ch2',
    order: 2,
    name: '第二章 · 乱阵',
    blurb: '占位：对手开始玩弄心神。',
    nodes: [
      {
        id: 'ch2_n1',
        kind: 'story',
        title: '异兆',
        blurb: '占位：有人能扰乱阵脚。',
      },
      {
        id: 'ch2_n2',
        kind: 'battle',
        title: '速攻来袭',
        blurb: '占位：应对高机动敌人。',
        encounterId: 'raiders',
      },
    ],
    unlocksOnClear: [{ kind: 'gacha_unit', id: 'baigujing' }],
  },
  {
    id: 'ch3',
    order: 3,
    name: '第三章 · 远矢',
    blurb: '占位：后排火力加压。',
    nodes: [
      {
        id: 'ch3_n1',
        kind: 'battle',
        title: '弓阵',
        blurb: '占位：切开后排。',
        encounterId: 'archers',
      },
    ],
    unlocksOnClear: [{ kind: 'gacha_unit', id: 'medusa' }],
  },
  {
    id: 'ch4',
    order: 4,
    name: '第四章 · 磨合',
    blurb: '占位：阵容开始定型。',
    nodes: [
      {
        id: 'ch4_n1',
        kind: 'story',
        title: '整备',
        blurb: '占位：回去刷装、抽人，再来。',
      },
      {
        id: 'ch4_n2',
        kind: 'battle',
        title: '再战盾墙',
        blurb: '占位：检验构筑。',
        encounterId: 'wall',
      },
    ],
    unlocksOnClear: [{ kind: 'gacha_unit', id: 'zhuge' }],
  },
  {
    id: 'ch5',
    order: 5,
    name: '第五章 · 高压',
    blurb: '占位：遭遇轮换加压。',
    nodes: [
      {
        id: 'ch5_n1',
        kind: 'battle',
        title: '乱战',
        blurb: '占位：速攻再临。',
        encounterId: 'raiders',
      },
    ],
    unlocksOnClear: [{ kind: 'gacha_unit', id: 'athena' }],
  },
  {
    id: 'ch6',
    order: 6,
    name: '第六章 · 暂歇',
    blurb: '占位：本线告一段落。',
    nodes: [
      {
        id: 'ch6_n1',
        kind: 'story',
        title: '回望',
        blurb: '占位：主线骨架走完；后续章可继续往本表加。',
      },
      {
        id: 'ch6_n2',
        kind: 'battle',
        title: '终阵',
        blurb: '占位：最后一场。',
        encounterId: 'archers',
      },
    ],
    unlocksOnClear: [],
  },
];

const byId = new Map(CHAPTERS.map((c) => [c.id, c]));
const byOrder = new Map(CHAPTERS.map((c) => [c.order, c]));

export function getChapter(id: string): ChapterDef {
  const c = byId.get(id);
  if (!c) throw new Error(`Unknown chapter: ${id}`);
  return c;
}

export function getChapterByOrder(order: number): ChapterDef | undefined {
  return byOrder.get(order);
}

export function listChapters(): ChapterDef[] {
  return [...CHAPTERS].sort((a, b) => a.order - b.order);
}

export function maxChapterOrder(): number {
  return CHAPTERS.reduce((m, c) => Math.max(m, c.order), 0);
}
