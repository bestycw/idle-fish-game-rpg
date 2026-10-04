/**
 * 内置「小说类型」主题（Novel Frame）· 供序章选择与 Story Gen Skill 扩写
 */

import type {
  NarrativeBondLine,
  NarrativeControlPoints,
  NarrativeFortuneArc,
  NarrativeHeroEdge,
  NarrativeLens,
  NarrativePressureTone,
  NovelFrameId,
  WorldPreset,
} from '../shared/types.js';

/** Skill 扩写用的最小 bible 种子（非完整 overlay） */
export interface NovelFrameSeed {
  /** 主角在这类小说里的默认身份 */
  heroRole: string;
  /** 2～4 个势力/场景锚点 */
  anchors: string[];
  /** 必用意象/词（Skill 优先） */
  lexiconHints: string[];
  /** 禁用混进来的其它类型词 */
  avoidMixing: string[];
  /** 名册投影在此 Frame 下的称呼规则一句 */
  rosterHook: string;
}

export interface NovelFrameDef {
  id: NovelFrameId;
  preset: WorldPreset;
  title: string;
  tagline: string;
  pitch: string;
  seed: NovelFrameSeed;
}

export const BOND_LINE_LABEL: Record<NarrativeBondLine, string> = {
  bond_solo: '独线，名分为主',
  bond_slow: '慢热，阵上才熟',
  bond_warm: '羁绊多写一笔',
};

export const FORTUNE_ARC_LABEL: Record<NarrativeFortuneArc, string> = {
  fortune_uphill: '先抑后扬',
  fortune_even: '稳扎稳打',
  fortune_roller: '大起大落',
};

export const HERO_EDGE_LABEL: Record<NarrativeHeroEdge, string> = {
  edge_banter: '嘴碎不怂',
  edge_stoic: '少话硬扛',
  edge_warm: '温厚会操心',
};

export const NARRATIVE_LENS_LABEL: Record<NarrativeLens, string> = {
  lens_blade: '刀光场面',
  lens_bond: '人情世故',
  lens_riddle: '谜团线索',
};

export const PRESSURE_TONE_LABEL: Record<NarrativePressureTone, string> = {
  pressure_life: '命悬一线',
  pressure_honor: '信誉名分',
  pressure_hush: '日常暗流',
};

