/**
 * 深做卡：母题 + 招牌改写 + 典故星章。
 * 数值/钩子走能力池；标题必须贴历史，禁止「主属性强化」当终态。
 */
import type { SkillDef } from '../shared/types.js';
import type { StarBranchDef, StarNodeDef, StarNodeEffect } from './starTypes.js';
import {
  EXPAND_DEEP_SKILL_OVERRIDES,
  EXPAND_DEEP_STAR_OVERRIDES,
} from './expandDeepKits.js';

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

function fork(
  id: string,
  identityLabel: string,
  label: string,
  effects: StarNodeEffect[],
): StarBranchDef {
  return { id, identityLabel, label, effects };
}

/** 覆盖 CORE / 已升格扩展技能的展示与机制（id 不变） */
const CORE_DEEP_SKILL_OVERRIDES: Record<string, Partial<SkillDef>> = {
  skill_hero_strike: {
    name: '破妄斩',
    blurb: '对单体力系重击并驱散一道增益；本场第一刀更锋利。目标有盾时，破妄专克护盾。',
    effects: [{ kind: 'purge' }, { kind: 'first_cast', multiplier: 1.25 }],
    softModes: [
      {
        when: { kind: 'target_has_shield' },
        then: { effectPatches: [{ kind: 'vs_shield', multiplier: 1.28 }], multiplierDelta: 0.06 },
        copy: '有盾：破妄加重',
      },
    ],
  },
  skill_zhangfei_roar: {
    name: '当阳吼',
    blurb: '怒吼眩晕单体；本场第一吼先声夺人，并锁住敌方焦点。',
    applyStatus: [{ statusId: 'stun', duration: 1 }],
    effects: [{ kind: 'first_cast', multiplier: 1.4 }],
    softModes: [
      {
        when: { kind: 'first_cast' },
        then: { statusPatches: [{ statusId: 'taunt', duration: 2, chance: 0.7 }] },
        copy: '第一吼：当阳锁敌',
      },
    ],
  },
  skill_zhaoyun_longdan: {
    name: '龙胆枪',
    blurb: '银枪穿透点杀：撕开流血，专克护盾；猎物一旦被猎印锁定，枪尖直取残命。',
    applyStatus: [{ statusId: 'bleed', duration: 3, layers: 1 }],
    effects: [{ kind: 'vs_shield', multiplier: 1.25 }],
    softModes: [
      {
        when: { kind: 'target_has_status', statusId: 'mark_prey' },
        then: {
          effectPatches: [{ kind: 'execute', value: 0.3, multiplier: 1.45 }],
          multiplierDelta: 0.08,
        },
        copy: '猎印目标：斩杀加重',
      },
    ],
  },
  skill_wukong_sweep: {
    name: '定海神针',
    blurb: '十字打击并眩晕；身旁有人时棒势更沉。本场第一棍再扫一圈。',
    targetPattern: 'cross',
    tags: ['aoe', 'damage'],
    multiplier: 1.15,
    applyStatus: [{ statusId: 'stun', duration: 1 }],
    effects: [{ kind: 'first_cast', multiplier: 1.2 }, { kind: 'surround', multiplier: 1.2 }],
    softModes: [
      {
        when: { kind: 'first_cast' },
        then: { followUp: { chance: 0.45, multiplier: 0.5, targetPattern: 'cross' } },
        copy: '第一棍：定海再扫',
      },
    ],
  },
  skill_huatuo_qingnang: {
    name: '青囊济世',
    blurb: '治疗单体并净化减益；目标残血时疗得更猛，并顺手灌一口元气。',
    effects: [
      { kind: 'cleanse' },
      { kind: 'heal_low_hp', value: 0.4, multiplier: 1.35 },
    ],
    softModes: [
      {
        when: { kind: 'target_hp_below', value: 0.4 },
        then: { effectPatches: [{ kind: 'ally_grant_qi', value: 18 }] },
        copy: '残血：青囊灌气',
      },
    ],
  },
  skill_houyi_luori: {
    name: '九日尽',
    blurb: '穿透点残并撕开流血。猎物已在流血时，九日再沉、专收残命。',
    applyStatus: [{ statusId: 'bleed', duration: 3, layers: 1 }],
    effects: [{ kind: 'execute', value: 0.35, multiplier: 1.35 }],
    focusPolicy: 'lowest_hp',
    softModes: [
      {
        when: { kind: 'target_has_status', statusId: 'bleed' },
        then: {
          effectPatches: [{ kind: 'execute', value: 0.35, multiplier: 1.5 }],
          multiplierDelta: 0.08,
        },
        copy: '流血目标：九日再沉',
      },
    ],
  },
  skill_zhuge_qimen: {
    name: '借东风',
    blurb: '抽干敌人能量并迟滞；25% 给友军灌一大口气。本场第一阵东风抽得更狠。',
    applyStatus: [
      { statusId: 'qi_drought', duration: 2 },
      { statusId: 'slow', duration: 2 },
    ],
    effects: [{ kind: 'ally_grant_qi', value: 64, chance: 0.25 }],
    softModes: [
      {
        when: { kind: 'first_cast' },
        then: { statusPatches: [{ statusId: 'qi_drought', duration: 1 }] },
        copy: '第一阵：东风更深',
      },
    ],
  },
  skill_baigujing_huagu: {
    name: '化骨绵掌',
    blurb: '横扫前排并扰乱心神；印被驱散时反噬。敌军已乱时，化骨咬得更狠。',
    applyStatus: [{ statusId: 'havoc', duration: 1 }, { statusId: 'unstable', duration: 3 }],
    softModes: [
      {
        when: { kind: 'target_has_status', statusId: 'havoc' },
        then: { effectPatches: [{ kind: 'vs_cc', multiplier: 1.28 }], multiplierDelta: 0.08 },
        copy: '混乱目标：化骨加码',
      },
    ],
  },
  skill_guanyu_slash: {
    name: '温酒青龙',
    blurb: '单体重创并流血，伤害会抬队里最残的人。敌方残血时，温酒斩杀。',
    applyStatus: [{ statusId: 'bleed', duration: 3, layers: 1 }],
    effects: [{ kind: 'first_cast', multiplier: 1.3 }, { kind: 'atonement', value: 0.22 }],
    softModes: [
      {
        when: { kind: 'target_hp_below', value: 0.35 },
        then: { effectPatches: [{ kind: 'execute', value: 0.35, multiplier: 1.4 }], multiplierDelta: 0.1 },
        copy: '残血：温酒斩杀',
      },
    ],
  },
  skill_lvbu_wushuang: {
    name: '人中吕布',
    blurb: '方天一戟：本场首击先声裂阵，残血时愈战愈凶；血线危急时戟影连环，专收残局。',
    effects: [
      { kind: 'first_cast', multiplier: 1.35 },
      { kind: 'self_low_hp', value: 0.4, multiplier: 1.3 },
    ],
    softModes: [
      {
        when: { kind: 'self_hp_below', value: 0.4 },
        then: {
          multiplierDelta: 0.12,
          followUp: { chance: 0.28, multiplier: 0.58 },
        },
        copy: '残血：戟影连环',
      },
    ],
  },
  skill_dianwei_guard: {
    name: '恶来护主',
    blurb: '为自己叠盾并卸力，挨打的伤分后扣，再按承伤回血。自己残血时护主更厚。',
    effects: [
      { kind: 'first_cast', multiplier: 1.2 },
      { kind: 'self_stagger' },
      { kind: 'heal_from_taken', value: 0.5 },
    ],
    softModes: [
      {
        when: { kind: 'self_hp_below', value: 0.4 },
        then: { effectPatches: [{ kind: 'self_shield', multiplier: 0.55 }], multiplierDelta: 0.1 },
        copy: '残血：恶来护主',
      },
    ],
  },
  skill_nezha_arms: {
    name: '风火连枪',
    blurb: '穿透点杀并流血，连打同一人越打越疼。猎物已在流血时，风火再燃。',
    applyStatus: [{ statusId: 'bleed', duration: 2, layers: 1 }],
    effects: [{ kind: 'focus_streak', value: 0.08 }],
    softModes: [
      {
        when: { kind: 'target_has_status', statusId: 'bleed' },
        then: { followUp: { chance: 0.32, multiplier: 0.55 } },
        copy: '流血目标：风火再燃',
      },
    ],
  },
  skill_daji_charm: {
    name: '九尾狐火',
    blurb: '横扫前排并扰乱心神。敌军已乱时，狐火抽走一口元气。',
    applyStatus: [{ statusId: 'havoc', duration: 1 }],
    softModes: [
      {
        when: { kind: 'target_has_status', statusId: 'havoc' },
        then: { effectPatches: [{ kind: 'steal_qi', value: 12 }] },
        copy: '混乱目标：狐火夺气',
      },
    ],
  },
  skill_yangjian_blade: {
    name: '天眼破妄',
    blurb: '穿透点残并流血。目标有盾时，天眼专破护盾。',
    applyStatus: [{ statusId: 'bleed', duration: 3, layers: 1 }],
    focusPolicy: 'lowest_hp',
    effects: [{ kind: 'vs_shield', multiplier: 1.2 }],
    softModes: [
      {
        when: { kind: 'target_has_shield' },
        then: { effectPatches: [{ kind: 'vs_shield', multiplier: 1.38 }], multiplierDelta: 0.08 },
        copy: '有盾：天眼破妄',
      },
    ],
  },
  skill_xishi_chenyu: {
    name: '沉鱼落雁',
    blurb: '低伤使目标沉眠。已沉眠的人再被点中，连招式也被封住。',
    applyStatus: [{ statusId: 'sleep', duration: 2 }],
    softModes: [
      {
        when: { kind: 'target_has_status', statusId: 'sleep' },
        then: { statusPatches: [{ statusId: 'silence', duration: 1, chance: 0.7 }] },
        copy: '沉眠目标：再封其招',
      },
    ],
  },
  skill_change_moon: {
    name: '月华',
    blurb: '月华覆全体：治疗并净化；25% 再灌一口月露。',
    effects: [{ kind: 'cleanse' }, { kind: 'ally_grant_qi', value: 32, chance: 0.25 }],
  },
  skill_sunbin_jianzao: {
    name: '减灶',
    blurb: '点破护甲并迟滞；身旁有人时合围加伤。已破甲时减灶套得更死。',
    applyStatus: [
      { statusId: 'shred', duration: 2, value: 0.78 },
      { statusId: 'slow', duration: 2 },
    ],
    effects: [{ kind: 'surround', multiplier: 1.2 }],
    softModes: [
      {
        when: { kind: 'target_has_status', statusId: 'shred' },
        then: { effectPatches: [{ kind: 'surround', multiplier: 1.35 }], multiplierDelta: 0.08 },
        copy: '破甲目标：减灶合围',
      },
    ],
  },
};

