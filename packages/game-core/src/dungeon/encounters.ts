import type { GridSlot, Role, UnitRank, UnitTemplate } from '../shared/types.js';

export interface EnemySpec {
  name: string;
  role: Role;
  job: UnitTemplate['job'];
  slot: GridSlot;
  physAtk: number;
  spiritAtk: number;
  physDef: number;
  spiritDef: number;
  maxHp: number;
  spd: number;
  critRating?: number;
  critDmgRating?: number;
  hasteRating?: number;
  versRating?: number;
  masteryRating?: number;
  finalDmgRating?: number;
  fortune?: number;
  skillId: string;
  /** 抗控分级，默认 normal */
  rank?: UnitRank;
}

export interface EncounterDef {
  id: string;
  name: string;
  enemies: EnemySpec[];
}

/**
 * 遭遇表（2026-08-04 解法卡关 · 防御×0.5 后）：
 *
 * | 遭遇 | 卡住 | 破解 |
 * | wall | 无破甲磨不动 | 破甲（悟空/诸葛） |
 * | archers | 后排点杀 | 穿透 |
 * | raiders | 控+速 | 盾/坦 |
 * | spirit_wall | 高物防（力队吃瘪） | 深破甲；镜渊 pressure>1 |
 * | chaos_rite | 群扰乱 | 斩祭师/续航/控场 |
 * | boss_warden | 免疫硬控+厚血 | 破甲/流血，先清侧卫 |
 *
 * 基线按开局/猎装 pressure=1；镜渊 pressure=1.25 再抬一档。
 */