export const NOVEL_FRAMES: NovelFrameDef[] = [
  {
    id: 'wuxia_escort',
    preset: 'wuxia',
    title: '天下镖局',
    tagline: '护银、劫道、信誉',
    pitch: '走镖路上全是人情与刀；每一战都像在护一条不能断的线。',
    seed: {
      heroRole: '新入镖局的趟子手',
      anchors: ['总镖头', '暗标', '劫道山寨'],
      lexiconHints: ['镖银', '趟子', '暗桩', '信义'],
      avoidMixing: ['厂卫', '诏狱', '飞剑', '灵根'],
      rosterHook: '投影多写成「走镖旧识」或「被劫过的江湖名宿」。',
    },
  },
  {
    id: 'wuxia_wanderer',
    preset: 'wuxia',
    title: '浪子酒旗',
    tagline: '消息、欠情、随手救人',
    pitch: '酒馆里听风，路上还人情；没有门派也能闯出姓名。',
    seed: {
      heroRole: '挂无牌酒旗的过客',
      anchors: ['说书台', '欠情簿', '夜路劫'],
      lexiconHints: ['酒旗', '风闻', '还情', '路数'],
      avoidMixing: ['朝堂密档', '元婴', '公司合约'],
      rosterHook: '投影像「曾同桌喝过一碗酒」的旧交。',
    },
  },
  {
    id: 'wuxia_sect_case',
    preset: 'wuxia',
    title: '门墙旧案',
    tagline: '被逐、查冤、剑还名分',
    pitch: '师门规矩压人，但案卷里藏着真相；破阵是为了把名字写回去。',
    seed: {
      heroRole: '被除名的外门弟子',
      anchors: ['戒律堂', '旧案卷', '同门冷眼'],
      lexiconHints: ['门规', '除名', '洗冤', '剑谱'],
      avoidMixing: ['镖银', '灵脉', '黑客'],
      rosterHook: '投影多为「当年案卷里的证人或对手」。',
    },
  },
  {
    id: 'wuxia_board_game',
    preset: 'wuxia',
    title: '借势行棋',
    tagline: '江湖人为子，局外有人落子',
    pitch: '明面是擂台与帮派，暗里是借刀杀人；你要在棋盘上赢，不是当棋子。',
    seed: {
      heroRole: '被卷入局中的无名刀客',
      anchors: ['棋社', '替罪羊', '换命契'],
      lexiconHints: ['落子', '借势', '局外手', '换命'],
      avoidMixing: ['纯镖局', '天劫', '直播'],
      rosterHook: '投影写成「某一手棋的变数」。',
    },
  },
  {
    id: 'wuxia_river_shed',
    preset: 'wuxia',
    title: '江口孤篷',
    tagline: '私渡、暗哨、水脉',
    pitch: '江上比岸更危险；每一篙都可能是最后一篙。',
    seed: {
      heroRole: '守渡口的撑篷客',
      anchors: ['私渡价', '水匪哨', '沉船 rumor'],
      lexiconHints: ['孤篷', '私渡', '水脉', '暗哨'],
      avoidMixing: ['灵根', '弹幕', '镖银'],
      rosterHook: '投影像「水上旧债或同渡客」。',
    },
  },
  {
    id: 'wuxia_forged_case',
    preset: 'wuxia',
    title: '金身疑案',
    tagline: '佛窟、铸像、贪墨',
    pitch: '寺里金身新铸，人心却先腐；刀为真相，也为活人。',
    seed: {
      heroRole: '来寺挂单的游方客',
      anchors: ['铸像坊', '功德簿', '空龛'],
      lexiconHints: ['金身', '功德', '贪墨', '空龛'],
      avoidMixing: ['跑刀', '天劫', '战队'],
      rosterHook: '投影写成「当年造像或查案的见证」。',
    },
  },
  {
    id: 'wuxia_snow_letter',
    preset: 'wuxia',
    title: '雪山送帖',
    tagline: '请柬、毒帖、大会',
    pitch: '一封帖子上山，半座江湖下山；你送的是帖，也是命。',
    seed: {
      heroRole: '替人送帖的脚夫',
      anchors: ['请柬', '毒帖', '论剑台'],
      lexiconHints: ['请柬', '毒帖', '论剑', '风雪'],
      avoidMixing: ['协议栈', '灵脉席', '经纪'],
      rosterHook: '投影是「收帖人或帖上无名氏」。',
    },
  },
  {
    id: 'wuxia_medicine_oath',
    preset: 'wuxia',
    title: '药谷换命',
    tagline: '以伤换功、毒疗',
    pitch: '药谷不讲侠义，只讲换命；每一味药都欠一条命。',
    seed: {
      heroRole: '药谷试药的外来客',
      anchors: ['毒疗池', '换命契', '谷主'],
      lexiconHints: ['换命', '毒疗', '药谷', '试药'],
      avoidMixing: ['殁网', '剑冢', '赞助墙'],
      rosterHook: '投影像「被药谷救过或害过的人」。',
    },
  },
  {
    id: 'xianxia_trialheart',
    preset: 'xianxia',
    title: '劫域试心',
    tagline: '天劫、心魔、破境',
    pitch: '劫火压顶，心魔比妖更吵；每一关都是问心，不是问剑。',
    seed: {
      heroRole: '刚被裂隙扔进劫域的散修',
      anchors: ['心魔镜', '劫云', '破境台'],
      lexiconHints: ['劫火', '问心', '破境', '心魔'],
      avoidMixing: ['镖局', '战队合约', '厂卫'],
      rosterHook: '投影是「前世因果或心魔所化之相」。',
    },
  },
  {
    id: 'xianxia_guardtown',
    preset: 'xianxia',
    title: '人间镇守',
    tagline: '小镇妖祸，慢慢抬头',
    pitch: '下界烟火还在，妖祸已至；先守一镇，再谈飞升。',
    seed: {
      heroRole: '镇守小镇的练气修士',
      anchors: ['镇妖井', '夜啼', '乡绅请愿'],
      lexiconHints: ['镇守', '妖祸', '烟火', '升表'],
      avoidMixing: ['剑冢', '八角笼', '镖银'],
      rosterHook: '投影像「镇上供奉或旧日除妖人」。',
    },
  },
  {
    id: 'xianxia_swordhall',
    preset: 'xianxia',
    title: '剑冢无名',
    tagline: '古剑、认主、剑意',
    pitch: '剑冢里无名剑多，认主的一口少；你练的是剑，也是自己的名。',
    seed: {
      heroRole: '剑冢扫尘的杂役弟子',
      anchors: ['剑冢', '认主', '剑意残响'],
      lexiconHints: ['剑意', '认主', '剑鸣', '尘剑'],
      avoidMixing: ['灵脉争席', '跑刀', '门规除名'],
      rosterHook: '投影写成「剑上残念或旧主」。',
    },
  },
  {
    id: 'xianxia_seat_fight',
    preset: 'xianxia',
    title: '灵脉争席',
    tagline: '长老博弈，席位即命',
    pitch: '灵脉有限，席位更有限；斗法是人情，也是规矩。',
    seed: {
      heroRole: '候补内门弟子',
      anchors: ['灵脉图', '长老席', '候补榜'],
      lexiconHints: ['灵脉', '席位', '候补', '斗法'],
      avoidMixing: ['剑冢', '酒旗', '殁网'],
      rosterHook: '投影是「争席对手或背后靠山」。',
    },
  },
  {
    id: 'xianxia_alchemy_oath',
    preset: 'xianxia',
    title: '丹炉誓约',
    tagline: '破誓、毒丹、反噬',
    pitch: '丹成一念，誓破一夜；炉里炼的不只是药。',
    seed: {
      heroRole: '守炉的记名弟子',
      anchors: ['丹炉', '誓印', '反噬痕'],
      lexiconHints: ['丹誓', '反噬', '炉温', '记名'],
      avoidMixing: ['跑刀', '走镖', '笼赛'],
      rosterHook: '投影是「曾共炉或夺丹之人」。',
    },
  },
  {
    id: 'xianxia_beast_register',
    preset: 'xianxia',
    title: '异兽名簿',
    tagline: '镇兽、取名、契约',
    pitch: '兽有名则驯，名错则反噬；你记的是簿，也是命。',
    seed: {
      heroRole: '名簿院的抄录生',
      anchors: ['名簿', '镇兽桩', '误名'],
      lexiconHints: ['名簿', '镇兽', '契约', '误名'],
      avoidMixing: ['私渡', '教典', '镖银'],
      rosterHook: '投影写成「兽主或曾镇之兽相」。',
    },
  },
  {
    id: 'xianxia_cloud_convoy',
    preset: 'xianxia',
    title: '云上护送',
    tagline: '灵舟、仙苗、劫云',
    pitch: '灵舟行于劫云之间；护一人如护一宗未来。',
    seed: {
      heroRole: '灵舟副桨',
      anchors: ['劫云', '仙苗', '舟契'],
      lexiconHints: ['灵舟', '仙苗', '劫云', '桨位'],
      avoidMixing: ['八角笼', '棋社', '记忆当铺'],
      rosterHook: '投影是「舟上旧客或劫云里的影」。',
    },
  },
  {
    id: 'xianxia_mirror_trial',
    preset: 'xianxia',
    title: '心镜幻境',
    tagline: '幻境、旧我、问心',
    pitch: '镜里人比你更懂你的怯；破境先破镜。',
    seed: {
      heroRole: '误入心镜的试炼者',
      anchors: ['心镜', '旧我', '幻境层'],
      lexiconHints: ['心镜', '幻境', '旧我', '问心'],
      avoidMixing: ['赞助', '走镖', '殁网'],
      rosterHook: '投影像「镜中倒影或心魔所借之形」。',
    },
  },
  {
    id: 'cyber_runner',
    preset: 'cyberpunk',
    title: '债务跑刀',
    tagline: '接单、跑路、还不完的账',
    pitch: '下层霓虹里，合约比刀快；你跑的不是路，是倒计时。',
    seed: {
      heroRole: '欠账的独立跑刀手',
      anchors: ['合约终端', '追债无人机', '黑市换码'],
      lexiconHints: ['跑刀', '合约', '倒计时', '换码'],
      avoidMixing: ['剑冢', '镖银', '天劫'],
      rosterHook: '投影是「同队佣兵或曾毁约的雇主」。',
    },
  },
  {
    id: 'cyber_team_contract',
    preset: 'cyberpunk',
    title: '战队挂靠',
    tagline: '名分、赞助、队内政治',
    pitch: '挂上战队才有排面；赞助方笑脸背后都是条款。',
    seed: {
      heroRole: '新签替补的战队成员',
      anchors: ['赞助墙', '队内频道', '条款附件'],
      lexiconHints: ['挂靠', '赞助', '替补', '条款'],
      avoidMixing: ['剑意', '走镖', '心魔'],
      rosterHook: '投影写成「队内核心或转会绯闻对象」。',
    },
  },
  {
    id: 'cyber_dead_protocol',
    preset: 'cyberpunk',
    title: '殁网教典',
    tagline: '旧协议、数据邪教、失传栈',
    pitch: '有人 worship 死掉的网络；你捡到的协议片段会反噬。',
    seed: {
      heroRole: '打捞旧栈的 freelance',
      anchors: ['殁网节点', '教典片段', '栈溢出怪'],
      lexiconHints: ['殁网', '协议', '栈', '教典'],
      avoidMixing: ['八角笼', '灵脉', '镖局'],
      rosterHook: '投影像「教典里记录的数字幽灵」。',
    },
  },
  {
    id: 'cyber_pit_fame',
    preset: 'cyberpunk',
    title: '笼中成名',
    tagline: '地下格斗、流量、镜头',
    pitch: '八角笼上赢一场，弹幕里多一万个债主；名气是另一张合约。',
    seed: {
      heroRole: '地下笼赛新人',
      anchors: ['八角笼', '弹幕', '经纪条款'],
      lexiconHints: ['笼赛', '弹幕', '经纪', '流量'],
      avoidMixing: ['殁网教典', '剑冢', '走镖'],
      rosterHook: '投影是「陪练或宿敌选手」。',
    },
  },
  {
    id: 'cyber_memory_pawn',
    preset: 'cyberpunk',
    title: '记忆当铺',
    tagline: '当记忆、买童年',
    pitch: '记忆能当能买；当铺老板记得比你更清楚你是谁。',
    seed: {
      heroRole: '刚当掉一段记忆的债务人',
      anchors: ['当铺柜', '记忆条', '伪造童年'],
      lexiconHints: ['当铺', '记忆条', '赎回', '伪造'],
      avoidMixing: ['剑意', '药谷', '论剑'],
      rosterHook: '投影是「被当掉记忆里的人」。',
    },
  },
  {
    id: 'cyber_rail_commune',
    preset: 'cyberpunk',
    title: '轨下社群',
    tagline: '废轨、互助、黑电',
    pitch: '城在头上，活在轨下；互助网比公司合约靠得住。',
    seed: {
      heroRole: '轨下互助网接线员',
      anchors: ['废轨', '黑电', '互助频'],
      lexiconHints: ['轨下', '互助', '黑电', '接线'],
      avoidMixing: ['灵脉', '佛窟', '心镜'],
      rosterHook: '投影是「社群里的老手或债主」。',
    },
  },
  {
    id: 'cyber_synthetic_faces',
    preset: 'cyberpunk',
    title: '合成人格',
    tagline: '多脸、多号、切换',
    pitch: '一张脸一个身份；错切一次，全城追杀。',
    seed: {
      heroRole: '持多套合成人格的接单者',
      anchors: ['人格槽', '错切', '全城通辑'],
      lexiconHints: ['合成人格', '错切', '身份槽', '通辑'],
      avoidMixing: ['镖局', '丹炉', '雪山帖'],
      rosterHook: '投影写成「某一号身份下的旧识」。',
    },
  },
  {
    id: 'cyber_neon_sermon',
    preset: 'cyberpunk',
    title: '霓虹布道',
    tagline: '街头信仰、广告神',
    pitch: '广告即经咒，屏幕即祭坛；信的是品牌，怕的是下架。',
    seed: {
      heroRole: '不信教却接活的街头导游',
      anchors: ['广告神龛', '下架恐惧', '布道屏'],
      lexiconHints: ['布道', '广告神', '下架', '霓虹经'],
      avoidMixing: ['剑冢', '名簿院', '私渡'],
      rosterHook: '投影像「某教派 KPI 里的名人脸」。',
    },
  },
];

