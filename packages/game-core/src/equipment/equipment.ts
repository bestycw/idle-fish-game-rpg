import { AFFIX_DEFS, SLOT_NAMES } from './affixes.js';
import { UNLOCKED_EQUIP_SLOTS } from '../shared/types.js';
import type {
  Equipment,
  EquipSlot,
  PlayerState,
  Rarity,
  Rng,
  StatKey,
  UnitRuntime,
} from '../shared/types.js';

const RARITY_WEIGHTS: { rarity: Rarity; weight: number; affixCount: number }[] = [
  { rarity: 'common', weight: 60, affixCount: 1 },
  { rarity: 'rare', weight: 30, affixCount: 2 },
  { rarity: 'epic', weight: 10, affixCount: 3 },
];

const RARE_STATS: StatKey[] = ['dodge', 'lifesteal', 'critResist', 'block'];

function rollRarity(rng: Rng): { rarity: Rarity; affixCount: number } {
  const total = RARITY_WEIGHTS.reduce((s, r) => s + r.weight, 0);
  let roll = rng.int(1, total);
  for (const row of RARITY_WEIGHTS) {
    roll -= row.weight;
    if (roll <= 0) return { rarity: row.rarity, affixCount: row.affixCount };
  }
  return RARITY_WEIGHTS[0]!;
}

let equipSeq = 0;

export function createEquipmentId(rng: Rng): string {
  equipSeq += 1;
  return `eq_${rng.int(1000, 9999)}_${equipSeq}`;
}

function roundRare(value: number): number {
  return Math.round(value) / 100;
}

export type GenerateEquipmentOptions = {
  /** 缺省 0.25 */
  setIdChance?: number;
  /** 缺省 set_demo_1 / set_demo_2 等权 */
  setIdWeights?: { id: string; weight: number }[];
};

function pickWeightedSetId(rng: Rng, weights: { id: string; weight: number }[]): string | undefined {
  if (weights.length === 0) return undefined;
  const total = weights.reduce((s, w) => s + w.weight, 0);
  if (total <= 0) return undefined;
  let roll = rng.int(1, total);
  for (const row of weights) {
    roll -= row.weight;
    if (roll <= 0) return row.id;
  }
  return weights[0]?.id;
}

export function generateEquipment(
  rng: Rng,
  slot?: EquipSlot,
  opts?: GenerateEquipmentOptions,
): Equipment {
  const chosenSlot = slot ?? rng.pick(UNLOCKED_EQUIP_SLOTS);
  const { rarity, affixCount } = rollRarity(rng);
  const pool = [...AFFIX_DEFS];
  const affixes = [];
  for (let i = 0; i < affixCount && pool.length > 0; i += 1) {
    const idx = rng.int(0, pool.length - 1);
    const def = pool.splice(idx, 1)[0]!;
    const raw = rng.int(def.min, def.max);
    affixes.push({
      defId: def.id,
      name: def.name,
      stat: def.stat,
      value: RARE_STATS.includes(def.stat) ? roundRare(raw) : raw,
    });
  }
  const rarityLabel = rarity === 'epic' ? '史诗' : rarity === 'rare' ? '稀有' : '普通';
  const setIdChance = opts?.setIdChance ?? 0.25;
  const setIdWeights = opts?.setIdWeights ?? [
    { id: 'set_demo_1', weight: 1 },
    { id: 'set_demo_2', weight: 1 },
  ];
  const setId = rng.next() < setIdChance ? pickWeightedSetId(rng, setIdWeights) : undefined;
  return {
    id: createEquipmentId(rng),
    name: `${rarityLabel}${SLOT_NAMES[chosenSlot] ?? chosenSlot}`,
    slot: chosenSlot,
    rarity,
    affixes,
    setId,
  };
}

