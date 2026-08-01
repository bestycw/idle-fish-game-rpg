import type { Rng } from './types.js';

/** Mulberry32 — deterministic, no Math.random in core paths when seeded. */
export function createRng(seed: number): Rng {
  let t = seed >>> 0;
  const next = () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int(min, max) {
      return Math.floor(next() * (max - min + 1)) + min;
    },
    pick(items) {
      if (items.length === 0) {
        throw new Error('Cannot pick from empty list');
      }
      return items[Math.floor(next() * items.length)]!;
    },
  };
}