const FRAME_BY_ID = new Map(NOVEL_FRAMES.map((f) => [f.id, f]));

export function getNovelFrame(id: NovelFrameId): NovelFrameDef {
  const f = FRAME_BY_ID.get(id);
  if (!f) throw new Error(`Unknown novel frame: ${id}`);
  return f;
}

export function novelFramesForPreset(preset: WorldPreset): NovelFrameDef[] {
  return NOVEL_FRAMES.filter((f) => f.preset === preset);
}

export function defaultNovelFrameId(preset: WorldPreset): NovelFrameId {
  const list = novelFramesForPreset(preset);
  return list[0]!.id;
}

export function frameMatchesPreset(id: NovelFrameId, preset: WorldPreset): boolean {
  if (!FRAME_BY_ID.has(id)) return false;
  return getNovelFrame(id).preset === preset;
}

export function isNovelFrameId(id: string): id is NovelFrameId {
  return FRAME_BY_ID.has(id as NovelFrameId);
}

export const DEFAULT_NARRATIVE_CONTROL: NarrativeControlPoints = {
  bondLine: 'bond_slow',
  fortuneArc: 'fortune_uphill',
  heroEdge: 'edge_banter',
  narrativeLens: 'lens_blade',
  pressureTone: 'pressure_honor',
};
