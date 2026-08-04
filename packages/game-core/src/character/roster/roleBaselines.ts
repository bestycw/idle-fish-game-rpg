/**
 * 占位卡属性底板：按 role + rarity 生成，避免手填 76 份。
 * 深做卡仍用 templates 手工数值。
 */
import type { GridSlot, Job, Rarity, Role, UnitTemplate } from '../../shared/types.js';

export interface RoleBaseline {
  preferredSlot: GridSlot;
  job: Job;
  basePhysAtk: number;
  baseSpiritAtk: number;
  basePhysDef: number;
  baseSpiritDef: number;
  baseMaxHp: number;
  baseSpd: number;
  critRating: number;
  critDmgRating: number;
  hasteRating: number;
  versRating: number;
  masteryRating: number;
  finalDmgRating: number;
  fortune: number;
}

const BASE: Record<Role, RoleBaseline> = {
  tank: {
    preferredSlot: 1,
    job: 'vanguard',
    basePhysAtk: 10,
    baseSpiritAtk: 5,
    basePhysDef: 14,
    baseSpiritDef: 11,
    baseMaxHp: 120,
    baseSpd: 9,
    critRating: 8,
    critDmgRating: 8,
    hasteRating: 6,
    versRating: 16,
    masteryRating: 14,
    finalDmgRating: 0,
    fortune: 8,
  },
  st_burst: {
    preferredSlot: 8,
    job: 'assassin',
    basePhysAtk: 16,
    baseSpiritAtk: 7,
    basePhysDef: 5,
    baseSpiritDef: 4,
    baseMaxHp: 74,
    baseSpd: 14,
    critRating: 22,
    critDmgRating: 18,
    hasteRating: 12,
    versRating: 4,
    masteryRating: 16,
    finalDmgRating: 8,
    fortune: 6,
  },
  aoe_dps: {
    preferredSlot: 5,
    job: 'mage',
    basePhysAtk: 12,
    baseSpiritAtk: 12,
    basePhysDef: 6,
    baseSpiritDef: 7,
    baseMaxHp: 86,
    baseSpd: 12,
    critRating: 16,
    critDmgRating: 14,
    hasteRating: 10,
    versRating: 8,
    masteryRating: 12,
    finalDmgRating: 8,
    fortune: 7,
  },
  st_ctrl: {
    preferredSlot: 6,
    job: 'warlock',
    basePhysAtk: 6,
    baseSpiritAtk: 14,
    basePhysDef: 5,
    baseSpiritDef: 8,
    baseMaxHp: 78,
    baseSpd: 11,
    critRating: 10,
    critDmgRating: 10,
    hasteRating: 10,
    versRating: 8,
    masteryRating: 14,
    finalDmgRating: 4,
    fortune: 8,
  },
  aoe_ctrl: {
    preferredSlot: 4,
    job: 'warlock',
    basePhysAtk: 6,
    baseSpiritAtk: 13,
    basePhysDef: 5,
    baseSpiritDef: 8,
    baseMaxHp: 80,
    baseSpd: 11,
    critRating: 10,
    critDmgRating: 10,
    hasteRating: 10,
    versRating: 8,
    masteryRating: 14,
    finalDmgRating: 4,
    fortune: 8,
  },
  group_amp: {
    preferredSlot: 5,
    job: 'support',
    basePhysAtk: 6,
    baseSpiritAtk: 13,
    basePhysDef: 6,
    baseSpiritDef: 9,
    baseMaxHp: 84,
    baseSpd: 11,
    critRating: 8,
    critDmgRating: 8,
    hasteRating: 10,
    versRating: 10,
    masteryRating: 16,
    finalDmgRating: 2,
    fortune: 9,
  },
  st_heal: {
    preferredSlot: 7,
    job: 'healer',
    basePhysAtk: 4,
    baseSpiritAtk: 14,
    basePhysDef: 5,
    baseSpiritDef: 10,
    baseMaxHp: 82,
    baseSpd: 10,
    critRating: 6,
    critDmgRating: 6,
    hasteRating: 8,
    versRating: 10,
    masteryRating: 14,
    finalDmgRating: 0,
    fortune: 10,
  },
  aoe_heal: {
    preferredSlot: 7,
    job: 'healer',
    basePhysAtk: 4,
    baseSpiritAtk: 13,
    basePhysDef: 5,
    baseSpiritDef: 10,
    baseMaxHp: 84,
    baseSpd: 10,
    critRating: 6,
    critDmgRating: 6,
    hasteRating: 8,
    versRating: 10,
    masteryRating: 14,
    finalDmgRating: 0,
    fortune: 10,
  },
  flex: {
    preferredSlot: 2,
    job: 'adept',
    basePhysAtk: 13,
    baseSpiritAtk: 11,
    basePhysDef: 8,
    baseSpiritDef: 8,
    baseMaxHp: 92,
    baseSpd: 12,
    critRating: 14,
    critDmgRating: 12,
    hasteRating: 10,
    versRating: 10,
    masteryRating: 12,
    finalDmgRating: 6,
    fortune: 8,
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
    basePhysAtk: scale(b.basePhysAtk, s),
    baseSpiritAtk: scale(b.baseSpiritAtk, s),
    basePhysDef: scale(b.basePhysDef, s),
    baseSpiritDef: scale(b.baseSpiritDef, s),
    baseMaxHp: scale(b.baseMaxHp, s),
    baseSpd: scale(b.baseSpd, s),
    critRating: scale(b.critRating, s),
    critDmgRating: scale(b.critDmgRating, s),
    hasteRating: scale(b.hasteRating, s),
    versRating: scale(b.versRating, s),
    masteryRating: scale(b.masteryRating, s),
    finalDmgRating: scale(b.finalDmgRating, s),
    fortune: scale(b.fortune, s),
    maxQi: 100,
    skillId: opts.skillId,
  };
}
