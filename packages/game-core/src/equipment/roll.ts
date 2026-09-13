import type { AffixDef, AffixInstance, Rng } from '../shared/types.js';
import { isPercentRare } from './catalog/rares.js';

export function pickFrom<T>(rng: Rng, items: T[]): T {
  if (items.length === 0) throw new Error('empty pick');
  return rng.pick(items);
}

export function rollInt(rng: Rng, min: number, max: number): number {
  return rng.int(min, max);
}

export function rollAffixValue(rng: Rng, def: AffixDef): AffixInstance {
  const raw = rng.int(def.min, def.max);
  return {
    defId: def.id,
    name: def.name,
    stat: def.stat,
    value: isPercentRare(def.stat) ? raw / 100 : raw,
  };
}

export function chanceChain(rng: Rng, first: number, second: number): number {
  if (first <= 0) return 0;
  if (rng.next() >= first) return 0;
  if (second <= 0) return 1;
  return rng.next() < second ? 2 : 1;
}
