/**
 * 主线「阵内第三波」混搭精锐（非整表八题重复）。
 * 每阵 1 个带机制点的精英 + 其他职业；仅该节最后一阵才上完整配方 / boss_*。
 * 编制对齐生态小怪：每场 5 人、九宫布局各异。
 */
import type { EncounterDef } from './encounters.js';
import { mainlineSquadEncounter } from './mainlineSquadBuilder.js';

const S = {
  smash: 'mob_smash' as const,
  guard: 'mob_guard' as const,
  arrow: 'mob_arrow' as const,
  stun: 'mob_stun' as const,
  slow: 'mob_slow' as const,
  sleep: 'mob_sleep' as const,
  mend: 'mob_mend' as const,
  spirit: 'mob_spirit_bolt' as const,
  stack: 'mob_stack_shield' as const,
  healBlock: 'mob_heal_block' as const,
};

export const MAINLINE_CAP_BLEND_ENCOUNTERS: EncounterDef[] = [
  mainlineSquadEncounter('mainline_blend_wall', '盾墙混阵', '铁壁精英挡前，侧翼弓手点射：破甲或切后', [
    { slot: 2, name: '铁壁伍长', role: 'tank', job: 'vanguard', skillId: S.guard, rank: 'elite', scale: 1.15 },
    { slot: 8, name: '侧射弓', role: 'st_burst', job: 'ranger', skillId: S.arrow },
    { slot: 4, name: '点穴卒', role: 'st_ctrl', job: 'warlock', skillId: S.stun, masteryRating: 16 },
    { slot: 1, name: '趟子刀', role: 'st_burst', job: 'assassin', skillId: S.smash },
    { slot: 6, name: '护墙趟子', role: 'tank', job: 'vanguard', skillId: S.smash },
  ]),
  mainlineSquadEncounter('mainline_blend_wall_b', '盾墙侧击', '双前排磨盾+后排迟滞：群攻或穿透', [
    { slot: 1, name: '厚甲卒', role: 'tank', job: 'vanguard', skillId: S.smash, scale: 1.05 },
    { slot: 3, name: '盾役', role: 'tank', job: 'vanguard', skillId: S.guard, scale: 1.05 },
    { slot: 9, name: '迟滞弓', role: 'st_ctrl', job: 'warlock', skillId: S.slow, masteryRating: 18 },
    { slot: 7, name: '侧弓', role: 'st_burst', job: 'ranger', skillId: S.arrow },
    { slot: 8, name: '补弓', role: 'st_burst', job: 'ranger', skillId: S.arrow },
  ]),
  mainlineSquadEncounter('mainline_blend_archers', '弓阵混编', '金弓精英在后，前排仅薄盾：穿透或秒弓', [
    { slot: 2, name: '挡箭趟子', role: 'tank', job: 'vanguard', skillId: S.smash },
    { slot: 8, name: '伏弓长', role: 'st_burst', job: 'ranger', skillId: S.arrow, rank: 'elite', scale: 1.12 },
    { slot: 9, name: '辅弓', role: 'st_burst', job: 'ranger', skillId: S.arrow },
    { slot: 4, name: '点穴卒', role: 'st_ctrl', job: 'warlock', skillId: S.stun, masteryRating: 14 },
    { slot: 6, name: '迟滞卒', role: 'st_ctrl', job: 'warlock', skillId: S.slow, masteryRating: 14 },
  ]),
  mainlineSquadEncounter('mainline_blend_archers_b', '弓阵包抄', '左右弓+中军点穴：护阵或双切', [
    { slot: 4, name: '左弓', role: 'st_burst', job: 'ranger', skillId: S.arrow },
    { slot: 6, name: '右弓', role: 'st_burst', job: 'ranger', skillId: S.arrow },
    { slot: 5, name: '弓队控', role: 'st_ctrl', job: 'warlock', skillId: S.stun, masteryRating: 18 },
    { slot: 1, name: '护弓盾', role: 'tank', job: 'vanguard', skillId: S.guard },
    { slot: 9, name: '后援弓', role: 'st_burst', job: 'ranger', skillId: S.arrow },
  ]),
  mainlineSquadEncounter('mainline_blend_raiders', '速攻混刃', '影刃精英+双控：四人快攻，坦阵或秒魁', [
    { slot: 9, name: '影刃魁', role: 'st_burst', job: 'assassin', skillId: S.arrow, rank: 'elite', scale: 1.12 },
    { slot: 5, name: '点穴客', role: 'st_ctrl', job: 'warlock', skillId: S.stun, masteryRating: 20 },
    { slot: 4, name: '迟滞客', role: 'st_ctrl', job: 'warlock', skillId: S.slow, masteryRating: 16 },
    { slot: 2, name: '匪盾', role: 'tank', job: 'vanguard', skillId: S.guard },
  ]),
  mainlineSquadEncounter('mainline_blend_raiders_b', '速攻侧袭', '双刺+前排盾：换位护后', [
    { slot: 4, name: '侧袭甲', role: 'st_burst', job: 'assassin', skillId: S.arrow },
    { slot: 6, name: '侧袭乙', role: 'st_burst', job: 'assassin', skillId: S.arrow },
    { slot: 2, name: '匪盾', role: 'tank', job: 'vanguard', skillId: S.guard },
    { slot: 8, name: '匪医', role: 'st_heal', job: 'healer', skillId: S.mend },
    { slot: 1, name: '挡刀趟子', role: 'tank', job: 'vanguard', skillId: S.smash },
  ]),
  mainlineSquadEncounter('mainline_blend_spirit_wall', '灵障混阵', '灵卫精英物防高，灵矢补刀：破甲或灵伤', [
    { slot: 2, name: '灵障尉', role: 'tank', job: 'vanguard', skillId: S.guard, rank: 'elite', scale: 1.14 },
    { slot: 8, name: '灵矢手', role: 'st_burst', job: 'mage', skillId: S.spirit },
    { slot: 1, name: '趟子卒', role: 'tank', job: 'vanguard', skillId: S.smash },
    { slot: 4, name: '迟滞灵徒', role: 'st_ctrl', job: 'warlock', skillId: S.slow, masteryRating: 14 },
    { slot: 9, name: '辅灵矢', role: 'st_burst', job: 'mage', skillId: S.spirit, scale: 0.95 },
  ]),
  mainlineSquadEncounter('mainline_blend_spirit_wall_b', '灵线三角', '双灵卫+眠咒：断控再破防', [
    { slot: 1, name: '灵卫甲', role: 'tank', job: 'vanguard', skillId: S.smash, scale: 1.06 },
    { slot: 3, name: '灵卫乙', role: 'tank', job: 'vanguard', skillId: S.guard, scale: 1.06 },
    { slot: 9, name: '眠咒师', role: 'st_ctrl', job: 'warlock', skillId: S.sleep, masteryRating: 20 },
    { slot: 7, name: '灵矢', role: 'st_burst', job: 'mage', skillId: S.spirit },
    { slot: 5, name: '点穴灵徒', role: 'st_ctrl', job: 'warlock', skillId: S.stun, masteryRating: 16 },
  ]),
  mainlineSquadEncounter('mainline_blend_chaos_rite', '祭坛混场', '祭司长精英催眠，刀侍护卫：先断咒', [
    { slot: 8, name: '祭司长', role: 'st_ctrl', job: 'warlock', skillId: S.sleep, masteryRating: 24, rank: 'elite', scale: 1.1 },
    { slot: 1, name: '刀侍', role: 'st_burst', job: 'assassin', skillId: S.smash },
    { slot: 5, name: '迟滞徒', role: 'st_ctrl', job: 'warlock', skillId: S.slow, masteryRating: 16 },
    { slot: 2, name: '护祭盾', role: 'tank', job: 'vanguard', skillId: S.guard },
    { slot: 9, name: '侍火刃', role: 'st_burst', job: 'assassin', skillId: S.arrow },
  ]),
  mainlineSquadEncounter('mainline_blend_chaos_rite_b', '祭纹散阵', '四格控场混搭：续航或爆发', [
    { slot: 4, name: '侍火', role: 'st_ctrl', job: 'warlock', skillId: S.sleep, masteryRating: 16 },
    { slot: 6, name: '侍刃', role: 'st_burst', job: 'assassin', skillId: S.arrow },
    { slot: 2, name: '护祭盾', role: 'tank', job: 'vanguard', skillId: S.guard },
    { slot: 9, name: '乱心徒', role: 'st_ctrl', job: 'warlock', skillId: S.slow, masteryRating: 14 },
    { slot: 8, name: '祭坛医', role: 'st_heal', job: 'healer', skillId: S.mend },
  ]),
  mainlineSquadEncounter('mainline_blend_oil_cask', '油阵混编', '油医精英抬血，盾刃护阵：禁疗破局', [
    { slot: 1, name: '油盾', role: 'tank', job: 'vanguard', skillId: S.guard },
    { slot: 9, name: '油阵医魁', role: 'st_heal', job: 'healer', skillId: S.mend, rank: 'elite', scale: 1.1 },
    { slot: 4, name: '油刃', role: 'st_burst', job: 'assassin', skillId: S.arrow },
    { slot: 3, name: '泼油卒', role: 'tank', job: 'vanguard', skillId: S.smash },
    { slot: 7, name: '泼油弓', role: 'st_burst', job: 'ranger', skillId: S.arrow },
  ]),
  mainlineSquadEncounter('mainline_blend_oil_cask_b', '油道断疗', '禁疗客精英+双坦：先破禁疗', [
    { slot: 8, name: '禁疗客', role: 'st_ctrl', job: 'warlock', skillId: S.healBlock, rank: 'elite', scale: 1.1 },
    { slot: 2, name: '油工甲', role: 'tank', job: 'vanguard', skillId: S.smash },
    { slot: 9, name: '辅医', role: 'st_heal', job: 'healer', skillId: S.mend },
    { slot: 1, name: '油盾乙', role: 'tank', job: 'vanguard', skillId: S.guard },
    { slot: 6, name: '油刃卒', role: 'st_burst', job: 'assassin', skillId: S.arrow },
  ]),
  mainlineSquadEncounter(
    'mainline_blend_shield_stack',
    '叠盾混阵',
    '五阵：仅督军叠盾，余者刃医弓混搭',
    [
      { slot: 5, name: '叠盾督军', role: 'tank', job: 'vanguard', skillId: S.stack, rank: 'elite', scale: 1.1, startShield: 120, shieldPurgeFactor: 0.28 },
      { slot: 1, name: '护督刃甲', role: 'st_burst', job: 'assassin', skillId: S.arrow },
      { slot: 3, name: '趟子', role: 'tank', job: 'vanguard', skillId: S.smash },
      { slot: 8, name: '护督医', role: 'st_heal', job: 'healer', skillId: S.mend },
      { slot: 9, name: '护督弓', role: 'st_burst', job: 'ranger', skillId: S.arrow },
    ],
  ),
  mainlineSquadEncounter('mainline_blend_shield_stack_b', '叠盾游射', '游盾精英+三弓+挡刀五阵', [
    { slot: 2, name: '游盾尉', role: 'tank', job: 'vanguard', skillId: S.stack, rank: 'elite', scale: 1.08, startShield: 90, shieldPurgeFactor: 0.3 },
    { slot: 1, name: '挡刀', role: 'tank', job: 'vanguard', skillId: S.guard },
    { slot: 7, name: '游射甲', role: 'st_burst', job: 'ranger', skillId: S.arrow },
    { slot: 8, name: '游射乙', role: 'st_burst', job: 'ranger', skillId: S.arrow },
    { slot: 9, name: '游射丙', role: 'st_burst', job: 'ranger', skillId: S.arrow },
  ]),
];

/** 非最后一阵的第三波：混搭精锐 id 轮换 */
export const MAINLINE_CAP_BLEND_IDS: Record<
  string,
  readonly [string, string]
> = {
  wall: ['mainline_blend_wall', 'mainline_blend_wall_b'],
  archers: ['mainline_blend_archers', 'mainline_blend_archers_b'],
  raiders: ['mainline_blend_raiders', 'mainline_blend_raiders_b'],
  spirit_wall: ['mainline_blend_spirit_wall', 'mainline_blend_spirit_wall_b'],
  chaos_rite: ['mainline_blend_chaos_rite', 'mainline_blend_chaos_rite_b'],
  oil_cask: ['mainline_blend_oil_cask', 'mainline_blend_oil_cask_b'],
  shield_stack: ['mainline_blend_shield_stack', 'mainline_blend_shield_stack_b'],
};
