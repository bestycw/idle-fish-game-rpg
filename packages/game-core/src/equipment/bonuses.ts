import type { Equipment, PlayerState, StatKey, UnitRuntime } from '../shared/types.js';
import { GEM_DEFS } from './gems.js';
import { applyActiveSetBonuses, countEquippedSets } from './sets.js';
import { canWearEquipment } from './wear.js';

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
  qiSiphon: number;
  qiRefund: number;
  finalDmgBonus: number;
};

export function emptyBonuses(): EquipmentBonuses {
  return {
    atk: 0, def: 0, res: 0, maxHp: 0, spd: 0,
    critRating: 0, critDmgRating: 0, penRating: 0,
    masteryRating: 0, tenacityRating: 0, fortuneRating: 0,
    dodge: 0, lifesteal: 0, critResist: 0, block: 0,
    counter: 0, resilience: 0, echo: 0, thorns: 0, steal: 0,
    qiSiphon: 0, qiRefund: 0,
    finalDmgBonus: 0,
  };
}

function applyAffixStat(bonus: EquipmentBonuses, stat: StatKey, value: number): void {
  const key = stat as keyof EquipmentBonuses;
  if (key in bonus) bonus[key] += value;
}

function applyItemToBonus(bonus: EquipmentBonuses, item: Equipment): void {
  const enhMult = 1 + item.enhanceLevel * 0.05;
  for (const [k, v] of Object.entries(item.baseStats)) {
    const key = k as keyof EquipmentBonuses;
    if (key in bonus) bonus[key] += Math.round(v * enhMult);
  }
  for (const a of item.affixes) applyAffixStat(bonus, a.stat, a.value);
  for (const a of item.rareAffixes ?? []) applyAffixStat(bonus, a.stat, a.value);
  if (item.gemId) {
    const gem = GEM_DEFS.find((g) => g.id === item.gemId);
    if (gem) applyAffixStat(bonus, gem.stat, gem.value);
  }
}

export function itemBonuses(item: Equipment): EquipmentBonuses {
  const bonus = emptyBonuses();
  applyItemToBonus(bonus, item);
  return bonus;
}

export function equippedItems(state: PlayerState, templateId?: string): Equipment[] {
  if (!templateId) return [];
  const equipMap = state.characterEquip?.[templateId] ?? {};
  const tier = state.roster?.[templateId]?.breakthroughTier ?? 0;
  const items: Equipment[] = [];
  for (const id of Object.values(equipMap)) {
    if (!id) continue;
    const item = state.inventory.find((e) => e.id === id);
    if (!item) continue;
    if (!canWearEquipment(item, tier)) continue;
    items.push(item);
  }
  return items;
}

export function sumEquipmentBonuses(state: PlayerState, templateId?: string): EquipmentBonuses {
  const bonus = emptyBonuses();
  const items = equippedItems(state, templateId);
  for (const item of items) applyItemToBonus(bonus, item);
  applyActiveSetBonuses(bonus, countEquippedSets(items.map((i) => i.setId)));
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
    qiSiphon: Math.min(6, (unit.qiSiphon ?? 0) + bonus.qiSiphon),
    qiRefund: Math.min(6, (unit.qiRefund ?? 0) + bonus.qiRefund),
    finalDmgBonus: unit.finalDmgBonus + bonus.finalDmgBonus,
    maxHp,
    hp: Math.max(1, Math.round(maxHp * hpRatio)),
  };
}
