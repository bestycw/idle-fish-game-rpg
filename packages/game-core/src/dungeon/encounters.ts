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
  /** 开战盾（叠盾题用，不走装词缀） */
  startShield?: number;
  /** 驱散只削该比例的盾，缺省整层 */
  shieldPurgeFactor?: number;
  /** 抗控分级，默认 normal */
  rank?: UnitRank;
}

export interface EncounterDef {
  id: string;
  name: string;
  /** 战前一句：堆装/站位方向（不锁进门） */
  prepHint?: string;
  enemies: EnemySpec[];
}

/**
 * 遭遇表（2026-08-04 解法卡关 · 防御×0.5 后）：
 *
 * | 遭遇 | 卡住 | 破解 |
 * | wall | 无破甲磨不动 | 破甲（悟空/诸葛） |
 * | archers | 磨前门时被后排点杀 | 穿透先斩弓 |
 * | raiders | 控+双影刃秒玻璃 | 盾/坦/奶 |
 * | spirit_wall | 高物防（力队吃瘪） | 深破甲；镜渊 pressure>1 |
 * | chaos_rite | 群扰乱 | 斩祭师/续航/控场 |
 * | boss_warden | 免疫硬控+厚血 | 破甲/流血，先清侧卫 |
 * | oil_cask | 后排奶抬不完 | 禁疗 / 斩杀 / 穿透点奶 |
 * | shield_stack | 盾挡完输出 | 对盾增伤 |
 *
 * 基线按开局/猎装 pressure=1；章档×本种（二章 1.25、三章 1.55、镜渊再 ×1.3）。
 * 猎装旧题（弓/速）在三章压力下才卡穿透/坦奶；油桶/叠盾二章解锁后在 p1 即可卡关。
 */
export const ENCOUNTERS: EncounterDef[] = [
  {
    id: 'wall',
    name: '盾墙巡逻',
    prepHint: '前排极肉：破甲/群攻磨盾，术士可禁疗 · 猎装刷装',
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
    ],
  },
  {
    id: 'archers',
    name: '后排伏击',
    prepHint: '先撕前排否则后排点杀：穿透/切后 · 猎装量、镜渊对症 T3',
    enemies: [
      {
        name: '挡箭杂兵',
        role: 'tank',
        job: 'vanguard',
        slot: 2,
        atk: 12,
        def: 16,
        res: 10,
        maxHp: 250,
        spd: 8,
        fortuneRating: 8,
        skillId: 'mob_smash',
      },
      {
        name: '伏击弓手甲',
        role: 'st_burst',
        job: 'ranger',
        slot: 7,
        atk: 21,
        def: 5,
        res: 4,
        maxHp: 66,
        spd: 16,
        critRating: 34,
        critDmgRating: 24,
        fortuneRating: 6,
        skillId: 'mob_arrow',
      },
      {
        name: '伏击弓手乙',
        role: 'st_burst',
        job: 'ranger',
        slot: 9,
        atk: 20,
        def: 5,
        res: 4,
        maxHp: 62,
        spd: 16,
        critRating: 34,
        critDmgRating: 24,
        fortuneRating: 6,
        skillId: 'mob_arrow',
      },
    ],
  },
  {
    id: 'raiders',
    name: '速攻刺客',
    prepHint: '身法快带控：护盾/坦阵，优先秒脆皮后排',
    enemies: [
      {
        name: '点穴客',
        role: 'st_ctrl',
        job: 'warlock',
        slot: 5,
        atk: 16,
        def: 9,
        res: 8,
        maxHp: 105,
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
        atk: 15,
        def: 9,
        res: 8,
        maxHp: 100,
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
        atk: 15,
        def: 8,
        res: 7,
        maxHp: 96,
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
        atk: 22,
        def: 5,
        res: 4,
        maxHp: 88,
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
    prepHint: '物防极高：灵伤或裂甲/破甲 T3 · 解法装→镜渊试炼',
    enemies: [
      {
        name: '铁壁灵卫',
        role: 'tank',
        job: 'vanguard',
        slot: 1,
        atk: 18,
        def: 60,
        res: 14,
        maxHp: 240,
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
        def: 56,
        res: 13,
        maxHp: 220,
        spd: 7,
        fortuneRating: 14,
        skillId: 'mob_smash',
      },
      {
        name: '灵矢手',
        role: 'st_burst',
        job: 'mage',
        slot: 8,
        atk: 20,
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
    prepHint: '群乱心：先斩祭师，净化/护盾稳住',
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
    prepHint: '首领厚血抗控：破甲/流血，先清侧卫再集火',
    enemies: [
      {
        name: '镇狱守卫',
        role: 'tank',
        job: 'vanguard',
        slot: 2,
        atk: 23,
        def: 50,
        res: 24,
        maxHp: 560,
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
  {
    id: 'oil_cask',
    name: '油桶续命',
    prepHint: '后排双医抬血：禁疗/斩杀/穿透点医 · 净疗/禁疗 T3→镜渊',
    enemies: [
      {
        name: '油桶门板',
        role: 'tank',
        job: 'vanguard',
        slot: 2,
        atk: 12,
        def: 22,
        res: 14,
        maxHp: 480,
        spd: 7,
        fortuneRating: 10,
        skillId: 'mob_smash',
      },
      {
        name: '油桶刀手',
        role: 'st_burst',
        job: 'assassin',
        slot: 5,
        atk: 13,
        def: 8,
        res: 7,
        maxHp: 85,
        spd: 12,
        critRating: 16,
        fortuneRating: 8,
        skillId: 'mob_arrow',
      },
      {
        name: '油桶医士',
        role: 'st_heal',
        job: 'healer',
        slot: 7,
        atk: 36,
        def: 6,
        res: 12,
        maxHp: 72,
        spd: 16,
        masteryRating: 42,
        fortuneRating: 12,
        skillId: 'mob_mend',
      },
      {
        name: '油桶药童',
        role: 'st_heal',
        job: 'healer',
        slot: 9,
        atk: 32,
        def: 5,
        res: 11,
        maxHp: 68,
        spd: 15,
        masteryRating: 36,
        fortuneRating: 10,
        skillId: 'mob_mend',
      },
    ],
  },
  {
    id: 'shield_stack',
    name: '叠盾铁阵',
    prepHint: '反复叠盾：对盾增伤/破盾 T3 · 解法装→镜渊试炼',
    enemies: [
      {
        name: '叠盾甲',
        role: 'tank',
        job: 'vanguard',
        slot: 2,
        atk: 30,
        def: 16,
        res: 12,
        maxHp: 210,
        spd: 10,
        fortuneRating: 10,
        skillId: 'mob_stack_shield',
        startShield: 180,
        shieldPurgeFactor: 0.22,
      },
      {
        name: '叠盾乙',
        role: 'tank',
        job: 'vanguard',
        slot: 6,
        atk: 30,
        def: 16,
        res: 12,
        maxHp: 210,
        spd: 10,
        fortuneRating: 10,
        skillId: 'mob_stack_shield',
        startShield: 180,
        shieldPurgeFactor: 0.22,
      },
      {
        name: '叠盾丙',
        role: 'group_amp',
        job: 'support',
        slot: 8,
        atk: 32,
        def: 14,
        res: 13,
        maxHp: 190,
        spd: 13,
        fortuneRating: 10,
        skillId: 'mob_stack_shield',
        startShield: 200,
        shieldPurgeFactor: 0.22,
      },
    ],
  },
];
