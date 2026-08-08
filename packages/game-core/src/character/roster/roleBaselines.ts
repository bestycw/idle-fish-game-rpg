/**
 * 占位卡属性底板：按 role + rarity 生成，避免手填 76 份。
 * 深做卡仍用 templates 手工数值。
 */
import type { DamageSchool, GridSlot, Job, Rarity, Role, UnitTemplate } from '../../shared/types.js';

export interface RoleBaseline {
  preferredSlot: GridSlot;
  job: Job;
  damageSchool: DamageSchool;
  baseAtk: number;
  baseDef: number;
  baseRes: number;
  baseMaxHp: number;
  baseSpd: number;
  critRating: number;
  critDmgRating: number;
  penRating: number;
  masteryRating: number;
  tenacityRating: number;
  fortuneRating: number;
}

const BASE: Record<Role, RoleBaseline> = {
  tank: {
    preferredSlot: 1,
    job: 'vanguard',
    damageSchool: 'phys',
    baseAtk: 10,
    baseDef: 14,
    baseRes: 11,
    baseMaxHp: 120,
    baseSpd: 9,
    critRating: 8,
    critDmgRating: 8,
    penRating: 0,
    tenacityRating: 0,
    masteryRating: 14,
    fortuneRating: 8,
  },
  st_burst: {
    preferredSlot: 8,
    job: 'assassin',
    damageSchool: 'phys',
    baseAtk: 16,
    baseDef: 5,
    baseRes: 4,
    baseMaxHp: 74,
    baseSpd: 14,
    critRating: 22,
    critDmgRating: 18,
    penRating: 0,
    tenacityRating: 0,
    masteryRating: 16,
    fortuneRating: 6,
  },
  aoe_dps: {
    preferredSlot: 5,
    job: 'mage',
    damageSchool: 'phys',
    baseAtk: 12,
    baseDef: 6,
    baseRes: 7,
    baseMaxHp: 86,
    baseSpd: 12,
    critRating: 16,
    critDmgRating: 14,
    penRating: 0,
    tenacityRating: 0,
    masteryRating: 12,
    fortuneRating: 7,
  },
  st_ctrl: {
    preferredSlot: 6,
    job: 'warlock',
    damageSchool: 'spirit',
    baseAtk: 14,
    baseDef: 5,
    baseRes: 8,
    baseMaxHp: 78,
    baseSpd: 11,
    critRating: 10,
    critDmgRating: 10,
    penRating: 0,
    tenacityRating: 0,
    masteryRating: 14,
    fortuneRating: 8,
  },
  aoe_ctrl: {
    preferredSlot: 4,
    job: 'warlock',
    damageSchool: 'spirit',
    baseAtk: 13,
    baseDef: 5,
    baseRes: 8,
    baseMaxHp: 80,
    baseSpd: 11,
    critRating: 10,
    critDmgRating: 10,
    penRating: 0,
    tenacityRating: 0,
    masteryRating: 14,
    fortuneRating: 8,
  },
  group_amp: {
    preferredSlot: 5,
    job: 'support',
    damageSchool: 'spirit',
    baseAtk: 13,
    baseDef: 6,
    baseRes: 9,
    baseMaxHp: 84,
    baseSpd: 11,
    critRating: 8,
    critDmgRating: 8,
    penRating: 0,
    tenacityRating: 0,
    masteryRating: 16,
    fortuneRating: 9,
  },
  st_heal: {
    preferredSlot: 7,
    job: 'healer',
    damageSchool: 'spirit',
    baseAtk: 14,
    baseDef: 5,
    baseRes: 10,
    baseMaxHp: 82,
    baseSpd: 10,
    critRating: 6,
    critDmgRating: 6,
    penRating: 0,
    tenacityRating: 0,
    masteryRating: 14,
    fortuneRating: 10,
  },
  aoe_heal: {
    preferredSlot: 7,
    job: 'healer',
    damageSchool: 'spirit',
    baseAtk: 13,
    baseDef: 5,
    baseRes: 10,
    baseMaxHp: 84,
    baseSpd: 10,
    critRating: 6,
    critDmgRating: 6,
    penRating: 0,
    tenacityRating: 0,
    masteryRating: 14,
    fortuneRating: 10,
  },
  flex: {
    preferredSlot: 2,
    job: 'adept',
    damageSchool: 'phys',
    baseAtk: 13,
    baseDef: 8,
    baseRes: 8,
    baseMaxHp: 92,
    baseSpd: 12,
    critRating: 14,
    critDmgRating: 12,
    penRating: 0,
    tenacityRating: 0,
    masteryRating: 12,
    fortuneRating: 8,
  },
};

/** 凡→绝：略抬面板，绝品不碾压深做卡 */
const RARITY_SCALE: Record<Rarity, number> = {
  common: 0.92,
  rare: 1.0,
  epic: 1.06,
  legendary: 1.12,
};

function scale(n: number, s: number): number {
  return Math.max(1, Math.round(n * s));
}

export function buildStubTemplate(opts: {
  id: string;
  name: string;
  role: Role;
  rarity: Rarity;
  skillId: string;
  job?: Job;
  preferredSlot?: GridSlot;
}): UnitTemplate {
  const b = BASE[opts.role];
  const s = RARITY_SCALE[opts.rarity];
  return {
    id: opts.id,
    name: opts.name,
    role: opts.role,
    job: opts.job ?? b.job,
    rarity: opts.rarity,
    preferredSlot: opts.preferredSlot ?? b.preferredSlot,
    damageSchool: b.damageSchool,
    baseAtk: scale(b.baseAtk, s),
    baseDef: scale(b.baseDef, s),
    baseRes: scale(b.baseRes, s),
    baseMaxHp: scale(b.baseMaxHp, s),
    baseSpd: scale(b.baseSpd, s),
    critRating: scale(b.critRating, s),
    critDmgRating: scale(b.critDmgRating, s),
    penRating: scale(b.penRating, s),
    tenacityRating: scale(b.tenacityRating, s),
    masteryRating: scale(b.masteryRating, s),
        fortuneRating: scale(b.fortuneRating, s),
    maxQi: 100,
    skillId: opts.skillId,
  };
}
