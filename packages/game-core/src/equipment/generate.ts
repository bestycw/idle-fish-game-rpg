import { EQUIP_SLOTS } from '../shared/types.js';
import type {
  AffixDef,
  AffixInstance,
  ConditionAffix,
  Equipment,
  EquipSlot,
  Rarity,
  Rng,
} from '../shared/types.js';
import {
  CONDITION_EXTREME_MULT,
  DROPTABLE,
  OPEN_POOL_DEFS,
  RARITY_MULTIPLIER,
  RARE_AFFIX_DEFS,
  WHITE_BASE,
  droptableOf,
  affixLevelScale,
  earlyGearBaseSoft,
  itemLevelScale,
  listConditionsForSlot,
  listT3ForSlot,
  substatDefs,
  SLOT_SUBSTAT_POOL,
} from './catalog/index.js';
import { composeEquipmentName } from './composeName.js';
import { chanceChain, pickFrom, rollAffixValue } from './roll.js';

export type GenerateEquipmentOptions = {
  setIdChance?: number;
  setIdWeights?: { id: string; weight: number }[];
  itemLevel?: number;
  rarity?: Rarity;
  /** 覆盖全局品级权重；未列出的品级权重为 0 */
  rarityWeights?: Partial<Record<Rarity, number>>;
  /** T3 池内按 id 加权；仅对本槽位合法 id 生效 */
  t3IdWeights?: { id: string; weight: number }[];
  /** 入门装已有 softenStarterItem，勿再叠 earlyGearBaseSoft */
  skipEarlyBaseSoft?: boolean;
};

let equipSeq = 0;

export function createEquipmentId(rng: Rng): string {
  equipSeq += 1;
  return `eq_${rng.int(1000, 9999)}_${equipSeq}`;
}

function rollRarity(rng: Rng, weights?: Partial<Record<Rarity, number>>): Rarity {
  if (weights && Object.keys(weights).length > 0) {
    const rows = (Object.entries(weights) as [Rarity, number][]).filter(([, w]) => w > 0);
    const total = rows.reduce((s, [, w]) => s + w, 0);
    if (total > 0) {
      let roll = rng.int(1, total);
      for (const [rarity, w] of rows) {
        roll -= w;
        if (roll <= 0) return rarity;
      }
      return rows[0]![0];
    }
  }
  const total = DROPTABLE.reduce((s, r) => s + r.weight, 0);
  let roll = rng.int(1, total);
  for (const row of DROPTABLE) {
    roll -= row.weight;
    if (roll <= 0) return row.rarity;
  }
  return 'common';
}

function pickWeightedT3(
  rng: Rng,
  slot: EquipSlot,
  weights: { id: string; weight: number }[],
): string | undefined {
  const pool = listT3ForSlot(slot);
  const byId = new Map(pool.map((d) => [d.id, d]));
  const rows = weights.filter((w) => w.weight > 0 && byId.has(w.id));
  if (rows.length === 0) return pool.length > 0 ? pickFrom(rng, pool).id : undefined;
  const total = rows.reduce((s, w) => s + w.weight, 0);
  let roll = rng.int(1, total);
  for (const row of rows) {
    roll -= row.weight;
    if (roll <= 0) return row.id;
  }
  return rows[0]!.id;
}

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

function takeWithoutReplacement(rng: Rng, pool: AffixDef[], used: Set<string>): AffixDef | undefined {
  const avail = pool.filter((d) => !used.has(d.stat));
  if (avail.length === 0) return undefined;
  return pickFrom(rng, avail);
}

function rollRandomAffixes(
  rng: Rng,
  slot: EquipSlot,
  guaranteed: number,
  open: number,
): AffixInstance[] {
  const used = new Set<string>();
  const out: AffixInstance[] = [];
  const subPool = substatDefs(SLOT_SUBSTAT_POOL[slot]);

  for (let i = 0; i < guaranteed; i += 1) {
    const def = takeWithoutReplacement(rng, subPool, used);
    if (!def) break;
    used.add(def.stat);
    out.push(rollAffixValue(rng, def));
  }
  for (let i = 0; i < open; i += 1) {
    const def = takeWithoutReplacement(rng, OPEN_POOL_DEFS, used);
    if (!def) break;
    used.add(def.stat);
    out.push(rollAffixValue(rng, def));
  }
  return out;
}