export type EquipmentBonuses = {
  physAtk: number;
  spiritAtk: number;
  physDef: number;
  spiritDef: number;
  maxHp: number;
  spd: number;
  critRating: number;
  critDmgRating: number;
  hasteRating: number;
  versRating: number;
  masteryRating: number;
  finalDmgRating: number;
  fortune: number;
  dodge: number;
  lifesteal: number;
  critResist: number;
  block: number;
};

export function emptyBonuses(): EquipmentBonuses {
  return {
    physAtk: 0,
    spiritAtk: 0,
    physDef: 0,
    spiritDef: 0,
    maxHp: 0,
    spd: 0,
    critRating: 0,
    critDmgRating: 0,
    hasteRating: 0,
    versRating: 0,
    masteryRating: 0,
    finalDmgRating: 0,
    fortune: 0,
    dodge: 0,
    lifesteal: 0,
    critResist: 0,
    block: 0,
  };
}

function applyAffixStat(bonus: EquipmentBonuses, stat: StatKey, value: number): void {
  if (stat === 'atk') {
    bonus.physAtk += value;
    return;
  }
  if (stat === 'def') {
    bonus.physDef += value;
    return;
  }
  const key = stat as keyof EquipmentBonuses;
  if (key in bonus) bonus[key] += value;
}

export function sumEquipmentBonuses(state: PlayerState): EquipmentBonuses {
  const bonus = emptyBonuses();
  for (const id of Object.values(state.equipped)) {
    if (!id) continue;
    const item = state.inventory.find((e) => e.id === id);
    if (!item) continue;
    for (const a of item.affixes) {
      applyAffixStat(bonus, a.stat, a.value);
    }
  }
  return bonus;
}

export function applyBonusesToUnit(unit: UnitRuntime, bonus: EquipmentBonuses): UnitRuntime {
  const maxHp = unit.maxHp + bonus.maxHp;
  const hpRatio = unit.maxHp > 0 ? unit.hp / unit.maxHp : 1;
  return {
    ...unit,
    physAtk: unit.physAtk + bonus.physAtk,
    spiritAtk: unit.spiritAtk + bonus.spiritAtk,
    physDef: unit.physDef + bonus.physDef,
    spiritDef: unit.spiritDef + bonus.spiritDef,
    spd: unit.spd + bonus.spd,
    critRating: unit.critRating + bonus.critRating,
    critDmgRating: unit.critDmgRating + bonus.critDmgRating,
    hasteRating: unit.hasteRating + bonus.hasteRating,
    versRating: unit.versRating + bonus.versRating,
    masteryRating: unit.masteryRating + bonus.masteryRating,
    finalDmgRating: unit.finalDmgRating + bonus.finalDmgRating,
    fortune: Math.min(50, unit.fortune + bonus.fortune),
    dodge: Math.min(0.25, unit.dodge + bonus.dodge),
    lifesteal: Math.min(0.12, unit.lifesteal + bonus.lifesteal),
    critResist: Math.min(0.25, unit.critResist + bonus.critResist),
    block: Math.min(0.3, unit.block + bonus.block),
    maxHp,
    hp: Math.max(1, Math.round(maxHp * hpRatio)),
  };
}

export function equipItem(state: PlayerState, itemId: string): PlayerState {
  const item = state.inventory.find((e) => e.id === itemId);
  if (!item) return state;
  if (!UNLOCKED_EQUIP_SLOTS.includes(item.slot)) return state;
  return {
    ...state,
    equipped: { ...state.equipped, [item.slot]: item.id },
  };
}

export function unequipSlot(state: PlayerState, slot: EquipSlot): PlayerState {
  if (!state.equipped[slot]) return state;
  const equipped = { ...state.equipped };
  delete equipped[slot];
  return { ...state, equipped };
}

export function itemsForSlot(state: PlayerState, slot: EquipSlot): Equipment[] {
  return state.inventory.filter((e) => e.slot === slot);
}

export { UNLOCKED_EQUIP_SLOTS };
