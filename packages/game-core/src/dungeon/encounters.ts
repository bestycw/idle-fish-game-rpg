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

/** 三套路轮换，逼换阵 */
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
        physAtk: 9,
        spiritAtk: 6,
        physDef: 18,
        spiritDef: 14,
        maxHp: 95,
        spd: 7,
        versRating: 15,
        fortune: 10,
        skillId: 'mob_guard',
        rank: 'elite',
      },
      {
        name: '厚甲恶徒',
        role: 'tank',
        job: 'vanguard',
        slot: 3,
        physAtk: 10,
        spiritAtk: 7,
        physDef: 17,
        spiritDef: 13,
        maxHp: 90,
        spd: 7,
        versRating: 12,
        fortune: 10,
        skillId: 'mob_smash',
      },
      {
        name: '封脉刀手',
        role: 'st_ctrl',
        job: 'warlock',
        slot: 5,
        physAtk: 11,
        spiritAtk: 8,
        physDef: 8,
        spiritDef: 6,
        maxHp: 55,
        spd: 10,
        masteryRating: 20,
        fortune: 8,
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
        physAtk: 8,
        spiritAtk: 6,
        physDef: 10,
        spiritDef: 8,
        maxHp: 60,
        spd: 8,
        skillId: 'mob_smash',
      },
      {
        name: '伏击弓手甲',
        role: 'st_burst',
        job: 'ranger',
        slot: 7,
        physAtk: 15,
        spiritAtk: 10,
        physDef: 3,
        spiritDef: 2,
        maxHp: 42,
        spd: 13,
        critRating: 22,
        critDmgRating: 16,
        skillId: 'mob_arrow',
      },
      {
        name: '伏击弓手乙',
        role: 'st_burst',
        job: 'ranger',
        slot: 9,
        physAtk: 14,
        spiritAtk: 10,
        physDef: 3,
        spiritDef: 2,
        maxHp: 40,
        spd: 14,
        critRating: 22,
        critDmgRating: 16,
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
        physAtk: 11,
        spiritAtk: 8,
        physDef: 5,
        spiritDef: 4,
        maxHp: 50,
        spd: 15,
        masteryRating: 24,
        fortune: 6,
        skillId: 'mob_stun',
      },
      {
        name: '迟滞客',
        role: 'st_ctrl',
        job: 'warlock',
        slot: 4,
        physAtk: 10,
        spiritAtk: 7,
        physDef: 5,
        spiritDef: 4,
        maxHp: 48,
        spd: 14,
        masteryRating: 18,
        fortune: 6,
        skillId: 'mob_slow',
      },
      {
        name: '催眠客',
        role: 'st_ctrl',
        job: 'warlock',
        slot: 8,
        physAtk: 11,
        spiritAtk: 8,
        physDef: 4,
        spiritDef: 3,
        maxHp: 44,
        spd: 13,
        masteryRating: 20,
        fortune: 5,
        skillId: 'mob_sleep',
      },
      {
        name: '煽狂客',
        role: 'st_ctrl',
        job: 'warlock',
        slot: 6,
        physAtk: 10,
        spiritAtk: 7,
        physDef: 4,
        spiritDef: 3,
        maxHp: 42,
        spd: 12,
        masteryRating: 18,
        fortune: 5,
        skillId: 'mob_berserk',
      },
      {
        name: '影刃',
        role: 'st_burst',
        job: 'assassin',
        slot: 9,
        physAtk: 16,
        spiritAtk: 11,
        physDef: 3,
        spiritDef: 2,
        maxHp: 45,
        spd: 16,
        critRating: 30,
        critDmgRating: 18,
        fortune: 5,
        skillId: 'mob_arrow',
      },
    ],
  },
];
