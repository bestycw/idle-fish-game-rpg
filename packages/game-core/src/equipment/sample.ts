import type { EquipSlot, PlayerState, Rarity } from '../shared/types.js';
import { createRng } from '../shared/rng.js';
import { generateEquipment } from './generate.js';

export const SAMPLE_GEAR_PREFIX = 'sample_';

const SAMPLES: { rarity: Rarity; slot: EquipSlot; itemLevel: number }[] = [
  { rarity: 'common', slot: 'weapon', itemLevel: 6 },
  { rarity: 'uncommon', slot: 'hands', itemLevel: 12 },
  { rarity: 'rare', slot: 'chest', itemLevel: 18 },
  { rarity: 'rare', slot: 'ring1', itemLevel: 16 },
  { rarity: 'epic', slot: 'weapon', itemLevel: 14 },
  { rarity: 'epic', slot: 'neck', itemLevel: 14 },
  { rarity: 'legendary', slot: 'weapon', itemLevel: 20 },
  { rarity: 'legendary', slot: 'offhand', itemLevel: 20 },
];

/** 往背包塞一套各品级样装，方便读条 / 洗练 / 封存。已有 sample_ 件则跳过。 */
export function grantSampleEquipment(
  state: PlayerState,
  opts?: { replace?: boolean },
): PlayerState {
  const hasSample = state.inventory.some((e) => e.id.startsWith(SAMPLE_GEAR_PREFIX));
  if (hasSample && !opts?.replace) return state;

  const rng = createRng(state.seed + 901);
  const samples = SAMPLES.map((row, i) => {
    const eq = generateEquipment(rng, row.slot, {
      rarity: row.rarity,
      itemLevel: row.itemLevel,
    });
    return { ...eq, id: `${SAMPLE_GEAR_PREFIX}${row.rarity}_${row.slot}_${i}` };
  });

  return {
    ...state,
    inventory: [
      ...state.inventory.filter((e) => !e.id.startsWith(SAMPLE_GEAR_PREFIX)),
      ...samples,
    ],
    enhanceStones: Math.max(state.enhanceStones ?? 0, 40),
    gold: Math.max(state.gold, 3000),
  };
}
