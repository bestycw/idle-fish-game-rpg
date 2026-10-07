/**
 * 序章官方文案（诙谐 · 网文节奏 · 分类型行）。
 * 真源：docs/superpowers/specs/2026-09-29-opening-saga-modern-isekai.md §3
 */

import type { WorldPreset } from '../shared/types.js';

export type PrologueStepId =
  | 'p01'
  | 'p02'
  | 'p03'
  | 'p04'
  | 'p05'
  | 'p06'
  | 'p08'
  | 'p10';

export type PrologueLineKind =
  | 'narration'
  | 'inner'
  | 'dialogue'
  | 'system'
  | 'emphasis'
  | 'divider'
  /** 聊天输入框草稿（常接「删掉」） */
  | 'draft';

export interface PrologueLine {
  kind: PrologueLineKind;
  text: string;
  /** dialogue / system 说话者 */
  speaker?: string;
}

export type PrologueMood = 'office' | 'glitch' | 'void' | 'world';

export interface PrologueBeat {
  id: PrologueStepId;
  title: string;
  /** 章首钩子（网文首句） */
  hook?: string;
  mood: PrologueMood;
  lines: PrologueLine[];
  continueLabel?: string;
  /** 逐行揭示间隔（ms），默认由 UI 决定 */
  revealMs?: number;
  /** 点「继续」离开本页时的过场 */
  transitionOut?: 'flash-white' | 'flash-glitch' | 'fade-void';
}

export interface ArrivalBeat {
  place: string;
  hook?: string;
  mood: PrologueMood;
  lines: PrologueLine[];
}

