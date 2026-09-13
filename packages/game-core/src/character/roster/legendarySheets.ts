/**
 * 绝品刀二：母题卡 → 招牌补丁 + 六星星章。
 * ★3 选定技能分支，★6 沿这条跟跑；分支零件互斥。
 */
import type { SkillDef } from '../../shared/types.js';
import { effectsFromAbilityIds } from '../abilityAtoms.js';
import type { StarBranchDef, StarNodeDef, StarNodeEffect } from '../starTypes.js';

type EffectRow = {
  label: string;
  abilityIds?: readonly string[];
  extra?: StarNodeEffect[];
};

type IdentityDef = {
  id: string;
  label: string;
  star3: EffectRow;
  star6: EffectRow;
};

type StarRow = {
  label: string;
  abilityIds?: readonly string[];
  extra?: StarNodeEffect[];
};

export interface LegendarySheet {
  templateId: string;
  motif: string;
  verb: string;
  skill: Partial<SkillDef> & { name: string; blurb: string };
  identities: readonly IdentityDef[];
  stars: readonly StarRow[];
}

function compileEffects(abilityIds?: readonly string[], extra?: StarNodeEffect[]): StarNodeEffect[] {
  const fromAtoms = abilityIds ? effectsFromAbilityIds(abilityIds) : [];
  return [...fromAtoms, ...(extra ?? [])];
}

function compileStars(sheet: LegendarySheet): Partial<Record<number, StarNodeDef>> {
  if (sheet.stars.length !== 6) throw new Error(`${sheet.templateId} stars ${sheet.stars.length}`);
  if (sheet.identities.length !== 2) {
    throw new Error(`${sheet.templateId} needs 2 identities`);
  }
  const out: Partial<Record<number, StarNodeDef>> = {};
  sheet.stars.forEach((row, i) => {
    const star = i + 1;
    out[star] = {
      star,
      label: row.label,
      effects: compileEffects(row.abilityIds, row.extra),
    };
  });
  out[3] = {
    star: 3,
    label: sheet.stars[2]!.label,
    effects: [],
    branches: sheet.identities.map((id) => ({
      id: id.id,
      label: id.star3.label,
      identityLabel: id.label,
      effects: compileEffects(id.star3.abilityIds, id.star3.extra),
    })),
  };
  out[6] = {
    star: 6,
    label: sheet.stars[5]!.label,
    effects: [],
    branches: sheet.identities.map((id) => ({
      id: id.id,
      label: id.star6.label,
      identityLabel: id.label,
      effects: compileEffects(id.star6.abilityIds, id.star6.extra),
    } satisfies StarBranchDef)),
  };
  return out;
}

export function compileLegendarySheets(sheets: readonly LegendarySheet[]): {
  skills: Record<string, Partial<SkillDef>>;
  stars: Record<string, Partial<Record<number, StarNodeDef>>>;
} {
  const skills: Record<string, Partial<SkillDef>> = {};
  const stars: Record<string, Partial<Record<number, StarNodeDef>>> = {};
  for (const sheet of sheets) {
    skills[`skill_${sheet.templateId}`] = sheet.skill;
    stars[sheet.templateId] = compileStars(sheet);
  }
  return { skills, stars };
}

