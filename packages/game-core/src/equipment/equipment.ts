import { AFFIX_DEFS, RARE_STATS, SLOT_PREFERRED_POOL, SLOT_NAMES } from './affixes.js';
import { EFFECT_AFFIX_POOL, rollEffectAffixes } from './effectAffixes.js';
import { applyActiveSetBonuses, countEquippedSets } from './sets.js';
import { GEM_DEFS } from './gems.js';
import { EQUIP_SLOTS } from '../shared/types.js';
import type {
  AffixDef,
  AffixInstance,
  Equipment,
  EquipSlot,
  PlayerState,
  Rarity,
  Rng,
  StatKey,
  UnitRuntime,
} from '../shared/types.js';

// ---------- Rarity generation ----------

const RARITY_WEIGHTS: { rarity: Rarity; weight: number; affixCount: number }[] = [
  { rarity: 'common', weight: 40, affixCount: 0 },
  { rarity: 'uncommon', weight: 30, affixCount: 2 },
  { rarity: 'rare', weight: 20, affixCount: 3 },
  { rarity: 'epic', weight: 8, affixCount: 4 },
  { rarity: 'legendary', weight: 2, affixCount: 5 },
];

const RARITY_MULTIPLIER: Record<Rarity, number> = {
  common: 1.0,
  uncommon: 1.2,
  rare: 1.5,
  epic: 1.8,
  legendary: 2.2,
};

const RARITY_LABELS: Record<Rarity, string> = {
  common: '普通',
  uncommon: '精良',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

// ---------- Base stats per slot (white-tier reference) ----------

const BASE_STATS_DEF: Record<EquipSlot, Partial<Record<'atk' | 'def' | 'res' | 'maxHp' | 'spd', number>>> = {
  weapon: { atk: 12, maxHp: 25 },
  offhand: { def: 8, res: 8, maxHp: 25 },
  head: { maxHp: 25, res: 8 },
  chest: { maxHp: 25, def: 8, res: 8 },
  hands: { atk: 12, def: 8 },
  feet: { spd: 2, maxHp: 25, def: 8 },
  back: { res: 8, maxHp: 25 },
  neck: { atk: 12, spd: 2 },
  ring: { atk: 12, maxHp: 25 },
  trinket: { maxHp: 25, def: 8, res: 8 },
};

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

function roundRarePercent(value: number): number {
  return Math.round(value) / 100;
}

// ---------- Affix picking with soft weighting ----------

function pickAffixFromPool(rng: Rng, pool: AffixDef[], slot: EquipSlot): AffixDef {
  const preferred = SLOT_PREFERRED_POOL[slot];
  const isTrinket = slot === 'trinket';
  const weights = pool.map((d) => {
    let w = d.weight;
    if (preferred.length > 0) {
      // 70/30 split: preferred get 70% weight share
      if (preferred.includes(d.id)) {
        w *= 3; // boost preferred
      }
    }
    // trinket: rare affixes get +50% weight
    if (isTrinket && RARE_STATS.includes(d.stat)) {
      w = Math.ceil(w * 1.5);
    }
    return w;
  });
  const total = weights.reduce((s, w) => s + w, 0);
  let roll = rng.int(1, total);
  for (let i = 0; i < pool.length; i += 1) {
    roll -= weights[i]!;
    if (roll <= 0) return pool[i]!;
  }
  return pool[0]!;
}

// ---------- Rare affix (independent judgment) ----------

function rollRareAffixes(rng: Rng, rarity: Rarity, slot: EquipSlot, usedStats: Set<string>): AffixInstance[] {
  let chance = 0;
  let maxCount = 0;
  if (rarity === 'rare') { chance = 0.03; maxCount = 1; }
  else if (rarity === 'epic') { chance = 0.05; maxCount = 2; }
  else if (rarity === 'legendary') { chance = 0.08; maxCount = 2; }
  if (maxCount === 0) return [];

  const rarePool = AFFIX_DEFS.filter((d) => RARE_STATS.includes(d.stat) && !usedStats.has(d.stat));
  const result: AffixInstance[] = [];
  for (let i = 0; i < maxCount && rarePool.length > 0; i++) {
    if (rng.next() >= chance) continue;
    const def = rarePool.splice(rng.int(0, rarePool.length - 1), 1)[0]!;
    const raw = rng.int(def.min, def.max);
    result.push({
      defId: def.id,
      name: def.name,
      stat: def.stat,
      value: roundRarePercent(raw),
    });
    usedStats.add(def.stat);
  }
  return result;
}

// ---------- Socket ----------

function rollSocket(rng: Rng, rarity: Rarity): 0 | 1 {
  if (rarity === 'legendary') return 1;
  if (rarity === 'epic') return rng.next() < 0.5 ? 1 : 0;
  return 0;
}

// ---------- Generate Equipment ----------

export type GenerateEquipmentOptions = {
  setIdChance?: number;
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
  const chosenSlot = slot ?? rng.pick(EQUIP_SLOTS);
  const { rarity, affixCount } = rollRarity(rng);
  const mult = RARITY_MULTIPLIER[rarity];

  // Base stats scaled by rarity
  const rawBase = BASE_STATS_DEF[chosenSlot];
  const baseStats: Partial<Record<'atk' | 'def' | 'res' | 'maxHp' | 'spd', number>> = {};
  for (const [k, v] of Object.entries(rawBase)) {
    baseStats[k as 'atk' | 'def' | 'res' | 'maxHp' | 'spd'] = Math.round(v * mult);
  }

  // Random affixes (no duplicate stat types)
  const pool = [...AFFIX_DEFS];
  const usedStats = new Set<string>();
  const affixes: AffixInstance[] = [];
  for (let i = 0; i < affixCount && pool.length > 0; i += 1) {
    const def = pickAffixFromPool(rng, pool, chosenSlot);
    // Remove all defs with same stat to prevent duplicates
    for (let j = pool.length - 1; j >= 0; j--) {
      if (pool[j]!.stat === def.stat) pool.splice(j, 1);
    }
    usedStats.add(def.stat);
    const raw = rng.int(def.min, def.max);
    affixes.push({
      defId: def.id,
      name: def.name,
      stat: def.stat,
      value: RARE_STATS.includes(def.stat) ? roundRarePercent(raw) : raw,
    });
  }

  // Rare affixes (independent)
  const rareAffixes = rollRareAffixes(rng, rarity, chosenSlot, usedStats);

  // T3 effect affixes
  const effects = rollEffectAffixes(rng, rarity, chosenSlot);
  const effectAffixId = effects[0];
  const effectAffixId2 = effects[1];

  // Socket
  const socketCount = rollSocket(rng, rarity);

  // Set
  const setIdChance = opts?.setIdChance ?? 0.25;
  const setIdWeights = opts?.setIdWeights ?? [
    { id: 'set_pojun', weight: 1 },
    { id: 'set_tiebi', weight: 1 },
    { id: 'set_jishi', weight: 1 },
  ];
  const setId = rng.next() < setIdChance ? pickWeightedSetId(rng, setIdWeights) : undefined;

  return {
    id: createEquipmentId(rng),
    name: `${RARITY_LABELS[rarity]}${SLOT_NAMES[chosenSlot]}`,
    slot: chosenSlot,
    rarity,
    baseStats,
    affixes,
    rareAffixes: rareAffixes.length > 0 ? rareAffixes : undefined,
    effectAffixId,
    effectAffixId2,
    setId,
    socketCount,
    enhanceLevel: 0,
  };
}

// ---------- Bonuses ----------

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
    atk: 0, def: 0, res: 0, maxHp: 0, spd: 0,
    critRating: 0, critDmgRating: 0, penRating: 0,
    masteryRating: 0, tenacityRating: 0, fortuneRating: 0,
    dodge: 0, lifesteal: 0, critResist: 0, block: 0,
    counter: 0, resilience: 0, echo: 0, thorns: 0, steal: 0,
    finalDmgBonus: 0,
  };
}

