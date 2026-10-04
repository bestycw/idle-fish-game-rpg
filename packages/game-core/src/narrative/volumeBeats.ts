/**
 * 卷级剧情骨（Spine · 全皮共用）
 * Skill 只填槽位，必须满足每章 beat 的因果与引用，避免散漫。
 */

export type VolumeId = 'vol1' | 'vol2';

/** 引擎地点 id · display 见 worldSpine.ts */
export type SpineLocationId =
  | 'loc_gate'
  | 'loc_forest'
  | 'loc_highland'
  | 'loc_camp'
  | 'loc_wastes'
  | 'loc_rest'
  | 'loc_pass'
  | 'loc_inner'
  | 'loc_hall'
  | 'loc_boss_gate';

/** 卷内城镇（Hub/途经之地 · 与 loc_* 事发地点分离） */
export type SpineTownId = 'town_outer' | 'town_midland' | 'town_marches' | 'town_fortress';

/** 剧情 NPC 槽（非抽卡 hero · 同一卷内身份稳定） */
export type SpineNpcSlot =
  | 'npc_handler'
  | 'npc_rival'
  | 'npc_elder'
  | 'npc_merchant'
  | 'npc_turncoat';

export interface VolumeChapterBeat {
  volumeId: VolumeId;
  chapterOrder: number;
  chapterId: string;
  /** 本章叙事功能（Skill 必须体现，校验用关键词/槽位） */
  beatTitle: string;
  beatSummary: string;
  /** 本章所属城镇（显示名 · 非事发地点） */
  primaryTown: SpineTownId;
  /** 主场景（关隘/林道等 · 不得用城镇名顶替） */
  primaryLocation: SpineLocationId;
  /** 本章应出现的 NPC 槽 */
  npcSlots: SpineNpcSlot[];
  /** 须回调的上一章 beat 关键词（0 = 首章） */
  callbackFromChapter: number | null;
  /** 须为下一章埋的 hook 类型 */
  hookForNext: 'threat' | 'clue' | 'cost' | 'arrival' | 'none';
  /** 默认绑定的 Spine node（首 battle/story 用于模板） */
  anchorNodeId: string;
}

