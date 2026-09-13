/**
 * 职能破境轨：修为肉身（评级 / 稀有属性），不挂招式神通。
 * 升星才改怎么打（斩杀、涅槃、招魂）；破境只改这具身子怎么扛、怎么会心。
 */
import type { Role } from '../shared/types.js';
import { BREAKTHROUGH_LABELS } from './realmLadder.js';
import type { StarNodeEffect } from './starTypes.js';

export interface BreakthroughPerkDef {
  tier: number;
  label: string;
  effects: StarNodeEffect[];
}

type Step = { short: string; effects: StarNodeEffect[] };

function compile(steps: readonly Step[]): BreakthroughPerkDef[] {
  if (steps.length !== BREAKTHROUGH_LABELS.length - 1) {
    throw new Error(`role breakthrough must cover ${BREAKTHROUGH_LABELS.length - 1} realms`);
  }
  return steps.map((s, i) => ({
    tier: i + 1,
    label: `${BREAKTHROUGH_LABELS[i + 1]}·${s.short}`,
    effects: s.effects,
  }));
}

const r = (stat: 'critRating' | 'critDmgRating' | 'penRating' | 'masteryRating' | 'tenacityRating' | 'fortuneRating', value: number): StarNodeEffect =>
  ({ kind: 'rating', stat, value });
const q = (stat: 'lifesteal' | 'dodge' | 'block' | 'counter' | 'resilience' | 'echo' | 'thorns', value: number): StarNodeEffect =>
  ({ kind: 'rare_stat', stat, value });

/** 坦克：格挡 / 坚韧 / 不屈 */
const TANK = compile([
  { short: '铁脉', effects: [r('tenacityRating', 8)] },
  { short: '厚土', effects: [q('block', 0.03)] },
  { short: '沉肩', effects: [r('tenacityRating', 6)] },
  { short: '金骨', effects: [q('block', 0.03), r('tenacityRating', 4)] },
  { short: '凝躯', effects: [q('resilience', 0.08)] },
  { short: '不灭', effects: [r('tenacityRating', 10), q('block', 0.02)] },
  { short: '反刺', effects: [q('thorns', 0.06)] },
  { short: '铁壁', effects: [q('block', 0.04)] },
  { short: '磐石', effects: [r('tenacityRating', 12)] },
  { short: '劫骨', effects: [q('resilience', 0.1)] },
  { short: '散劲', effects: [r('tenacityRating', 8)] },
  { short: '福体', effects: [q('block', 0.03)] },
  { short: '天骨', effects: [r('tenacityRating', 10)] },
  { short: '不坏', effects: [q('block', 0.04), r('tenacityRating', 8)] },
  { short: '太岳', effects: [q('resilience', 0.08)] },
  { short: '罗城', effects: [r('tenacityRating', 12), q('block', 0.05)] },
]);

/** 单体爆发：暴击 / 暴伤 / 穿透 */
const ST_BURST = compile([
  { short: '开锋', effects: [r('critRating', 8)] },
  { short: '开眼', effects: [r('critRating', 6), r('fortuneRating', 4)] },
  { short: '清刃', effects: [r('penRating', 6)] },
  { short: '锋芒', effects: [r('critDmgRating', 8)] },
  { short: '杀意', effects: [r('critRating', 8)] },
  { short: '破霄', effects: [r('critRating', 10), r('critDmgRating', 6)] },
  { short: '饮血', effects: [q('lifesteal', 0.03)] },
  { short: '贯体', effects: [r('penRating', 8)] },
  { short: '会心', effects: [r('critRating', 10)] },
  { short: '劫锋', effects: [r('critDmgRating', 10)] },
  { short: '游刃', effects: [r('penRating', 8)] },
  { short: '饮胜', effects: [q('lifesteal', 0.03)] },
  { short: '天目', effects: [r('critRating', 10)] },
  { short: '金芒', effects: [r('critDmgRating', 10)] },
  { short: '太杀', effects: [r('critRating', 8), r('penRating', 6)] },
  { short: '一击', effects: [r('critRating', 12), r('critDmgRating', 10)] },
]);