export const PROLOGUE_BEATS: PrologueBeat[] = [
  {
    id: 'p01',
    title: '第0章 · 凌晨两点十七分',
    hook: '——如果成神也要先改一版 ppt，那神大概也加过班。',
    mood: 'office',
    lines: [
      { kind: 'narration', text: '整栋楼黑着，只有你工位还亮。像一颗没关的错题。' },
      { kind: 'narration', text: '群聊置顶：「收到请回复。」' },
      { kind: 'inner', text: '发消息的人，八成已经睡了。' },
      { kind: 'emphasis', text: '最终版_真的最终_求别改_3.pptx' },
      { kind: 'narration', text: '文件名在任务栏里闪了一下，像对你眨眼。' },
    ],
    continueLabel: '……行，下一页',
  },
  {
    id: 'p02',
    title: '第0章 · 六十秒',
    hook: '老板的声音，在空楼层里自带混响。',
    mood: 'office',
    lines: [
      { kind: 'narration', text: '你手滑点开语音，免提——' },
      { kind: 'narration', text: '空楼层里，他的声音被放大成「现场版」。' },
      { kind: 'dialogue', speaker: '老板', text: '这个需求很简单。年轻人多沉淀。周五前辛苦一下。' },
      { kind: 'narration', text: '你打字：「好的收到。」——删了。' },
      { kind: 'draft', text: '去你×××的，大×××。' },
      { kind: 'narration', text: '——删掉。输入框抖了一下，像替你咽回去。' },
      { kind: 'narration', text: '改成「👌」——又删了。' },
      { kind: 'emphasis', text: '最后，你回了一个「。」' },
      { kind: 'inner', text: '句号是成年人最后的反抗。' },
    ],
    continueLabel: '下一个地狱',
  },
  {
    id: 'p03',
    title: '第0章 · 摸鱼三十秒',
    hook: '穿越文里，主角都是在摸鱼时被雷劈的。你决定专业一点。',
    mood: 'office',
    lines: [
      { kind: 'narration', text: '你打开收藏夹，像抽卡：' },
      { kind: 'system', speaker: '收藏·修仙', text: '帖：渡劫失败怎么办，在线等，急。' },
      { kind: 'system', speaker: '收藏·武侠', text: '帖：这一剑，二十年的 KPI。' },
      { kind: 'system', speaker: '收藏·赛博', text: '帖：义体在保修期内辞职算违约吗。' },
      { kind: 'inner', text: '要是人生也能换服务器就好了。' },
      { kind: 'narration', text: '收藏夹的图标还没加载完，屏幕边缘先起了细密的雪花。' },
      { kind: 'narration', text: '像有人在你显示器里搓了一小团静电。' },
      { kind: 'inner', text: '……眼花了？' },
    ],
    continueLabel: '就摸一会儿',
  },
  {
    id: 'p04',
    title: '第0章 · 咖啡失效',
    hook: '心脏先提交了离职申请，身体还在走流程。',
    mood: 'office',
    lines: [
      { kind: 'narration', text: '心跳咚、咚、咚——像有人在用你肋骨敲加班提醒。' },
      { kind: 'narration', text: '手还想抬去关页面，指尖却像陷在键盘里。' },
      { kind: 'narration', text: '群聊里，老板的头像旁慢慢浮出：「对方正在输入…」' },
      { kind: 'inner', text: '别回了。别回了。' },
      { kind: 'divider', text: '' },
      { kind: 'narration', text: '视野边缘发虚，电梯口海报却格外清晰：' },
      { kind: 'emphasis', text: '「奋斗者永不眠。」' },
      { kind: 'dialogue', speaker: '你', text: '奋斗者想睡觉。' },
      { kind: 'narration', text: '声音很轻。轻到像只说给自己听。' },
      { kind: 'narration', text: '然后灯光、键盘、咖啡味，一层层远下去。' },
    ],
    continueLabel: '撑不住了',
    transitionOut: 'flash-white',
  },
  {
    id: 'p05',
    title: '意识深处 · 一条推送',
    hook: '你以为晕过去就完事了。工位不同意。',
    mood: 'glitch',
    revealMs: 560,
    lines: [
      { kind: 'narration', text: '黑里浮起一点光——不是救护灯，是弹窗圆角。' },
      { kind: 'narration', text: '你想闭眼，协议已经在读条。' },
      { kind: 'system', speaker: '跨维劳工补偿计划', text: 'v0.1（Beta）已推送至您的生物界面。' },
      { kind: 'narration', text: '没有「拒绝」按钮。只有「稍后」——而稍后是灰色的。' },
      { kind: 'system', speaker: '系统', text: '检测到宿主长期超负荷运行。现发放「换服试玩」资格 ×1。' },
      {
        kind: 'system',
        speaker: '隐藏条款 · 双向同步',
        text: '原时间线肉身不迁移；副本中的意志与名分锚点将回填平行肉身。那边仍在加班——你越强，那边的「你」越不易被一句话击穿（章末《原世界同步简报》）。',
      },
      { kind: 'system', speaker: '免责声明', text: '最终解释权归裂隙所有。与现公司 HR 及老板语音无关。' },
      { kind: 'inner', text: '……我在做梦。一定是冰美式还没凉透。' },
      { kind: 'narration', text: '你下意识去点「确定」。指尖穿过了屏幕。' },
    ],
    continueLabel: '……确认？',
    transitionOut: 'flash-glitch',
  },
  {
    id: 'p06',
    title: '坠落 · 选服前夜',
    hook: '你终于离职了。离的是整个时间线。',
    mood: 'void',
    revealMs: 620,
    lines: [
      { kind: 'narration', text: '椅子消失了。不是摔下来——是工位从你身下被抽走。' },
      { kind: 'narration', text: '楼层数字在视野里乱跳：17 → 404 → ∞。' },
      { kind: 'emphasis', text: '失重。' },
      { kind: 'narration', text: '风里有 PPT 转圈声、老板语音的尾音、收藏夹里三片还没关的标签页。' },
      { kind: 'system', speaker: '打卡机', text: '叮——本时间线今日额度已用尽。感谢您的燃烧。' },
      { kind: 'inner', text: '至少不用回那个「。」了。' },
      {
        kind: 'system',
        speaker: '原世界 · 仍在线',
        text: '显示器还亮着。另一个你趴在桌上，像只是小憩。',
      },
      { kind: 'divider', text: '' },
      { kind: 'narration', text: '黑暗深处，有什么东西一扇一扇亮起来。' },
      { kind: 'narration', text: '三扇门。三种规则。门楣同一行小字：' },
      { kind: 'emphasis', text: '选服后不可回档。' },
    ],
    continueLabel: '靠近那三扇门',
    transitionOut: 'fade-void',
  },
];

/** 序章绑定：点名开局随机珍品伙伴 */
export function companionBindingBeat(companionName: string): PrologueBeat {
  return {
    id: 'p08',
    title: '【绑定】协作单位',
    mood: 'world',
    lines: [
      { kind: 'narration', text: '手里一沉——名册 / 玉符 / 芯片，随你选的世界自动变形。' },
      {
        kind: 'system',
        speaker: '说明书',
        text: `首批锚定完成：【${companionName}】·珍品投影。`,
      },
      {
        kind: 'system',
        speaker: '说明书',
        text: '上阵上限：5。眼下只有你与这位投影——其余席位之后用抽卡补。',
      },
      { kind: 'system', speaker: '说明书', text: '投影不享五险一金。不报销打车。' },
      { kind: 'dialogue', speaker: '你', text: `${companionName}？比工位上那群人靠谱。` },
    ],
    continueLabel: '继续',
  };
}

