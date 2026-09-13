/**
 * 扩展 8 张绝品升格深做：母题招牌 + 典故星章。
 * 技能 id 仍是 skill_<id>；覆盖在 SKILLS 合并之后生效。
 */
import type { SkillDef } from '../shared/types.js';
import type { StarBranchDef, StarNodeDef, StarNodeEffect } from './starTypes.js';
import { KNIFE2_BATCH1_COMPILED, KNIFE2_BATCH1_IDS } from './roster/legendarySheets.js';

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

export const EXPAND_DEEP_IDS = [
  'zhouyu',
  'xiangyu',
  'nuwa',
  'yuefei',
  'jiangziya',
  ...KNIFE2_BATCH1_IDS,
] as const;

export const EXPAND_DEEP_SKILL_OVERRIDES: Record<string, Partial<SkillDef>> = {
  skill_zhouyu: {
    name: '赤壁业火',
    blurb: '东南风起：业火横扫前排、扰乱心神；本场首把火最烈。敌军已乱时火势乘乱加码。',
    targetPattern: 'row_front',
    tags: ['aoe', 'damage'],
    multiplier: 1.08,
    qiCost: 55,
    applyStatus: [{ statusId: 'havoc', duration: 1 }],
    effects: [{ kind: 'first_cast', multiplier: 1.25 }],
    damageSchool: 'spirit',
    softModes: [
      {
        when: { kind: 'target_has_status', statusId: 'havoc' },
        then: {
          multiplierDelta: 0.1,
          effectPatches: [{ kind: 'vs_cc', multiplier: 1.28 }],
        },
        copy: '混乱目标：业火乘乱',
      },
      {
        when: { kind: 'target_under_cc' },
        then: {
          multiplierDelta: 0.08,
          effectPatches: [{ kind: 'vs_cc', multiplier: 1.25 }],
        },
        copy: '硬控目标：火势加码',
      },
    ],
  },
  skill_xiangyu: {
    name: '破釜沉舟',
    blurb: '绝后路力劈前排；自己残血时愈战愈凶，并再砍一刀。本场第一刀先声裂阵。',
    targetPattern: 'row_front',
    tags: ['aoe', 'damage'],
    multiplier: 1.22,
    qiCost: 56,
    applyStatus: [],
    effects: [{ kind: 'first_cast', multiplier: 1.4 }, { kind: 'self_low_hp', value: 0.4, multiplier: 1.3 }],
    damageSchool: 'phys',
    softModes: [
      {
        when: { kind: 'self_hp_below', value: 0.4 },
        then: { followUp: { chance: 0.4, multiplier: 0.5, targetPattern: 'row_front' } },
        copy: '残血：破釜再砍',
      },
    ],
  },
  skill_nuwa: {
    name: '补天炼石',
    blurb: '为全队补上天石结界并治疗，残血处更厚。有人倒下时，本招转向补天招魂。',
    targetPattern: 'all',
    tags: ['heal', 'aoe', 'guard'],
    multiplier: 0.68,
    qiCost: 52,
    applyStatus: [],
    effects: [
      { kind: 'team_shield', multiplier: 0.38 },
      { kind: 'heal_low_hp', value: 0.4, multiplier: 1.22 },
    ],
    damageSchool: 'spirit',
    softModes: [
      {
        when: { kind: 'ally_downed' },
        then: { reviveAlly: { hpRatio: 0.3 } },
        copy: '有倒地：补天招魂',
      },
    ],
  },
  skill_yuefei: {
    name: '精忠枪',
    blurb: '正面力斩；对精英与首领更疼，本场第一枪先声。敌方残血时精忠追击。',
    targetPattern: 'single',
    tags: ['damage'],
    multiplier: 1.72,
    qiCost: 52,
    applyStatus: [],
    effects: [{ kind: 'first_cast', multiplier: 1.3 }, { kind: 'vs_rank', multiplier: 1.22 }],
    damageSchool: 'phys',
    softModes: [
      {
        when: { kind: 'target_hp_below', value: 0.35 },
        then: { followUp: { chance: 0.35, multiplier: 0.55 } },
        copy: '残血：精忠追击',
      },
    ],
  },
  skill_jiangziya: {
    name: '封神榜',
    blurb: '写入榜上：抽干能量并沉默。已被封招的人，榜上除名、斩杀加重。',
    targetPattern: 'single',
    tags: ['damage'],
    multiplier: 0.5,
    qiCost: 50,
    applyStatus: [
      { statusId: 'qi_drought', duration: 2 },
      { statusId: 'silence', duration: 1 },
    ],
    effects: [{ kind: 'first_cast', multiplier: 1.15 }],
    damageSchool: 'spirit',
    softModes: [
      {
        when: { kind: 'target_has_status', statusId: 'silence' },
        then: { effectPatches: [{ kind: 'execute', value: 0.3, multiplier: 1.4 }], multiplierDelta: 0.1 },
        copy: '封招目标：榜上除名',
      },
    ],
  },
  ...KNIFE2_BATCH1_COMPILED.skills,
};