/** 群攻：精通 / 穿透 / 会心 */
const AOE_DPS = compile([
  { short: '横脉', effects: [r('masteryRating', 8)] },
  { short: '开眼', effects: [r('critRating', 6)] },
  { short: '清息', effects: [r('penRating', 6)] },
  { short: '锋阵', effects: [r('masteryRating', 8)] },
  { short: '杀意', effects: [r('critRating', 8)] },
  { short: '破霄', effects: [r('critRating', 8), r('masteryRating', 6)] },
  { short: '分影', effects: [r('penRating', 8)] },
  { short: '同势', effects: [r('masteryRating', 8)] },
  { short: '道韵', effects: [r('masteryRating', 10)] },
  { short: '劫锋', effects: [r('critDmgRating', 8)] },
  { short: '游身', effects: [r('penRating', 8)] },
  { short: '福锋', effects: [r('critRating', 8)] },
  { short: '天目', effects: [r('masteryRating', 10)] },
  { short: '金芒', effects: [r('critDmgRating', 8)] },
  { short: '太杀', effects: [r('critRating', 8), r('penRating', 6)] },
  { short: '屠阵', effects: [r('critRating', 10), r('masteryRating', 10)] },
]);

/** 单控：精通 / 气运 / 坚韧 */
const ST_CTRL = compile([
  { short: '通脉', effects: [r('masteryRating', 8)] },
  { short: '开眼', effects: [r('fortuneRating', 8)] },
  { short: '清神', effects: [r('tenacityRating', 6)] },
  { short: '符胎', effects: [r('masteryRating', 8)] },
  { short: '凝神', effects: [r('fortuneRating', 8)] },
  { short: '定魂', effects: [r('masteryRating', 10)] },
  { short: '虚印', effects: [r('tenacityRating', 8)] },
  { short: '同息', effects: [r('fortuneRating', 8)] },
  { short: '道韵', effects: [r('masteryRating', 10)] },
  { short: '劫定', effects: [r('tenacityRating', 8)] },
  { short: '散念', effects: [r('fortuneRating', 8)] },
  { short: '福心', effects: [r('masteryRating', 8)] },
  { short: '天目', effects: [r('fortuneRating', 10)] },
  { short: '金符', effects: [r('masteryRating', 10)] },
  { short: '太定', effects: [r('tenacityRating', 10)] },
  { short: '镇岳', effects: [r('masteryRating', 12), r('fortuneRating', 8)] },
]);

/** 群控：精通 / 气运 */
const AOE_CTRL = compile([
  { short: '通脉', effects: [r('masteryRating', 8)] },
  { short: '开眼', effects: [r('fortuneRating', 8)] },
  { short: '清神', effects: [r('masteryRating', 6)] },
  { short: '乱胎', effects: [r('fortuneRating', 8)] },
  { short: '凝神', effects: [r('masteryRating', 8)] },
  { short: '乱魂', effects: [r('fortuneRating', 10)] },
  { short: '虚印', effects: [r('masteryRating', 8)] },
  { short: '同乱', effects: [r('fortuneRating', 8)] },
  { short: '道韵', effects: [r('masteryRating', 10)] },
  { short: '劫心', effects: [r('fortuneRating', 8)] },
  { short: '散念', effects: [r('masteryRating', 8)] },
  { short: '福心', effects: [r('fortuneRating', 8)] },
  { short: '天目', effects: [r('masteryRating', 10)] },
  { short: '金符', effects: [r('fortuneRating', 10)] },
  { short: '太乱', effects: [r('masteryRating', 10)] },
  { short: '封天', effects: [r('masteryRating', 12), r('fortuneRating', 8)] },
]);

/** 增幅：精通 / 气运 */
const GROUP_AMP = compile([
  { short: '通脉', effects: [r('masteryRating', 8)] },
  { short: '开眼', effects: [r('fortuneRating', 6)] },
  { short: '清阵', effects: [r('masteryRating', 6)] },
  { short: '破胎', effects: [r('masteryRating', 8)] },
  { short: '凝神', effects: [r('fortuneRating', 8)] },
  { short: '破霄', effects: [r('masteryRating', 10)] },
  { short: '虚辅', effects: [r('fortuneRating', 8)] },
  { short: '同息', effects: [r('masteryRating', 8)] },
  { short: '道韵', effects: [r('masteryRating', 10)] },
  { short: '劫辅', effects: [r('fortuneRating', 8)] },
  { short: '散势', effects: [r('masteryRating', 8)] },
  { short: '福阵', effects: [r('fortuneRating', 8)] },
  { short: '天机', effects: [r('masteryRating', 10)] },
  { short: '金略', effects: [r('fortuneRating', 10)] },
  { short: '太辅', effects: [r('masteryRating', 10)] },
  { short: '枢机', effects: [r('masteryRating', 12), r('fortuneRating', 8)] },
]);