function applyAffixStat(bonus: EquipmentBonuses, stat: StatKey, value: number): void {
  const key = stat as keyof EquipmentBonuses;
  if (key in bonus) bonus[key] += value;
}

function applyItemToBonus(bonus: EquipmentBonuses, item: Equipment): void {
  // Base stats (with enhance multiplier: +5% per level)
  const enhMult = 1 + item.enhanceLevel * 0.05;
  for (const [k, v] of Object.entries(item.baseStats)) {
    const key = k as keyof EquipmentBonuses;
    if (key in bonus) bonus[key] += Math.round(v * enhMult);
  }
  // Random affixes
  for (const a of item.affixes) {
    applyAffixStat(bonus, a.stat, a.value);
  }
  // Rare affixes
  if (item.rareAffixes) {
    for (const a of item.rareAffixes) {
      applyAffixStat(bonus, a.stat, a.value);
    }
  }
  // Gem
  if (item.gemId) {
    const gem = GEM_DEFS.find((g) => g.id === item.gemId);
    if (gem) applyAffixStat(bonus, gem.stat, gem.value);
  }
}

/**
 * Sum bonuses for a specific character (per-character equip).
 * Falls back to legacy `state.equipped` if `characterEquip` is not set.
 */
export function sumEquipmentBonuses(state: PlayerState, templateId?: string): EquipmentBonuses {
  const bonus = emptyBonuses();
  const equippedSetIds: (string | undefined)[] = [];

  // Determine equip map for this character
  let equipMap: Partial<Record<EquipSlot, string>> = {};
  if (templateId && state.characterEquip?.[templateId]) {
    equipMap = state.characterEquip[templateId]!;
  } else if (!templateId) {
    // Legacy: use old shared equipped (for backward compat in tests)
    equipMap = state.equipped ?? {};
  }

  for (const id of Object.values(equipMap)) {
    if (!id) continue;
    const item = state.inventory.find((e) => e.id === id);
    if (!item) continue;
    equippedSetIds.push(item.setId);
    applyItemToBonus(bonus, item);
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

// ---------- Equip/Unequip (per-character) ----------

/** Equip an item to a character's slot */
export function equipItem(state: PlayerState, itemId: string, templateId?: string): PlayerState {
  const item = state.inventory.find((e) => e.id === itemId);
  if (!item) return state;
  if (!EQUIP_SLOTS.includes(item.slot)) return state;

  if (templateId) {
    const charEquip = { ...(state.characterEquip ?? {}) };
    const slots = { ...(charEquip[templateId] ?? {}) };
    slots[item.slot] = item.id;
    charEquip[templateId] = slots;
    return { ...state, characterEquip: charEquip };
  }
  // Legacy fallback
  return { ...state, equipped: { ...state.equipped, [item.slot]: item.id } };
}

/** Unequip a slot for a character */
export function unequipSlot(state: PlayerState, slot: EquipSlot, templateId?: string): PlayerState {
  if (templateId) {
    const charEquip = { ...(state.characterEquip ?? {}) };
    const slots = { ...(charEquip[templateId] ?? {}) };
    if (!slots[slot]) return state;
    delete slots[slot];
    charEquip[templateId] = slots;
    return { ...state, characterEquip: charEquip };
  }
  // Legacy
  if (!state.equipped[slot]) return state;
  const equipped = { ...state.equipped };
  delete equipped[slot];
  return { ...state, equipped };
}

export function itemsForSlot(state: PlayerState, slot: EquipSlot): Equipment[] {
  return state.inventory.filter((e) => e.slot === slot);
}