/** 卷一 · 10 章（与 ch1–ch10 order 对齐） */
export const VOLUME1_BEATS: VolumeChapterBeat[] = [
  {
    volumeId: 'vol1',
    chapterOrder: 1,
    chapterId: 'ch1',
    beatTitle: '入局',
    beatSummary: '进入主区域，接引者点明规则与第一次试炼理由。',
    primaryTown: 'town_outer',
    primaryLocation: 'loc_gate',
    npcSlots: ['npc_handler'],
    callbackFromChapter: null,
    hookForNext: 'threat',
    anchorNodeId: 'ch1_n1',
  },
  {
    volumeId: 'vol1',
    chapterOrder: 2,
    chapterId: 'ch2',
    beatTitle: '初规',
    beatSummary: '第二次交锋，同辈/rival 施压，林道或侧翼威胁落地。',
    primaryTown: 'town_outer',
    primaryLocation: 'loc_forest',
    npcSlots: ['npc_rival', 'npc_handler'],
    callbackFromChapter: 1,
    hookForNext: 'threat',
    anchorNodeId: 'ch2_n1',
  },
  {
    volumeId: 'vol1',
    chapterOrder: 3,
    chapterId: 'ch3',
    beatTitle: '远锋',
    beatSummary: '远程/高台压力，证明破阵不只是近身。',
    primaryTown: 'town_midland',
    primaryLocation: 'loc_highland',
    npcSlots: ['npc_elder'],
    callbackFromChapter: 2,
    hookForNext: 'cost',
    anchorNodeId: 'ch3_n1',
  },
  {
    volumeId: 'vol1',
    chapterOrder: 4,
    chapterId: 'ch4',
    beatTitle: '整备',
    beatSummary: '营地整备，名册/投影被正式提及， elder 给阶段目标。',
    primaryTown: 'town_midland',
    primaryLocation: 'loc_camp',
    npcSlots: ['npc_elder', 'npc_merchant'],
    callbackFromChapter: 3,
    hookForNext: 'clue',
    anchorNodeId: 'ch4_n1',
  },
  {
    volumeId: 'vol1',
    chapterOrder: 5,
    chapterId: 'ch5',
    beatTitle: '高压',
    beatSummary: '乱战或轮换加压，代价感（伤/耗/信誉）抬升。',
    primaryTown: 'town_marches',
    primaryLocation: 'loc_wastes',
    npcSlots: ['npc_rival'],
    callbackFromChapter: 4,
    hookForNext: 'cost',
    anchorNodeId: 'ch5_n1',
  },
  {
    volumeId: 'vol1',
    chapterOrder: 6,
    chapterId: 'ch6',
    beatTitle: '半程',
    beatSummary: '卷中回望，handler 总结前半得失，不解决主冲突。',
    primaryTown: 'town_marches',
    primaryLocation: 'loc_rest',
    npcSlots: ['npc_handler', 'npc_elder'],
    callbackFromChapter: 5,
    hookForNext: 'arrival',
    anchorNodeId: 'ch6_n1',
  },
  {
    volumeId: 'vol1',
    chapterOrder: 7,
    chapterId: 'ch7',
    beatTitle: '开门',
    beatSummary: '新关隘/新区域打开，目标地点换成 pass。',
    primaryTown: 'town_marches',
    primaryLocation: 'loc_pass',
    npcSlots: ['npc_handler', 'npc_merchant'],
    callbackFromChapter: 6,
    hookForNext: 'clue',
    anchorNodeId: 'ch7_n1',
  },
  {
    volumeId: 'vol1',
    chapterOrder: 8,
    chapterId: 'ch8',
    beatTitle: '暗线',
    beatSummary: '内鬼或第二条线冒头（turncoat 槽），线索不揭底。',
    primaryTown: 'town_fortress',
    primaryLocation: 'loc_inner',
    npcSlots: ['npc_turncoat', 'npc_rival'],
    callbackFromChapter: 7,
    hookForNext: 'threat',
    anchorNodeId: 'ch8_n1',
  },
  {
    volumeId: 'vol1',
    chapterOrder: 9,
    chapterId: 'ch9',
    beatTitle: '集结',
    beatSummary: '卷末前夜，elder 下达总攻/破门要求，名册齐整感。',
    primaryTown: 'town_fortress',
    primaryLocation: 'loc_hall',
    npcSlots: ['npc_elder', 'npc_handler'],
    callbackFromChapter: 8,
    hookForNext: 'threat',
    anchorNodeId: 'ch9_n1',
  },
  {
    volumeId: 'vol1',
    chapterOrder: 10,
    chapterId: 'ch10',
    beatTitle: '卷终',
    beatSummary: '守门决战，卷内主威胁暂退，留下一卷 hook（不写死下卷内容）。',
    primaryTown: 'town_fortress',
    primaryLocation: 'loc_boss_gate',
    npcSlots: ['npc_elder', 'npc_rival'],
    callbackFromChapter: 9,
    hookForNext: 'none',
    anchorNodeId: 'ch10_n2',
  },
];

export function volumeBeatForChapter(chapterOrder: number): VolumeChapterBeat | undefined {
  return VOLUME1_BEATS.find((b) => b.chapterOrder === chapterOrder);
}

export function volumeBeatForChapterId(chapterId: string): VolumeChapterBeat | undefined {
  return VOLUME1_BEATS.find((b) => b.chapterId === chapterId);
}

/**
 * 卷二规划：同一套 SpineLocationId，beat  escalation（待 ch11+ defs 落地时补全表）
 */
export const VOLUME2_BEATS_PLACEHOLDER: Pick<VolumeChapterBeat, 'volumeId' | 'beatTitle' | 'hookForNext'>[] = [
  { volumeId: 'vol2', beatTitle: '余烬', hookForNext: 'threat' },
  { volumeId: 'vol2', beatTitle: '再门', hookForNext: 'none' },
];