/** 序章答疑：用开局伙伴举例「你给投影派活」 */
export function whyHistoryBeat(companionName: string): PrologueBeat {
  return {
    id: 'p10',
    title: '【答疑】为何是历史人物？',
    mood: 'world',
    lines: [
      { kind: 'narration', text: '说明书第二页，终于说人话了：' },
      {
        kind: 'system',
        speaker: '系统',
        text: '历史与传说中的强意念，可在裂隙中编译为战斗投影。',
      },
      {
        kind: 'system',
        speaker: '系统',
        text: '你付锚定代价（体力、券、星尘…）。他们付一刀。',
      },
      {
        kind: 'dialogue',
        speaker: '你',
        text: `所以不是老板给我派活，是我给${companionName}派活？`,
      },
      { kind: 'system', speaker: '系统', text: '概念正确。' },
      {
        kind: 'system',
        speaker: '同步说明',
        text: '每通一章，裂隙会向原世界发送一次状态评定——战力与名册，都会算数。',
      },
      { kind: 'emphasis', text: '——欢迎来到：不用写周报的异世界。' },
    ],
    continueLabel: '开整',
  };
}

export const WORLD_PICK_OPTIONS: {
  preset: WorldPreset;
  title: string;
  tagline: string;
  subtitle: string;
  rosterName: string;
}[] = [
  {
    preset: 'wuxia',
    title: '武侠世界',
    tagline: '副本位面 A',
    subtitle: '内力代替咖啡因 · 江湖没有周报',
    rosterName: '江湖异名录（试用版）',
  },
  {
    preset: 'xianxia',
    title: '仙侠世界',
    tagline: '副本位面 B · 推荐',
    subtitle: '御剑通勤 · 天劫比 KPI 好懂',
    rosterName: '劫域命格册',
  },
  {
    preset: 'cyberpunk',
    title: '赛博朋克',
    tagline: '副本位面 C',
    subtitle: '霓虹加班 · 义体可保修',
    rosterName: '魂线档案馆',
  },
];

export const ARRIVAL_BY_PRESET: Record<WorldPreset, ArrivalBeat> = {
  wuxia: {
    place: '江渡驿 · 落地',
    hook: '雨夜。灯笼三晃。有人查岗——查的是你的剑意。',
    mood: 'world',
    lines: [
      { kind: 'narration', text: '雨砸在木栈道上，像无数小号在催稿。' },
      { kind: 'emphasis', text: '江湖异名录（试用版）' },
      { kind: 'narration', text: '远处盾墙排开——不是查码，是查你配不配过江。' },
      { kind: 'dialogue', speaker: '你', text: '行。至少不用填出差申请。' },
    ],
  },
  xianxia: {
    place: '城门驿道 · 落地',
    hook: '灵气入肺。你第一次觉得，空气比咖啡贵。',
    mood: 'world',
    lines: [
      { kind: 'narration', text: '灵雾贴脸，像免费加湿器，但带升级弹窗。' },
      { kind: 'narration', text: '劫域命格册自动翻页，第一个名字亮得有点装。' },
      { kind: 'system', speaker: '关隘', text: '盾墙试阵。先破阵，再谈飞升。' },
      { kind: 'dialogue', speaker: '你', text: '比周一晨会清晰。' },
    ],
  },
  cyberpunk: {
    place: '下层检卡口 · 落地',
    hook: '霓虹把脸切成像素。你的义眼说：订阅已过期。',
    mood: 'world',
    lines: [
      { kind: 'narration', text: '酸雨、广告、警笛——城市在放 mixed 版白噪音。' },
      { kind: 'system', speaker: '芯片', text: 'HISTORICAL_GHOST.exe — max deploy 5' },
      { kind: 'narration', text: '闸机外，安保盾阵算法已上线。' },
      { kind: 'dialogue', speaker: '你', text: '至少比 OA 好看。' },
    ],
  },
};

export const PROLOGUE_SKIP_DEFAULT_PRESET: WorldPreset = 'xianxia';
