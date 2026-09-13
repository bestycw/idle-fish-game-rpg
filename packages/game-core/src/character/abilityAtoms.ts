/**
 * 能力池原子 → 星章效果。制作侧零件柜，玩家不养成本表。
 * 只收录现网可配（N 档）且已有 compose / 战斗钩子的条目。
 */
import type { StarNodeEffect } from './starTypes.js';

export type AbilityAtom = {
  id: string;
  label: string;
  effect: StarNodeEffect;
  extra?: StarNodeEffect[];
};

export const ABILITY_ATOMS: Record<string, AbilityAtom> = {
  a_main_pct_s: { id: 'a_main_pct_s', label: '底子微幅', effect: { kind: 'stat_pct', mainPct: 0.03 } },
  a_main_pct_m: { id: 'a_main_pct_m', label: '底子强化', effect: { kind: 'stat_pct', mainPct: 0.04 } },
  a_mastery_edge: {
    id: 'a_mastery_edge',
    label: '精通锋',
    effect: { kind: 'rating', stat: 'masteryRating', value: 8 },
  },
  b_crit: { id: 'b_crit', label: '会心', effect: { kind: 'rating', stat: 'critRating', value: 8 } },
  b_crit_dmg: {
    id: 'b_crit_dmg',
    label: '暴烈',
    effect: { kind: 'rating', stat: 'critDmgRating', value: 8 },
  },
  b_lifesteal: { id: 'b_lifesteal', label: '嗜血', effect: { kind: 'rare_stat', stat: 'lifesteal', value: 0.03 } },
  b_dodge: { id: 'b_dodge', label: '飘忽', effect: { kind: 'rare_stat', stat: 'dodge', value: 0.04 } },
  b_block: { id: 'b_block', label: '格挡', effect: { kind: 'rare_stat', stat: 'block', value: 0.04 } },
  b_counter: { id: 'b_counter', label: '反击', effect: { kind: 'rare_stat', stat: 'counter', value: 0.04 } },
  b_thorns: { id: 'b_thorns', label: '反刺', effect: { kind: 'rare_stat', stat: 'thorns', value: 0.08 } },
  b_resilience: {
    id: 'b_resilience',
    label: '不屈',
    effect: { kind: 'rare_stat', stat: 'resilience', value: 0.2 },
  },
  b_fortune: {
    id: 'b_fortune',
    label: '气运',
    effect: { kind: 'rating', stat: 'fortuneRating', value: 8 },
  },
  c_mult_s: { id: 'c_mult_s', label: '招式加深', effect: { kind: 'skill_mult', delta: 0.1 } },
  c_mult_m: { id: 'c_mult_m', label: '招式大成', effect: { kind: 'skill_mult', delta: 0.15 } },
  c_qi_cheap: { id: 'c_qi_cheap', label: '省元', effect: { kind: 'qi_cost', delta: -5 } },
  c_status_power: {
    id: 'c_status_power',
    label: '符效',
    effect: { kind: 'status_boost', valueMult: 0.92 },
  },
  d_follow_s: {
    id: 'd_follow_s',
    label: '连势',
    effect: { kind: 'enable_follow_up', chance: 0.25, multiplier: 0.55 },
  },
  d_follow_m: {
    id: 'd_follow_m',
    label: '连斩',
    effect: { kind: 'enable_follow_up', chance: 0.35, multiplier: 0.7 },
  },
  e_vs_shield: {
    id: 'e_vs_shield',
    label: '碎甲',
    effect: { kind: 'effect_unlock', effect: { kind: 'vs_shield', multiplier: 1.25 } },
  },
  e_first_cast: {
    id: 'e_first_cast',
    label: '先声',
    effect: { kind: 'effect_unlock', effect: { kind: 'first_cast', multiplier: 1.3 } },
  },
  e_execute: {
    id: 'e_execute',
    label: '斩杀',
    effect: { kind: 'effect_unlock', effect: { kind: 'execute', value: 0.3, multiplier: 1.4 } },
  },
  f_shred: {
    id: 'f_shred',
    label: '破甲',
    effect: { kind: 'status_unlock', status: { statusId: 'shred', duration: 2, value: 0.88 } },
  },
  f_shred_deep: {
    id: 'f_shred_deep',
    label: '碎铠',
    effect: { kind: 'status_boost', duration: 1, valueMult: 0.9 },
  },
  f_bleed: {
    id: 'f_bleed',
    label: '流血',
    effect: { kind: 'status_unlock', status: { statusId: 'bleed', duration: 2, layers: 1 } },
  },
  g_silence: {
    id: 'g_silence',
    label: '禁咒',
    effect: { kind: 'status_unlock', status: { statusId: 'silence', duration: 1, chance: 0.55 } },
  },
  g_stun: {
    id: 'g_stun',
    label: '镇岳',
    effect: { kind: 'status_unlock', status: { statusId: 'stun', duration: 1, chance: 0.4 } },
  },
  m_revive_self: {
    id: 'm_revive_self',
    label: '涅槃',
    effect: { kind: 'nirvana', hpRatio: 0.3 },
  },
  m_revive_ally: {
    id: 'm_revive_ally',
    label: '招魂',
    effect: { kind: 'effect_unlock', effect: { kind: 'revive_ally', value: 0.35 } },
  },
  h_shield_team: {
    id: 'h_shield_team',
    label: '结界',
    effect: { kind: 'effect_unlock', effect: { kind: 'team_shield', multiplier: 0.4 } },
  },
  i_heal_low: {
    id: 'i_heal_low',
    label: '残血加疗',
    effect: { kind: 'effect_unlock', effect: { kind: 'heal_low_hp', value: 0.4, multiplier: 1.4 } },
  },
  i_cleanse: {
    id: 'i_cleanse',
    label: '净化',
    effect: { kind: 'effect_unlock', effect: { kind: 'cleanse' } },
  },
  k_kill_refund: {
    id: 'k_kill_refund',
    label: '击杀还元',
    effect: { kind: 'effect_unlock', effect: { kind: 'refund_qi_on_kill', value: 0.45 } },
  },
  k_ally_qi: {
    id: 'k_ally_qi',
    label: '济元',
    effect: { kind: 'effect_unlock', effect: { kind: 'ally_grant_qi', value: 8 } },
  },
  k_grant_qi: {
    id: 'k_grant_qi',
    label: '赠气',
    effect: { kind: 'effect_unlock', effect: { kind: 'grant_qi', value: 10 } },
  },
  j_purge: {
    id: 'j_purge',
    label: '驱散',
    effect: { kind: 'effect_unlock', effect: { kind: 'purge' } },
  },
  f_slow: {
    id: 'f_slow',
    label: '迟滞',
    effect: { kind: 'status_unlock', status: { statusId: 'slow', duration: 2 } },
  },
  f_heal_block: {
    id: 'f_heal_block',
    label: '封疗',
    effect: { kind: 'status_unlock', status: { statusId: 'heal_block', duration: 2 } },
  },
  f_mark_prey: {
    id: 'f_mark_prey',
    label: '猎印',
    effect: { kind: 'status_unlock', status: { statusId: 'mark_prey', duration: 2, value: 1.15 } },
  },
  g_sleep: {
    id: 'g_sleep',
    label: '沉眠',
    effect: { kind: 'status_unlock', status: { statusId: 'sleep', duration: 1, chance: 0.35 } },
  },
  g_havoc: {
    id: 'g_havoc',
    label: '乱心',
    effect: { kind: 'status_unlock', status: { statusId: 'havoc', duration: 1, chance: 0.4 } },
  },
  g_berserk: {
    id: 'g_berserk',
    label: '狂乱',
    effect: { kind: 'status_unlock', status: { statusId: 'berserk', duration: 1, chance: 0.4 } },
  },
  h_shield: {
    id: 'h_shield',
    label: '护体',
    effect: { kind: 'effect_unlock', effect: { kind: 'self_shield', multiplier: 0.4 } },
  },
  h_atk_up: {
    id: 'h_atk_up',
    label: '加持',
    effect: { kind: 'effect_unlock', effect: { kind: 'self_atk_up' } },
  },
  h_def_up: {
    id: 'h_def_up',
    label: '铁壁咒',
    effect: { kind: 'effect_unlock', effect: { kind: 'self_def_up' } },
  },
  h_spd_up: {
    id: 'h_spd_up',
    label: '神行',
    effect: { kind: 'effect_unlock', effect: { kind: 'self_spd_up' } },
  },
  i_hot: {
    id: 'i_hot',
    label: '续命',
    effect: { kind: 'effect_unlock', effect: { kind: 'self_regen', value: 0.04 } },
  },
  i_heal_on_kill: {
    id: 'i_heal_on_kill',
    label: '饮胜',
    effect: { kind: 'effect_unlock', effect: { kind: 'heal_on_kill', value: 0.12 } },
  },
  e_vs_cc: {
    id: 'e_vs_cc',
    label: '乘乱',
    effect: { kind: 'effect_unlock', effect: { kind: 'vs_cc', multiplier: 1.25 } },
  },
  e_vs_high_hp: {
    id: 'e_vs_high_hp',
    label: '撼岳',
    effect: { kind: 'effect_unlock', effect: { kind: 'vs_high_hp', value: 0.65, multiplier: 1.25 } },
  },
  e_self_low: {
    id: 'e_self_low',
    label: '残血狂',
    effect: { kind: 'effect_unlock', effect: { kind: 'self_low_hp', value: 0.4, multiplier: 1.3 } },
  },
  e_vs_rank: {
    id: 'e_vs_rank',
    label: '镇煞',
    effect: { kind: 'effect_unlock', effect: { kind: 'vs_rank', multiplier: 1.22 } },
  },
  e_surround: {
    id: 'e_surround',
    label: '合围',
    effect: { kind: 'effect_unlock', effect: { kind: 'surround', multiplier: 1.2 } },
  },
  e_focus_streak: {
    id: 'e_focus_streak',
    label: '一鼓作气',
    effect: { kind: 'effect_unlock', effect: { kind: 'focus_streak', value: 0.08 } },
  },
  i_atonement: {
    id: 'i_atonement',
    label: '伤疗同源',
    effect: { kind: 'effect_unlock', effect: { kind: 'atonement', value: 0.22 } },
  },
  i_heal_from_taken: {
    id: 'i_heal_from_taken',
    label: '以伤回血',
    effect: { kind: 'effect_unlock', effect: { kind: 'heal_from_taken', value: 0.5 } },
  },
  h_stagger: {
    id: 'h_stagger',
    label: '卸力',
    effect: { kind: 'effect_unlock', effect: { kind: 'self_stagger' } },
  },
  h_earth_shield: {
    id: 'h_earth_shield',
    label: '受击回春',
    effect: { kind: 'effect_unlock', effect: { kind: 'self_earth_shield' } },
  },
  f_unstable: {
    id: 'f_unstable',
    label: '驱则反噬',
    effect: { kind: 'status_unlock', status: { statusId: 'unstable', duration: 3 } },
  },
  a_hp_pct: { id: 'a_hp_pct', label: '体魄', effect: { kind: 'split_stat', stat: 'hp', pct: 0.04 } },
  a_atk_phys: { id: 'a_atk_phys', label: '力势', effect: { kind: 'split_stat', stat: 'atk', pct: 0.04 } },
  a_atk_spirit: { id: 'a_atk_spirit', label: '灵机', effect: { kind: 'split_stat', stat: 'atk', pct: 0.04 } },
  a_def_phys: { id: 'a_def_phys', label: '铁骨', effect: { kind: 'split_stat', stat: 'def', pct: 0.04 } },
  a_def_spirit: { id: 'a_def_spirit', label: '定心', effect: { kind: 'split_stat', stat: 'res', pct: 0.04 } },
  a_spd_edge: { id: 'a_spd_edge', label: '先机', effect: { kind: 'split_stat', stat: 'spd', pct: 0.03 } },
  a_vers_wall: {
    id: 'a_vers_wall',
    label: '均衡壁',
    effect: { kind: 'rating', stat: 'tenacityRating', value: 8 },
  },
  a_final_edge: { id: 'a_final_edge', label: '终势', effect: { kind: 'final_dmg', value: 0.03 } },
  b_haste: { id: 'b_haste', label: '勤修', effect: { kind: 'qi_passive', basic: 6 } },
  b_crit_resist: {
    id: 'b_crit_resist',
    label: '沉着',
    effect: { kind: 'rare_stat', stat: 'critResist', value: 0.04 },
  },
  c_heal_mult: { id: 'c_heal_mult', label: '济世加深', effect: { kind: 'tag_mult', tag: 'heal', delta: 0.12 } },
  c_guard_mult: { id: 'c_guard_mult', label: '守势加深', effect: { kind: 'tag_mult', tag: 'guard', delta: 0.12 } },
  c_aoe_mult: { id: 'c_aoe_mult', label: '横扫加深', effect: { kind: 'tag_mult', tag: 'aoe', delta: 0.1 } },
  c_single_mult: { id: 'c_single_mult', label: '一点加深', effect: { kind: 'tag_mult', tag: 'single', delta: 0.12 } },
  d_follow_heal: {
    id: 'd_follow_heal',
    label: '连济',
    effect: { kind: 'effect_unlock', effect: { kind: 'follow_heal', value: 0.4 } },
  },
  d_follow_shred: {
    id: 'd_follow_shred',
    label: '连破',
    effect: { kind: 'enable_follow_up', chance: 0.28, multiplier: 0.55 },
    extra: [{ kind: 'status_unlock', status: { statusId: 'shred', duration: 2, value: 0.9 } }],
  },
  d_extra_hit_front: {
    id: 'd_extra_hit_front',
    label: '扫尾',
    effect: { kind: 'effect_unlock', effect: { kind: 'extra_hit_front', multiplier: 0.45 } },
  },
  d_on_kill_follow: {
    id: 'd_on_kill_follow',
    label: '追亡',
    effect: { kind: 'effect_unlock', effect: { kind: 'on_kill_follow', multiplier: 0.5 } },
  },
  d_counter_follow: {
    id: 'd_counter_follow',
    label: '反击连',
    effect: { kind: 'unit_flag', flag: 'counterFollow' },
  },
  e_vs_low_hp: {
    id: 'e_vs_low_hp',
    label: '猎残',
    effect: { kind: 'focus_policy', policy: 'lowest_hp' },
  },
  e_back_bonus: {
    id: 'e_back_bonus',
    label: '袭后',
    effect: { kind: 'effect_unlock', effect: { kind: 'vs_back', multiplier: 1.18 } },
  },
  e_overkill_col: {
    id: 'e_overkill_col',
    label: '列贯余伤',
    effect: { kind: 'effect_unlock', effect: { kind: 'overkill_col', value: 0.25 } },
  },
  f_bleed_deep: {
    id: 'f_bleed_deep',
    label: '血河',
    effect: { kind: 'status_boost', duration: 1, layers: 1 },
  },
  f_poison: {
    id: 'f_poison',
    label: '毒雾',
    effect: { kind: 'status_unlock', status: { statusId: 'poison', duration: 2, layers: 1, value: 0.025 } },
  },
  f_burn: {
    id: 'f_burn',
    label: '灼魂',
    effect: { kind: 'status_unlock', status: { statusId: 'burn', duration: 2, layers: 1, value: 0.03 } },
  },
  f_frostbite: {
    id: 'f_frostbite',
    label: '霜噬',
    effect: { kind: 'status_unlock', status: { statusId: 'frostbite', duration: 2, value: 0.02 } },
  },
  f_atk_down: {
    id: 'f_atk_down',
    label: '丧锋',
    effect: { kind: 'status_unlock', status: { statusId: 'atk_down', duration: 2 } },
  },
  f_corruption: {
    id: 'f_corruption',
    label: '侵蚀',
    effect: { kind: 'status_unlock', status: { statusId: 'corruption', duration: 3, layers: 1 } },
  },
  g_freeze: {
    id: 'g_freeze',
    label: '凝冰',
    effect: { kind: 'status_unlock', status: { statusId: 'freeze', duration: 1, chance: 0.35 } },
  },
  g_root: {
    id: 'g_root',
    label: '定身',
    effect: { kind: 'status_unlock', status: { statusId: 'root', duration: 2 } },
  },
  g_taunt: {
    id: 'g_taunt',
    label: '嘲讽',
    effect: { kind: 'status_unlock', status: { statusId: 'taunt', duration: 2, chance: 0.7 } },
  },
  g_disarm: {
    id: 'g_disarm',
    label: '缴械',
    effect: { kind: 'status_unlock', status: { statusId: 'disarm', duration: 1, chance: 0.5 } },
  },
  h_crit_up: {
    id: 'h_crit_up',
    label: '开眼',
    effect: { kind: 'effect_unlock', effect: { kind: 'self_crit_up' } },
  },
  h_immortal_brief: {
    id: 'h_immortal_brief',
    label: '不屈金身',
    effect: { kind: 'effect_unlock', effect: { kind: 'self_immortal' } },
  },
  h_share_dmg: {
    id: 'h_share_dmg',
    label: '义护',
    effect: { kind: 'effect_unlock', effect: { kind: 'share_oath' } },
  },
  h_link_heal: {
    id: 'h_link_heal',
    label: '同心',
    effect: { kind: 'unit_flag', flag: 'linkHeal' },
  },
  h_stealth_next: {
    id: 'h_stealth_next',
    label: '隐锋',
    effect: { kind: 'effect_unlock', effect: { kind: 'self_stealth' } },
  },
  i_heal_st: { id: 'i_heal_st', label: '单济', effect: { kind: 'tag_mult', tag: 'heal', delta: 0.08 } },
  i_heal_aoe: { id: 'i_heal_aoe', label: '普济', effect: { kind: 'tag_mult', tag: 'heal', delta: 0.06 } },
  i_heal_on_skill: {
    id: 'i_heal_on_skill',
    label: '战疗',
    effect: { kind: 'effect_unlock', effect: { kind: 'heal_on_skill', value: 0.12 } },
  },
  i_cleanse_team: {
    id: 'i_cleanse_team',
    label: '群体涤',
    effect: { kind: 'effect_unlock', effect: { kind: 'team_cleanse' } },
  },
  j_strip_buff: {
    id: 'j_strip_buff',
    label: '削灵',
    effect: { kind: 'effect_unlock', effect: { kind: 'purge_all' } },
  },
  j_break_guard: {
    id: 'j_break_guard',
    label: '破守',
    effect: { kind: 'effect_unlock', effect: { kind: 'vs_shield', multiplier: 1.25 } },
  },
  j_cleanse_self: {
    id: 'j_cleanse_self',
    label: '净己',
    effect: { kind: 'effect_unlock', effect: { kind: 'cleanse_self' } },
  },
  k_qi_start: { id: 'k_qi_start', label: '开局聚气', effect: { kind: 'qi_passive', start: 15 } },
  k_qi_on_hit: { id: 'k_qi_on_hit', label: '受击回气', effect: { kind: 'qi_passive', onHit: 4 } },
  k_qi_steal: {
    id: 'k_qi_steal',
    label: '夺气',
    effect: { kind: 'effect_unlock', effect: { kind: 'steal_qi', value: 8 } },
  },
  k_basic_qi_up: { id: 'k_basic_qi_up', label: '普攻充盈', effect: { kind: 'qi_passive', basic: 8 } },
  l_pierce: { id: 'l_pierce', label: '穿透', effect: { kind: 'tag_add', tag: 'pierce' } },
  l_row_front: { id: 'l_row_front', label: '扫排', effect: { kind: 'pattern', pattern: 'row_front' } },
  l_col: { id: 'l_col', label: '贯列', effect: { kind: 'pattern', pattern: 'col_focus' } },
  l_focus_back: { id: 'l_focus_back', label: '猎后', effect: { kind: 'focus_policy', policy: 'backline' } },
  l_focus_front: { id: 'l_focus_front', label: '攻坚', effect: { kind: 'focus_policy', policy: 'front_row' } },
  l_ally_lowest: {
    id: 'l_ally_lowest',
    label: '急救焦点',
    effect: { kind: 'focus_policy', policy: 'lowest_hp' },
  },
  l_cover_front: {
    id: 'l_cover_front',
    label: '掩护',
    effect: { kind: 'effect_unlock', effect: { kind: 'self_cover' } },
  },
  l_cell_lock: {
    id: 'l_cell_lock',
    label: '画地为牢',
    effect: { kind: 'status_unlock', status: { statusId: 'cell_lock', duration: 2 } },
  },
  l_swap_threat: {
    id: 'l_swap_threat',
    label: '换位势',
    effect: { kind: 'status_unlock', status: { statusId: 'taunt', duration: 2, chance: 0.65 } },
  },
  m_execute: {
    id: 'm_execute',
    label: '斩杀线',
    effect: { kind: 'effect_unlock', effect: { kind: 'execute', value: 0.3, multiplier: 1.4 } },
  },
  m_second_wind: {
    id: 'm_second_wind',
    label: '残阳',
    effect: { kind: 'unit_flag', flag: 'secondWind' },
  },
  m_clone_hit: {
    id: 'm_clone_hit',
    label: '影袭',
    effect: { kind: 'effect_unlock', effect: { kind: 'clone_hit', multiplier: 0.4 } },
  },
  m_time_rewind: {
    id: 'm_time_rewind',
    label: '逆转',
    effect: { kind: 'effect_unlock', effect: { kind: 'time_rewind', value: 0.4 } },
  },
  m_steal_buff: {
    id: 'm_steal_buff',
    label: '窃天',
    effect: { kind: 'effect_unlock', effect: { kind: 'steal_buff' } },
  },
  m_reflect_cc: {
    id: 'm_reflect_cc',
    label: '反制',
    effect: { kind: 'effect_unlock', effect: { kind: 'self_reflect_cc' } },
  },
  m_dmg_cap: {
    id: 'm_dmg_cap',
    label: '金身限额',
    effect: { kind: 'effect_unlock', effect: { kind: 'self_dmg_cap', value: 0.35 } },
  },
  m_stack_dao: {
    id: 'm_stack_dao',
    label: '悟道叠层',
    effect: { kind: 'effect_unlock', effect: { kind: 'self_dao' } },
    extra: [{ kind: 'effect_unlock', effect: { kind: 'dao_stack', value: 0.1 } }],
  },
  m_blood_pact: {
    id: 'm_blood_pact',
    label: '血契',
    effect: { kind: 'effect_unlock', effect: { kind: 'blood_pact', multiplier: 1.28 } },
  },
  m_guardian_oath: {
    id: 'm_guardian_oath',
    label: '誓约',
    effect: { kind: 'effect_unlock', effect: { kind: 'share_oath' } },
  },
  m_domain_lite: {
    id: 'm_domain_lite',
    label: '领域',
    effect: { kind: 'effect_unlock', effect: { kind: 'domain_lite' } },
  },
  m_mark_pop: {
    id: 'm_mark_pop',
    label: '印爆',
    effect: { kind: 'effect_unlock', effect: { kind: 'mark_pop', value: 0.08 } },
  },
  m_fate_lock: {
    id: 'm_fate_lock',
    label: '因果锁',
    effect: { kind: 'status_unlock', status: { statusId: 'fate_lock', duration: 1 } },
  },
  j_transfer_debuff: {
    id: 'j_transfer_debuff',
    label: '移花接木',
    effect: { kind: 'effect_unlock', effect: { kind: 'transfer_debuff' } },
  },
  k_qi_drought: {
    id: 'k_qi_drought',
    label: '闭气',
    effect: { kind: 'status_unlock', status: { statusId: 'qi_drought', duration: 2 } },
  },
  m_fortune_strike: {
    id: 'm_fortune_strike',
    label: '天眷',
    effect: { kind: 'effect_unlock', effect: { kind: 'fortune_strike', multiplier: 1.25 } },
    extra: [{ kind: 'rating', stat: 'fortuneRating', value: 8 }],
  },
};

const STAT_KINDS = new Set(['stat_pct', 'rare_stat', 'rating', 'split_stat', 'final_dmg']);

export function isStatOnlyEffects(effects: StarNodeEffect[]): boolean {
  return effects.length > 0 && effects.every((e) => STAT_KINDS.has(e.kind));
}

export function playablePassives(effects: StarNodeEffect[]): StarNodeEffect[] {
  return effects.filter((e) => !STAT_KINDS.has(e.kind)).map((e) => structuredClone(e));
}

export function effectsFromAbilityIds(ids: readonly string[]): StarNodeEffect[] {
  return ids.flatMap((id) => {
    const atom = ABILITY_ATOMS[id];
    if (!atom) throw new Error(`unknown ability atom: ${id}`);
    const out = [structuredClone(atom.effect)];
    if (atom.extra) out.push(...atom.extra.map((e) => structuredClone(e)));
    return out;
  });
}
