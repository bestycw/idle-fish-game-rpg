/**
 * 深做 20 卡：母题 + 招牌改写 + 典故星章。
 * 数值/钩子走能力池；标题必须贴历史，禁止「主属性强化」当终态。
 */
import type { SkillDef } from '../shared/types.js';
import type { StarNodeDef, StarNodeEffect } from './starTypes.js';

type TrackEntry = {
  label: string;
  effects: StarNodeEffect[];
  stack?: boolean;
};

function track(entries: TrackEntry[]): Partial<Record<number, StarNodeDef>> {
  const out: Partial<Record<number, StarNodeDef>> = {};
  entries.forEach((e, i) => {
    const star = i + 1;
    out[star] = { star, label: e.label, effects: e.effects, stack: e.stack };
  });
  return out;
}

/** 覆盖 CORE 技能的展示与机制（id 不变） */
export const DEEP_SKILL_OVERRIDES: Record<string, Partial<SkillDef>> = {
  skill_hero_strike: {
    name: '破妄斩',
    blurb: '对单体造成力系重击，并驱散其一道增益；本场首次施放伤害更高。',
    effects: [{ kind: 'purge' }, { kind: 'first_cast', multiplier: 1.25 }],
  },
  skill_zhangfei_roar: {
    name: '当阳吼',
    blurb: '震慑单体；本场首次施放伤害更高。',
    applyStatus: [{ statusId: 'stun', duration: 1 }],
    effects: [{ kind: 'first_cast', multiplier: 1.4 }],
  },
  skill_zhaoyun_longdan: {
    name: '龙胆枪',
    blurb: '穿透点杀，附加流血；对护盾额外增伤。',
    applyStatus: [{ statusId: 'bleed', duration: 3, layers: 1 }],
    effects: [{ kind: 'vs_shield', multiplier: 1.25 }],
  },
  skill_wukong_sweep: {
    name: '定海神针',
    blurb: '打击目标所在行与列，附加破甲，专克盾墙。',
    targetPattern: 'cross',
    tags: ['aoe', 'damage'],
    multiplier: 1.15,
    applyStatus: [{ statusId: 'shred', duration: 2, value: 0.82 }],
    effects: [{ kind: 'first_cast', multiplier: 1.2 }],
  },
  skill_huatuo_qingnang: {
    name: '青囊济世',
    blurb: '治疗单体并净化减益；目标残血时治疗更强。',
    effects: [
      { kind: 'cleanse' },
      { kind: 'heal_low_hp', value: 0.4, multiplier: 1.35 },
    ],
  },
  skill_houyi_luori: {
    name: '九日尽',
    blurb: '穿透点残血目标，附加流血，猎杀后排脆皮。',
    applyStatus: [{ statusId: 'bleed', duration: 3, layers: 1 }],
    effects: [{ kind: 'execute', value: 0.35, multiplier: 1.35 }],
    focusPolicy: 'lowest_hp',
  },
  skill_heracles_hide: {
    name: '涅墨亚狮皮',
    blurb: '为自己裹上厚实护盾，扛住第一波冲击。',
    effects: [{ kind: 'first_cast', multiplier: 1.15 }],
  },
  skill_zhuge_qimen: {
    name: '借东风',
    blurb: '深破甲并迟滞敌人，为队友撕开铁壁窗口。',
    applyStatus: [
      { statusId: 'shred', duration: 3, value: 0.55 },
      { statusId: 'slow', duration: 2 },
    ],
  },
  skill_baigujing_huagu: {
    name: '化骨绵掌',
    blurb: '横扫前排，扰乱敌方心神（混乱）。',
    applyStatus: [{ statusId: 'havoc', duration: 1 }],
  },
  skill_medusa_gaze: {
    name: '戈耳工凝视',
    blurb: '低伤硬控，将敌人短暂石化（眩晕）。',
    applyStatus: [{ statusId: 'stun', duration: 1 }],
    effects: [{ kind: 'first_cast', multiplier: 1.2 }],
  },
  skill_athena_aegis: {
    name: '神盾恩典',
    blurb: '治疗全体；星章可开净化与结界。',
    effects: [{ kind: 'heal_low_hp', value: 0.45, multiplier: 1.25 }],
  },
  skill_guanyu_slash: {
    name: '温酒青龙',
    blurb: '力系单体重创并流血；本场首次施放锋芒更盛。',
    applyStatus: [{ statusId: 'bleed', duration: 3, layers: 1 }],
    effects: [{ kind: 'first_cast', multiplier: 1.3 }],
  },
  skill_lvbu_wushuang: {
    name: '人中吕布',
    blurb: '极高倍率单体爆发；本场首刀更加凶戾。',
    effects: [{ kind: 'first_cast', multiplier: 1.35 }],
  },
  skill_dianwei_guard: {
    name: '恶来护主',
    blurb: '为自己叠盾死守，换主公一线生机。',
    effects: [{ kind: 'first_cast', multiplier: 1.2 }],
  },
  skill_nezha_arms: {
    name: '风火连枪',
    blurb: '穿透并破甲；身法疾如风火轮。',
    applyStatus: [{ statusId: 'shred', duration: 2, value: 0.85 }],
  },
  skill_daji_charm: {
    name: '九尾狐火',
    blurb: '横扫前排扰乱心神；高星可诱敌狂乱。',
    applyStatus: [{ statusId: 'havoc', duration: 1 }],
  },
  skill_yangjian_blade: {
    name: '天眼破妄',
    blurb: '穿透点残，破甲开路，专打后排。',
    applyStatus: [{ statusId: 'shred', duration: 2, value: 0.8 }],
    focusPolicy: 'lowest_hp',
    effects: [{ kind: 'vs_shield', multiplier: 1.2 }],
  },
  skill_thor_hammer: {
    name: '妙尔尼尔',
    blurb: '横扫前排并震慑；本场首次施放伤害更高。',
    applyStatus: [{ statusId: 'stun', duration: 1 }],
    effects: [{ kind: 'first_cast', multiplier: 1.25 }],
  },
  skill_arthur_oath: {
    name: '石中剑誓',
    blurb: '灵系护盾守御己身；星章可护全队。',
    effects: [{ kind: 'first_cast', multiplier: 1.15 }],
  },
  skill_xishi_chenyu: {
    name: '沉鱼落雁',
    blurb: '低伤使目标沉眠，争取布阵与输出空档。',
    applyStatus: [{ statusId: 'sleep', duration: 2 }],
  },
};

