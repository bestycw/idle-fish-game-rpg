import { AFFIX_DEFS, SLOT_AFFIX_BIAS, SLOT_NAMES } from './affixes.js';
import { applyActiveSetBonuses, countEquippedSets } from './sets.js';
import { UNLOCKED_EQUIP_SLOTS } from '../shared/types.js';
import type {
  AffixDef,
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

const RARE_STATS: StatKey[] = ['dodge', 'lifesteal', 'critResist', 'block', 'counter', 'resilience', 'echo', 'thorns', 'steal'];

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

function pickAffixFromPool(rng: Rng, pool: AffixDef[], slot: EquipSlot): AffixDef {
  const bias = SLOT_AFFIX_BIAS[slot] ?? {};
  const weights = pool.map((d) => Math.max(1, bias[d.id] ?? 1));
  const total = weights.reduce((s, w) => s + w, 0);
  let roll = rng.int(1, total);
  for (let i = 0; i < pool.length; i += 1) {
    roll -= weights[i]!;
    if (roll <= 0) return pool[i]!;
  }
  return pool[0]!;
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
    const def = pickAffixFromPool(rng, pool, chosenSlot);
    const idx = pool.findIndex((d) => d.id === def.id);
    if (idx >= 0) pool.splice(idx, 1);
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
    { id: 'set_pojun', weight: 1 },
    { id: 'set_tiebi', weight: 1 },
    { id: 'set_jishi', weight: 1 },
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
  atk: number;
  def: number;
  res: number;
  maxHp: number;
  spd: number;
  critRating: number;
  critDmgRating: number;
  penRating: number;
  masteryRating: number;
  tenacityRating: number;
  fortuneRating: number;
  dodge: number;
  lifesteal: number;
  critResist: number;
  block: number;
  counter: number;
  resilience: number;
  echo: number;
  thorns: number;
  steal: number;
  finalDmgBonus: number;
};

export function emptyBonuses(): EquipmentBonuses {
  return {
    atk: 0,
    def: 0,
    res: 0,
    maxHp: 0,
    spd: 0,
    critRating: 0,
    critDmgRating: 0,
    penRating: 0,
    masteryRating: 0,
    tenacityRating: 0,
    fortuneRating: 0,
    dodge: 0,
    lifesteal: 0,
    critResist: 0,
    block: 0,
    counter: 0,
    resilience: 0,
    echo: 0,
    thorns: 0,
    steal: 0,
    finalDmgBonus: 0,
  };
}

function applyAffixStat(bonus: EquipmentBonuses, stat: StatKey, value: number): void {
  const key = stat as keyof EquipmentBonuses;
  if (key in bonus) bonus[key] += value;
}

export function sumEquipmentBonuses(state: PlayerState): EquipmentBonuses {
  const bonus = emptyBonuses();
  const equippedSetIds: (string | undefined)[] = [];
  for (const id of Object.values(state.equipped)) {
    if (!id) continue;
    const item = state.inventory.find((e) => e.id === id);
    if (!item) continue;
    equippedSetIds.push(item.setId);
    for (const a of item.affixes) {
      applyAffixStat(bonus, a.stat, a.value);
    }
  }
  applyActiveSetBonuses(bonus, countEquippedSets(equippedSetIds));
  return bonus;
}

export function applyBonusesToUnit(unit: UnitRuntime, bonus: EquipmentBonuses): UnitRuntime {
  const maxHp = unit.maxHp + bonus.maxHp;
  const hpRatio = unit.maxHp > 0 ? unit.hp / unit.maxHp : 1;
  return {
    ...unit,
    atk: unit.atk + bonus.atk,
    def: unit.def + bonus.def,
    res: unit.res + bonus.res,
    spd: unit.spd + bonus.spd,
    critRating: unit.critRating + bonus.critRating,
    critDmgRating: unit.critDmgRating + bonus.critDmgRating,
    penRating: unit.penRating + bonus.penRating,
    masteryRating: unit.masteryRating + bonus.masteryRating,
    tenacityRating: unit.tenacityRating + bonus.tenacityRating,
    fortuneRating: unit.fortuneRating + bonus.fortuneRating,
    dodge: Math.min(0.25, unit.dodge + bonus.dodge),
    lifesteal: Math.min(0.12, unit.lifesteal + bonus.lifesteal),
    critResist: Math.min(0.25, unit.critResist + bonus.critResist),
    block: Math.min(0.3, unit.block + bonus.block),
    counter: Math.min(0.2, unit.counter + bonus.counter),
    resilience: Math.min(0.15, unit.resilience + bonus.resilience),
    echo: Math.min(0.18, unit.echo + bonus.echo),
    thorns: Math.min(0.15, unit.thorns + bonus.thorns),
    steal: Math.min(0.12, unit.steal + bonus.steal),
    finalDmgBonus: unit.finalDmgBonus + bonus.finalDmgBonus,
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
