/**
 * 主线剧情生态 · 每场 5 人编制（阵型各异，技能混搭）。
 */
import type { EncounterDef } from './encounters.js';
import { mainlineSquadEncounter } from './mainlineSquadBuilder.js';

export type MainlineBiomeId =
  | 'gate'
  | 'mist_forest'
  | 'trial'
  | 'camp'
  | 'ash'
  | 'inner'
  | 'siege';

const S = {
  smash: 'mob_smash',
  guard: 'mob_guard',
  arrow: 'mob_arrow',
  stun: 'mob_stun',
  slow: 'mob_slow',
  sleep: 'mob_sleep',
  mend: 'mob_mend',
  spirit: 'mob_spirit_bolt',
};

export const MAINLINE_BIOME_ENCOUNTERS: EncounterDef[] = [
  mainlineSquadEncounter('biome_gate_patrol', '关隘巡哨', '五列巡哨：前排趟子、后排双弓，先破前或切后', [
    { slot: 1, name: '趟子甲', role: 'tank', job: 'vanguard', skillId: S.smash },
    { slot: 2, name: '趟子乙', role: 'tank', job: 'vanguard', skillId: S.guard },
    { slot: 3, name: '趟子丙', role: 'tank', job: 'vanguard', skillId: S.smash },
    { slot: 8, name: '弓手甲', role: 'st_burst', job: 'ranger', skillId: S.arrow },
    { slot: 9, name: '弓手乙', role: 'st_burst', job: 'ranger', skillId: S.arrow },
  ]),
  mainlineSquadEncounter('biome_gate_ctrl', '关隘控场', '盾点穴刃五阵：解控或秒后排', [
    { slot: 1, name: '盾役', role: 'tank', job: 'vanguard', skillId: S.guard },
    { slot: 3, name: '刀卒', role: 'st_burst', job: 'assassin', skillId: S.smash },
    { slot: 5, name: '点穴客', role: 'st_ctrl', job: 'warlock', skillId: S.stun, masteryRating: 18 },
    { slot: 7, name: '迟滞卒', role: 'st_ctrl', job: 'warlock', skillId: S.slow, masteryRating: 14 },
    { slot: 9, name: '快刀', role: 'st_burst', job: 'assassin', skillId: S.arrow },
  ]),
  mainlineSquadEncounter('biome_gate_wing', '关隘两翼', '翼展五阵：左右翼+中军弓迟滞', [
    { slot: 1, name: '左翼', role: 'tank', job: 'vanguard', skillId: S.smash },
    { slot: 3, name: '右翼', role: 'tank', job: 'vanguard', skillId: S.smash },
    { slot: 5, name: '中军迟', role: 'st_ctrl', job: 'warlock', skillId: S.slow, masteryRating: 14 },
    { slot: 7, name: '中军弓甲', role: 'st_burst', job: 'ranger', skillId: S.arrow },
    { slot: 9, name: '中军弓乙', role: 'st_burst', job: 'ranger', skillId: S.arrow },
  ]),
  mainlineSquadEncounter('biome_gate_sergeant', '关隘伍长', '伍长精英居中：先集火精英', [
    { slot: 1, name: '趟子', role: 'tank', job: 'vanguard', skillId: S.smash },
    { slot: 2, name: '伍长·韩横', role: 'tank', job: 'vanguard', skillId: S.guard, rank: 'elite', scale: 1.12 },
    { slot: 3, name: '趟子副', role: 'tank', job: 'vanguard', skillId: S.smash },
    { slot: 8, name: '随行弓甲', role: 'st_burst', job: 'ranger', skillId: S.arrow },
    { slot: 9, name: '随行弓乙', role: 'st_burst', job: 'ranger', skillId: S.arrow },
  ]),
  mainlineSquadEncounter('biome_forest_crawl', '林缘爬刺', '五虫斜线：蚀甲顶前、毒控散后', [
    { slot: 1, name: '蚀甲虫', role: 'tank', job: 'vanguard', skillId: S.smash },
    { slot: 2, name: '棘刺蝎', role: 'st_burst', job: 'assassin', skillId: S.smash },
    { slot: 4, name: '毒蛛', role: 'st_ctrl', job: 'warlock', skillId: S.slow, masteryRating: 16 },
    { slot: 7, name: '迷雾蛾', role: 'st_ctrl', job: 'warlock', skillId: S.sleep, masteryRating: 16 },
    { slot: 9, name: '幼蛊', role: 'st_heal', job: 'healer', skillId: S.mend },
  ]),
  mainlineSquadEncounter('biome_forest_swarm', '虫群涌雾', '七虫散阵：人多单弱，群攻或断控', [
    { slot: 1, name: '刃脚虫甲', role: 'st_burst', job: 'assassin', skillId: S.arrow, scale: 0.9 },
    { slot: 2, name: '刃脚虫乙', role: 'st_burst', job: 'assassin', skillId: S.arrow, scale: 0.9 },
    { slot: 3, name: '刃脚虫丙', role: 'st_burst', job: 'assassin', skillId: S.smash, scale: 0.9 },
    { slot: 4, name: '酸涎虫', role: 'st_ctrl', job: 'warlock', skillId: S.slow, masteryRating: 14, scale: 0.92 },
    { slot: 6, name: '毒蛛幼', role: 'st_ctrl', job: 'warlock', skillId: S.slow, masteryRating: 12, scale: 0.9 },
    { slot: 8, name: '迷雾蛾', role: 'st_ctrl', job: 'warlock', skillId: S.sleep, masteryRating: 16, scale: 0.92 },
    { slot: 9, name: '蛊母徒', role: 'st_heal', job: 'healer', skillId: S.mend, scale: 0.95 },
  ]),
  mainlineSquadEncounter('biome_forest_mist', '雾影伏击', '雾蟾精英+四虫护卫', [
    { slot: 1, name: '地蜈蚣', role: 'st_burst', job: 'assassin', skillId: S.smash },
    { slot: 3, name: '棘刺蝎', role: 'st_burst', job: 'assassin', skillId: S.slow },
    { slot: 5, name: '雾蟾', role: 'st_ctrl', job: 'warlock', skillId: S.sleep, masteryRating: 22, rank: 'elite', scale: 1.1 },
    { slot: 7, name: '毒蛛', role: 'st_ctrl', job: 'warlock', skillId: S.slow, masteryRating: 16 },
    { slot: 9, name: '幼蛊', role: 'st_heal', job: 'healer', skillId: S.mend },
  ]),
  mainlineSquadEncounter('biome_forest_brood', '蛊巢余孽', '双刃+蛊母+双控', [
    { slot: 2, name: '蛊母', role: 'st_heal', job: 'healer', skillId: S.mend, scale: 1.05 },
    { slot: 4, name: '刃虫甲', role: 'st_burst', job: 'assassin', skillId: S.arrow },
    { slot: 6, name: '刃虫乙', role: 'st_burst', job: 'assassin', skillId: S.arrow },
    { slot: 8, name: '眠蛾', role: 'st_ctrl', job: 'warlock', skillId: S.sleep, masteryRating: 18 },
    { slot: 9, name: '缓蛛', role: 'st_ctrl', job: 'warlock', skillId: S.slow, masteryRating: 16 },
  ]),
  mainlineSquadEncounter('biome_trial_lanes', '试剑箭道', '三前排挡箭+双弓高台', [
    { slot: 1, name: '挡箭甲', role: 'tank', job: 'vanguard', skillId: S.guard },
    { slot: 2, name: '挡箭乙', role: 'tank', job: 'vanguard', skillId: S.smash },
    { slot: 3, name: '挡箭丙', role: 'tank', job: 'vanguard', skillId: S.guard },
    { slot: 8, name: '试剑弓甲', role: 'st_burst', job: 'ranger', skillId: S.arrow },
    { slot: 9, name: '试剑弓乙', role: 'st_burst', job: 'ranger', skillId: S.arrow },
  ]),
  mainlineSquadEncounter('biome_trial_guard', '试剑护射', '十字护射：中军剑侍+四角弓', [
    { slot: 1, name: '挡箭甲', role: 'tank', job: 'vanguard', skillId: S.guard },
    { slot: 3, name: '挡箭乙', role: 'tank', job: 'vanguard', skillId: S.smash },
    { slot: 5, name: '剑侍', role: 'tank', job: 'vanguard', skillId: S.smash },
    { slot: 7, name: '高台弓甲', role: 'st_burst', job: 'ranger', skillId: S.arrow },
    { slot: 9, name: '高台弓乙', role: 'st_burst', job: 'ranger', skillId: S.arrow },
  ]),
  mainlineSquadEncounter('biome_trial_duel', '试剑单挑阵', '三人论剑：点穴+双快剑，无后排', [
    { slot: 5, name: '点穴试手', role: 'st_ctrl', job: 'warlock', skillId: S.stun, masteryRating: 20 },
    { slot: 7, name: '快剑甲', role: 'st_burst', job: 'assassin', skillId: S.arrow, scale: 1.08 },
    { slot: 9, name: '快剑乙', role: 'st_burst', job: 'assassin', skillId: S.arrow, scale: 1.08 },
  ]),
  mainlineSquadEncounter('biome_trial_volley', '试剑齐射', '五弓扇面：穿透或护盾', [
    { slot: 4, name: '齐射甲', role: 'st_burst', job: 'ranger', skillId: S.arrow },
    { slot: 5, name: '齐射乙', role: 'st_burst', job: 'ranger', skillId: S.arrow },
    { slot: 6, name: '齐射丙', role: 'st_burst', job: 'ranger', skillId: S.arrow },
    { slot: 8, name: '齐射丁', role: 'st_burst', job: 'ranger', skillId: S.arrow },
    { slot: 9, name: '齐射戊', role: 'st_burst', job: 'ranger', skillId: S.arrow },
  ]),
  mainlineSquadEncounter('biome_camp_drill', '营外操练', '盾刃控医五教头：先断控或秒医', [
    { slot: 1, name: '操练盾', role: 'tank', job: 'vanguard', skillId: S.guard },
    { slot: 3, name: '操练刃', role: 'st_burst', job: 'assassin', skillId: S.smash },
    { slot: 5, name: '操练控', role: 'st_ctrl', job: 'warlock', skillId: S.slow, masteryRating: 16 },
    { slot: 8, name: '营医', role: 'st_heal', job: 'healer', skillId: S.mend },
    { slot: 9, name: '操练弓', role: 'st_burst', job: 'ranger', skillId: S.arrow },
  ]),
  mainlineSquadEncounter('biome_camp_supply', '辎重队', '双坦护辎+弓迟：先破辎或切弓', [
    { slot: 1, name: '辎重甲', role: 'tank', job: 'vanguard', skillId: S.smash },
    { slot: 2, name: '辎重乙', role: 'tank', job: 'vanguard', skillId: S.guard },
    { slot: 3, name: '辎重丙', role: 'tank', job: 'vanguard', skillId: S.smash },
    { slot: 8, name: '护辎弓', role: 'st_burst', job: 'ranger', skillId: S.arrow },
    { slot: 9, name: '迟滞卒', role: 'st_ctrl', job: 'warlock', skillId: S.slow, masteryRating: 14 },
  ]),
  mainlineSquadEncounter('biome_camp_scout', '营斥候', '斥候长精英+四探', [
    { slot: 4, name: '斥候甲', role: 'st_burst', job: 'assassin', skillId: S.arrow },
    { slot: 6, name: '斥候乙', role: 'st_burst', job: 'assassin', skillId: S.arrow },
    { slot: 5, name: '斥候长', role: 'st_ctrl', job: 'warlock', skillId: S.stun, masteryRating: 20, rank: 'elite', scale: 1.08 },
    { slot: 7, name: '斥候丙', role: 'st_burst', job: 'assassin', skillId: S.arrow },
    { slot: 9, name: '斥候丁', role: 'st_burst', job: 'assassin', skillId: S.arrow },
  ]),
  mainlineSquadEncounter('biome_camp_medic', '医帐外缘', '双卫双医+点穴：禁疗破局', [
    { slot: 1, name: '护卫甲', role: 'tank', job: 'vanguard', skillId: S.guard },
    { slot: 3, name: '护卫乙', role: 'tank', job: 'vanguard', skillId: S.smash },
    { slot: 8, name: '营医甲', role: 'st_heal', job: 'healer', skillId: S.mend },
    { slot: 9, name: '营医乙', role: 'st_heal', job: 'healer', skillId: S.mend },
    { slot: 5, name: '帐前控', role: 'st_ctrl', job: 'warlock', skillId: S.stun, masteryRating: 16 },
  ]),
  mainlineSquadEncounter('biome_ash_raiders', '劫灰游骑', '五匪：盾+骑射+点穴', [
    { slot: 2, name: '劫匪盾', role: 'tank', job: 'vanguard', skillId: S.smash },
    { slot: 4, name: '游骑甲', role: 'st_burst', job: 'assassin', skillId: S.arrow },
    { slot: 6, name: '游骑乙', role: 'st_burst', job: 'assassin', skillId: S.arrow },
    { slot: 8, name: '点穴匪', role: 'st_ctrl', job: 'warlock', skillId: S.stun, masteryRating: 18 },
    { slot: 9, name: '迟滞匪', role: 'st_ctrl', job: 'warlock', skillId: S.slow, masteryRating: 14 },
  ]),
  mainlineSquadEncounter('biome_ash_ember', '余烬伏线', '眠咒+三刀+盾：先断眠', [
    { slot: 1, name: '余烬盾', role: 'tank', job: 'vanguard', skillId: S.guard },
    { slot: 4, name: '余烬刀甲', role: 'st_burst', job: 'assassin', skillId: S.arrow },
    { slot: 5, name: '余烬术士', role: 'st_ctrl', job: 'warlock', skillId: S.sleep, masteryRating: 20 },
    { slot: 7, name: '余烬刀乙', role: 'st_burst', job: 'assassin', skillId: S.smash },
    { slot: 9, name: '余烬刀丙', role: 'st_burst', job: 'assassin', skillId: S.arrow },
  ]),
  mainlineSquadEncounter('biome_ash_shade', '灰影潜行', '五影：双潜+迟滞+双刺', [
    { slot: 4, name: '灰影甲', role: 'st_burst', job: 'assassin', skillId: S.arrow },
    { slot: 6, name: '灰影乙', role: 'st_burst', job: 'assassin', skillId: S.arrow },
    { slot: 5, name: '灰缚', role: 'st_ctrl', job: 'warlock', skillId: S.slow, masteryRating: 16 },
    { slot: 8, name: '灰刺甲', role: 'st_burst', job: 'assassin', skillId: S.arrow },
    { slot: 9, name: '灰刺乙', role: 'st_burst', job: 'assassin', skillId: S.arrow },
  ]),
  mainlineSquadEncounter('biome_ash_brute', '蛮冲劫手', '蛮首精英+医匪+三刃', [
    { slot: 2, name: '蛮冲首', role: 'tank', job: 'vanguard', skillId: S.smash, rank: 'elite', scale: 1.12 },
    { slot: 1, name: '匪刃甲', role: 'st_burst', job: 'assassin', skillId: S.arrow },
    { slot: 3, name: '匪刃乙', role: 'st_burst', job: 'assassin', skillId: S.arrow },
    { slot: 8, name: '匪医', role: 'st_heal', job: 'healer', skillId: S.mend },
    { slot: 9, name: '点穴匪', role: 'st_ctrl', job: 'warlock', skillId: S.stun, masteryRating: 16 },
  ]),
  mainlineSquadEncounter('biome_inner_rite', '祭纹残阵', '祭师+刀侍+三控', [
    { slot: 1, name: '刀侍甲', role: 'st_burst', job: 'assassin', skillId: S.smash },
    { slot: 5, name: '乱纹客', role: 'st_ctrl', job: 'warlock', skillId: S.slow, masteryRating: 18 },
    { slot: 7, name: '残祭师', role: 'st_ctrl', job: 'warlock', skillId: S.sleep, masteryRating: 22 },
    { slot: 8, name: '刀侍乙', role: 'st_burst', job: 'assassin', skillId: S.arrow },
    { slot: 9, name: '侍火', role: 'st_ctrl', job: 'warlock', skillId: S.sleep, masteryRating: 16 },
  ]),
  mainlineSquadEncounter('biome_inner_blade', '暗刃狭道', '五刃：双暗+点穴+双挡', [
    { slot: 1, name: '挡刀', role: 'tank', job: 'vanguard', skillId: S.guard },
    { slot: 4, name: '暗刃甲', role: 'st_burst', job: 'assassin', skillId: S.arrow },
    { slot: 5, name: '暗点穴', role: 'st_ctrl', job: 'warlock', skillId: S.stun, masteryRating: 20 },
    { slot: 6, name: '暗刃乙', role: 'st_burst', job: 'assassin', skillId: S.arrow },
    { slot: 9, name: '暗刃丙', role: 'st_burst', job: 'assassin', skillId: S.arrow },
  ]),
  mainlineSquadEncounter('biome_inner_wall', '灵障碎阵', '双灵卫+双灵矢+趟子', [
    { slot: 1, name: '碎阵卫甲', role: 'tank', job: 'vanguard', skillId: S.guard },
    { slot: 3, name: '碎阵卫乙', role: 'tank', job: 'vanguard', skillId: S.smash },
    { slot: 5, name: '趟子', role: 'tank', job: 'vanguard', skillId: S.smash },
    { slot: 8, name: '碎阵灵弓甲', role: 'st_burst', job: 'mage', skillId: S.spirit },
    { slot: 9, name: '碎阵灵弓乙', role: 'st_burst', job: 'mage', skillId: S.spirit },
  ]),
  mainlineSquadEncounter('biome_inner_whisper', '低语回廊', '祭司精英+侍从三军', [
    { slot: 2, name: '侍刀', role: 'st_burst', job: 'assassin', skillId: S.smash },
    { slot: 5, name: '低语祭司', role: 'st_ctrl', job: 'warlock', skillId: S.sleep, masteryRating: 24, rank: 'elite', scale: 1.1 },
    { slot: 7, name: '侍弓甲', role: 'st_burst', job: 'ranger', skillId: S.arrow },
    { slot: 8, name: '迟咒', role: 'st_ctrl', job: 'warlock', skillId: S.slow, masteryRating: 16 },
    { slot: 9, name: '侍弓乙', role: 'st_burst', job: 'ranger', skillId: S.arrow },
  ]),
  mainlineSquadEncounter('biome_siege_oil', '门前油工', '油盾+油工+双医+刃', [
    { slot: 1, name: '油盾', role: 'tank', job: 'vanguard', skillId: S.guard },
    { slot: 2, name: '泼油工', role: 'tank', job: 'vanguard', skillId: S.smash },
    { slot: 3, name: '油刃', role: 'st_burst', job: 'assassin', skillId: S.arrow },
    { slot: 8, name: '油阵医甲', role: 'st_heal', job: 'healer', skillId: S.mend },
    { slot: 9, name: '油阵医乙', role: 'st_heal', job: 'healer', skillId: S.mend },
  ]),
  mainlineSquadEncounter('biome_siege_ram', '撞门队', '撞门精英+三弓+盾', [
    { slot: 2, name: '撞门槌', role: 'tank', job: 'vanguard', skillId: S.smash, rank: 'elite', scale: 1.12 },
    { slot: 1, name: '门盾', role: 'tank', job: 'vanguard', skillId: S.guard },
    { slot: 7, name: '门楼弓甲', role: 'st_burst', job: 'ranger', skillId: S.arrow },
    { slot: 8, name: '门楼弓乙', role: 'st_burst', job: 'ranger', skillId: S.arrow },
    { slot: 9, name: '门楼弓丙', role: 'st_burst', job: 'ranger', skillId: S.arrow },
  ]),
  mainlineSquadEncounter('biome_siege_arch', '弓楼压制', '楼盾+四弓扇面：穿透秒弓', [
    { slot: 1, name: '楼盾', role: 'tank', job: 'vanguard', skillId: S.guard },
    { slot: 4, name: '楼弓甲', role: 'st_burst', job: 'ranger', skillId: S.arrow },
    { slot: 5, name: '楼弓乙', role: 'st_burst', job: 'ranger', skillId: S.arrow },
    { slot: 8, name: '楼弓丙', role: 'st_burst', job: 'ranger', skillId: S.arrow },
    { slot: 9, name: '楼弓丁', role: 'st_burst', job: 'ranger', skillId: S.arrow },
  ]),
  mainlineSquadEncounter('biome_siege_banner', '旗阵鼓舞', '旗手精英+旗卫+旗刃+迟', [
    { slot: 1, name: '旗卫', role: 'tank', job: 'vanguard', skillId: S.guard },
    { slot: 5, name: '旗手', role: 'st_ctrl', job: 'warlock', skillId: S.slow, masteryRating: 20, rank: 'elite', scale: 1.08 },
    { slot: 7, name: '旗刃甲', role: 'st_burst', job: 'assassin', skillId: S.arrow },
    { slot: 8, name: '旗刃乙', role: 'st_burst', job: 'assassin', skillId: S.arrow },
    { slot: 9, name: '旗迟', role: 'st_ctrl', job: 'warlock', skillId: S.slow, masteryRating: 14 },
  ]),
];
