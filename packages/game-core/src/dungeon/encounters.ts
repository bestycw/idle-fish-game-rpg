import type { GridSlot, Role, UnitRank, UnitTemplate } from '../shared/types.js';

export interface EnemySpec {
  name: string;
  role: Role;
  job: UnitTemplate['job'];
  slot: GridSlot;
  damageSchool?: 'phys' | 'spirit';
  atk: number;
  def: number;
  res: number;
  maxHp: number;
  spd: number;
  critRating?: number;
  critDmgRating?: number;
  penRating?: number;
  masteryRating?: number;
  tenacityRating?: number;
  fortuneRating?: number;
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
        atk: 16,
        def: 36,
        res: 18,
        maxHp: 225,
        spd: 7,
        tenacityRating: 22,
        fortuneRating: 14,
        skillId: 'mob_guard',
        rank: 'elite',
      },
      {
        name: '厚甲恶徒',
        role: 'tank',
        job: 'vanguard',
        slot: 3,
        atk: 15,
        def: 36,
        res: 17,
        maxHp: 220,
        spd: 7,
        tenacityRating: 18,
        fortuneRating: 12,
        skillId: 'mob_smash',
      },
      {
        name: '封脉刀手',
        role: 'st_ctrl',
        job: 'warlock',
        slot: 5,
        atk: 14,
        def: 11,
        res: 10,
        maxHp: 110,
        spd: 12,
        masteryRating: 28,
        fortuneRating: 12,
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
        atk: 13,
        def: 14,
        res: 10,
        maxHp: 115,
        spd: 8,
        fortuneRating: 8,
        skillId: 'mob_smash',
      },
      {
        name: '伏击弓手甲',
        role: 'st_burst',
        job: 'ranger',
        slot: 7,
        atk: 22,
        def: 5,
        res: 4,
        maxHp: 78,
        spd: 15,
        critRating: 30,
        critDmgRating: 22,
        fortuneRating: 6,
        skillId: 'mob_arrow',
      },
      {
        name: '伏击弓手乙',
        role: 'st_burst',
        job: 'ranger',
        slot: 9,
        atk: 21,
        def: 5,
        res: 4,
        maxHp: 74,
        spd: 16,
        critRating: 30,
        critDmgRating: 22,
        fortuneRating: 6,
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
        atk: 15,
        def: 8,
        res: 7,
        maxHp: 85,
        spd: 16,
        masteryRating: 26,
        fortuneRating: 11,
        skillId: 'mob_stun',
      },
      {
        name: '迟滞客',
        role: 'st_ctrl',
        job: 'warlock',
        slot: 4,
        atk: 14,
        def: 8,
        res: 7,
        maxHp: 82,
        spd: 15,
        masteryRating: 22,
        fortuneRating: 10,
        skillId: 'mob_slow',
      },
      {
        name: '催眠客',
        role: 'st_ctrl',
        job: 'warlock',
        slot: 8,
        atk: 14,
        def: 7,
        res: 6,
        maxHp: 78,
        spd: 14,
        masteryRating: 24,
        fortuneRating: 10,
        skillId: 'mob_sleep',
      },
      {
        name: '影刃',
        role: 'st_burst',
        job: 'assassin',
        slot: 9,
        atk: 20,
        def: 5,
        res: 4,
        maxHp: 80,
        spd: 16,
        critRating: 30,
        critDmgRating: 22,
        fortuneRating: 10,
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
        atk: 18,
        def: 54,
        res: 14,
        maxHp: 300,
        spd: 7,
        tenacityRating: 26,
        fortuneRating: 16,
        skillId: 'mob_guard',
        rank: 'elite',
      },
      {
        name: '铁壁灵卫乙',
        role: 'tank',
        job: 'vanguard',
        slot: 3,
        atk: 17,
        def: 50,
        res: 13,
        maxHp: 280,
        spd: 7,
        fortuneRating: 14,
        skillId: 'mob_smash',
      },
      {
        name: '灵矢手',
        role: 'st_burst',
        job: 'mage',
        slot: 8,
        atk: 34,
        def: 7,
        res: 12,
        maxHp: 120,
        spd: 16,
        critRating: 34,
        fortuneRating: 10,
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
        atk: 24,
        def: 12,
        res: 16,
        maxHp: 200,
        spd: 14,
        masteryRating: 42,
        fortuneRating: 15,
        skillId: 'mob_chaos_wave',
        rank: 'elite',
      },
      {
        name: '附和者',
        role: 'st_ctrl',
        job: 'warlock',
        slot: 4,
        atk: 18,
        def: 9,
        res: 10,
        maxHp: 115,
        spd: 15,
        masteryRating: 26,
        fortuneRating: 12,
        skillId: 'mob_berserk',
      },
      {
        name: '附和者乙',
        role: 'st_ctrl',
        job: 'warlock',
        slot: 6,
        atk: 18,
        def: 9,
        res: 10,
        maxHp: 115,
        spd: 15,
        masteryRating: 26,
        fortuneRating: 12,
        skillId: 'mob_sleep',
      },
      {
        name: '乱心刀客',
        role: 'st_burst',
        job: 'assassin',
        slot: 9,
        atk: 17,
        def: 6,
        res: 5,
        maxHp: 90,
        spd: 14,
        critRating: 20,
        fortuneRating: 10,
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
        atk: 23,
        def: 42,
        res: 24,
        maxHp: 520,
        spd: 10,
        tenacityRating: 28,
        masteryRating: 26,
        fortuneRating: 18,
        skillId: 'mob_boss_slam',
        rank: 'boss',
      },
      {
        name: '侧卫甲',
        role: 'st_burst',
        job: 'assassin',
        slot: 7,
        atk: 22,
        def: 7,
        res: 5,
        maxHp: 115,
        spd: 15,
        critRating: 34,
        fortuneRating: 11,
        skillId: 'mob_arrow',
      },
      {
        name: '侧卫乙',
        role: 'st_heal',
        job: 'healer',
        slot: 9,
        atk: 20,
        def: 10,
        res: 14,
        maxHp: 130,
        spd: 12,
        masteryRating: 28,
        fortuneRating: 12,
        skillId: 'mob_heal_block',
      },
    ],
  },
];
