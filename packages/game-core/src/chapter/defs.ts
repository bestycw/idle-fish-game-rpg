/**
 * 章节内容表（B4 框架）。
 * 后续加章、改解锁、改节点 → 只改本文件；禁止在 Hub/战斗主循环写死章 id 业务。
 */
import { expandIdsByUnlock } from '../character/roster/expandRoster.js';
import type { MainlineBattleCap } from './mainlineBattleWaves.js';

/** 解锁种类：各系统用 isContentUnlocked 查询 */
export type UnlockKind = 'dungeon' | 'gacha_unit' | 'encounter';

export interface ContentUnlock {
  kind: UnlockKind;
  id: string;
}

export type ChapterNodeKind = 'story' | 'battle';

/** 同一 battle 节点内连战；全胜才推进 node */
export interface BattleWaveDef {
  encounterId: string;
  label?: string;
  /** 0-based：本节内第几个「三连战单元」 */
  unitIndex?: number;
  /** 展示用，如「第 2 阵」 */
  unitLabel?: string;
}

export interface ChapterNodeDef {
  id: string;
  kind: ChapterNodeKind;
  title: string;
  /** 场地名（关卡条 /「进入 · 某地」）；故事皮可后换 */
  place: string;
  /** 占位文案；故事皮可后换 */
  blurb: string;
  /** battle 单波（与 battleWaves 二选一，waves 优先） */
  encounterId?: string;
  /** battle 多波（引擎默认表 · 非 Skill） */
  battleWaves?: BattleWaveDef[];
  /** 主线八题 cap；运行时展开为多阵连战（与 battleWaves 二选一） */
  battleCap?: MainlineBattleCap;
}

