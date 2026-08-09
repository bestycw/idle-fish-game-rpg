import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createInitialPlayer } from '../save/player.js';
import { generateEquipment, sumEquipmentBonuses } from './equipment.js';
import { applyActiveSetBonuses, countEquippedSets, resolveSetId } from './sets.js';
import { createRng } from '../shared/rng.js';
import type { Equipment, EquipSlot } from '../shared/types.js';

function stubItem(partial: Partial<Equipment> & Pick<Equipment, 'id' | 'slot' | 'setId'>): Equipment {
  return {
    name: '测',
    rarity: 'rare',
    baseStats: {},
    affixes: [],
    socketCount: 0,
    enhanceLevel: 0,
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
    const beforeFinal = bonus.penRating;
    const beforeCrit = bonus.critRating;
    applyActiveSetBonuses(bonus, counts);
    assert.ok(bonus.penRating > beforeFinal);
    assert.ok(bonus.critRating > beforeCrit);
  });

  it('sumEquipmentBonuses includes set pieces from per-character equip', () => {
    let p = createInitialPlayer(1);
    const items: Equipment[] = [
      stubItem({ id: 'a', slot: 'weapon', setId: 'set_tiebi' }),
      stubItem({ id: 'b', slot: 'chest', setId: 'set_tiebi' }),
      stubItem({ id: 'c', slot: 'feet', setId: 'set_tiebi', affixes: [{ defId: 'hp', name: '生命', stat: 'maxHp', value: 10 }] }),
    ];
    p = {
      ...p,
      inventory: items,
      characterEquip: { hero: { weapon: 'a', chest: 'b', feet: 'c' } },
    };
    const bonus = sumEquipmentBonuses(p, 'hero');
    // 2件铁壁 +18 hp；第三条词缀 +10 → 至少 28
    assert.ok(bonus.maxHp >= 28);
    assert.ok(bonus.def >= 4);
  });

  it('generateEquipment produces valid Equipment', () => {
    const rng = createRng(42);
    const eq = generateEquipment(rng);
    assert.ok(eq.id);
    assert.ok(eq.slot);
    assert.ok(eq.rarity);
    assert.ok(eq.baseStats);
    assert.ok(eq.enhanceLevel === 0);
    assert.ok(eq.socketCount === 0 || eq.socketCount === 1);
  });

  it('generateEquipment respects no duplicate stat types', () => {
    const rng = createRng(123);
    for (let i = 0; i < 50; i++) {
      const eq = generateEquipment(rng);
      const stats = eq.affixes.map((a) => a.stat);
      const unique = new Set(stats);
      assert.equal(stats.length, unique.size, `Duplicate stats in equipment: ${JSON.stringify(stats)}`);
    }
  });
});