/** 深做星章（★1–★6 数据轨；可玩上限仍按品级截断） */
export const DEEP_STAR_OVERRIDES: Record<string, Partial<Record<number, StarNodeDef>>> = {
  hero: track([
    { label: '问心', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '斩意', effects: [{ kind: 'qi_cost', delta: -5 }] },
    {
      label: '连斩破妄',
      effects: [{ kind: 'enable_follow_up', chance: 0.28, multiplier: 0.6 }],
    },
    { label: '锋砺', effects: [{ kind: 'skill_mult', delta: 0.15 }] },
    {
      label: '再斩',
      effects: [{ kind: 'enable_follow_up', chance: 0.38, multiplier: 0.75 }],
    },
    {
      label: '破妄圆满',
      effects: [
        { kind: 'rating', stat: 'finalDmgRating', value: 10 },
        { kind: 'skill_mult', delta: 0.12 },
      ],
    },
  ]),
  zhangfei: track([
    { label: '燕人虎躯', effects: [{ kind: 'stat_pct', mainPct: 0.04 }] },
    { label: '丈八铁壁', effects: [{ kind: 'rare_stat', stat: 'block', value: 0.04 }] },
    {
      label: '当阳结界',
      effects: [
        { kind: 'effect_unlock', effect: { kind: 'team_shield', multiplier: 0.5 } },
        { kind: 'status_boost', duration: 1 },
      ],
    },
    { label: '长坂骨', effects: [{ kind: 'rating', stat: 'versRating', value: 10 }] },
    {
      label: '震喝三军',
      effects: [
        { kind: 'skill_mult', delta: 0.12 },
        { kind: 'rare_stat', stat: 'block', value: 0.03 },
      ],
    },
    {
      label: '万人敌',
      effects: [
        { kind: 'stat_pct', mainPct: 0.04 },
        { kind: 'effect_unlock', effect: { kind: 'vs_shield', multiplier: 1.35 } },
        { kind: 'effect_unlock', effect: { kind: 'refund_qi_on_kill', value: 0.4 } },
      ],
    },
  ]),
  zhaoyun: track([
    { label: '银枪', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '常山会心', effects: [{ kind: 'rating', stat: 'critRating', value: 8 }] },
    {
      label: '七进七出',
      effects: [
        { kind: 'enable_follow_up', chance: 0.34, multiplier: 0.68 },
        {
          kind: 'status_unlock',
          status: { statusId: 'mark_prey', duration: 2, value: 1.15, chance: 0.7 },
        },
      ],
    },
    { label: '血染长坂', effects: [{ kind: 'status_boost', layers: 1, duration: 1 }] },
    {
      label: '龙胆连刺',
      effects: [{ kind: 'enable_follow_up', chance: 0.42, multiplier: 0.8 }],
    },
    {
      label: '单骑救主',
      effects: [
        { kind: 'rating', stat: 'critDmgRating', value: 10 },
        {
          kind: 'status_unlock',
          status: { statusId: 'mark_prey', duration: 3, value: 1.22 },
        },
        { kind: 'effect_unlock', effect: { kind: 'execute', value: 0.3, multiplier: 1.5 } },
        { kind: 'effect_unlock', effect: { kind: 'refund_qi_on_kill', value: 0.55 } },
      ],
    },
  ]),
  wukong: track([
    { label: '金箍如意', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '筋斗云', effects: [{ kind: 'rare_stat', stat: 'dodge', value: 0.04 }] },
    {
      label: '大闹天宫',
      stack: true,
      effects: [
        { kind: 'rare_stat', stat: 'dodge', value: 0.04 },
        { kind: 'status_boost', valueMult: 0.92, duration: 1 },
      ],
    },
    { label: '棒扫千军', effects: [{ kind: 'skill_mult', delta: 0.15 }] },
    {
      label: '七十二变',
      effects: [{ kind: 'enable_follow_up', chance: 0.32, multiplier: 0.55 }],
    },
    {
      label: '齐天大圣',
      effects: [
        { kind: 'skill_mult', delta: 0.15 },
        { kind: 'rating', stat: 'finalDmgRating', value: 10 },
        { kind: 'effect_unlock', effect: { kind: 'refund_qi_on_kill', value: 0.35 } },
      ],
    },
  ]),
  huatuo: track([
    { label: '五禽戏', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '麻沸散', effects: [{ kind: 'skill_mult', delta: 0.12 }] },
    {
      label: '济元回春',
      effects: [
        { kind: 'effect_unlock', effect: { kind: 'ally_grant_qi', value: 18 } },
        { kind: 'qi_cost', delta: -5 },
      ],
    },
    { label: '青囊精通', effects: [{ kind: 'rating', stat: 'masteryRating', value: 12 }] },
    {
      label: '刮骨疗毒',
      effects: [
        { kind: 'skill_mult', delta: 0.15 },
        { kind: 'effect_unlock', effect: { kind: 'heal_low_hp', value: 0.35, multiplier: 1.55 } },
      ],
    },
    {
      label: '悬壶济世',
      effects: [
        { kind: 'qi_cost', delta: -5 },
        { kind: 'effect_unlock', effect: { kind: 'ally_grant_qi', value: 25 } },
        { kind: 'effect_unlock', effect: { kind: 'team_shield', multiplier: 0.35 } },
      ],
    },
  ]),
  houyi: track([
    { label: '扶桑神射', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '穿杨', effects: [{ kind: 'rating', stat: 'critDmgRating', value: 10 }] },
    {
      label: '落日血痕',
      effects: [
        { kind: 'status_boost', layers: 1, duration: 1 },
        { kind: 'enable_follow_up', chance: 0.28, multiplier: 0.55 },
      ],
    },
    { label: '射日加深', effects: [{ kind: 'skill_mult', delta: 0.15 }] },
    {
      label: '连矢追乌',
      effects: [{ kind: 'enable_follow_up', chance: 0.36, multiplier: 0.65 }],
    },
    {
      label: '九日尽灭',
      effects: [
        { kind: 'rating', stat: 'finalDmgRating', value: 12 },
        { kind: 'effect_unlock', effect: { kind: 'execute', value: 0.28, multiplier: 1.55 } },
        { kind: 'qi_cost', delta: -5 },
      ],
    },
  ]),
  heracles: track([
    { label: '半神体魄', effects: [{ kind: 'stat_pct', mainPct: 0.04 }] },
    { label: '狮皮厚甲', effects: [{ kind: 'rare_stat', stat: 'block', value: 0.05 }] },
    { label: '涅墨亚加厚', effects: [{ kind: 'skill_mult', delta: 0.2 }] },
    { label: '不屈功业', effects: [{ kind: 'rating', stat: 'versRating', value: 12 }] },
    { label: '省力护体', effects: [{ kind: 'qi_cost', delta: -8 }] },
    {
      label: '十二功业',
      effects: [
        { kind: 'rare_stat', stat: 'block', value: 0.04 },
        { kind: 'skill_mult', delta: 0.15 },
        { kind: 'effect_unlock', effect: { kind: 'team_shield', multiplier: 0.4 } },
      ],
    },
  ]),
  zhuge: track([
    { label: '星算', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '八阵精通', effects: [{ kind: 'rating', stat: 'masteryRating', value: 10 }] },
    {
      label: '东风更烈',
      effects: [{ kind: 'status_boost', valueMult: 0.9, duration: 1 }],
    },
    { label: '省策', effects: [{ kind: 'qi_cost', delta: -8 }] },
    {
      label: '锦囊再计',
      effects: [{ kind: 'enable_follow_up', chance: 0.25, multiplier: 0.4 }],
    },
    {
      label: '卧龙出山',
      effects: [
        { kind: 'status_boost', duration: 1, valueMult: 0.9 },
        { kind: 'rating', stat: 'masteryRating', value: 10 },
        {
          kind: 'status_unlock',
          status: { statusId: 'heal_block', duration: 2, chance: 0.5 },
        },
      ],
    },
  ]),
  baigujing: track([
    { label: '白骨森森', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '惑心', effects: [{ kind: 'rating', stat: 'masteryRating', value: 10 }] },
    {
      label: '三打白骨',
      effects: [{ kind: 'status_boost', duration: 1 }],
    },
    { label: '群魇', effects: [{ kind: 'skill_mult', delta: 0.12 }] },
    { label: '省咒', effects: [{ kind: 'qi_cost', delta: -5 }] },
    {
      label: '白骨夫人',
      effects: [
        { kind: 'status_boost', duration: 1 },
        { kind: 'skill_mult', delta: 0.1 },
        {
          kind: 'status_unlock',
          status: { statusId: 'bleed', duration: 2, layers: 1, chance: 0.55 },
        },
      ],
    },
  ]),
  medusa: track([
    { label: '蛇瞳', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '石化锋', effects: [{ kind: 'skill_mult', delta: 0.1 }] },
    {
      label: '凝视延长',
      effects: [{ kind: 'status_boost', duration: 1 }],
    },
    { label: '蛇发之力', effects: [{ kind: 'qi_cost', delta: -8 }] },
    {
      label: '连视',
      effects: [{ kind: 'enable_follow_up', chance: 0.22, multiplier: 0.45 }],
    },
    {
      label: '戈耳工真身',
      effects: [
        { kind: 'status_boost', duration: 1 },
        { kind: 'rating', stat: 'masteryRating', value: 12 },
        {
          kind: 'status_unlock',
          status: { statusId: 'slow', duration: 2, chance: 0.8 },
        },
      ],
    },
  ]),
  athena: track([
    { label: '智慧之光', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '群愈恩典', effects: [{ kind: 'skill_mult', delta: 0.12 }] },
    {
      label: '涤净神恩',
      effects: [{ kind: 'effect_unlock', effect: { kind: 'cleanse' } }],
    },
    { label: '城邦守护', effects: [{ kind: 'rating', stat: 'masteryRating', value: 10 }] },
    { label: '省恩', effects: [{ kind: 'qi_cost', delta: -8 }] },
    {
      label: '雅典娜之盾',
      effects: [
        { kind: 'skill_mult', delta: 0.12 },
        { kind: 'effect_unlock', effect: { kind: 'team_shield', multiplier: 0.45 } },
        { kind: 'rating', stat: 'versRating', value: 8 },
      ],
    },
  ]),
  guanyu: track([
    { label: '青龙偃月', effects: [{ kind: 'stat_pct', mainPct: 0.035 }] },
    { label: '义绝', effects: [{ kind: 'rating', stat: 'finalDmgRating', value: 8 }] },
    {
      label: '过五关',
      effects: [
        { kind: 'status_boost', layers: 1, duration: 1 },
        { kind: 'enable_follow_up', chance: 0.28, multiplier: 0.55 },
      ],
    },
    { label: '武圣锋', effects: [{ kind: 'skill_mult', delta: 0.15 }] },
    {
      label: '拖刀计',
      effects: [{ kind: 'enable_follow_up', chance: 0.36, multiplier: 0.7 }],
    },
    {
      label: '温酒斩华雄',
      effects: [
        { kind: 'rating', stat: 'critDmgRating', value: 10 },
        { kind: 'skill_mult', delta: 0.12 },
        {
          kind: 'status_unlock',
          status: { statusId: 'shred', duration: 2, value: 0.88, chance: 0.7 },
        },
      ],
    },
  ]),
  lvbu: track([
    { label: '方天画戟', effects: [{ kind: 'stat_pct', mainPct: 0.04 }] },
    { label: '赤兔暴戾', effects: [{ kind: 'rating', stat: 'critRating', value: 10 }] },
    {
      label: '辕门射戟',
      effects: [{ kind: 'enable_follow_up', chance: 0.3, multiplier: 0.7 }],
    },
    { label: '弑神', effects: [{ kind: 'skill_mult', delta: 0.2 }] },
    {
      label: '无双再战',
      effects: [{ kind: 'enable_follow_up', chance: 0.4, multiplier: 0.85 }],
    },
    {
      label: '人中吕布',
      effects: [
        { kind: 'rating', stat: 'finalDmgRating', value: 14 },
        { kind: 'effect_unlock', effect: { kind: 'execute', value: 0.25, multiplier: 1.4 } },
        { kind: 'qi_cost', delta: -5 },
      ],
    },
  ]),
  dianwei: track([
    { label: '恶来之躯', effects: [{ kind: 'stat_pct', mainPct: 0.04 }] },
    { label: '死守', effects: [{ kind: 'rare_stat', stat: 'block', value: 0.05 }] },
    { label: '护主盾厚', effects: [{ kind: 'skill_mult', delta: 0.18 }] },
    { label: '双戟厚血', effects: [{ kind: 'rating', stat: 'versRating', value: 10 }] },
    { label: '省力', effects: [{ kind: 'qi_cost', delta: -8 }] },
    {
      label: '古之恶来',
      effects: [
        { kind: 'rare_stat', stat: 'block', value: 0.04 },
        { kind: 'stat_pct', mainPct: 0.05 },
        { kind: 'effect_unlock', effect: { kind: 'team_shield', multiplier: 0.35 } },
      ],
    },
  ]),
  nezha: track([
    { label: '莲花化身', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '风火轮', effects: [{ kind: 'rating', stat: 'hasteRating', value: 10 }] },
    {
      label: '三头六臂',
      effects: [{ kind: 'enable_follow_up', chance: 0.35, multiplier: 0.55 }],
    },
    { label: '火尖加深', effects: [{ kind: 'skill_mult', delta: 0.15 }] },
    {
      label: '六臂连打',
      effects: [{ kind: 'enable_follow_up', chance: 0.45, multiplier: 0.7 }],
    },
    {
      label: '哪吒闹海',
      effects: [
        { kind: 'rare_stat', stat: 'dodge', value: 0.05 },
        { kind: 'skill_mult', delta: 0.12 },
        {
          kind: 'status_unlock',
          status: { statusId: 'bleed', duration: 2, layers: 1, chance: 0.55 },
        },
      ],
    },
  ]),
  daji: track([
    { label: '狐媚', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '朝歌惑阵', effects: [{ kind: 'rating', stat: 'masteryRating', value: 10 }] },
    {
      label: '魅惑延长',
      effects: [{ kind: 'status_boost', duration: 1 }],
    },
    { label: '群惑', effects: [{ kind: 'skill_mult', delta: 0.1 }] },
    { label: '低语', effects: [{ kind: 'qi_cost', delta: -8 }] },
    {
      label: '九尾天狐',
      effects: [
        { kind: 'status_boost', duration: 1 },
        { kind: 'rating', stat: 'masteryRating', value: 12 },
        {
          kind: 'status_unlock',
          status: { statusId: 'berserk', duration: 1, chance: 0.45 },
        },
      ],
    },
  ]),
  yangjian: track([
    { label: '天眼', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '梅山会神', effects: [{ kind: 'rating', stat: 'finalDmgRating', value: 8 }] },
    {
      label: '天眼破甲',
      effects: [{ kind: 'status_boost', valueMult: 0.9, duration: 1 }],
    },
    { label: '三尖锋', effects: [{ kind: 'skill_mult', delta: 0.15 }] },
    {
      label: '哮天连刺',
      effects: [{ kind: 'enable_follow_up', chance: 0.32, multiplier: 0.6 }],
    },
    {
      label: '二郎真君',
      effects: [
        { kind: 'rating', stat: 'critRating', value: 10 },
        { kind: 'qi_cost', delta: -5 },
        {
          kind: 'status_unlock',
          status: { statusId: 'bleed', duration: 2, layers: 1, chance: 0.5 },
        },
        { kind: 'effect_unlock', effect: { kind: 'execute', value: 0.32, multiplier: 1.35 } },
      ],
    },
  ]),
  thor: track([
    { label: '雷神之力', effects: [{ kind: 'stat_pct', mainPct: 0.035 }] },
    { label: '轰鸣', effects: [{ kind: 'rating', stat: 'critRating', value: 8 }] },
    {
      label: '眩雷',
      effects: [{ kind: 'status_boost', duration: 1 }],
    },
    { label: '雷殛', effects: [{ kind: 'skill_mult', delta: 0.15 }] },
    {
      label: '连雷',
      effects: [{ kind: 'enable_follow_up', chance: 0.28, multiplier: 0.5 }],
    },
    {
      label: '雷神之锤',
      effects: [
        { kind: 'skill_mult', delta: 0.12 },
        { kind: 'rating', stat: 'finalDmgRating', value: 10 },
        { kind: 'effect_unlock', effect: { kind: 'vs_shield', multiplier: 1.3 } },
      ],
    },
  ]),
  arthur: track([
    { label: '石中剑', effects: [{ kind: 'stat_pct', mainPct: 0.035 }] },
    { label: '圆桌誓约', effects: [{ kind: 'rare_stat', stat: 'block', value: 0.04 }] },
    {
      label: '王盾结界',
      effects: [
        { kind: 'skill_mult', delta: 0.15 },
        { kind: 'effect_unlock', effect: { kind: 'team_shield', multiplier: 0.45 } },
      ],
    },
    { label: '王气', effects: [{ kind: 'rating', stat: 'versRating', value: 10 }] },
    { label: '省力', effects: [{ kind: 'qi_cost', delta: -8 }] },
    {
      label: '王者归来',
      effects: [
        { kind: 'rare_stat', stat: 'block', value: 0.03 },
        { kind: 'skill_mult', delta: 0.12 },
        { kind: 'effect_unlock', effect: { kind: 'ally_grant_qi', value: 12 } },
      ],
    },
  ]),
  xishi: track([
    { label: '浣纱', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '沉鱼', effects: [{ kind: 'rating', stat: 'masteryRating', value: 10 }] },
    {
      label: '长眠',
      effects: [{ kind: 'status_boost', duration: 1 }],
    },
    { label: '吴越省息', effects: [{ kind: 'qi_cost', delta: -8 }] },
    {
      label: '连惑',
      effects: [{ kind: 'enable_follow_up', chance: 0.22, multiplier: 0.4 }],
    },
    {
      label: '西子捧心',
      effects: [
        { kind: 'status_boost', duration: 1 },
        { kind: 'skill_mult', delta: 0.1 },
        {
          kind: 'status_unlock',
          status: { statusId: 'havoc', duration: 1, chance: 0.4 },
        },
      ],
    },
  ]),
};