export const ENCOUNTERS: EncounterDef[] = [
  {
    id: 'wall',
    name: '盾墙巡逻',
    enemies: [
      {
        name: '铁壁恶徒',
        role: 'tank',
        job: 'vanguard',
        slot: 1,
        physAtk: 16,
        spiritAtk: 9,
        physDef: 36,
        spiritDef: 18,
        maxHp: 225,
        spd: 7,
        versRating: 22,
        fortune: 14,
        skillId: 'mob_guard',
        rank: 'elite',
      },
      {
        name: '厚甲恶徒',
        role: 'tank',
        job: 'vanguard',
        slot: 3,
        physAtk: 15,
        spiritAtk: 9,
        physDef: 36,
        spiritDef: 17,
        maxHp: 220,
        spd: 7,
        versRating: 18,
        fortune: 12,
        skillId: 'mob_smash',
      },
      {
        name: '封脉刀手',
        role: 'st_ctrl',
        job: 'warlock',
        slot: 5,
        physAtk: 14,
        spiritAtk: 13,
        physDef: 11,
        spiritDef: 10,
        maxHp: 110,
        spd: 12,
        masteryRating: 28,
        fortune: 12,
        skillId: 'mob_heal_block',
      },
    ],
  },
  {
    id: 'archers',
    name: '后排伏击',
    enemies: [
      {
        name: '挡箭杂兵',
        role: 'tank',
        job: 'vanguard',
        slot: 2,
        physAtk: 13,
        spiritAtk: 8,
        physDef: 14,
        spiritDef: 10,
        maxHp: 115,
        spd: 8,
        fortune: 8,
        skillId: 'mob_smash',
      },
      {
        name: '伏击弓手甲',
        role: 'st_burst',
        job: 'ranger',
        slot: 7,
        physAtk: 22,
        spiritAtk: 12,
        physDef: 5,
        spiritDef: 4,
        maxHp: 78,
        spd: 15,
        critRating: 30,
        critDmgRating: 22,
        fortune: 6,
        skillId: 'mob_arrow',
      },
      {
        name: '伏击弓手乙',
        role: 'st_burst',
        job: 'ranger',
        slot: 9,
        physAtk: 21,
        spiritAtk: 12,
        physDef: 5,
        spiritDef: 4,
        maxHp: 74,
        spd: 16,
        critRating: 30,
        critDmgRating: 22,
        fortune: 6,
        skillId: 'mob_arrow',
      },
    ],
  },
  {
    id: 'raiders',
    name: '速攻刺客',
    enemies: [
      {
        name: '点穴客',
        role: 'st_ctrl',
        job: 'warlock',
        slot: 5,
        physAtk: 15,
        spiritAtk: 12,
        physDef: 8,
        spiritDef: 7,
        maxHp: 85,
        spd: 16,
        masteryRating: 26,
        fortune: 11,
        skillId: 'mob_stun',
      },
      {
        name: '迟滞客',
        role: 'st_ctrl',
        job: 'warlock',
        slot: 4,
        physAtk: 14,
        spiritAtk: 11,
        physDef: 8,
        spiritDef: 7,
        maxHp: 82,
        spd: 15,
        masteryRating: 22,
        fortune: 10,
        skillId: 'mob_slow',
      },
      {
        name: '催眠客',
        role: 'st_ctrl',
        job: 'warlock',
        slot: 8,
        physAtk: 14,
        spiritAtk: 12,
        physDef: 7,
        spiritDef: 6,
        maxHp: 78,
        spd: 14,
        masteryRating: 24,
        fortune: 10,
        skillId: 'mob_sleep',
      },
      {
        name: '影刃',
        role: 'st_burst',
        job: 'assassin',
        slot: 9,
        physAtk: 20,
        spiritAtk: 12,
        physDef: 5,
        spiritDef: 4,
        maxHp: 80,
        spd: 16,
        critRating: 30,
        critDmgRating: 22,
        fortune: 10,
        skillId: 'mob_arrow',
      },
    ],
  },
  {
    id: 'spirit_wall',
    name: '铁壁灵阵',
    enemies: [
      {
        name: '铁壁灵卫',
        role: 'tank',
        job: 'vanguard',
        slot: 1,
        physAtk: 16,
        spiritAtk: 18,
        physDef: 54,
        spiritDef: 14,
        maxHp: 300,
        spd: 7,
        versRating: 26,
        fortune: 16,
        skillId: 'mob_guard',
        rank: 'elite',
      },
      {
        name: '铁壁灵卫乙',
        role: 'tank',
        job: 'vanguard',
        slot: 3,
        physAtk: 16,
        spiritAtk: 17,
        physDef: 50,
        spiritDef: 13,
        maxHp: 280,
        spd: 7,
        fortune: 14,
        skillId: 'mob_smash',
      },
      {
        name: '灵矢手',
        role: 'st_burst',
        job: 'mage',
        slot: 8,
        physAtk: 12,
        spiritAtk: 34,
        physDef: 7,
        spiritDef: 12,
        maxHp: 120,
        spd: 16,
        critRating: 34,
        fortune: 10,
        skillId: 'mob_spirit_bolt',
      },
    ],
  },
  {
    id: 'chaos_rite',
    name: '乱心仪式',
    enemies: [
      {
        name: '乱心祭师',
        role: 'aoe_ctrl',
        job: 'warlock',
        slot: 5,
        physAtk: 13,
        spiritAtk: 24,
        physDef: 12,
        spiritDef: 16,
        maxHp: 200,
        spd: 14,
        masteryRating: 42,
        fortune: 15,
        skillId: 'mob_chaos_wave',
        rank: 'elite',
      },
      {
        name: '附和者',
        role: 'st_ctrl',
        job: 'warlock',
        slot: 4,
        physAtk: 15,
        spiritAtk: 18,
        physDef: 9,
        spiritDef: 10,
        maxHp: 115,
        spd: 15,
        masteryRating: 26,
        fortune: 12,
        skillId: 'mob_berserk',
      },
      {
        name: '附和者乙',
        role: 'st_ctrl',
        job: 'warlock',
        slot: 6,
        physAtk: 15,
        spiritAtk: 18,
        physDef: 9,
        spiritDef: 10,
        maxHp: 115,
        spd: 15,
        masteryRating: 26,
        fortune: 12,
        skillId: 'mob_sleep',
      },
      {
        name: '乱心刀客',
        role: 'st_burst',
        job: 'assassin',
        slot: 9,
        physAtk: 17,
        spiritAtk: 11,
        physDef: 6,
        spiritDef: 5,
        maxHp: 90,
        spd: 14,
        critRating: 20,
        fortune: 10,
        skillId: 'mob_arrow',
      },
    ],
  },
  {
    id: 'boss_warden',
    name: '守卫首领',
    enemies: [
      {
        name: '镇狱守卫',
        role: 'tank',
        job: 'vanguard',
        slot: 2,
        physAtk: 23,
        spiritAtk: 14,
        physDef: 42,
        spiritDef: 24,
        maxHp: 520,
        spd: 10,
        versRating: 28,
        masteryRating: 26,
        fortune: 18,
        skillId: 'mob_boss_slam',
        rank: 'boss',
      },
      {
        name: '侧卫甲',
        role: 'st_burst',
        job: 'assassin',
        slot: 7,
        physAtk: 22,
        spiritAtk: 12,
        physDef: 7,
        spiritDef: 5,
        maxHp: 115,
        spd: 15,
        critRating: 34,
        fortune: 11,
        skillId: 'mob_arrow',
      },
      {
        name: '侧卫乙',
        role: 'st_heal',
        job: 'healer',
        slot: 9,
        physAtk: 7,
        spiritAtk: 20,
        physDef: 10,
        spiritDef: 14,
        maxHp: 130,
        spd: 12,
        masteryRating: 28,
        fortune: 12,
        skillId: 'mob_heal_block',
      },
    ],
  },
];