function rollConditions(
  rng: Rng,
  slot: EquipSlot,
  first: number,
  second: number,
  extreme: boolean,
): ConditionAffix[] {
  const n = chanceChain(rng, first, second);
  if (n <= 0) return [];
  const pool = [...listConditionsForSlot(slot)];
  const out: ConditionAffix[] = [];
  for (let i = 0; i < n && pool.length > 0; i += 1) {
    const def = pool.splice(rng.int(0, pool.length - 1), 1)[0]!;
    const isExtreme = extreme && rng.next() < 0.3;
    const lo = def.min;
    const hi = def.max;
    const steps = 100;
    const t = rng.int(0, steps) / steps;
    let value = lo + (hi - lo) * t;
    if (isExtreme) value *= CONDITION_EXTREME_MULT;
    value = Math.round(value * 1000) / 1000;
    out.push({
      defId: def.id,
      name: def.name,
      value,
      min: isExtreme ? lo * CONDITION_EXTREME_MULT : lo,
      max: isExtreme ? hi * CONDITION_EXTREME_MULT : hi,
      extreme: isExtreme || undefined,
    });
  }
  return out;
}

function rollRares(rng: Rng, first: number, second: number, usedStats: Set<string>): AffixInstance[] {
  const n = chanceChain(rng, first, second);
  if (n <= 0) return [];
  const pool = RARE_AFFIX_DEFS.filter((d) => !usedStats.has(d.stat));
  const out: AffixInstance[] = [];
  for (let i = 0; i < n && pool.length > 0; i += 1) {
    const def = pool.splice(rng.int(0, pool.length - 1), 1)[0]!;
    usedStats.add(def.stat);
    out.push(rollAffixValue(rng, def));
  }
  return out;
}

function scaleBase(
  slot: EquipSlot,
  rarity: Rarity,
  itemLevel: number,
  baseSoft: number,
) {
  const mult = RARITY_MULTIPLIER[rarity] * itemLevelScale(itemLevel) * baseSoft;
  const raw = WHITE_BASE[slot];
  const baseStats: Partial<Record<'atk' | 'def' | 'res' | 'maxHp' | 'spd', number>> = {};
  for (const [k, v] of Object.entries(raw)) {
    baseStats[k as 'atk' | 'def' | 'res' | 'maxHp' | 'spd'] = Math.max(
      1,
      Math.round(v * mult),
    );
  }
  return baseStats;
}

/** 词缀/条件随装等缩放（原先只缩白字，低装等蓝装 affix 满额会战力起飞） */
function scaleRolledValue(value: number, itemLevel: number): number {
  const scaled = value * affixLevelScale(itemLevel);
  if (Number.isInteger(value)) return Math.max(1, Math.round(scaled));
  return Math.round(scaled * 1000) / 1000;
}

