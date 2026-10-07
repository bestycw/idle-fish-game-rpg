import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getTemplate } from './templates.js';
import { DEFAULT_STARTER_GIFT_IDS } from './starterRoster.js';

describe('starterRoster', () => {
  it('default gifts mix legendary / epic / rare / common', () => {
    const rarities = DEFAULT_STARTER_GIFT_IDS.map((id) => getTemplate(id)?.rarity);
    assert.deepEqual(rarities, [
      'legendary',
      'legendary',
      'epic',
      'rare',
      'common',
    ]);
    assert.equal(getTemplate('hero')?.rarity, 'legendary');
  });

  it('hand legendaries stay legendary and are not auto-gifted', () => {
    for (const id of ['zhangfei', 'wukong', 'huatuo', 'guanyu']) {
      assert.equal(getTemplate(id)?.rarity, 'legendary', id);
      assert.equal(
        (DEFAULT_STARTER_GIFT_IDS as readonly string[]).includes(id),
        false,
        `${id} should be pool-only at start`,
      );
    }
  });
});
