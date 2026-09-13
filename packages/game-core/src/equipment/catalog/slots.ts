import type { EquipSlot } from '../../shared/types.js';

export const SLOT_NAMES: Record<EquipSlot, string> = {
  weapon: '武器',
  offhand: '副手',
  head: '头盔',
  chest: '胸甲',
  hands: '手套',
  feet: '靴子',
  legs: '裤子',
  neck: '项链',
  ring1: '戒指一',
  ring2: '戒指二',
  trinket1: '饰品一',
  trinket2: '饰品二',
};

export const SLOT_SHORT_NAMES: Record<EquipSlot, string> = {
  weapon: '武',
  offhand: '副',
  head: '头',
  chest: '胸',
  hands: '手',
  feet: '鞋',
  legs: '裤',
  neck: '链',
  ring1: '戒①',
  ring2: '戒②',
  trinket1: '饰①',
  trinket2: '饰②',
};

/** 随机层前半：必须从该槽小池抽副属性 */
export const SLOT_SUBSTAT_POOL: Record<EquipSlot, string[]> = {
  weapon: ['critRating', 'critDmgRating', 'penRating'],
  offhand: ['tenacityRating', 'masteryRating'],
  head: ['tenacityRating', 'masteryRating'],
  chest: ['tenacityRating', 'masteryRating'],
  hands: ['critRating', 'critDmgRating', 'penRating'],
  feet: ['masteryRating', 'penRating'],
  legs: ['tenacityRating', 'masteryRating'],
  neck: ['penRating', 'critDmgRating', 'masteryRating'],
  ring1: ['critRating', 'critDmgRating', 'penRating'],
  ring2: ['critRating', 'critDmgRating', 'penRating'],
  trinket1: ['critRating', 'critDmgRating', 'penRating', 'masteryRating', 'tenacityRating'],
  trinket2: ['critRating', 'critDmgRating', 'penRating', 'masteryRating', 'tenacityRating'],
};

export type T3Group = 'weapon' | 'armor' | 'accessory';

export function t3GroupOf(slot: EquipSlot): T3Group {
  if (slot === 'weapon') return 'weapon';
  if (
    slot === 'offhand' ||
    slot === 'head' ||
    slot === 'chest' ||
    slot === 'hands' ||
    slot === 'feet' ||
    slot === 'legs'
  ) {
    return 'armor';
  }
  return 'accessory';
}

export const WHITE_BASE: Record<EquipSlot, Partial<Record<'atk' | 'def' | 'res' | 'maxHp' | 'spd', number>>> = {
  weapon: { atk: 12, maxHp: 25 },
  offhand: { def: 8, res: 8, maxHp: 25 },
  head: { maxHp: 25, res: 8 },
  chest: { maxHp: 25, def: 8, res: 8 },
  hands: { atk: 12, def: 8, maxHp: 20 },
  feet: { spd: 2, maxHp: 25, def: 8 },
  legs: { maxHp: 25, def: 8, res: 8 },
  neck: { atk: 12, spd: 2, maxHp: 20 },
  ring1: { atk: 12, maxHp: 25 },
  ring2: { atk: 12, maxHp: 25 },
  trinket1: { maxHp: 25, def: 8, res: 8 },
  trinket2: { maxHp: 25, def: 8, res: 8 },
};