/** 单奶：精通 / 气运 */
const ST_HEAL = compile([
  { short: '青脉', effects: [r('masteryRating', 8)] },
  { short: '开眼', effects: [r('fortuneRating', 6)] },
  { short: '清体', effects: [r('masteryRating', 6)] },
  { short: '丹胎', effects: [r('fortuneRating', 8)] },
  { short: '凝神', effects: [r('masteryRating', 8)] },
  { short: '慈息', effects: [r('fortuneRating', 10)] },
  { short: '虚济', effects: [r('masteryRating', 8)] },
  { short: '同息', effects: [r('fortuneRating', 8)] },
  { short: '道韵', effects: [r('masteryRating', 10)] },
  { short: '劫余', effects: [r('fortuneRating', 8)] },
  { short: '散济', effects: [r('masteryRating', 8)] },
  { short: '福地', effects: [r('fortuneRating', 8)] },
  { short: '天心', effects: [r('masteryRating', 10)] },
  { short: '金囊', effects: [r('fortuneRating', 10)] },
  { short: '太慈', effects: [r('masteryRating', 10)] },
  { short: '慈航', effects: [r('masteryRating', 12), r('fortuneRating', 8)] },
]);

/** 群奶：精通 / 气运 */
const AOE_HEAL = compile([
  { short: '普脉', effects: [r('masteryRating', 8)] },
  { short: '开眼', effects: [r('fortuneRating', 6)] },
  { short: '清体', effects: [r('masteryRating', 6)] },
  { short: '丹胎', effects: [r('fortuneRating', 8)] },
  { short: '凝神', effects: [r('masteryRating', 8)] },
  { short: '普济', effects: [r('fortuneRating', 10)] },
  { short: '虚济', effects: [r('masteryRating', 8)] },
  { short: '同息', effects: [r('fortuneRating', 8)] },
  { short: '道韵', effects: [r('masteryRating', 10)] },
  { short: '劫余', effects: [r('fortuneRating', 8)] },
  { short: '散济', effects: [r('masteryRating', 8)] },
  { short: '福地', effects: [r('fortuneRating', 8)] },
  { short: '天心', effects: [r('masteryRating', 10)] },
  { short: '金囊', effects: [r('fortuneRating', 10)] },
  { short: '太慈', effects: [r('masteryRating', 10)] },
  { short: '普度', effects: [r('masteryRating', 12), r('fortuneRating', 8)] },
]);

/** 全能：会心 + 精通 + 气运 */
const FLEX = compile([
  { short: '通脉', effects: [r('masteryRating', 8)] },
  { short: '开眼', effects: [r('critRating', 6), r('fortuneRating', 6)] },
  { short: '清体', effects: [q('dodge', 0.03)] },
  { short: '锋胎', effects: [r('penRating', 6)] },
  { short: '凝神', effects: [r('tenacityRating', 8)] },
  { short: '破妄', effects: [r('critRating', 8), r('masteryRating', 6)] },
  { short: '分影', effects: [r('penRating', 8)] },
  { short: '同息', effects: [q('echo', 0.03)] },
  { short: '道韵', effects: [r('masteryRating', 10)] },
  { short: '劫余', effects: [q('resilience', 0.08)] },
  { short: '游身', effects: [q('dodge', 0.03)] },
  { short: '福地', effects: [r('fortuneRating', 8)] },
  { short: '天目', effects: [r('critRating', 8)] },
  { short: '不坏', effects: [r('tenacityRating', 10)] },
  { short: '凝元', effects: [r('masteryRating', 10)] },
  { short: '一念', effects: [r('critRating', 10), r('masteryRating', 8)] },
]);

export const ROLE_BREAKTHROUGH_LADDERS: Record<Role, BreakthroughPerkDef[]> = {
  tank: TANK,
  st_burst: ST_BURST,
  aoe_dps: AOE_DPS,
  st_ctrl: ST_CTRL,
  aoe_ctrl: AOE_CTRL,
  group_amp: GROUP_AMP,
  st_heal: ST_HEAL,
  aoe_heal: AOE_HEAL,
  flex: FLEX,
};

export function roleBreakthroughPerk(role: Role, tier: number): BreakthroughPerkDef | undefined {
  return (ROLE_BREAKTHROUGH_LADDERS[role] ?? FLEX).find((p) => p.tier === tier);
}
