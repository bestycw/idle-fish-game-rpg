import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createInitialPlayer } from '../save/player.js';
import { sumEquipmentBonuses } from './equipment.js';
import { applyActiveSetBonuses, countEquippedSets, resolveSetId } from './sets.js';
import type { Equipment } from '../shared/types.js';

function stubItem(partial: Partial<Equipment> & Pick<Equipment, 'id' | 'slot' | 'setId'>): Equipment {
  return {
    name: '测',
    rarity: 'rare',
    affixes: [],
    ...partial,
  };
}

describe('equipment sets', () => {
  it('aliases old demo set ids', () => {
    assert.equal(resolveSetId('set_demo_1'), 'set_pojun');
    assert.equal(resolveSetId('set_demo_2'), 'set_tiebi');
  });

  it('applies 2pc and 4pc bonuses', () => {
    const counts = countEquippedSets([
      'set_pojun',
      'set_pojun',
      'set_pojun',
      'set_pojun',
    ]);
    const bonus = sumEquipmentBonuses(createInitialPlayer(1));
    const beforeFinal = bonus.finalDmgRating;
    const beforeCrit = bonus.critRating;
    applyActiveSetBonuses(bonus, counts);
    assert.ok(bonus.finalDmgRating > beforeFinal);
    assert.ok(bonus.critRating > beforeCrit);
  });

  it('sumEquipmentBonuses includes set pieces from equipped', () => {
    let p = createInitialPlayer(1);
    const items = [
      stubItem({ id: 'a', slot: 'mainHand', setId: 'set_tiebi' }),
      stubItem({ id: 'b', slot: 'chest', setId: 'set_tiebi' }),
      stubItem({ id: 'c', slot: 'legs', setId: 'set_tiebi', affixes: [{ defId: 'hp_s', name: '生命', stat: 'maxHp', value: 10 }] }),
    ];
    p = {
      ...p,
      inventory: items,
      equipped: { mainHand: 'a', chest: 'b', legs: 'c' },
    };
    const bonus = sumEquipmentBonuses(p);
    // 2件铁壁 +18 hp；第三条词缀 +10 → 至少 28
    assert.ok(bonus.maxHp >= 28);
    assert.ok(bonus.physDef >= 4);
  });
});
