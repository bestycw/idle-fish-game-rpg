/**
 * 深做 20 卡：母题 + 招牌改写 + 典故星章。
 * 数值/钩子走能力池；标题必须贴历史，禁止「主属性强化」当终态。
 */
import type { SkillDef } from '../shared/types.js';
import type { StarBranchDef, StarNodeDef, StarNodeEffect } from './starTypes.js';

type TrackEntry = {
  label: string;
  effects: StarNodeEffect[];
  stack?: boolean;
  branches?: StarBranchDef[];
};

function track(entries: TrackEntry[]): Partial<Record<number, StarNodeDef>> {
  const out: Partial<Record<number, StarNodeDef>> = {};
  entries.forEach((e, i) => {
    const star = i + 1;
    out[star] = {
      star,
      label: e.label,
      effects: e.effects,
      stack: e.stack,
      branches: e.branches,
    };
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
      label: '破妄岔路',
      effects: [],
      branches: [
        {
          id: 'combo',
          label: '连斩破妄',
          effects: [{ kind: 'enable_follow_up', chance: 0.28, multiplier: 0.6 }],
        },
        {
          id: 'burst',
          label: '一刀入魂',
          effects: [
            { kind: 'skill_mult', delta: 0.2 },
            { kind: 'effect_unlock', effect: { kind: 'first_cast', multiplier: 1.35 } },
          ],
        },
      ],
    },
    { label: '锋砺', effects: [{ kind: 'skill_mult', delta: 0.15 }] },
    {
      label: '再斩',
      effects: [{ kind: 'enable_follow_up', chance: 0.38, multiplier: 0.75 }],
    },
    {
      label: '破妄圆满',
      effects: [],
      branches: [
        {
          id: 'relentless',
          label: '无尽追斩',
          effects: [
            { kind: 'rating', stat: 'finalDmgRating', value: 10 },
            { kind: 'enable_follow_up', chance: 0.15, multiplier: 0.5 },
          ],
        },
        {
          id: 'purge',
          label: '万法皆空',
          effects: [
            { kind: 'skill_mult', delta: 0.18 },
            { kind: 'effect_unlock', effect: { kind: 'purge' } },
            { kind: 'rating', stat: 'critDmgRating', value: 10 },
          ],
        },
      ],
    },
  ]),
  zhangfei: track([
    { label: '燕人虎躯', effects: [{ kind: 'stat_pct', mainPct: 0.04 }] },
    { label: '丈八铁壁', effects: [{ kind: 'rare_stat', stat: 'block', value: 0.04 }] },
    {
      label: '当阳岔路',
      effects: [{ kind: 'status_boost', duration: 1 }],
      branches: [
        {
          id: 'bulwark',
          label: '当阳结界',
          effects: [
            { kind: 'effect_unlock', effect: { kind: 'team_shield', multiplier: 0.5 } },
          ],
        },
        {
          id: 'roar',
          label: '怒吼震桥',
          effects: [
            { kind: 'skill_mult', delta: 0.15 },
            { kind: 'status_unlock', status: { statusId: 'slow', duration: 1, chance: 0.6 } },
          ],
        },
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
      effects: [{ kind: 'stat_pct', mainPct: 0.04 }],
      branches: [
        {
          id: 'fortress',
          label: '铁壁万人',
          effects: [
            { kind: 'effect_unlock', effect: { kind: 'team_shield', multiplier: 0.4 } },
            { kind: 'rare_stat', stat: 'block', value: 0.05 },
          ],
        },
        {
          id: 'berserk',
          label: '暴走蛇矛',
          effects: [
            { kind: 'effect_unlock', effect: { kind: 'vs_shield', multiplier: 1.35 } },
            { kind: 'effect_unlock', effect: { kind: 'refund_qi_on_kill', value: 0.4 } },
          ],
        },
      ],
    },
  ]),
  zhaoyun: track([
    { label: '银枪', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '常山会心', effects: [{ kind: 'rating', stat: 'critRating', value: 8 }] },
    {
      label: '七进七出',
      effects: [],
      branches: [
        {
          id: 'rush',
          label: '七进七出·突阵',
          effects: [
            { kind: 'enable_follow_up', chance: 0.34, multiplier: 0.68 },
            { kind: 'status_unlock', status: { statusId: 'mark_prey', duration: 2, value: 1.15, chance: 0.7 } },
          ],
        },
        {
          id: 'crit',
          label: '七进七出·会心',
          effects: [
            { kind: 'rating', stat: 'critRating', value: 12 },
            { kind: 'rating', stat: 'critDmgRating', value: 8 },
          ],
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
      effects: [{ kind: 'rating', stat: 'critDmgRating', value: 10 }],
      branches: [
        {
          id: 'hunt',
          label: '单骑·猎杀',
          effects: [
            { kind: 'effect_unlock', effect: { kind: 'execute', value: 0.3, multiplier: 1.5 } },
            { kind: 'effect_unlock', effect: { kind: 'refund_qi_on_kill', value: 0.55 } },
          ],
        },
        {
          id: 'mark',
          label: '单骑·标靶',
          effects: [
            { kind: 'status_unlock', status: { statusId: 'mark_prey', duration: 3, value: 1.22 } },
            { kind: 'enable_follow_up', chance: 0.15, multiplier: 0.5 },
          ],
        },
      ],
    },
  ]),
  wukong: track([
    { label: '金箍如意', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '筋斗云', effects: [{ kind: 'rare_stat', stat: 'dodge', value: 0.04 }] },
    {
      label: '大闹天宫',
      stack: true,
      effects: [],
      branches: [
        {
          id: 'evade',
          label: '大闹·腾云',
          effects: [
            { kind: 'rare_stat', stat: 'dodge', value: 0.06 },
            { kind: 'status_boost', valueMult: 0.92, duration: 1 },
          ],
        },
        {
          id: 'shred',
          label: '大闹·碎甲',
          effects: [
            { kind: 'status_boost', valueMult: 0.88 },
            { kind: 'skill_mult', delta: 0.12 },
          ],
        },
      ],
    },
    { label: '棒扫千军', effects: [{ kind: 'skill_mult', delta: 0.15 }] },
    {
      label: '七十二变',
      effects: [{ kind: 'enable_follow_up', chance: 0.32, multiplier: 0.55 }],
    },
    {
      label: '齐天大圣',
      effects: [{ kind: 'rating', stat: 'finalDmgRating', value: 10 }],
      branches: [
        {
          id: 'rampage',
          label: '齐天·横扫',
          effects: [
            { kind: 'skill_mult', delta: 0.2 },
            { kind: 'effect_unlock', effect: { kind: 'refund_qi_on_kill', value: 0.35 } },
          ],
        },
        {
          id: 'immortal',
          label: '齐天·不灭',
          effects: [
            { kind: 'rare_stat', stat: 'dodge', value: 0.06 },
            { kind: 'rare_stat', stat: 'lifesteal', value: 0.06 },
          ],
        },
      ],
    },
  ]),
  huatuo: track([
    { label: '五禽戏', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '麻沸散', effects: [{ kind: 'skill_mult', delta: 0.12 }] },
    {
      label: '济元岔路',
      effects: [{ kind: 'qi_cost', delta: -5 }],
      branches: [
        {
          id: 'qi',
          label: '济元回春',
          effects: [
            { kind: 'effect_unlock', effect: { kind: 'ally_grant_qi', value: 18 } },
          ],
        },
        {
          id: 'heal',
          label: '济世深愈',
          effects: [
            { kind: 'skill_mult', delta: 0.18 },
            { kind: 'effect_unlock', effect: { kind: 'heal_low_hp', value: 0.4, multiplier: 1.4 } },
          ],
        },
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
      effects: [{ kind: 'qi_cost', delta: -5 }],
      branches: [
        {
          id: 'guardian',
          label: '悬壶·结界',
          effects: [
            { kind: 'effect_unlock', effect: { kind: 'team_shield', multiplier: 0.4 } },
            { kind: 'effect_unlock', effect: { kind: 'ally_grant_qi', value: 20 } },
          ],
        },
        {
          id: 'purify',
          label: '悬壶·净世',
          effects: [
            { kind: 'effect_unlock', effect: { kind: 'cleanse' } },
            { kind: 'effect_unlock', effect: { kind: 'ally_grant_qi', value: 28 } },
          ],
        },
      ],
    },
  ]),
  houyi: track([
    { label: '扶桑神射', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '穿杨', effects: [{ kind: 'rating', stat: 'critDmgRating', value: 10 }] },
    {
      label: '落日岔路',
      effects: [],
      branches: [
        {
          id: 'bleed',
          label: '落日血痕',
          effects: [
            { kind: 'status_boost', layers: 1, duration: 1 },
            { kind: 'enable_follow_up', chance: 0.28, multiplier: 0.55 },
          ],
        },
        {
          id: 'snipe',
          label: '落日穿心',
          effects: [
            { kind: 'rating', stat: 'critRating', value: 12 },
            { kind: 'effect_unlock', effect: { kind: 'execute', value: 0.3, multiplier: 1.3 } },
          ],
        },
      ],
    },
    { label: '射日加深', effects: [{ kind: 'skill_mult', delta: 0.15 }] },
    {
      label: '连矢追乌',
      effects: [{ kind: 'enable_follow_up', chance: 0.36, multiplier: 0.65 }],
    },
    {
      label: '九日尽灭',
      effects: [{ kind: 'qi_cost', delta: -5 }],
      branches: [
        {
          id: 'execute',
          label: '九日·猎杀',
          effects: [
            { kind: 'rating', stat: 'finalDmgRating', value: 12 },
            { kind: 'effect_unlock', effect: { kind: 'execute', value: 0.28, multiplier: 1.55 } },
          ],
        },
        {
          id: 'volley',
          label: '九日·连射',
          effects: [
            { kind: 'enable_follow_up', chance: 0.2, multiplier: 0.6 },
            { kind: 'rating', stat: 'critDmgRating', value: 12 },
          ],
        },
      ],
    },
  ]),
  heracles: track([
    { label: '半神体魄', effects: [{ kind: 'stat_pct', mainPct: 0.04 }] },
    { label: '狮皮厚甲', effects: [{ kind: 'rare_stat', stat: 'block', value: 0.05 }] },
    {
      label: '涅墨亚岔路',
      effects: [],
      branches: [
        {
          id: 'thick',
          label: '涅墨亚·加厚',
          effects: [{ kind: 'skill_mult', delta: 0.25 }],
        },
        {
          id: 'thorns',
          label: '涅墨亚·荆棘',
          effects: [
            { kind: 'skill_mult', delta: 0.1 },
            { kind: 'rating', stat: 'versRating', value: 10 },
            { kind: 'rare_stat', stat: 'block', value: 0.03 },
          ],
        },
      ],
    },
    { label: '不屈功业', effects: [{ kind: 'rating', stat: 'versRating', value: 12 }] },
    { label: '省力护体', effects: [{ kind: 'qi_cost', delta: -8 }] },
    {
      label: '十二功业',
      effects: [{ kind: 'skill_mult', delta: 0.15 }],
      branches: [
        {
          id: 'aegis',
          label: '功业·团盾',
          effects: [
            { kind: 'effect_unlock', effect: { kind: 'team_shield', multiplier: 0.45 } },
            { kind: 'rare_stat', stat: 'block', value: 0.04 },
          ],
        },
        {
          id: 'undying',
          label: '功业·不朽',
          effects: [
            { kind: 'stat_pct', mainPct: 0.06 },
            { kind: 'rare_stat', stat: 'lifesteal', value: 0.06 },
          ],
        },
      ],
    },
  ]),
  zhuge: track([
    { label: '星算', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '八阵精通', effects: [{ kind: 'rating', stat: 'masteryRating', value: 10 }] },
    {
      label: '东风岔路',
      effects: [],
      branches: [
        {
          id: 'deep_shred',
          label: '东风·深破',
          effects: [
            { kind: 'status_boost', valueMult: 0.88, duration: 1 },
          ],
        },
        {
          id: 'lockdown',
          label: '东风·封锁',
          effects: [
            { kind: 'status_boost', duration: 2 },
            { kind: 'rating', stat: 'masteryRating', value: 8 },
          ],
        },
      ],
    },
    { label: '省策', effects: [{ kind: 'qi_cost', delta: -8 }] },
    {
      label: '锦囊再计',
      effects: [{ kind: 'enable_follow_up', chance: 0.25, multiplier: 0.4 }],
    },
    {
      label: '卧龙出山',
      effects: [{ kind: 'rating', stat: 'masteryRating', value: 10 }],
      branches: [
        {
          id: 'control',
          label: '卧龙·全控',
          effects: [
            { kind: 'status_boost', duration: 1, valueMult: 0.9 },
            { kind: 'status_unlock', status: { statusId: 'heal_block', duration: 2, chance: 0.5 } },
          ],
        },
        {
          id: 'support',
          label: '卧龙·运筹',
          effects: [
            { kind: 'effect_unlock', effect: { kind: 'ally_grant_qi', value: 15 } },
            { kind: 'qi_cost', delta: -5 },
          ],
        },
      ],
    },
  ]),
  baigujing: track([
    { label: '白骨森森', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '惑心', effects: [{ kind: 'rating', stat: 'masteryRating', value: 10 }] },
    {
      label: '三打岔路',
      effects: [],
      branches: [
        {
          id: 'havoc',
          label: '三打·离魂',
          effects: [
            { kind: 'status_boost', duration: 1 },
            { kind: 'rating', stat: 'masteryRating', value: 6 },
          ],
        },
        {
          id: 'corrode',
          label: '三打·蚀骨',
          effects: [
            { kind: 'status_unlock', status: { statusId: 'bleed', duration: 2, layers: 1, chance: 0.6 } },
            { kind: 'skill_mult', delta: 0.1 },
          ],
        },
      ],
    },
    { label: '群魇', effects: [{ kind: 'skill_mult', delta: 0.12 }] },
    { label: '省咒', effects: [{ kind: 'qi_cost', delta: -5 }] },
    {
      label: '白骨夫人',
      effects: [{ kind: 'skill_mult', delta: 0.1 }],
      branches: [
        {
          id: 'nightmare',
          label: '夫人·永魇',
          effects: [
            { kind: 'status_boost', duration: 2 },
            { kind: 'rating', stat: 'masteryRating', value: 12 },
          ],
        },
        {
          id: 'poison',
          label: '夫人·噬魂',
          effects: [
            { kind: 'status_unlock', status: { statusId: 'bleed', duration: 3, layers: 2, chance: 0.55 } },
            { kind: 'rating', stat: 'finalDmgRating', value: 8 },
          ],
        },
      ],
    },
  ]),
  medusa: track([
    { label: '蛇瞳', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '石化锋', effects: [{ kind: 'skill_mult', delta: 0.1 }] },
    {
      label: '凝视岔路',
      effects: [],
      branches: [
        {
          id: 'petrify',
          label: '凝视·石化',
          effects: [
            { kind: 'status_boost', duration: 1 },
            { kind: 'rating', stat: 'masteryRating', value: 6 },
          ],
        },
        {
          id: 'venom',
          label: '凝视·蛇毒',
          effects: [
            { kind: 'status_unlock', status: { statusId: 'bleed', duration: 3, layers: 1, chance: 0.65 } },
            { kind: 'skill_mult', delta: 0.12 },
          ],
        },
      ],
    },
    { label: '蛇发之力', effects: [{ kind: 'qi_cost', delta: -8 }] },
    {
      label: '连视',
      effects: [{ kind: 'enable_follow_up', chance: 0.22, multiplier: 0.45 }],
    },
    {
      label: '戈耳工真身',
      effects: [{ kind: 'rating', stat: 'masteryRating', value: 12 }],
      branches: [
        {
          id: 'full_control',
          label: '真身·全控',
          effects: [
            { kind: 'status_boost', duration: 1 },
            { kind: 'status_unlock', status: { statusId: 'slow', duration: 2, chance: 0.8 } },
          ],
        },
        {
          id: 'gaze_burst',
          label: '真身·石爆',
          effects: [
            { kind: 'skill_mult', delta: 0.18 },
            { kind: 'rating', stat: 'finalDmgRating', value: 10 },
          ],
        },
      ],
    },
  ]),
  athena: track([
    { label: '智慧之光', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '群愈恩典', effects: [{ kind: 'skill_mult', delta: 0.12 }] },
    {
      label: '神恩岔路',
      effects: [],
      branches: [
        {
          id: 'cleanse',
          label: '涤净神恩',
          effects: [{ kind: 'effect_unlock', effect: { kind: 'cleanse' } }],
        },
        {
          id: 'ward',
          label: '结界神恩',
          effects: [
            { kind: 'effect_unlock', effect: { kind: 'team_shield', multiplier: 0.35 } },
          ],
        },
      ],
    },
    { label: '城邦守护', effects: [{ kind: 'rating', stat: 'masteryRating', value: 10 }] },
    { label: '省恩', effects: [{ kind: 'qi_cost', delta: -8 }] },
    {
      label: '雅典娜之盾',
      effects: [{ kind: 'skill_mult', delta: 0.12 }],
      branches: [
        {
          id: 'guardian',
          label: '神盾·守护',
          effects: [
            { kind: 'effect_unlock', effect: { kind: 'team_shield', multiplier: 0.5 } },
            { kind: 'rating', stat: 'versRating', value: 10 },
          ],
        },
        {
          id: 'war',
          label: '神盾·战意',
          effects: [
            { kind: 'skill_mult', delta: 0.15 },
            { kind: 'effect_unlock', effect: { kind: 'ally_grant_qi', value: 15 } },
          ],
        },
      ],
    },
  ]),
  guanyu: track([
    { label: '青龙偃月', effects: [{ kind: 'stat_pct', mainPct: 0.035 }] },
    { label: '义绝', effects: [{ kind: 'rating', stat: 'finalDmgRating', value: 8 }] },
    {
      label: '过五关',
      effects: [],
      branches: [
        {
          id: 'combo',
          label: '过关·连斩',
          effects: [
            { kind: 'status_boost', layers: 1, duration: 1 },
            { kind: 'enable_follow_up', chance: 0.28, multiplier: 0.55 },
          ],
        },
        {
          id: 'shred',
          label: '过关·破甲',
          effects: [
            { kind: 'status_unlock', status: { statusId: 'shred', duration: 2, value: 0.85, chance: 0.75 } },
            { kind: 'skill_mult', delta: 0.1 },
          ],
        },
      ],
    },
    { label: '武圣锋', effects: [{ kind: 'skill_mult', delta: 0.15 }] },
    {
      label: '拖刀计',
      effects: [{ kind: 'enable_follow_up', chance: 0.36, multiplier: 0.7 }],
    },
    {
      label: '温酒斩华雄',
      effects: [{ kind: 'skill_mult', delta: 0.12 }],
      branches: [
        {
          id: 'brute',
          label: '华雄·暴力',
          effects: [
            { kind: 'rating', stat: 'critDmgRating', value: 12 },
            { kind: 'rating', stat: 'finalDmgRating', value: 8 },
          ],
        },
        {
          id: 'breaker',
          label: '华雄·破阵',
          effects: [
            { kind: 'status_unlock', status: { statusId: 'shred', duration: 2, value: 0.85, chance: 0.7 } },
            { kind: 'effect_unlock', effect: { kind: 'refund_qi_on_kill', value: 0.4 } },
          ],
        },
      ],
    },
  ]),
  lvbu: track([
    { label: '方天画戟', effects: [{ kind: 'stat_pct', mainPct: 0.04 }] },
    { label: '赤兔暴戾', effects: [{ kind: 'rating', stat: 'critRating', value: 10 }] },
    {
      label: '辕门岔路',
      effects: [],
      branches: [
        {
          id: 'combo',
          label: '辕门·连戟',
          effects: [{ kind: 'enable_follow_up', chance: 0.3, multiplier: 0.7 }],
        },
        {
          id: 'nuke',
          label: '辕门·重斩',
          effects: [
            { kind: 'skill_mult', delta: 0.25 },
            { kind: 'rating', stat: 'critDmgRating', value: 8 },
          ],
        },
      ],
    },
    { label: '弑神', effects: [{ kind: 'skill_mult', delta: 0.2 }] },
    {
      label: '无双再战',
      effects: [{ kind: 'enable_follow_up', chance: 0.4, multiplier: 0.85 }],
    },
    {
      label: '人中吕布',
      effects: [{ kind: 'qi_cost', delta: -5 }],
      branches: [
        {
          id: 'slayer',
          label: '吕布·猎神',
          effects: [
            { kind: 'rating', stat: 'finalDmgRating', value: 14 },
            { kind: 'effect_unlock', effect: { kind: 'execute', value: 0.25, multiplier: 1.4 } },
          ],
        },
        {
          id: 'frenzy',
          label: '吕布·狂战',
          effects: [
            { kind: 'enable_follow_up', chance: 0.2, multiplier: 0.6 },
            { kind: 'rating', stat: 'critRating', value: 10 },
            { kind: 'rating', stat: 'critDmgRating', value: 10 },
          ],
        },
      ],
    },
  ]),
  dianwei: track([
    { label: '恶来之躯', effects: [{ kind: 'stat_pct', mainPct: 0.04 }] },
    { label: '死守', effects: [{ kind: 'rare_stat', stat: 'block', value: 0.05 }] },
    {
      label: '护主岔路',
      effects: [],
      branches: [
        {
          id: 'shield',
          label: '护主·厚盾',
          effects: [{ kind: 'skill_mult', delta: 0.22 }],
        },
        {
          id: 'counter',
          label: '护主·反击',
          effects: [
            { kind: 'skill_mult', delta: 0.08 },
            { kind: 'enable_follow_up', chance: 0.25, multiplier: 0.5 },
          ],
        },
      ],
    },
    { label: '双戟厚血', effects: [{ kind: 'rating', stat: 'versRating', value: 10 }] },
    { label: '省力', effects: [{ kind: 'qi_cost', delta: -8 }] },
    {
      label: '古之恶来',
      effects: [{ kind: 'stat_pct', mainPct: 0.05 }],
      branches: [
        {
          id: 'team',
          label: '恶来·团盾',
          effects: [
            { kind: 'effect_unlock', effect: { kind: 'team_shield', multiplier: 0.4 } },
            { kind: 'rare_stat', stat: 'block', value: 0.04 },
          ],
        },
        {
          id: 'last_stand',
          label: '恶来·死战',
          effects: [
            { kind: 'rare_stat', stat: 'lifesteal', value: 0.06 },
            { kind: 'rating', stat: 'versRating', value: 12 },
          ],
        },
      ],
    },
  ]),
  nezha: track([
    { label: '莲花化身', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '风火轮', effects: [{ kind: 'rating', stat: 'hasteRating', value: 10 }] },
    {
      label: '三头六臂',
      effects: [],
      branches: [
        {
          id: 'speed',
          label: '六臂·速攻',
          effects: [
            { kind: 'enable_follow_up', chance: 0.35, multiplier: 0.55 },
          ],
        },
        {
          id: 'shred',
          label: '六臂·破甲',
          effects: [
            { kind: 'status_boost', valueMult: 0.88 },
            { kind: 'skill_mult', delta: 0.12 },
          ],
        },
      ],
    },
    { label: '火尖加深', effects: [{ kind: 'skill_mult', delta: 0.15 }] },
    {
      label: '六臂连打',
      effects: [{ kind: 'enable_follow_up', chance: 0.45, multiplier: 0.7 }],
    },
    {
      label: '哪吒闹海',
      effects: [{ kind: 'skill_mult', delta: 0.12 }],
      branches: [
        {
          id: 'storm',
          label: '闹海·风暴',
          effects: [
            { kind: 'rare_stat', stat: 'dodge', value: 0.05 },
            { kind: 'status_unlock', status: { statusId: 'bleed', duration: 2, layers: 1, chance: 0.55 } },
          ],
        },
        {
          id: 'flame',
          label: '闹海·焚天',
          effects: [
            { kind: 'rating', stat: 'finalDmgRating', value: 12 },
            { kind: 'rating', stat: 'hasteRating', value: 8 },
          ],
        },
      ],
    },
  ]),
  daji: track([
    { label: '狐媚', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '朝歌惑阵', effects: [{ kind: 'rating', stat: 'masteryRating', value: 10 }] },
    {
      label: '魅惑岔路',
      effects: [],
      branches: [
        {
          id: 'prolong',
          label: '魅惑·长控',
          effects: [
            { kind: 'status_boost', duration: 1 },
            { kind: 'rating', stat: 'masteryRating', value: 6 },
          ],
        },
        {
          id: 'spread',
          label: '魅惑·群扰',
          effects: [
            { kind: 'skill_mult', delta: 0.15 },
            { kind: 'status_unlock', status: { statusId: 'havoc', duration: 1, chance: 0.4 } },
          ],
        },
      ],
    },
    { label: '群惑', effects: [{ kind: 'skill_mult', delta: 0.1 }] },
    { label: '低语', effects: [{ kind: 'qi_cost', delta: -8 }] },
    {
      label: '九尾天狐',
      effects: [{ kind: 'rating', stat: 'masteryRating', value: 12 }],
      branches: [
        {
          id: 'empress',
          label: '天狐·妖后',
          effects: [
            { kind: 'status_boost', duration: 1 },
            { kind: 'status_unlock', status: { statusId: 'berserk', duration: 1, chance: 0.45 } },
          ],
        },
        {
          id: 'fox_fire',
          label: '天狐·业火',
          effects: [
            { kind: 'skill_mult', delta: 0.2 },
            { kind: 'rating', stat: 'finalDmgRating', value: 10 },
          ],
        },
      ],
    },
  ]),
  yangjian: track([
    { label: '天眼', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '梅山会神', effects: [{ kind: 'rating', stat: 'finalDmgRating', value: 8 }] },
    {
      label: '天眼岔路',
      effects: [],
      branches: [
        {
          id: 'shred',
          label: '天眼·深破',
          effects: [
            { kind: 'status_boost', valueMult: 0.88, duration: 1 },
          ],
        },
        {
          id: 'hunt',
          label: '天眼·猎杀',
          effects: [
            { kind: 'effect_unlock', effect: { kind: 'execute', value: 0.25, multiplier: 1.25 } },
            { kind: 'rating', stat: 'critRating', value: 8 },
          ],
        },
      ],
    },
    { label: '三尖锋', effects: [{ kind: 'skill_mult', delta: 0.15 }] },
    {
      label: '哮天连刺',
      effects: [{ kind: 'enable_follow_up', chance: 0.32, multiplier: 0.6 }],
    },
    {
      label: '二郎真君',
      effects: [{ kind: 'qi_cost', delta: -5 }],
      branches: [
        {
          id: 'assassin',
          label: '真君·杀伐',
          effects: [
            { kind: 'rating', stat: 'critRating', value: 10 },
            { kind: 'effect_unlock', effect: { kind: 'execute', value: 0.32, multiplier: 1.35 } },
          ],
        },
        {
          id: 'erosion',
          label: '真君·蚀甲',
          effects: [
            { kind: 'status_unlock', status: { statusId: 'shred', duration: 2, value: 0.85, chance: 0.65 } },
            { kind: 'status_unlock', status: { statusId: 'bleed', duration: 2, layers: 1, chance: 0.5 } },
          ],
        },
      ],
    },
  ]),
  thor: track([
    { label: '雷神之力', effects: [{ kind: 'stat_pct', mainPct: 0.035 }] },
    { label: '轰鸣', effects: [{ kind: 'rating', stat: 'critRating', value: 8 }] },
    {
      label: '眩雷岔路',
      effects: [],
      branches: [
        {
          id: 'stun',
          label: '眩雷·震慑',
          effects: [
            { kind: 'status_boost', duration: 1 },
            { kind: 'rating', stat: 'masteryRating', value: 6 },
          ],
        },
        {
          id: 'aoe',
          label: '眩雷·裂地',
          effects: [
            { kind: 'skill_mult', delta: 0.18 },
            { kind: 'enable_follow_up', chance: 0.2, multiplier: 0.4 },
          ],
        },
      ],
    },
    { label: '雷殛', effects: [{ kind: 'skill_mult', delta: 0.15 }] },
    {
      label: '连雷',
      effects: [{ kind: 'enable_follow_up', chance: 0.28, multiplier: 0.5 }],
    },
    {
      label: '雷神之锤',
      effects: [{ kind: 'skill_mult', delta: 0.12 }],
      branches: [
        {
          id: 'breaker',
          label: '雷锤·破盾',
          effects: [
            { kind: 'rating', stat: 'finalDmgRating', value: 10 },
            { kind: 'effect_unlock', effect: { kind: 'vs_shield', multiplier: 1.3 } },
          ],
        },
        {
          id: 'tempest',
          label: '雷锤·风暴',
          effects: [
            { kind: 'enable_follow_up', chance: 0.2, multiplier: 0.55 },
            { kind: 'rating', stat: 'critDmgRating', value: 12 },
          ],
        },
      ],
    },
  ]),
  arthur: track([
    { label: '石中剑', effects: [{ kind: 'stat_pct', mainPct: 0.035 }] },
    { label: '圆桌誓约', effects: [{ kind: 'rare_stat', stat: 'block', value: 0.04 }] },
    {
      label: '王盾岔路',
      effects: [{ kind: 'skill_mult', delta: 0.12 }],
      branches: [
        {
          id: 'team',
          label: '王盾·结界',
          effects: [
            { kind: 'effect_unlock', effect: { kind: 'team_shield', multiplier: 0.45 } },
          ],
        },
        {
          id: 'self',
          label: '王盾·圣体',
          effects: [
            { kind: 'skill_mult', delta: 0.12 },
            { kind: 'rare_stat', stat: 'block', value: 0.05 },
          ],
        },
      ],
    },
    { label: '王气', effects: [{ kind: 'rating', stat: 'versRating', value: 10 }] },
    { label: '省力', effects: [{ kind: 'qi_cost', delta: -8 }] },
    {
      label: '王者归来',
      effects: [{ kind: 'skill_mult', delta: 0.12 }],
      branches: [
        {
          id: 'charge',
          label: '归来·充能',
          effects: [
            { kind: 'effect_unlock', effect: { kind: 'ally_grant_qi', value: 15 } },
            { kind: 'rare_stat', stat: 'block', value: 0.03 },
          ],
        },
        {
          id: 'bulwark',
          label: '归来·不破',
          effects: [
            { kind: 'stat_pct', mainPct: 0.06 },
            { kind: 'rating', stat: 'versRating', value: 10 },
          ],
        },
      ],
    },
  ]),
  xishi: track([
    { label: '浣纱', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '沉鱼', effects: [{ kind: 'rating', stat: 'masteryRating', value: 10 }] },
    {
      label: '长眠岔路',
      effects: [],
      branches: [
        {
          id: 'deep_sleep',
          label: '长眠·深沉',
          effects: [
            { kind: 'status_boost', duration: 1 },
            { kind: 'rating', stat: 'masteryRating', value: 6 },
          ],
        },
        {
          id: 'confuse',
          label: '长眠·迷乱',
          effects: [
            { kind: 'status_unlock', status: { statusId: 'havoc', duration: 1, chance: 0.45 } },
            { kind: 'skill_mult', delta: 0.1 },
          ],
        },
      ],
    },
    { label: '吴越省息', effects: [{ kind: 'qi_cost', delta: -8 }] },
    {
      label: '连惑',
      effects: [{ kind: 'enable_follow_up', chance: 0.22, multiplier: 0.4 }],
    },
    {
      label: '西子捧心',
      effects: [{ kind: 'skill_mult', delta: 0.1 }],
      branches: [
        {
          id: 'full_cc',
          label: '捧心·全控',
          effects: [
            { kind: 'status_boost', duration: 2 },
            { kind: 'rating', stat: 'masteryRating', value: 12 },
          ],
        },
        {
          id: 'spirit',
          label: '捧心·蚀魂',
          effects: [
            { kind: 'status_unlock', status: { statusId: 'havoc', duration: 1, chance: 0.5 } },
            { kind: 'rating', stat: 'finalDmgRating', value: 10 },
          ],
        },
      ],
    },
  ]),
};
