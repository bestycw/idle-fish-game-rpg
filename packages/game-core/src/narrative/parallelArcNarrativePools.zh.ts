/** 弧末简报 · 表驱动变体池（由轴 band + 种子择句，同存档稳定、不同局不同文） */

export type AxisBand = 'low' | 'mid' | 'high';

export function axisBand(value: number, lowMax = 33, midMax = 58): AxisBand {
  if (value < lowMax) return 'low';
  if (value < midMax) return 'mid';
  return 'high';
}

/** grind 越低越好 → 生活舒适度 band */
export function leisureBand(grind: number): AxisBand {
  if (grind >= 60) return 'low';
  if (grind >= 38) return 'mid';
  return 'high';
}

export function hashSeed(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pickFromPool<T>(seedKey: string, pool: readonly T[]): T {
  if (pool.length === 0) throw new Error('empty pool');
  const h = hashSeed(seedKey);
  return pool[h % pool.length]!;
}

export const LIFE_FAMILY: Record<AxisBand, readonly string[]> = {
  low: [
    '饭点来电多半在回「稍等我对齐」；爸妈听得出你累，问完「还熬吗」又憋回去。',
    '客厅灯常亮到半夜，家人学会不敲门——怕撞见你对着屏幕发呆。',
    '回家像换了个 Wi-Fi：人到了，魂还在工位群聊里飘。',
  ],
  mid: [
    '周末能坐回饭桌，中途亮屏两次，但至少没全程抱着笔记本。',
    '妈炖了汤，你喝了两口才回消息；她叹口气：「比上周好。」',
    '家里不再只问加班，开始问「这周能睡够吗」——算是微小进步。',
  ],
  high: [
    '有一晚整晚没开电脑，客厅灯暖着，家里人敢问「最近是不是没那么卷了」。',
    '你主动约了顿家宴，席间手机扣在腿上，只亮了一次。',
    '玄关的鞋摆整齐了，家人说你脸色不像刚下班的鬼。',
  ],
};

export const LIFE_FUN: Record<AxisBand, readonly string[]> = {
  low: [
    '娱乐只剩碎片：短视频、手游半场、漫画看不完一章就被 @；睡眠像借来的。',
    '想打一局排位，开局三分钟就被「紧急」拽走；爱好退化成背景音。',
    '剧追到一半睡着，醒来发现还在工位——梦和班味搅在一起。',
  ],
  mid: [
    '游戏能打满一局，剧能追两集；不算尽兴，但不再全是后台挂着工位。',
    '周末打了两小时联机，虽被消息打断两次，好歹算「玩过」。',
    '收藏夹里的番终于少了一格；娱乐从奢侈品变回零食。',
  ],
  high: [
    '爱好占回沙发一角——打球、追剧、联机，像给活人留的时间，不是 KPI 缓冲带。',
    '你久违地通关了一章单机，关机时窗外天还没亮，但心里是亮的。',
    '娱乐日历上多了两个勾：一场球、一场 live；班味洗不掉，但能冲淡。',
  ],
};

export const LIFE_MOOD: Record<AxisBand, readonly string[]> = {
  low: [
    '情绪带回家只剩「别惹我」；室友学会了绕着你走。',
    '一回家就装死，家人说你像行走的勿扰模式。',
  ],
  mid: [
    '没那么易怒，回家会先洗手喝水，再摸手机——像给自己缓冲带。',
    '偶尔能聊两句非工作的事，家人说你「像回来了」。',
  ],
  high: [
    '情绪带回客厅：会笑、会接梗，家人说你脸色好了一档。',
    '你能把异界的硬气翻译成「今晚不加班」，家里听得懂。',
  ],
};

export const WORK_PEERS: Record<AxisBand, readonly string[]> = {
  low: [
    '同事默认你是兜底位：@ 一来，屎盆子先扣桌上；对齐时少人替你说话。',
    '群里的「辛苦啦」从不 @ 你；背锅倒是条件反射。',
  ],
  mid: [
    '小群有人抄你排期模板，私聊问「这块你真懂」；甩锅时你是第二个名字。',
    '对齐会上有人接你半句，把结论补完——信任在慢热。',
  ],
  high: [
    '跨组默认「这块问他」；甩锅豁免权比夸奖实在。',
    '老板问进度时，同事会先提你上周的交付——罕见。',
  ],
};

export const WORK_BOSS: Record<string, readonly string[]> = {
  tight_weak: [
    '领导握着审批、排期、群聊三板斧；拒绝话在输入框打转，发不出去。',
    '「紧急」「对齐」「再改一版」轮番上；桎梏还在，你只是学会了在异界破阵这个词。',
  ],
  tight_firm: [
    '领导还想 KPI 箍人，原身开始回「需排期」「今日已满」——没碎，但不窒息了。',
    '老板语音变长，你回得更短；桎梏松扣，还在手腕上晃。',
  ],
  loose_firm: [
    '「随手加一项」被挡在流程外；敢留语音不回文字，敢准时关屏。',
    '会议邀请敢点「暂定」；领导不习惯，但排期里有了你的名字而不是只有响应速度。',
  ],
  default: [
    '班味仍呛，领导仍用会议造紧迫感；夹缝里能留一条自己的排期。',
    'KPI 还在，但你不再 24h 在线待命——算平局。',
  ],
  firm_high: [
    '上层想甩锅，原身挂回「需求不清」「资源不足」——桎梏从脖子退到手腕。',
  ],
};

export const WORK_VISIBLE: Record<AxisBand, readonly string[]> = {
  low: [
    '复盘里名字常被跳过，功劳像漏网的水。',
    '周报没亮点，存在感比工位绿植还淡。',
  ],
  mid: [
    '负责的一块被单独点名——从纯背锅位挪了半步，交付有迹可循。',
    '业务会上你能答上来两个问题；不算出头，但不透明了。',
  ],
  high: [
    '复盘记成「这周唯一能推进的人」；异界里程碑终于落在纸面上。',
    '里程碑表上多了你的名字，老板念出来时没加「但是」。',
  ],
};

export const PROMOTION: Record<AxisBand, readonly string[]> = {
  low: [
    '头衔薪水照旧；变化藏在分工里，不写在任命书上。',
    '晋升传闻与你无关，像隔壁组的八卦。',
  ],
  mid: [
    '绩效面谈多了「可承担更大 scope」——软晋升，但算数。',
    'HR 邮件里「发展」二字开始和你同屏出现。',
  ],
  high: [
    '职级讨论里你从「待定」挪进「可提名」；临门一脚还差口气。',
    '调任/晋升传闻落到纸面，HR 问「明年意向」——不是爽文，是流程动了。',
  ],
};

export const DELTA_GRIND_DOWN: readonly string[] = [
  '生活：下班时间更像自己的——敢关机、敢让群静音一整晚。',
  '闲暇：周末少了一场「临时对齐」，沙发终于记得你的体重。',
  '睡眠：闹钟响时不像被掐醒，像真的睡过。',
];

export const DELTA_GRIND_UP: readonly string[] = [
  '生活：周末又被「临时对齐」切碎，娱乐与睡眠缩水。',
  '班味回流：外卖盒堆回书桌，客厅又成第二工位。',
];

export const DELTA_GRIT_UP: readonly string[] = [
  '家庭边界：催婚催生盘问，更能留一句「这周真不行」。',
  '硬气回家：对亲戚局敢找借口溜，不必次次到场。',
];

export const DELTA_BACKUP_UP: readonly string[] = [
  '同事风向：甩锅时不再总是第一个名字。',
  '后援：私聊里「这块问你」变多了。',
];

export const DELTA_RES_UP: readonly string[] = [
  '工作与晋升：述职多了一行能写的成果，提名叙事有人接。',
  '同频：异界推进终于被人看见，不再只活在聊天记录里。',
];

export const DELTA_NEUTRAL: readonly string[] = [
  '相较上一段：变化不大，但裂隙还在——异界每推进一步，原世界晚半步跟上。',
  '相较上一段：局面像原地踏步，细处却有纹路——只有你自己摸得到。',
];

export const ODD_CHAPTER_PULSE: readonly string[] = [
  '单章通关，原世界只颤了一下：消息红点多了，但还没到改写人生的时候。',
  '信道微跳——家里没人察觉，只有你自己觉得「那边动了一下」。',
  '进度同步中：班味没散，但异界推来的力气，开始能摸到了。',
];

export const MAINLINE_DEFEAT_RIPPLE: readonly string[] = [
  '异界这一仗没顶住，原世界也跟着露怯：会上你没能把锅甩回去。',
  '阵脚乱了，映射到工位：老板随口加的活，你这次只能先「收到」。',
  '战败像规略老板失败——硬气缩了一截，班味又浓了一点。',
  '裂隙抖动，家里来电时你语气又软了，像怕现实也跟着崩盘。',
  '同频跌了一档：你刚在异界退的那半步，原世界立刻记进周报风险项。',
];

export const MAINLINE_DEFEAT_BOSS_RIPPLE: readonly string[] = [
  '最后一阵没守住，像汇报前被老板当众问穿——原世界硬气直接矮半截。',
  'Boss 战崩盘映射成「这版需求你扛不住」：锅扣实了，班味飙上来。',
  '规略彻底失败：会上你准备的反驳全噎回去，只能点头。',
];

export const ARC1_BASELINE: readonly string[] = [
  '裂隙刚连上，尚无上一段对照。班味、家庭电话、碎片娱乐仍是基线——异界第一次推进，会从这里留痕。',
  '信道刚稳定，原世界还是熟悉的配方：加班、外卖、消息红点。对照从这次结算才开始写。',
];
