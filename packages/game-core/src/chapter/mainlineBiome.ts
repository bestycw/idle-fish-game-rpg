/**
 * 主线小怪波 · 按章「剧情生态」轮换（混搭职业/技能），与八题精锐/首领 cap 分离。
 */
import type { MainlineBiomeId } from '../dungeon/mainlineBiomeEncounters.js';

export type { MainlineBiomeId };

type SkirmishPair = readonly [string, string, string, string];

/** 章序 → 卷一生态（林毒、关隘、劫灰…） */
export function mainlineBiomeForChapter(chapterOrder: number): MainlineBiomeId {
  const o = Math.max(1, Math.min(10, Math.round(chapterOrder)));
  if (o <= 1) return 'gate';
  if (o === 2) return 'mist_forest';
  if (o === 3) return 'trial';
  if (o === 4) return 'camp';
  if (o <= 6) return 'ash';
  if (o <= 8) return 'inner';
  return 'siege';
}

/** 每生态 4 组「双波小怪」；人数 2–4、技能混搭，按阵轮换 */
const BIOME_SKIRMISH_SETS: Record<MainlineBiomeId, readonly SkirmishPair[]> = {
  gate: [
    ['biome_gate_patrol', '巡哨', 'biome_gate_ctrl', '点穴'],
    ['biome_gate_wing', '两翼', 'biome_gate_sergeant', '伍长'],
    ['biome_gate_patrol', '巡哨', 'biome_gate_wing', '两翼'],
    ['biome_gate_ctrl', '点穴', 'biome_gate_sergeant', '伍长'],
  ],
  mist_forest: [
    ['biome_forest_crawl', '爬刺', 'biome_forest_swarm', '群涌'],
    ['biome_forest_mist', '雾影', 'biome_forest_brood', '蛊巢'],
    ['biome_forest_swarm', '群涌', 'biome_forest_crawl', '爬刺'],
    ['biome_forest_brood', '蛊巢', 'biome_forest_mist', '雾影'],
  ],
  trial: [
    ['biome_trial_lanes', '箭道', 'biome_trial_guard', '护射'],
    ['biome_trial_duel', '单挑', 'biome_trial_volley', '齐射'],
    ['biome_trial_guard', '护射', 'biome_trial_volley', '齐射'],
    ['biome_trial_lanes', '箭道', 'biome_trial_duel', '单挑'],
  ],
  camp: [
    ['biome_camp_drill', '操练', 'biome_camp_supply', '辎重'],
    ['biome_camp_scout', '斥候', 'biome_camp_medic', '医帐'],
    ['biome_camp_supply', '辎重', 'biome_camp_scout', '斥候'],
    ['biome_camp_drill', '操练', 'biome_camp_medic', '医帐'],
  ],
  ash: [
    ['biome_ash_raiders', '劫灰', 'biome_ash_ember', '余烬'],
    ['biome_ash_shade', '影伏', 'biome_ash_brute', '蛮冲'],
    ['biome_ash_ember', '余烬', 'biome_ash_raiders', '劫灰'],
    ['biome_ash_brute', '蛮冲', 'biome_ash_shade', '影伏'],
  ],
  inner: [
    ['biome_inner_rite', '祭纹', 'biome_inner_blade', '暗刃'],
    ['biome_inner_wall', '灵障', 'biome_inner_whisper', '低语'],
    ['biome_inner_blade', '暗刃', 'biome_inner_rite', '祭纹'],
    ['biome_inner_whisper', '低语', 'biome_inner_wall', '灵障'],
  ],
  siege: [
    ['biome_siege_oil', '油工', 'biome_siege_ram', '撞门'],
    ['biome_siege_arch', '弓楼', 'biome_siege_banner', '旗阵'],
    ['biome_siege_ram', '撞门', 'biome_siege_oil', '油工'],
    ['biome_siege_banner', '旗阵', 'biome_siege_arch', '弓楼'],
  ],
};

export function mainlineBiomeSkirmishPair(
  chapterOrder: number,
  unitIndex: number,
  planOffset = 0,
): SkirmishPair {
  const biome = mainlineBiomeForChapter(chapterOrder);
  const sets = BIOME_SKIRMISH_SETS[biome];
  return sets[(unitIndex + planOffset) % sets.length]!;
}
