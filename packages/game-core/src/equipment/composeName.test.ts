import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { composeEquipmentName } from './composeName.js';

describe('composeEquipmentName', () => {
  it('composes rarity + slot with preset', () => {
    const name = composeEquipmentName(
      { rarity: 'epic', slot: 'ring1', enhanceLevel: 0 },
      'xianxia',
    );
    assert.equal(name, '珍品灵戒');
  });

  it('prefixes set name when setId present', () => {
    const name = composeEquipmentName(
      {
        rarity: 'rare',
        slot: 'weapon',
        setId: 'set_pojun',
        enhanceLevel: 0,
      },
      'xianxia',
    );
    assert.match(name, /^破军·/);
    assert.match(name, /法器$/);
  });

  it('cyber preset uses cyber slot labels', () => {
    const name = composeEquipmentName(
      { rarity: 'epic', slot: 'weapon', enhanceLevel: 0 },
      'cyberpunk',
    );
    assert.equal(name, '精英主模块');
  });
});
