import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getTemplate } from './templates.js';
import {
  pickStarterCompanionId,
  resolveStarterCompanionId,
  STARTER_EPIC_POOL,
  starterGiftIds,
} from './starterRoster.js';

describe('starterRoster', () => {
  it('epic pool members are all epic rarity templates', () => {
    for (const id of STARTER_EPIC_POOL) {
      assert.equal(getTemplate(id)?.rarity, 'epic', id);
    }
  });

  it('pickStarterCompanionId is stable per seed and covers the pool', () => {
    assert.equal(pickStarterCompanionId(0), STARTER_EPIC_POOL[0]);
    assert.equal(pickStarterCompanionId(STARTER_EPIC_POOL.length), STARTER_EPIC_POOL[0]);
    const seen = new Set(STARTER_EPIC_POOL.map((_, i) => pickStarterCompanionId(i)));
    assert.equal(seen.size, STARTER_EPIC_POOL.length);
  });

  it('starter gifts are hero + one epic companion', () => {
    const companionId = pickStarterCompanionId(7);
    const gifts = starterGiftIds(companionId);
    assert.deepEqual(gifts, ['hero', companionId]);
    assert.equal(getTemplate(gifts[0]!)?.rarity, 'legendary');
    assert.equal(getTemplate(gifts[1]!)?.rarity, 'epic');
  });

  it('resolveStarterCompanionId keeps stored pool id', () => {
    assert.equal(resolveStarterCompanionId(99, 'daqiao'), 'daqiao');
    assert.equal(resolveStarterCompanionId(3, 'not_a_unit'), pickStarterCompanionId(3));
  });

  it('hand legendaries stay legendary and are not auto-gifted', () => {
    for (const id of ['zhangfei', 'wukong', 'huatuo', 'guanyu', 'zhaoyun']) {
      assert.equal(getTemplate(id)?.rarity, 'legendary', id);
      assert.equal((STARTER_EPIC_POOL as readonly string[]).includes(id), false, id);
    }
  });
});