export function generateEquipment(
  rng: Rng,
  slot?: EquipSlot,
  opts?: GenerateEquipmentOptions,
): Equipment {
  const chosenSlot = slot ?? rng.pick(EQUIP_SLOTS);
  const rarity = opts?.rarity ?? rollRarity(rng, opts?.rarityWeights);
  const table = droptableOf(rarity);
  const itemLevel = Math.max(1, Math.min(100, opts?.itemLevel ?? 1));

  const affixes = rollRandomAffixes(rng, chosenSlot, table.guaranteedSubs, table.openRolls).map(
    (a) => ({ ...a, value: scaleRolledValue(a.value, itemLevel) }),
  );
  const used = new Set(affixes.map((a) => a.stat));
  // 炼气档条件词出现率再压一截（条件对战力读数与实战都偏猛）
  const condRateScale = itemLevel <= 20 ? 0.45 + 0.55 * ((itemLevel - 1) / 19) : 1;
  const conditions = rollConditions(
    rng,
    chosenSlot,
    table.conditionFirst * condRateScale,
    table.conditionSecond * condRateScale,
    table.extremeCondition,
  ).map((c) => ({ ...c, value: scaleRolledValue(c.value, itemLevel) }));
  const rares = rollRares(rng, table.rareFirst, table.rareSecond, used).map((a) => ({
    ...a,
    value: scaleRolledValue(a.value, itemLevel),
  }));

  let effectAffixId: string | undefined;
  // 挂了解法权重的猎装（地狱/秘境）：蓝装本身 t3=0，抬底以免「不出金就几乎没器纹」
  const t3Chance = opts?.t3IdWeights?.length ? Math.max(table.t3, 0.48) : table.t3;
  if (t3Chance > 0 && rng.next() < t3Chance) {
    if (opts?.t3IdWeights?.length) {
      effectAffixId = pickWeightedT3(rng, chosenSlot, opts.t3IdWeights);
    } else {
      const pool = listT3ForSlot(chosenSlot);
      if (pool.length > 0) effectAffixId = pickFrom(rng, pool).id;
    }
  }

  const socketCount: 0 | 1 = table.socket >= 1 ? 1 : table.socket > 0 && rng.next() < table.socket ? 1 : 0;

  const setIdChance = opts?.setIdChance ?? 0.25;
  const setIdWeights = opts?.setIdWeights ?? [
    { id: 'set_pojun', weight: 1 },
    { id: 'set_tiebi', weight: 1 },
    { id: 'set_jishi', weight: 1 },
  ];
  const setId = rng.next() < setIdChance ? pickWeightedSetId(rng, setIdWeights) : undefined;

  const baseSoft = opts?.skipEarlyBaseSoft ? 1 : earlyGearBaseSoft(itemLevel);

  return {
    id: createEquipmentId(rng),
    name: composeEquipmentName({ rarity, slot: chosenSlot, setId, effectAffixId, enhanceLevel: 0 }),
    slot: chosenSlot,
    rarity,
    itemLevel,
    baseStats: scaleBase(chosenSlot, rarity, itemLevel, baseSoft),
    affixes,
    conditions: conditions.length > 0 ? conditions : undefined,
    rareAffixes: rares.length > 0 ? rares : undefined,
    effectAffixId,
    setId,
    socketCount,
    enhanceLevel: 0,
  };
}

export function rerollAffixLine(rng: Rng, item: Equipment, index: number): AffixInstance | undefined {
  const current = item.affixes[index];
  if (!current) return undefined;
  const table = droptableOf(item.rarity);
  const used = new Set(item.affixes.filter((_, i) => i !== index).map((a) => a.stat));
  const guaranteedCount = table.guaranteedSubs;
  const pool =
    index < guaranteedCount
      ? substatDefs(SLOT_SUBSTAT_POOL[item.slot])
      : OPEN_POOL_DEFS;
  const def = takeWithoutReplacement(rng, pool, used);
  if (!def) return current;
  return rollAffixValue(rng, def);
}

export function rerollConditionLine(rng: Rng, item: Equipment, index: number): ConditionAffix | undefined {
  const current = item.conditions?.[index];
  if (!current) return undefined;
  const used = new Set((item.conditions ?? []).filter((_, i) => i !== index).map((c) => c.defId));
  const pool = listConditionsForSlot(item.slot).filter((d) => !used.has(d.id));
  if (pool.length === 0) return current;
  const def = pickFrom(rng, pool);
  const extreme = Boolean(current.extreme) && item.rarity === 'legendary';
  const t = rng.int(0, 100) / 100;
  let value = def.min + (def.max - def.min) * t;
  if (extreme) value *= CONDITION_EXTREME_MULT;
  return {
    defId: def.id,
    name: def.name,
    value: Math.round(value * 1000) / 1000,
    min: extreme ? def.min * CONDITION_EXTREME_MULT : def.min,
    max: extreme ? def.max * CONDITION_EXTREME_MULT : def.max,
    extreme: extreme || undefined,
  };
}

export function rerollRareLine(rng: Rng, item: Equipment, index: number): AffixInstance | undefined {
  const current = item.rareAffixes?.[index];
  if (!current) return undefined;
  const used = new Set((item.rareAffixes ?? []).filter((_, i) => i !== index).map((a) => a.stat));
  const pool = RARE_AFFIX_DEFS.filter((d) => !used.has(d.stat));
  if (pool.length === 0) return current;
  return rollAffixValue(rng, pickFrom(rng, pool));
}