export const KNIFE2_BATCH1: readonly LegendarySheet[] = [
  {
    templateId: 'liubei',
    motif: '仁德聚义',
    verb: '济',
    skill: {
      name: '桃园结义',
      blurb: '仁义聚义：抬起全队气血，残血处再多抬一截；25% 给友军灌一大口气。有人倒下时，本招转向招魂。',
      targetPattern: 'all',
      tags: ['heal', 'aoe'],
      multiplier: 0.72,
      qiCost: 50,
      applyStatus: [],
      effects: [
        { kind: 'heal_low_hp', value: 0.4, multiplier: 1.22 },
        { kind: 'ally_grant_qi', value: 56, chance: 0.25 },
      ],
      damageSchool: 'spirit',
      aiWeight: 0.72,
      softModes: [
        {
          when: { kind: 'ally_downed' },
          then: { reviveAlly: { hpRatio: 0.32 } },
          copy: '有倒地：桃园招魂',
        },
      ],
    },
    identities: [
      {
        id: 'heal',
        label: '济世',
        star3: { label: '仁德·济世', abilityIds: ['i_cleanse', 'c_mult_s'] },
        star6: { label: '汉中王·托孤', abilityIds: ['m_revive_ally', 'c_mult_s'] },
      },
      {
        id: 'ward',
        label: '护民',
        star3: { label: '仁德·护民', abilityIds: ['h_shield_team'] },
        star6: {
          label: '汉中王·仁政',
          abilityIds: ['c_mult_s'],
          extra: [{ kind: 'effect_unlock', effect: { kind: 'team_shield', multiplier: 0.55 } }],
        },
      },
    ],
    stars: [
      {
        label: '桃园',
        abilityIds: ['a_main_pct_s'],
        extra: [
          { kind: 'effect_unlock', effect: { kind: 'heal_low_hp', value: 0.4, multiplier: 1.28 } },
        ],
      },
      {
        label: '三顾',
        abilityIds: ['c_qi_cheap'],
        extra: [{ kind: 'effect_unlock', effect: { kind: 'ally_grant_qi', value: 64, chance: 0.25 } }],
      },
      { label: '仁德' },
      {
        label: '入川',
        abilityIds: ['a_main_pct_m'],
        extra: [
          { kind: 'effect_unlock', effect: { kind: 'heal_low_hp', value: 0.4, multiplier: 1.35 } },
        ],
      },
      { label: '白帝', abilityIds: ['a_main_pct_m', 'k_ally_qi'] },
      { label: '汉中王' },
    ],
  },
  {
    templateId: 'pangtong',
    motif: '落凤坡连环营',
    verb: '破',
    skill: {
      name: '落凤坡',
      blurb: '点破一名敌人并迟缓；合围时伤害再加一截。已迟缓时连环营燃起灼魂。',
      targetPattern: 'single',
      tags: ['damage'],
      multiplier: 1.05,
      qiCost: 50,
      applyStatus: [{ statusId: 'slow', duration: 2 }],
      effects: [{ kind: 'surround', multiplier: 1.2 }, { kind: 'self_atk_up' }],
      damageSchool: 'spirit',
      aiWeight: 0.55,
      softModes: [
        {
          when: { kind: 'target_has_status', statusId: 'slow' },
          then: { statusPatches: [{ statusId: 'burn', duration: 2, layers: 1, value: 0.03 }] },
          copy: '迟缓目标：连环灼魂',
        },
      ],
    },
    identities: [
      {
        id: 'siege',
        label: '围城',
        star3: {
          label: '连环·围城',
          abilityIds: ['c_status_power'],
          extra: [{ kind: 'status_boost', duration: 1 }],
        },
        star6: {
          label: '副军师·连营',
          extra: [
            { kind: 'status_boost', duration: 1 },
            { kind: 'effect_unlock', effect: { kind: 'surround', multiplier: 1.35 } },
          ],
        },
      },
      {
        id: 'fire',
        label: '火攻',
        star3: { label: '连环·火攻', abilityIds: ['f_burn', 'e_first_cast'] },
        star6: {
          label: '副军师·落凤',
          abilityIds: ['c_mult_s'],
          extra: [{ kind: 'skill_mult', delta: 0.12 }],
        },
      },
    ],
    stars: [
      { label: '凤雏', abilityIds: ['a_main_pct_s', 'c_mult_s'] },
      { label: '耒阳', abilityIds: ['a_main_pct_s', 'c_qi_cheap'] },
      { label: '连环' },
      { label: '落凤', abilityIds: ['a_main_pct_m', 'c_mult_s'] },
      { label: '西川', abilityIds: ['a_main_pct_m', 'c_status_power'] },
      { label: '副军师' },
    ],
  },
  {
    templateId: 'niumowang',
    motif: '混世魔王',
    verb: '守',
    skill: {
      name: '混世魔王',
      blurb: '怒喝锁住焦点并为自己叠盾；自己残血时魔王反震，盾与棒都更狠。',
      targetPattern: 'single',
      tags: ['guard'],
      multiplier: 1.22,
      qiCost: 45,
      applyStatus: [
        { statusId: 'taunt', duration: 2 },
        { statusId: 'shield', duration: 99, value: 0.9 },
      ],
      effects: [{ kind: 'self_low_hp', value: 0.4, multiplier: 1.2 }],
      damageSchool: 'phys',
      aiWeight: 0.5,
      softModes: [
        {
          when: { kind: 'self_hp_below', value: 0.4 },
          then: { multiplierDelta: 0.14, effectPatches: [{ kind: 'self_low_hp', value: 0.4, multiplier: 1.38 }] },
          copy: '残血：魔王反震',
        },
      ],
    },
    identities: [
      {
        id: 'hold',
        label: '镇洞',
        star3: { label: '平天·镇洞', abilityIds: ['h_shield_team', 'b_block'] },
        star6: {
          label: '牛王·金甲',
          abilityIds: ['b_block'],
          extra: [{ kind: 'effect_unlock', effect: { kind: 'team_shield', multiplier: 0.55 } }],
        },
      },
      {
        id: 'fan',
        label: '夺扇',
        star3: {
          label: '平天·夺扇',
          abilityIds: ['b_thorns'],
          extra: [{ kind: 'status_boost', duration: 1 }],
        },
        star6: { label: '牛王·涅槃', abilityIds: ['m_revive_self', 'b_lifesteal'] },
      },
    ],
    stars: [
      { label: '牛魔', abilityIds: ['a_main_pct_s', 'b_block'] },
      { label: '芭蕉洞', abilityIds: ['a_main_pct_s', 'c_qi_cheap'] },
      { label: '平天' },
      { label: '反刺', abilityIds: ['a_main_pct_m', 'b_thorns'] },
      { label: '魔王', abilityIds: ['a_main_pct_m', 'a_hp_pct'] },
      { label: '牛王' },
    ],
  },
  {
    templateId: 'tangseng',
    motif: '金蝉西行',
    verb: '济',
    skill: {
      name: '紧箍咒',
      blurb: '为最残的人抬血，残血处多抬；25% 再灌一口紧箍元气。有人倒下时转向招魂。',
      targetPattern: 'single',
      tags: ['heal'],
      multiplier: 1.28,
      qiCost: 48,
      applyStatus: [],
      effects: [
        { kind: 'heal_low_hp', value: 0.4, multiplier: 1.3 },
        { kind: 'ally_grant_qi', value: 48, chance: 0.25 },
      ],
      damageSchool: 'spirit',
      aiWeight: 0.75,
      softModes: [
        {
          when: { kind: 'ally_downed' },
          then: { reviveAlly: { hpRatio: 0.28 } },
          copy: '有倒地：紧箍招魂',
        },
      ],
    },
    identities: [
      {
        id: 'open',
        label: '开光',
        star3: { label: '紧箍·开光', abilityIds: ['i_cleanse', 'c_mult_s'] },
        star6: { label: '西天·不散', abilityIds: ['m_revive_ally', 'c_mult_s'] },
      },
      {
        id: 'gold',
        label: '金身',
        star3: { label: '紧箍·金身', abilityIds: ['h_shield_team', 'c_qi_cheap'] },
        star6: {
          label: '西天·普渡',
          abilityIds: ['c_qi_cheap'],
          extra: [{ kind: 'effect_unlock', effect: { kind: 'team_shield', multiplier: 0.55 } }],
        },
      },
    ],
    stars: [
      { label: '金蝉', abilityIds: ['a_main_pct_s', 'c_mult_s'] },
      { label: '收徒', abilityIds: ['a_main_pct_s', 'c_qi_cheap'] },
      { label: '紧箍' },
      { label: '西行', abilityIds: ['a_main_pct_m', 'k_ally_qi'] },
      { label: '取经', abilityIds: ['a_main_pct_m', 'c_mult_s'] },
      { label: '西天' },
    ],
  },
  {
    templateId: 'tieshan',
    motif: '芭蕉扇灭火',
    verb: '慑',
    skill: {
      name: '芭蕉扇',
      blurb: '横扫前排，封招并迟缓。已迟缓的人再被扇中，封招咬得更死。',
      targetPattern: 'row_front',
      tags: ['aoe', 'damage'],
      multiplier: 1.08,
      qiCost: 52,
      applyStatus: [
        { statusId: 'silence', duration: 1 },
        { statusId: 'slow', duration: 2 },
      ],
      effects: [],
      damageSchool: 'spirit',
      aiWeight: 0.55,
      softModes: [
        {
          when: { kind: 'target_has_status', statusId: 'slow' },
          then: { statusPatches: [{ statusId: 'silence', duration: 1 }] },
          copy: '迟缓目标：封招咬死',
        },
      ],
    },
    identities: [
      {
        id: 'seal',
        label: '封招',
        star3: {
          label: '借风·封招',
          abilityIds: ['c_status_power'],
          extra: [{ kind: 'status_boost', duration: 1 }],
        },
        star6: {
          label: '一扇·遮天',
          abilityIds: ['c_mult_s'],
          extra: [{ kind: 'pattern', pattern: 'all' }],
        },
      },
      {
        id: 'siphon',
        label: '抽息',
        star3: { label: '借风·抽息', abilityIds: ['k_qi_drought', 'e_first_cast'] },
        star6: { label: '一扇·风刃', abilityIds: ['d_follow_s', 'c_mult_s'] },
      },
    ],
    stars: [
      { label: '罗刹', abilityIds: ['a_main_pct_s', 'c_mult_s'] },
      { label: '芭蕉', abilityIds: ['a_main_pct_s', 'c_status_power'] },
      { label: '借风' },
      {
        label: '灭火',
        abilityIds: ['a_main_pct_m'],
        extra: [{ kind: 'status_boost', duration: 1 }],
      },
      { label: '魔息', abilityIds: ['a_main_pct_m', 'c_mult_s'] },
      { label: '一扇' },
    ],
  },
];

export const KNIFE2_BATCH1_IDS = KNIFE2_BATCH1.map((s) => s.templateId);

export const KNIFE2_BATCH1_COMPILED = compileLegendarySheets(KNIFE2_BATCH1);
