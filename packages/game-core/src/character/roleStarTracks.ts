/**
 * 职能默认星轨：每星 = 底子微幅 + 一条定位被动（能力池）。
 * ★3 / ★6 必须是身份神通，禁止九轨都走加深/省元。
 * 深做卡有个性轨时仍用典故名；纯属性星会叠本表的被动。
 */
import type { Role } from '../shared/types.js';
import { effectsFromAbilityIds } from './abilityAtoms.js';
import type { StarNodeDef } from './starTypes.js';

function row(star: number, label: string, ids: readonly string[]): StarNodeDef {
  return { star, label, effects: effectsFromAbilityIds(ids) };
}

/** 坦克：格挡 / 结界 / 涅槃（不全员挂涅槃） */
const TANK: StarNodeDef[] = [
  row(1, '铁骨', ['a_main_pct_s', 'b_block']),
  row(2, '省元', ['a_main_pct_s', 'c_qi_cheap']),
  row(3, '结界', ['a_main_pct_s', 'h_shield_team']),
  row(4, '反刺', ['a_main_pct_m', 'b_thorns']),
  row(5, '涅槃', ['a_main_pct_m', 'm_revive_self']),
  row(6, '金身', ['a_main_pct_m', 'h_shield_team', 'b_block']),
];

/** 单体爆发：碎甲 / 连击 / 斩杀还元 */
const ST_BURST: StarNodeDef[] = [
  row(1, '碎甲', ['a_main_pct_s', 'e_vs_shield']),
  row(2, '会心', ['a_main_pct_s', 'b_crit']),
  row(3, '连势', ['a_main_pct_s', 'd_follow_s']),
  row(4, '嗜血', ['a_main_pct_m', 'b_lifesteal']),
  row(5, '流血', ['a_main_pct_m', 'f_bleed']),
  row(6, '斩杀', ['a_main_pct_m', 'e_execute', 'k_kill_refund']),
];

/** 群体攻击：横扫 / 先声 / 屠尽（破甲只留孙膑、公输班） */
const AOE_DPS: StarNodeDef[] = [
  row(1, '横扫', ['a_main_pct_s', 'c_mult_s']),
  row(2, '精通', ['a_main_pct_s', 'a_mastery_edge']),
  row(3, '连势', ['a_main_pct_s', 'd_follow_s']),
  row(4, '焚营', ['a_main_pct_m', 'e_first_cast']),
  row(5, '合围', ['a_main_pct_m', 'e_surround']),
  row(6, '屠尽', ['a_main_pct_m', 'd_follow_m', 'e_execute']),
];

/** 单体控制：符效 / 禁咒 / 镇岳 */
const ST_CTRL: StarNodeDef[] = [
  row(1, '符效', ['a_main_pct_s', 'c_status_power']),
  row(2, '省元', ['a_main_pct_s', 'c_qi_cheap']),
  row(3, '禁咒', ['a_main_pct_s', 'g_silence']),
  row(4, '加深', ['a_main_pct_m', 'c_mult_s']),
  row(5, '封脉', ['a_main_pct_m', 'g_silence']),
  row(6, '镇岳', ['a_main_pct_m', 'g_stun']),
];

/** 群体控制：乱心 / 封技 */
const AOE_CTRL: StarNodeDef[] = [
  row(1, '横扫', ['a_main_pct_s', 'c_mult_s']),
  row(2, '符效', ['a_main_pct_s', 'c_status_power']),
  row(3, '乱心', ['a_main_pct_s', 'g_havoc']),
  row(4, '省元', ['a_main_pct_m', 'c_qi_cheap']),
  row(5, '连势', ['a_main_pct_m', 'd_follow_s']),
  row(6, '封技', ['a_main_pct_m', 'g_silence']),
];

/** 群体增幅：合围 / 济元 / 结界 */
const GROUP_AMP: StarNodeDef[] = [
  row(1, '破阵', ['a_main_pct_s', 'c_mult_s']),
  row(2, '符效', ['a_main_pct_s', 'c_status_power']),
  row(3, '济元', ['a_main_pct_s', 'k_ally_qi']),
  row(4, '合围', ['a_main_pct_m', 'e_surround']),
  row(5, '先声', ['a_main_pct_m', 'e_first_cast']),
  row(6, '结界', ['a_main_pct_m', 'h_shield_team', 'k_ally_qi']),
];

/** 单体治疗：残血 / 净化 / 招魂 */
const ST_HEAL: StarNodeDef[] = [
  row(1, '残血', ['a_main_pct_s', 'i_heal_low']),
  row(2, '省元', ['a_main_pct_s', 'c_qi_cheap']),
  row(3, '净化', ['a_main_pct_s', 'i_cleanse']),
  row(4, '济元', ['a_main_pct_m', 'k_ally_qi']),
  row(5, '招魂', ['a_main_pct_m', 'm_revive_ally']),
  row(6, '慈航', ['a_main_pct_m', 'i_heal_low', 'c_mult_s']),
];

/** 群体治疗：净化 / 结界 / 招魂 */
const AOE_HEAL: StarNodeDef[] = [
  row(1, '横济', ['a_main_pct_s', 'c_mult_s']),
  row(2, '残血', ['a_main_pct_s', 'i_heal_low']),
  row(3, '净化', ['a_main_pct_s', 'i_cleanse']),
  row(4, '济元', ['a_main_pct_m', 'k_ally_qi']),
  row(5, '招魂', ['a_main_pct_m', 'm_revive_ally']),
  row(6, '结界', ['a_main_pct_m', 'h_shield_team', 'c_mult_s']),
];

/** 全能 / 主角回落 */
const FLEX: StarNodeDef[] = [
  row(1, '问招', ['a_main_pct_s', 'c_mult_s']),
  row(2, '省元', ['a_main_pct_s', 'c_qi_cheap']),
  row(3, '连势', ['a_main_pct_s', 'd_follow_s']),
  row(4, '先声', ['a_main_pct_m', 'e_first_cast']),
  row(5, '开眼', ['a_main_pct_m', 'e_first_cast']),
  row(6, '破妄', ['a_main_pct_m', 'j_purge', 'c_mult_s']),
];

export const ROLE_STAR_LADDERS: Record<Role, StarNodeDef[]> = {
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

export function roleStarNodes(role: Role): StarNodeDef[] {
  return ROLE_STAR_LADDERS[role] ?? FLEX;
}

export function roleStarNode(role: Role, star: number): StarNodeDef | undefined {
  return roleStarNodes(role).find((n) => n.star === star);
}