export const DEEP_SKILL_OVERRIDES: Record<string, Partial<SkillDef>> = {
  ...CORE_DEEP_SKILL_OVERRIDES,
  ...EXPAND_DEEP_SKILL_OVERRIDES,
};

/** 深做星章（★1–★6 数据轨；可玩上限仍按品级截断） */
const CORE_DEEP_STAR_OVERRIDES: Record<string, Partial<Record<number, StarNodeDef>>> = {
  hero: track([
    { label: '问心', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '斩意', effects: [{ kind: 'qi_cost', delta: -5 }] },
    {
      label: '破妄',
      effects: [],
      branches: [
        fork('combo', '连斩', '破妄·连斩', [
          { kind: 'enable_follow_up', chance: 0.28, multiplier: 0.6 },
        ]),
        fork('burst', '破妄', '破妄·入魂', [
          { kind: 'skill_mult', delta: 0.2 },
          { kind: 'effect_unlock', effect: { kind: 'first_cast', multiplier: 1.35 } },
        ]),
      ],
    },
    { label: '锋砺', effects: [{ kind: 'skill_mult', delta: 0.15 }] },
    { label: '再砺', effects: [{ kind: 'rating', stat: 'penRating', value: 8 }] },
    {
      label: '问道',
      effects: [],
      branches: [
        fork('relentless', '连斩', '问道·追斩', [
          { kind: 'enable_follow_up', chance: 0.18, multiplier: 0.55 },
          { kind: 'rating', stat: 'penRating', value: 10 },
        ]),
        fork('purge', '破妄', '问道·皆空', [
          { kind: 'skill_mult', delta: 0.18 },
          { kind: 'rating', stat: 'critDmgRating', value: 10 },
        ]),
      ],
    },
  ]),
  zhangfei: track([
    { label: '燕人', effects: [{ kind: 'stat_pct', mainPct: 0.04 }] },
    { label: '丈八', effects: [{ kind: 'rare_stat', stat: 'block', value: 0.04 }] },
    {
      label: '当阳',
      effects: [{ kind: 'status_boost', duration: 1 }],
      branches: [
        fork('bulwark', '据守', '当阳·据守', [
          { kind: 'effect_unlock', effect: { kind: 'team_shield', multiplier: 0.5 } },
        ]),
        fork('roar', '断喝', '当阳·断喝', [
          { kind: 'skill_mult', delta: 0.15 },
          { kind: 'status_unlock', status: { statusId: 'slow', duration: 1, chance: 0.6 } },
        ]),
      ],
    },
    { label: '长坂', effects: [{ kind: 'rating', stat: 'tenacityRating', value: 10 }] },
    { label: '蛇矛', effects: [{ kind: 'rare_stat', stat: 'block', value: 0.03 }] },
    {
      label: '万人敌',
      effects: [{ kind: 'stat_pct', mainPct: 0.04 }],
      branches: [
        fork('fortress', '据守', '万人·铁壁', [
          { kind: 'effect_unlock', effect: { kind: 'team_shield', multiplier: 0.55 } },
          { kind: 'rare_stat', stat: 'block', value: 0.05 },
        ]),
        fork('berserk', '断喝', '万人·震桥', [
          { kind: 'skill_mult', delta: 0.18 },
          { kind: 'status_boost', duration: 1 },
        ]),
      ],
    },
  ]),
  zhaoyun: track([
    // 中间星只打磨已有动词：破盾 / 流血 / 穿透；肉身数值可附带
    {
      label: '银枪',
      effects: [
        { kind: 'stat_pct', mainPct: 0.03 },
        { kind: 'effect_unlock', effect: { kind: 'vs_shield', multiplier: 1.32 } },
      ],
    },
    {
      label: '常山',
      effects: [
        { kind: 'status_boost', duration: 1 },
        { kind: 'rating', stat: 'penRating', value: 8 },
      ],
    },
    {
      label: '七进七出',
      effects: [],
      branches: [
        fork('rush', '突阵', '七进·突阵', [
          { kind: 'enable_follow_up', chance: 0.34, multiplier: 0.68 },
        ]),
        fork('crit', '猎印', '七进·猎印', [
          {
            kind: 'status_unlock',
            status: { statusId: 'mark_prey', duration: 2, value: 1.15, chance: 0.7 },
          },
        ]),
      ],
    },
    {
      label: '血染长坂',
      effects: [
        { kind: 'status_boost', layers: 1, duration: 1 },
        { kind: 'skill_mult', delta: 0.06 },
      ],
    },
    {
      label: '龙胆',
      effects: [
        { kind: 'skill_mult', delta: 0.12 },
        { kind: 'effect_unlock', effect: { kind: 'vs_shield', multiplier: 1.4 } },
      ],
    },
    {
      label: '单骑救主',
      effects: [{ kind: 'rating', stat: 'critDmgRating', value: 10 }],
      branches: [
        fork('hunt', '突阵', '单骑·贯阵', [
          { kind: 'effect_unlock', effect: { kind: 'execute', value: 0.3, multiplier: 1.5 } },
          { kind: 'effect_unlock', effect: { kind: 'refund_qi_on_kill', value: 0.55 } },
        ]),
        fork('mark', '猎印', '单骑·标靶', [
          { kind: 'status_unlock', status: { statusId: 'mark_prey', duration: 3, value: 1.22 } },
        ]),
      ],
    },
  ]),
  wukong: track([
    { label: '金箍', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '筋斗云', effects: [{ kind: 'rare_stat', stat: 'dodge', value: 0.04 }] },
    {
      label: '大闹天宫',
      stack: true,
      effects: [],
      branches: [
        fork('evade', '腾云', '大闹·腾云', [
          { kind: 'rare_stat', stat: 'dodge', value: 0.06 },
        ]),
        fork('shred', '闹天', '大闹·定海', [
          { kind: 'status_boost', duration: 1 },
          { kind: 'skill_mult', delta: 0.12 },
        ]),
      ],
    },
    { label: '棒扫千军', effects: [{ kind: 'skill_mult', delta: 0.15 }] },
    { label: '七十二变', effects: [{ kind: 'enable_follow_up', chance: 0.32, multiplier: 0.55 }] },
    {
      label: '齐天大圣',
      effects: [{ kind: 'rating', stat: 'penRating', value: 10 }],
      branches: [
        fork('rampage', '腾云', '齐天·云纵', [
          { kind: 'rare_stat', stat: 'dodge', value: 0.06 },
          { kind: 'rare_stat', stat: 'lifesteal', value: 0.06 },
        ]),
        fork('immortal', '闹天', '齐天·横扫', [
          { kind: 'skill_mult', delta: 0.2 },
          { kind: 'effect_unlock', effect: { kind: 'refund_qi_on_kill', value: 0.35 } },
        ]),
      ],
    },
  ]),
  huatuo: track([
    { label: '五禽戏', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '麻沸散', effects: [{ kind: 'skill_mult', delta: 0.12 }] },
    {
      label: '济元',
      effects: [{ kind: 'qi_cost', delta: -5 }],
      branches: [
        fork('qi', '回春', '济元·回春', [
          { kind: 'effect_unlock', effect: { kind: 'ally_grant_qi', value: 18 } },
        ]),
        fork('heal', '刮骨', '济元·深愈', [{ kind: 'skill_mult', delta: 0.18 }]),
      ],
    },
    { label: '青囊', effects: [{ kind: 'rating', stat: 'masteryRating', value: 12 }] },
    { label: '济世', effects: [{ kind: 'skill_mult', delta: 0.1 }] },
    {
      label: '悬壶',
      effects: [{ kind: 'qi_cost', delta: -5 }],
      branches: [
        fork('guardian', '回春', '悬壶·灌气', [
          { kind: 'effect_unlock', effect: { kind: 'ally_grant_qi', value: 28 } },
        ]),
        fork('purify', '刮骨', '悬壶·还魂', [
          { kind: 'effect_unlock', effect: { kind: 'revive_ally', value: 0.35 } },
        ]),
      ],
    },
  ]),
  houyi: track([
    { label: '扶桑', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '穿杨', effects: [{ kind: 'rating', stat: 'critDmgRating', value: 10 }] },
    {
      label: '落日',
      effects: [],
      branches: [
        fork('bleed', '连射', '落日·连矢', [
          { kind: 'status_boost', layers: 1, duration: 1 },
          { kind: 'enable_follow_up', chance: 0.28, multiplier: 0.55 },
        ]),
        fork('snipe', '穿心', '落日·穿心', [
          { kind: 'rating', stat: 'critRating', value: 12 },
          { kind: 'skill_mult', delta: 0.12 },
        ]),
      ],
    },
    { label: '射日', effects: [{ kind: 'skill_mult', delta: 0.15 }] },
    { label: '追乌', effects: [{ kind: 'qi_cost', delta: -5 }] },
    {
      label: '九日尽',
      effects: [],
      branches: [
        fork('volley', '连射', '九日·连射', [
          { kind: 'enable_follow_up', chance: 0.2, multiplier: 0.6 },
          { kind: 'rating', stat: 'critDmgRating', value: 12 },
        ]),
        fork('execute', '穿心', '九日·贯日', [
          { kind: 'rating', stat: 'penRating', value: 12 },
          { kind: 'skill_mult', delta: 0.18 },
        ]),
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
            { kind: 'rating', stat: 'tenacityRating', value: 10 },
            { kind: 'rare_stat', stat: 'block', value: 0.03 },
          ],
        },
      ],
    },
    { label: '不屈功业', effects: [{ kind: 'rating', stat: 'tenacityRating', value: 12 }] },
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
    { label: '八阵', effects: [{ kind: 'rating', stat: 'masteryRating', value: 10 }] },
    {
      label: '东风',
      effects: [],
      branches: [
        fork('deep_shred', '借风', '东风·借风', [
          { kind: 'status_boost', valueMult: 0.88, duration: 1 },
        ]),
        fork('lockdown', '运筹', '东风·运筹', [
          { kind: 'effect_unlock', effect: { kind: 'ally_grant_qi', value: 80, chance: 0.25 } },
        ]),
      ],
    },
    { label: '省策', effects: [{ kind: 'qi_cost', delta: -8 }] },
    { label: '锦囊', effects: [{ kind: 'enable_follow_up', chance: 0.25, multiplier: 0.4 }] },
    {
      label: '卧龙',
      effects: [{ kind: 'rating', stat: 'masteryRating', value: 10 }],
      branches: [
        fork('control', '借风', '卧龙·空城', [
          { kind: 'status_boost', duration: 1, valueMult: 0.9 },
          { kind: 'status_unlock', status: { statusId: 'heal_block', duration: 2, chance: 0.5 } },
        ]),
        fork('support', '运筹', '卧龙·灌气', [
          { kind: 'effect_unlock', effect: { kind: 'ally_grant_qi', value: 96, chance: 0.25 } },
          { kind: 'qi_cost', delta: -5 },
        ]),
      ],
    },
  ]),
  baigujing: track([
    { label: '白骨森森', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '惑心', effects: [{ kind: 'rating', stat: 'masteryRating', value: 10 }] },
    {
      label: '三打',
      effects: [],
      branches: [
        fork('havoc', '离魂', '三打·离魂', [
          { kind: 'status_boost', duration: 1 },
          { kind: 'rating', stat: 'masteryRating', value: 6 },
        ]),
        fork('corrode', '蚀骨', '三打·蚀骨', [
          { kind: 'status_unlock', status: { statusId: 'bleed', duration: 2, layers: 1, chance: 0.6 } },
          { kind: 'skill_mult', delta: 0.1 },
        ]),
      ],
    },
    { label: '群魇', effects: [{ kind: 'skill_mult', delta: 0.12 }] },
    { label: '省咒', effects: [{ kind: 'qi_cost', delta: -5 }] },
    {
      label: '白骨夫人',
      effects: [{ kind: 'skill_mult', delta: 0.1 }],
      branches: [
        fork('nightmare', '离魂', '夫人·永魇', [
          { kind: 'status_boost', duration: 2 },
          { kind: 'rating', stat: 'masteryRating', value: 12 },
        ]),
        fork('poison', '蚀骨', '夫人·噬魂', [
          { kind: 'status_unlock', status: { statusId: 'bleed', duration: 3, layers: 2, chance: 0.55 } },
          { kind: 'rating', stat: 'penRating', value: 8 },
        ]),
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
            { kind: 'rating', stat: 'penRating', value: 10 },
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
            { kind: 'rating', stat: 'tenacityRating', value: 10 },
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
    { label: '青龙', effects: [{ kind: 'stat_pct', mainPct: 0.035 }] },
    { label: '义绝', effects: [{ kind: 'rating', stat: 'penRating', value: 8 }] },
    {
      label: '过五关',
      effects: [],
      branches: [
        fork('combo', '连斩', '过关·连斩', [
          { kind: 'status_boost', layers: 1, duration: 1 },
          { kind: 'enable_follow_up', chance: 0.28, multiplier: 0.55 },
        ]),
        fork('shred', '义斩', '过关·温酒', [
          { kind: 'effect_unlock', effect: { kind: 'first_cast', multiplier: 1.45 } },
          { kind: 'skill_mult', delta: 0.1 },
        ]),
      ],
    },
    { label: '武圣', effects: [{ kind: 'skill_mult', delta: 0.15 }] },
    { label: '汉寿', effects: [{ kind: 'qi_cost', delta: -5 }] },
    {
      label: '斩华雄',
      effects: [{ kind: 'skill_mult', delta: 0.12 }],
      branches: [
        fork('brute', '连斩', '华雄·拖刀', [
          { kind: 'enable_follow_up', chance: 0.18, multiplier: 0.6 },
          { kind: 'rating', stat: 'critDmgRating', value: 12 },
        ]),
        fork('breaker', '义斩', '华雄·斩将', [
          { kind: 'effect_unlock', effect: { kind: 'refund_qi_on_kill', value: 0.4 } },
          { kind: 'effect_unlock', effect: { kind: 'vs_rank', multiplier: 1.22 } },
        ]),
      ],
    },
  ]),
  lvbu: track([
    {
      label: '方天',
      effects: [
        { kind: 'stat_pct', mainPct: 0.04 },
        { kind: 'effect_unlock', effect: { kind: 'first_cast', multiplier: 1.42 } },
      ],
    },
    {
      label: '赤兔',
      effects: [
        { kind: 'effect_unlock', effect: { kind: 'self_low_hp', value: 0.4, multiplier: 1.38 } },
        { kind: 'rating', stat: 'critRating', value: 10 },
      ],
    },
    {
      label: '辕门',
      effects: [],
      branches: [
        fork('combo', '连戟', '辕门·连戟', [
          { kind: 'enable_follow_up', chance: 0.3, multiplier: 0.7 },
        ]),
        fork('nuke', '重斩', '辕门·重斩', [
          { kind: 'skill_mult', delta: 0.25 },
          { kind: 'rating', stat: 'critDmgRating', value: 8 },
        ]),
      ],
    },
    {
      label: '弑神',
      effects: [
        { kind: 'skill_mult', delta: 0.2 },
        { kind: 'effect_unlock', effect: { kind: 'first_cast', multiplier: 1.5 } },
      ],
    },
    {
      label: '无双',
      effects: [
        { kind: 'qi_cost', delta: -5 },
        { kind: 'effect_unlock', effect: { kind: 'self_low_hp', value: 0.4, multiplier: 1.45 } },
      ],
    },
    {
      label: '人中吕布',
      effects: [],
      branches: [
        fork('frenzy', '连戟', '吕布·狂战', [
          { kind: 'enable_follow_up', chance: 0.2, multiplier: 0.6 },
          { kind: 'rating', stat: 'critRating', value: 10 },
        ]),
        fork('slayer', '重斩', '吕布·猎神', [
          { kind: 'rating', stat: 'penRating', value: 14 },
          { kind: 'effect_unlock', effect: { kind: 'execute', value: 0.25, multiplier: 1.4 } },
        ]),
      ],
    },
  ]),
  dianwei: track([
    { label: '恶来', effects: [{ kind: 'stat_pct', mainPct: 0.04 }] },
    { label: '死守', effects: [{ kind: 'rare_stat', stat: 'block', value: 0.05 }] },
    {
      label: '护主',
      effects: [],
      branches: [
        fork('shield', '护主', '护主·厚盾', [
          { kind: 'rare_stat', stat: 'block', value: 0.04 },
          { kind: 'skill_mult', delta: 0.12 },
        ]),
        fork('counter', '死战', '护主·死战', [
          { kind: 'enable_follow_up', chance: 0.25, multiplier: 0.5 },
          { kind: 'skill_mult', delta: 0.08 },
        ]),
      ],
    },
    { label: '双戟', effects: [{ kind: 'rating', stat: 'tenacityRating', value: 10 }] },
    { label: '省力', effects: [{ kind: 'qi_cost', delta: -8 }] },
    {
      label: '古之恶来',
      effects: [{ kind: 'stat_pct', mainPct: 0.05 }],
      branches: [
        fork('team', '护主', '恶来·覆甲', [
          { kind: 'effect_unlock', effect: { kind: 'team_shield', multiplier: 0.4 } },
          { kind: 'rare_stat', stat: 'block', value: 0.04 },
        ]),
        fork('last_stand', '死战', '恶来·殉主', [
          { kind: 'rare_stat', stat: 'lifesteal', value: 0.06 },
          { kind: 'nirvana', hpRatio: 0.28 },
        ]),
      ],
    },
  ]),
  nezha: track([
    { label: '莲花', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '风火轮', effects: [{ kind: 'rating', stat: 'fortuneRating', value: 10 }] },
    {
      label: '三头六臂',
      effects: [],
      branches: [
        fork('speed', '风火', '六臂·风火', [
          { kind: 'enable_follow_up', chance: 0.35, multiplier: 0.55 },
        ]),
        fork('shred', '火尖', '六臂·火尖', [
          { kind: 'status_boost', layers: 1 },
          { kind: 'skill_mult', delta: 0.12 },
        ]),
      ],
    },
    { label: '混天绫', effects: [{ kind: 'skill_mult', delta: 0.15 }] },
    { label: '乾坤圈', effects: [{ kind: 'qi_cost', delta: -5 }] },
    {
      label: '闹海',
      effects: [{ kind: 'skill_mult', delta: 0.12 }],
      branches: [
        fork('storm', '风火', '闹海·连枪', [
          { kind: 'enable_follow_up', chance: 0.18, multiplier: 0.55 },
          { kind: 'rare_stat', stat: 'dodge', value: 0.05 },
        ]),
        fork('flame', '火尖', '闹海·焚天', [
          { kind: 'rating', stat: 'penRating', value: 12 },
          { kind: 'status_boost', layers: 1 },
        ]),
      ],
    },
  ]),
  daji: track([
    { label: '狐媚', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '朝歌', effects: [{ kind: 'rating', stat: 'masteryRating', value: 10 }] },
    {
      label: '魅惑',
      effects: [],
      branches: [
        fork('prolong', '长控', '魅惑·长乱', [
          { kind: 'status_boost', duration: 1 },
          { kind: 'rating', stat: 'masteryRating', value: 6 },
        ]),
        fork('spread', '狐火', '魅惑·狐火', [{ kind: 'skill_mult', delta: 0.15 }]),
      ],
    },
    { label: '群惑', effects: [{ kind: 'skill_mult', delta: 0.1 }] },
    { label: '低语', effects: [{ kind: 'qi_cost', delta: -8 }] },
    {
      label: '九尾',
      effects: [{ kind: 'rating', stat: 'masteryRating', value: 12 }],
      branches: [
        fork('empress', '长控', '天狐·妖后', [
          { kind: 'status_boost', duration: 1 },
          { kind: 'status_unlock', status: { statusId: 'berserk', duration: 1, chance: 0.45 } },
        ]),
        fork('fox_fire', '狐火', '天狐·业火', [
          { kind: 'skill_mult', delta: 0.2 },
          { kind: 'pattern', pattern: 'all' },
        ]),
      ],
    },
  ]),
  yangjian: track([
    { label: '天眼', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '梅山', effects: [{ kind: 'rating', stat: 'penRating', value: 8 }] },
    {
      label: '显圣',
      effects: [],
      branches: [
        fork('hunt', '猎杀', '天眼·猎杀', [
          { kind: 'effect_unlock', effect: { kind: 'execute', value: 0.25, multiplier: 1.25 } },
          { kind: 'rating', stat: 'critRating', value: 8 },
        ]),
        fork('shred', '破妄', '天眼·破妄', [
          { kind: 'effect_unlock', effect: { kind: 'vs_shield', multiplier: 1.28 } },
          { kind: 'skill_mult', delta: 0.1 },
        ]),
      ],
    },
    { label: '三尖', effects: [{ kind: 'skill_mult', delta: 0.15 }] },
    { label: '哮天', effects: [{ kind: 'enable_follow_up', chance: 0.32, multiplier: 0.6 }] },
    {
      label: '真君',
      effects: [{ kind: 'qi_cost', delta: -5 }],
      branches: [
        fork('assassin', '猎杀', '真君·杀伐', [
          { kind: 'rating', stat: 'critRating', value: 10 },
          { kind: 'effect_unlock', effect: { kind: 'execute', value: 0.32, multiplier: 1.35 } },
        ]),
        fork('erosion', '破妄', '真君·照妖', [
          { kind: 'effect_unlock', effect: { kind: 'purge' } },
          { kind: 'effect_unlock', effect: { kind: 'vs_shield', multiplier: 1.3 } },
        ]),
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
            { kind: 'rating', stat: 'penRating', value: 10 },
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
    { label: '王气', effects: [{ kind: 'rating', stat: 'tenacityRating', value: 10 }] },
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
            { kind: 'rating', stat: 'tenacityRating', value: 10 },
          ],
        },
      ],
    },
  ]),
  xishi: track([
    { label: '浣纱', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '沉鱼', effects: [{ kind: 'rating', stat: 'masteryRating', value: 10 }] },
    {
      label: '吴越',
      effects: [],
      branches: [
        fork('deep_sleep', '长眠', '吴越·长眠', [
          { kind: 'status_boost', duration: 1 },
          { kind: 'rating', stat: 'masteryRating', value: 6 },
        ]),
        fork('confuse', '销魂', '吴越·销魂', [
          { kind: 'effect_unlock', effect: { kind: 'steal_qi', value: 12 } },
          { kind: 'skill_mult', delta: 0.1 },
        ]),
      ],
    },
    { label: '省息', effects: [{ kind: 'qi_cost', delta: -8 }] },
    { label: '捧心', effects: [{ kind: 'skill_mult', delta: 0.1 }] },
    {
      label: '西子',
      effects: [],
      branches: [
        fork('full_cc', '长眠', '捧心·深眠', [
          { kind: 'status_boost', duration: 2 },
          { kind: 'rating', stat: 'masteryRating', value: 12 },
        ]),
        fork('spirit', '销魂', '捧心·抽息', [
          { kind: 'status_unlock', status: { statusId: 'qi_drought', duration: 2 } },
          { kind: 'effect_unlock', effect: { kind: 'steal_qi', value: 16 } },
        ]),
      ],
    },
  ]),
  beowulf: track([
    { label: '守夜厅', effects: [{ kind: 'stat_pct', mainPct: 0.04 }] },
    { label: '熊皮', effects: [{ kind: 'rare_stat', stat: 'block', value: 0.04 }] },
    {
      label: '撕臂岔路',
      effects: [{ kind: 'status_boost', duration: 1 }],
      branches: [
        {
          id: 'rip',
          label: '撕臂·断肢',
          effects: [
            { kind: 'effect_unlock', effect: { kind: 'execute', value: 0.3, multiplier: 1.35 } },
          ],
        },
        {
          id: 'lock',
          label: '撕臂·死掐',
          effects: [
            { kind: 'skill_mult', delta: 0.12 },
            { kind: 'rare_stat', stat: 'thorns', value: 0.08 },
          ],
        },
      ],
    },
    { label: '海族克星', effects: [{ kind: 'skill_mult', delta: 0.14 }] },
    { label: '龙焰灼身', effects: [{ kind: 'rating', stat: 'tenacityRating', value: 10 }] },
    {
      label: '屠龙岔路',
      effects: [{ kind: 'qi_cost', delta: -5 }],
      branches: [
        {
          id: 'ember',
          label: '屠龙·余烬',
          effects: [
            { kind: 'effect_unlock', effect: { kind: 'self_low_hp', value: 0.4, multiplier: 1.3 } },
            { kind: 'rating', stat: 'tenacityRating', value: 8 },
          ],
        },
        {
          id: 'martyr',
          label: '屠龙·殉国',
          effects: [
            { kind: 'nirvana', hpRatio: 0.28 },
            { kind: 'rare_stat', stat: 'thorns', value: 0.1 },
          ],
        },
      ],
    },
  ]),
  robin: track([
    { label: '舍伍德', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '绿林眼', effects: [{ kind: 'rating', stat: 'critRating', value: 8 }] },
    {
      label: '劫富岔路',
      effects: [],
      branches: [
        {
          id: 'mark',
          label: '劫富·标的',
          effects: [
            { kind: 'status_boost', valueMult: 1.08, duration: 1 },
            { kind: 'enable_follow_up', chance: 0.28, multiplier: 0.55 },
          ],
        },
        {
          id: 'pierce',
          label: '劫富·穿杨',
          effects: [
            { kind: 'skill_mult', delta: 0.16 },
            { kind: 'rating', stat: 'penRating', value: 10 },
          ],
        },
      ],
    },
    { label: '济贫', effects: [{ kind: 'rare_stat', stat: 'lifesteal', value: 0.04 }] },
    {
      label: '连射',
      effects: [{ kind: 'enable_follow_up', chance: 0.32, multiplier: 0.6 }],
    },
    {
      label: '侠盗岔路',
      effects: [{ kind: 'qi_cost', delta: -5 }],
      branches: [
        {
          id: 'ambush',
          label: '侠盗·伏击',
          effects: [
            { kind: 'effect_unlock', effect: { kind: 'surround', multiplier: 1.2 } },
            { kind: 'rating', stat: 'critDmgRating', value: 10 },
          ],
        },
        {
          id: 'ghost',
          label: '侠盗·飘忽',
          effects: [
            { kind: 'rare_stat', stat: 'dodge', value: 0.05 },
            { kind: 'effect_unlock', effect: { kind: 'self_spd_up' } },
          ],
        },
      ],
    },
  ]),
  change: track([
    { label: '桂下', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '清辉', effects: [{ kind: 'rating', stat: 'masteryRating', value: 10 }] },
    {
      label: '奔月',
      effects: [{ kind: 'qi_cost', delta: -5 }],
      branches: [
        fork('afterglow', '济月', '奔月·余晖', [
          { kind: 'effect_unlock', effect: { kind: 'heal_low_hp', value: 0.4, multiplier: 1.28 } },
        ]),
        fork('dew', '月露', '奔月·月露', [
          { kind: 'effect_unlock', effect: { kind: 'ally_grant_qi', value: 12 } },
        ]),
      ],
    },
    { label: '广寒', effects: [{ kind: 'skill_mult', delta: 0.12 }] },
    { label: '霜华', effects: [{ kind: 'rating', stat: 'fortuneRating', value: 8 }] },
    {
      label: '不死药',
      effects: [{ kind: 'qi_cost', delta: -5 }],
      branches: [
        fork('elixir', '济月', '不死·还魂', [
          { kind: 'effect_unlock', effect: { kind: 'revive_ally', value: 0.32 } },
        ]),
        fork('exile', '月露', '不死·谪仙', [
          { kind: 'effect_unlock', effect: { kind: 'ally_grant_qi', value: 20 } },
        ]),
      ],
    },
  ]),
  sunbin: track([
    { label: '膑法', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '减灶', effects: [{ kind: 'status_boost', valueMult: 0.92, duration: 1 }] },
    {
      label: '围魏',
      effects: [],
      branches: [
        fork('encircle', '合围', '围魏·合围', [
          { kind: 'skill_mult', delta: 0.14 },
          { kind: 'effect_unlock', effect: { kind: 'surround', multiplier: 1.28 } },
        ]),
        fork('rescue', '救赵', '围魏·救赵', [
          { kind: 'effect_unlock', effect: { kind: 'ally_grant_qi', value: 14 } },
          { kind: 'qi_cost', delta: -5 },
        ]),
      ],
    },
    { label: '诱敌', effects: [{ kind: 'qi_cost', delta: -8 }] },
    { label: '马陵伏', effects: [{ kind: 'effect_unlock', effect: { kind: 'vs_cc', multiplier: 1.22 } }] },
    {
      label: '马陵',
      effects: [{ kind: 'rating', stat: 'masteryRating', value: 8 }],
      branches: [
        fork('pang', '合围', '马陵·绝庞', [
          { kind: 'effect_unlock', effect: { kind: 'execute', value: 0.28, multiplier: 1.4 } },
          { kind: 'rating', stat: 'penRating', value: 8 },
        ]),
        fork('art', '救赵', '马陵·兵书', [
          { kind: 'effect_unlock', effect: { kind: 'ally_grant_qi', value: 16 } },
          { kind: 'status_boost', duration: 1, valueMult: 0.9 },
        ]),
      ],
    },
  ]),
};

export const DEEP_STAR_OVERRIDES: Record<string, Partial<Record<number, StarNodeDef>>> = {
  ...CORE_DEEP_STAR_OVERRIDES,
  ...EXPAND_DEEP_STAR_OVERRIDES,
};