export const EXPAND_DEEP_STAR_OVERRIDES: Record<string, Partial<Record<number, StarNodeDef>>> = {
  zhouyu: track([
    {
      label: '苦肉',
      effects: [
        { kind: 'stat_pct', mainPct: 0.03 },
        { kind: 'effect_unlock', effect: { kind: 'first_cast', multiplier: 1.32 } },
      ],
    },
    {
      label: '连环舟',
      effects: [
        { kind: 'status_boost', duration: 1 },
        { kind: 'effect_unlock', effect: { kind: 'vs_cc', multiplier: 1.22 } },
      ],
    },
    {
      label: '东南风',
      effects: [],
      branches: [
        fork('wind', '火攻', '东南·火势', [
          { kind: 'status_boost', duration: 1 },
          { kind: 'skill_mult', delta: 0.1 },
        ]),
        fork('fleet', '锁江', '东南·水军', [
          { kind: 'enable_follow_up', chance: 0.3, multiplier: 0.55 },
          { kind: 'qi_cost', delta: -5 },
        ]),
      ],
    },
    {
      label: '烈焰',
      effects: [
        { kind: 'skill_mult', delta: 0.14 },
        { kind: 'effect_unlock', effect: { kind: 'first_cast', multiplier: 1.4 } },
      ],
    },
    {
      label: '南郡',
      effects: [
        { kind: 'rating', stat: 'masteryRating', value: 12 },
        { kind: 'status_boost', duration: 1 },
      ],
    },
    {
      label: '赤壁',
      effects: [{ kind: 'rating', stat: 'penRating', value: 8 }],
      branches: [
        fork('burn', '火攻', '赤壁·烧尽', [
          { kind: 'effect_unlock', effect: { kind: 'execute', value: 0.28, multiplier: 1.35 } },
          { kind: 'effect_unlock', effect: { kind: 'refund_qi_on_kill', value: 0.4 } },
        ]),
        fork('lock', '锁江', '赤壁·锁江', [
          { kind: 'status_unlock', status: { statusId: 'silence', duration: 1 } },
          { kind: 'status_boost', duration: 1 },
        ]),
      ],
    },
  ]),
  xiangyu: track([
    { label: '拔山', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '沉舟', effects: [{ kind: 'rating', stat: 'critRating', value: 8 }] },
    {
      label: '破釜',
      effects: [],
      branches: [
        fork('death', '死战', '破釜·死战', [
          { kind: 'enable_follow_up', chance: 0.32, multiplier: 0.62 },
        ]),
        fork('awe', '别姬', '破釜·别姬', [
          { kind: 'skill_mult', delta: 0.12 },
          { kind: 'rare_stat', stat: 'lifesteal', value: 0.04 },
        ]),
      ],
    },
    { label: '力拔山兮', effects: [{ kind: 'skill_mult', delta: 0.16 }] },
    { label: '乌骓', effects: [{ kind: 'qi_cost', delta: -5 }] },
    {
      label: '西楚霸王',
      effects: [{ kind: 'rating', stat: 'critDmgRating', value: 10 }],
      branches: [
        fork('no_return', '死战', '霸王·不肯过江', [
          { kind: 'effect_unlock', effect: { kind: 'execute', value: 0.3, multiplier: 1.4 } },
          { kind: 'effect_unlock', effect: { kind: 'refund_qi_on_kill', value: 0.45 } },
        ]),
        fork('farewell', '别姬', '霸王·别姬', [
          { kind: 'rare_stat', stat: 'lifesteal', value: 0.08 },
          { kind: 'skill_mult', delta: 0.18 },
        ]),
      ],
    },
  ]),
  nuwa: track([
    { label: '炼石', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '黄土', effects: [{ kind: 'skill_mult', delta: 0.1 }] },
    {
      label: '补天',
      effects: [{ kind: 'qi_cost', delta: -4 }],
      branches: [
        fork('stone', '补天', '补天·石障', [
          { kind: 'effect_unlock', effect: { kind: 'team_shield', multiplier: 0.48 } },
        ]),
        fork('soil', '造人', '补天·息壤', [
          { kind: 'effect_unlock', effect: { kind: 'cleanse' } },
        ]),
      ],
    },
    { label: '娲皇', effects: [{ kind: 'rating', stat: 'masteryRating', value: 12 }] },
    { label: '造化', effects: [{ kind: 'qi_cost', delta: -4 }] },
    {
      label: '炼石补天',
      effects: [],
      branches: [
        fork('aegis', '补天', '娲皇·金身', [
          { kind: 'effect_unlock', effect: { kind: 'team_shield', multiplier: 0.58 } },
          { kind: 'effect_unlock', effect: { kind: 'ally_grant_qi', value: 18 } },
        ]),
        fork('rebirth', '造人', '娲皇·再造', [
          { kind: 'effect_unlock', effect: { kind: 'revive_ally', value: 0.35 } },
        ]),
      ],
    },
  ]),
  hades: track([
    { label: '三头犬', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '冥河', effects: [{ kind: 'qi_cost', delta: -5 }] },
    {
      label: '收魂岔路',
      effects: [],
      branches: [
        {
          id: 'bind',
          label: '收魂·禁足',
          effects: [{ kind: 'status_boost', duration: 1 }],
        },
        {
          id: 'mark',
          label: '收魂·标魂',
          effects: [
            { kind: 'status_unlock', status: { statusId: 'mark_prey', duration: 2, value: 1.16 } },
          ],
        },
      ],
    },
    { label: '冥冠', effects: [{ kind: 'rating', stat: 'fortuneRating', value: 10 }] },
    { label: '摄魄', effects: [{ kind: 'rare_stat', stat: 'steal', value: 0.08 }] },
    {
      label: '冥王',
      effects: [{ kind: 'rating', stat: 'masteryRating', value: 8 }],
      branches: [
        {
          id: 'harvest',
          label: '冥王·收割',
          effects: [
            { kind: 'effect_unlock', effect: { kind: 'execute', value: 0.32, multiplier: 1.45 } },
            { kind: 'effect_unlock', effect: { kind: 'refund_qi_on_kill', value: 0.5 } },
          ],
        },
        {
          id: 'lock',
          label: '冥王·锁魂',
          effects: [
            { kind: 'status_boost', duration: 1 },
            { kind: 'status_unlock', status: { statusId: 'shred', duration: 2, value: 0.8 } },
          ],
        },
      ],
    },
  ]),
  zeus: track([
    { label: '神盾座', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '雷云', effects: [{ kind: 'rating', stat: 'masteryRating', value: 8 }] },
    {
      label: '天罚岔路',
      effects: [],
      branches: [
        {
          id: 'bolt',
          label: '天罚·贯列',
          effects: [{ kind: 'skill_mult', delta: 0.14 }],
        },
        {
          id: 'daze',
          label: '天罚·眩雷',
          effects: [{ kind: 'status_unlock', status: { statusId: 'stun', duration: 1 } }],
        },
      ],
    },
    { label: '王权', effects: [{ kind: 'skill_mult', delta: 0.12 }] },
    { label: '连雷', effects: [{ kind: 'enable_follow_up', chance: 0.28, multiplier: 0.5 }] },
    {
      label: '奥林匹斯',
      effects: [{ kind: 'rating', stat: 'critRating', value: 8 }],
      branches: [
        {
          id: 'throne',
          label: '宙斯·万雷',
          effects: [
            { kind: 'skill_mult', delta: 0.18 },
            { kind: 'effect_unlock', effect: { kind: 'refund_qi_on_kill', value: 0.35 } },
          ],
        },
        {
          id: 'judge',
          label: '宙斯·天判',
          effects: [
            { kind: 'status_unlock', status: { statusId: 'stun', duration: 1 } },
            { kind: 'effect_unlock', effect: { kind: 'execute', value: 0.26, multiplier: 1.3 } },
          ],
        },
      ],
    },
  ]),
  odin: track([
    { label: '两只乌鸦', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '挂树', effects: [{ kind: 'rating', stat: 'fortuneRating', value: 10 }] },
    {
      label: '求知岔路',
      effects: [],
      branches: [
        {
          id: 'rune',
          label: '求知·卢恩',
          effects: [{ kind: 'effect_unlock', effect: { kind: 'ally_grant_qi', value: 14 } }],
        },
        {
          id: 'sight',
          label: '求知·预言',
          effects: [
            { kind: 'rating', stat: 'fortuneRating', value: 8 },
            { kind: 'status_boost', valueMult: 0.9 },
          ],
        },
      ],
    },
    { label: '冈格尼尔', effects: [{ kind: 'status_boost', valueMult: 0.9, duration: 1 }] },
    { label: '独眼', effects: [{ kind: 'rating', stat: 'masteryRating', value: 10 }] },
    {
      label: '众神之父',
      effects: [{ kind: 'qi_cost', delta: -4 }],
      branches: [
        {
          id: 'hall',
          label: '奥丁·英灵殿',
          effects: [
            { kind: 'effect_unlock', effect: { kind: 'team_shield', multiplier: 0.36 } },
            { kind: 'effect_unlock', effect: { kind: 'ally_grant_qi', value: 20 } },
          ],
        },
        {
          id: 'bind',
          label: '奥丁·缚名',
          effects: [{ kind: 'status_unlock', status: { statusId: 'silence', duration: 1 } }],
        },
      ],
    },
  ]),
  yuefei: track([
    { label: '岳家枪', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '直捣黄龙', effects: [{ kind: 'rating', stat: 'critRating', value: 8 }] },
    {
      label: '精忠',
      effects: [],
      branches: [
        fork('strike', '连斩', '精忠·连斩', [
          { kind: 'enable_follow_up', chance: 0.34, multiplier: 0.66 },
        ]),
        fork('guard', '护军', '精忠·护军', [
          { kind: 'effect_unlock', effect: { kind: 'team_shield', multiplier: 0.32 } },
        ]),
      ],
    },
    { label: '还我河山', effects: [{ kind: 'skill_mult', delta: 0.15 }] },
    { label: '朱仙镇', effects: [{ kind: 'qi_cost', delta: -5 }] },
    {
      label: '精忠报国',
      effects: [{ kind: 'rating', stat: 'critDmgRating', value: 8 }],
      branches: [
        fork('traitor', '连斩', '报国·斩奸', [
          { kind: 'effect_unlock', effect: { kind: 'execute', value: 0.3, multiplier: 1.45 } },
          { kind: 'effect_unlock', effect: { kind: 'refund_qi_on_kill', value: 0.4 } },
        ]),
        fork('lyric', '护军', '报国·满江红', [
          { kind: 'effect_unlock', effect: { kind: 'team_shield', multiplier: 0.5 } },
          { kind: 'effect_unlock', effect: { kind: 'ally_grant_qi', value: 14 } },
        ]),
      ],
    },
  ]),
  jiangziya: track([
    { label: '渭水', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '直钩', effects: [{ kind: 'rating', stat: 'fortuneRating', value: 8 }] },
    {
      label: '封神',
      effects: [],
      branches: [
        fork('list', '锁名', '封神·榜上有名', [{ kind: 'status_boost', duration: 1 }]),
        fork('whip', '敕封', '封神·敕封', [
          { kind: 'effect_unlock', effect: { kind: 'ally_grant_qi', value: 14 } },
        ]),
      ],
    },
    { label: '封神台', effects: [{ kind: 'skill_mult', delta: 0.1 }] },
    { label: '敕令', effects: [{ kind: 'rating', stat: 'masteryRating', value: 10 }] },
    {
      label: '姜尚',
      effects: [{ kind: 'qi_cost', delta: -4 }],
      branches: [
        fork('seal', '锁名', '封神·锁名', [
          { kind: 'status_boost', duration: 1 },
          { kind: 'status_unlock', status: { statusId: 'slow', duration: 2 } },
        ]),
        fork('decree', '敕封', '姜尚·敕令', [
          { kind: 'effect_unlock', effect: { kind: 'team_shield', multiplier: 0.34 } },
          { kind: 'effect_unlock', effect: { kind: 'ally_grant_qi', value: 18 } },
        ]),
      ],
    },
  ]),
  ...KNIFE2_BATCH1_COMPILED.stars,
};