export function nodePlace(node: Pick<ChapterNodeDef, 'place' | 'title'>): string {
  const place = node.place?.trim();
  return place || node.title;
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

/** 本章最后一个 battle 节点（章末首领落在这里） */
export function isChapterFinaleBattleNode(
  chapter: ChapterDef,
  node: ChapterNodeDef,
): boolean {
  if (node.kind !== 'battle') return false;
  let last: ChapterNodeDef | null = null;
  for (const n of chapter.nodes) {
    if (n.kind === 'battle') last = n;
  }
  return last?.id === node.id;
}

/**
 * 开局即解锁。调开局内容池只改这里。
 * 注意：未列入的 gacha_unit / encounter / dungeon 默认锁定，直到某章 unlocksOnClear。
 */
function gachaUnlocks(...ids: string[]): ContentUnlock[] {
  return ids.map((id) => ({ kind: 'gacha_unit' as const, id }));
}

/** 开局无猎装；通第一章才开第一本（见 ch1.unlocksOnClear） */
export const START_UNLOCKS: ContentUnlock[] = [
  { kind: 'dungeon', id: 'tower' },
  { kind: 'dungeon', id: 'stardust_realm' },
  { kind: 'encounter', id: 'wall' },
  { kind: 'encounter', id: 'archers' },
  ...gachaUnlocks(...expandIdsByUnlock('start')),
];

/**
 * 主线章表。卷一：10 章；文案可换，结构与解锁要真实。
 * 示例：第 1 章清完开 `raiders`；第 2 章开 `baigujing`。改解锁只改本表。
 */
export const CHAPTERS: ChapterDef[] = [
  {
    id: 'ch1',
    order: 1,
    name: '第一章 · 启程',
    blurb: '关外试炼初开，盾墙挡路——先看战前提示再进场。',
    nodes: [
      {
        id: 'ch1_n1',
        kind: 'story',
        title: '上路',
        place: '城门驿道',
        blurb: '驿道尘土里，你闻到铁与血。关隘那头，有人用盾墙试你底细。',
      },
      {
        id: 'ch1_n2',
        kind: 'battle',
        title: '初战盾墙',
        place: '盾墙关隘',
        blurb: '盾阵压上，先破前排再谈速攻。',
        battleCap: 'wall',
      },
      {
        id: 'ch1_n3',
        kind: 'story',
        title: '落脚',
        place: '关外营地',
        blurb: '营火渐起。盾墙既破，关丁让出箭道，有人提醒你别在关前久留。',
      },
      {
        id: 'ch1_n4',
        kind: 'battle',
        title: '箭道首领',
        place: '关外箭道',
        blurb: '关隘侧翼金弓列阵——章末首领战，先破挡箭再切后排。',
        battleCap: 'archers',
      },
      {
        id: 'ch1_n5',
        kind: 'story',
        title: '记名落定',
        place: '关外营地',
        blurb: '记名符亮了一线。接引者点明：下一程是林道，同辈不会等你。',
      },
    ],
    unlocksOnClear: [
      /** 卷一第一本猎装：通关第一章才开 */
      { kind: 'dungeon', id: 'gear_break_wall' },
      { kind: 'encounter', id: 'raiders' },
      ...gachaUnlocks(...expandIdsByUnlock('ch1')),
    ],
  },
  {
    id: 'ch2',
    order: 2,
    name: '第二章 · 乱阵',
    blurb: '林道伏兵频出，有人专打阵脚与后排。',
    nodes: [
      {
        id: 'ch2_n1',
        kind: 'story',
        title: '异兆',
        place: '乱阵林道',
        blurb: '林里脚步声乱，像是故意引你分兵；速攻部队就在侧翼。',
      },
      {
        id: 'ch2_n2',
        kind: 'battle',
        title: '速攻来袭',
        place: '密林伏击',
        blurb: '高机动切入，备好治疗与坦克换位。',
        battleCap: 'raiders',
      },
      {
        id: 'ch2_n3',
        kind: 'story',
        title: '分兵疑云',
        place: '林道岔口',
        blurb: '伏兵退去，留下乱阵脚印。同辈在远处冷笑：你跟不跟得上节奏？',
      },
      {
        id: 'ch2_n4',
        kind: 'battle',
        title: '祭纹余波',
        place: '林中空场',
        blurb: '乱心祭纹未散，控场与净化要跟上。',
        battleCap: 'chaos_rite',
      },
      {
        id: 'ch2_n5',
        kind: 'story',
        title: '林尽见台',
        place: '林道出口',
        blurb: '林尽处高台在望。远矢之约，从下一章开始算数。',
      },
      {
        id: 'ch2_n6',
        kind: 'battle',
        title: '出口戒严',
        place: '林道出口',
        blurb: '出口戒严，最后一阵速攻试探。',
        battleCap: 'raiders',
      },
    ],
    unlocksOnClear: [
      /** 第二章只开更多普通本；困难/地狱按后续章递进，避免建议战力全挤在 ~2000 */
      { kind: 'dungeon', id: 'gear_arrow_lane' },
      { kind: 'dungeon', id: 'gear_raider_trail' },
      { kind: 'dungeon', id: 'gear_oil_well' },
      { kind: 'dungeon', id: 'gear_spirit_gate' },
      { kind: 'dungeon', id: 'gear_shield_vault' },
      { kind: 'encounter', id: 'chaos_rite' },
      { kind: 'encounter', id: 'spirit_wall' },
      { kind: 'encounter', id: 'oil_cask' },
      { kind: 'encounter', id: 'shield_stack' },
      ...gachaUnlocks(...expandIdsByUnlock('ch2')),
    ],
  },
  {
    id: 'ch3',
    order: 3,
    name: '第三章 · 远矢',
    blurb: '占位：后排火力加压。',
    nodes: [
      {
        id: 'ch3_n1',
        kind: 'story',
        title: '远锋立约',
        place: '试剑台',
        blurb: '高台风硬，长老立约：破远锋，才谈传功序。',
      },
      {
        id: 'ch3_n2',
        kind: 'battle',
        title: '弓阵',
        place: '试剑台',
        blurb: '箭雨压阵，切后排或护阵二选一。',
        battleCap: 'archers',
      },
      {
        id: 'ch3_n3',
        kind: 'story',
        title: '弦歇一刻',
        place: '试剑台侧',
        blurb: '弓阵既破，有人递话：营地那头需要整备，别在高台耗干力气。',
      },
      {
        id: 'ch3_n4',
        kind: 'battle',
        title: '盾墙回测',
        place: '台下山道',
        blurb: '盾墙再阵，检验近身破阵是否稳固。',
        battleCap: 'wall',
      },
      {
        id: 'ch3_n5',
        kind: 'story',
        title: '远锋记名',
        place: '试剑台',
        blurb: '约成。名册上多了你一笔，也多了对手一笔。',
      },
    ],
    unlocksOnClear: [
      /** 困难档：章 3～4 */
      { kind: 'dungeon', id: 'gear_wall_hard' },
      { kind: 'dungeon', id: 'gear_arrow_hard' },
      { kind: 'dungeon', id: 'gear_raider_hard' },
      { kind: 'encounter', id: 'boss_warden' },
      ...gachaUnlocks(...expandIdsByUnlock('ch3')),
    ],
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
        place: '中途营地',
        blurb: '营火边整备：看战前提示 → 猎装/镜渊补缺口，再改阵。',
      },
      {
        id: 'ch4_n2',
        kind: 'battle',
        title: '再战盾墙',
        place: '盾墙回廊',
        blurb: '构筑检验战，前排压力复现。',
        battleCap: 'wall',
      },
      {
        id: 'ch4_n3',
        kind: 'story',
        title: '名册投影',
        place: '灵石营',
        blurb: '长老提及名册投影：能打的兄弟，要在阵上才算数。',
      },
      {
        id: 'ch4_n4',
        kind: 'battle',
        title: '叠盾演武',
        place: '营外校场',
        blurb: '叠盾阵脚专打破甲节奏。',
        battleCap: 'shield_stack',
      },
      {
        id: 'ch4_n5',
        kind: 'story',
        title: '阶段目标',
        place: '中途营地',
        blurb: '阶段目标落下：再往前，劫灰原不会跟你讲情面。',
      },
    ],
    unlocksOnClear: [
      { kind: 'dungeon', id: 'gear_oil_furnace' },
      { kind: 'dungeon', id: 'gear_shield_bastion' },
      { kind: 'dungeon', id: 'gear_spirit_array' },
      { kind: 'dungeon', id: 'gear_chaos_shrine' },
      ...gachaUnlocks(...expandIdsByUnlock('ch4')),
    ],
  },
  {
    id: 'ch5',
    order: 5,
    name: '第五章 · 高压',
    blurb: '占位：遭遇轮换加压。',
    nodes: [
      {
        id: 'ch5_n1',
        kind: 'story',
        title: '灰原前夜',
        place: '劫灰原',
        blurb: '劫灰原上风如刀，同辈放话：席次之争，从这里算硬场。',
      },
      {
        id: 'ch5_n2',
        kind: 'battle',
        title: '乱战',
        place: '劫灰原',
        blurb: '速攻再临，阵脚一乱就满盘皆输。',
        battleCap: 'raiders',
      },
      {
        id: 'ch5_n3',
        kind: 'story',
        title: '灰中喘息',
        place: '劫灰原',
        blurb: '乱战方歇，远处灵障光晕起伏，像有人在门后调阵。',
      },
      {
        id: 'ch5_n4',
        kind: 'battle',
        title: '灵障试压',
        place: '原边灵障',
        blurb: '灵障盾阵抬高承伤，考验持续输出。',
        battleCap: 'spirit_wall',
      },
      {
        id: 'ch5_n5',
        kind: 'story',
        title: '高压记取',
        place: '劫灰原',
        blurb: '你撑过高压一段，但卷中点尚远——半程歇点在前。',
      },
    ],
    unlocksOnClear: [
      /** 地狱档：章 5～6 */
      { kind: 'dungeon', id: 'gear_wall_hell' },
      { kind: 'dungeon', id: 'gear_chaos_hell' },
      ...gachaUnlocks(...expandIdsByUnlock('ch5')),
    ],
  },
  {
    id: 'ch6',
    order: 6,
    name: '第六章 · 半程',
    blurb: '卷中回望，前半威胁未除。',
    nodes: [
      {
        id: 'ch6_n1',
        kind: 'story',
        title: '回望',
        place: '半程歇点',
        blurb: '半程歇点，前半得失落定；真正的门还在后面。',
      },
      {
        id: 'ch6_n2',
        kind: 'battle',
        title: '余波',
        place: '歇点外缘',
        blurb: '卷中战，叠盾余波，非卷终。',
        battleCap: 'shield_stack',
      },
      {
        id: 'ch6_n3',
        kind: 'story',
        title: '半程抉择',
        place: '望劫亭',
        blurb: '关键 story：你选先稳平行线，还是先破眼前阵？（只改语气）',
      },
      {
        id: 'ch6_n4',
        kind: 'battle',
        title: '丹炉油阵',
        place: '亭外油道',
        blurb: '油阵灼场，走位与净化要跟上。',
        battleCap: 'oil_cask',
      },
      {
        id: 'ch6_n5',
        kind: 'story',
        title: '再启行程',
        place: '半程歇点',
        blurb: '歇足再发，第二关隘在望，规则将与关外不同。',
      },
      {
        id: 'ch6_n6',
        kind: 'battle',
        title: '亭前试刃',
        place: '望劫亭前',
        blurb: '卷中最后一练，叠盾与破甲节奏再验。',
        battleCap: 'shield_stack',
      },
      {
        id: 'ch6_n7',
        kind: 'story',
        title: '半程落定',
        place: '望劫亭',
        blurb: '半程落定。门线在前，暗线在后。',
      },
    ],
    unlocksOnClear: [
      { kind: 'dungeon', id: 'gear_warden_trial' },
      ...gachaUnlocks(...expandIdsByUnlock('ch6')),
    ],
  },
  {
    id: 'ch7',
    order: 7,
    name: '第七章 · 开门',
    blurb: '第二关隘打开，路线更深。',
    nodes: [
      {
        id: 'ch7_n1',
        kind: 'story',
        title: '过关',
        place: '第二关隘',
        blurb: '第二关隘开启，新区域规则不同，旧经验不够用了。',
      },
      {
        id: 'ch7_n2',
        kind: 'battle',
        title: '门线',
        place: '关隘线',
        blurb: '灵障守门，先破盾再谈深入。',
        battleCap: 'spirit_wall',
      },
      {
        id: 'ch7_n3',
        kind: 'story',
        title: '关内换律',
        place: '二重天阙',
        blurb: '入关后第一条律：内层回廊不认关外的侥幸。',
      },
      {
        id: 'ch7_n4',
        kind: 'battle',
        title: '弓线再压',
        place: '关内箭楼',
        blurb: '远矢再压，后排威胁回归。',
        battleCap: 'archers',
      },
      {
        id: 'ch7_n5',
        kind: 'story',
        title: '深线已开',
        place: '第二关隘',
        blurb: '门线既过，暗线将在内层露头。',
      },
    ],
    unlocksOnClear: [
      /** 秘境：高章才开金装池 */
      { kind: 'dungeon', id: 'gear_warden_rift' },
    ],
  },
  {
    id: 'ch8',
    order: 8,
    name: '第八章 · 暗线',
    blurb: '内层有第二套说法。',
    nodes: [
      {
        id: 'ch8_n1',
        kind: 'story',
        title: '疑线',
        place: '内层回廊',
        blurb: '蒙面弟子一闪而过，线索露头，不揭底。',
      },
      {
        id: 'ch8_n2',
        kind: 'battle',
        title: '暗涌',
        place: '内层狭场',
        blurb: '乱心祭坛余波，控场与爆发要取舍。',
        battleCap: 'chaos_rite',
      },
      {
        id: 'ch8_n3',
        kind: 'story',
        title: '暗线抉择',
        place: '内府秘径',
        blurb: '关键 story：信接引，还是信自己的判断？（只改语气）',
      },
      {
        id: 'ch8_n4',
        kind: 'battle',
        title: '侧翼再切',
        place: '秘径狭口',
        blurb: '速攻侧切，保护后排。',
        battleCap: 'raiders',
      },
      {
        id: 'ch8_n5',
        kind: 'story',
        title: '线头暂存',
        place: '内层回廊',
        blurb: '疑线暂存心底，传功殿的集结令已在路上。',
      },
    ],
    unlocksOnClear: [],
  },
  {
    id: 'ch9',
    order: 9,
    name: '第九章 · 集结',
    blurb: '卷末前夜，目标锁在门上。',
    nodes: [
      {
        id: 'ch9_n1',
        kind: 'story',
        title: '集结',
        place: '集结厅',
        blurb: '传功殿内集结，名册齐整，总攻布置落下。',
      },
      {
        id: 'ch9_n2',
        kind: 'battle',
        title: '前哨',
        place: '门前哨',
        blurb: '卷终前哨战，油阵与走位。',
        battleCap: 'oil_cask',
      },
      {
        id: 'ch9_n3',
        kind: 'story',
        title: '门前夜话',
        place: '传功殿',
        blurb: '最后一夜，长老只问一句：阵可稳否？',
      },
      {
        id: 'ch9_n4',
        kind: 'battle',
        title: '盾墙终练',
        place: '殿前校场',
        blurb: '盾墙终练，为守门战热阵。',
        battleCap: 'wall',
      },
      {
        id: 'ch9_n5',
        kind: 'story',
        title: '劫域在望',
        place: '集结厅',
        blurb: '劫域门在望，守门战明日即开。',
      },
      {
        id: 'ch9_n6',
        kind: 'battle',
        title: '门前演练',
        place: '劫域门外',
        blurb: '门前最后一练，灵障与油阵轮换。',
        battleCap: 'spirit_wall',
      },
    ],
    unlocksOnClear: [],
  },
  {
    id: 'ch10',
    order: 10,
    name: '第十章 · 卷终',
    blurb: '卷一守门决战。',
    nodes: [
      {
        id: 'ch10_n1',
        kind: 'story',
        title: '门前',
        place: '卷末门',
        blurb: '劫域门前，卷内主威胁在此一决；下一卷另开。',
      },
      {
        id: 'ch10_n2',
        kind: 'battle',
        title: '门线清扫',
        place: '劫域门外',
        blurb: '守门战前清扫，多阵连战热阵。',
        battleCap: 'spirit_wall',
      },
      {
        id: 'ch10_n3',
        kind: 'story',
        title: '破门一刻',
        place: '劫域门',
        blurb: '门缝里泄出的劫息，像在称量你的阵。',
      },
      {
        id: 'ch10_n4',
        kind: 'battle',
        title: '卷终',
        place: '镇守门内',
        blurb: '卷 BOSS 守门战，集火与禁疗要算清楚。',
        battleCap: 'boss_warden',
      },
      {
        id: 'ch10_n5',
        kind: 'story',
        title: '卷一收束',
        place: '劫域门',
        blurb: '卷一在此收束。猎装、塔与八题仍可精进；卷二将另开。',
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
