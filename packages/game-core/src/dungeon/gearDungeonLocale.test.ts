import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { tGearDungeonName } from './gearDungeonLocale.js';

describe('gearDungeonLocale', () => {
  it('switches display name by world preset', () => {
    assert.equal(tGearDungeonName('gear_break_wall', 'xianxia'), '青石关·盾鸣廊');
    assert.equal(tGearDungeonName('gear_break_wall', 'cyberpunk'), '隔离层·硬壳回廊');
    assert.notEqual(
      tGearDungeonName('gear_warden_trial', 'xianxia'),
      tGearDungeonName('gear_warden_trial', 'cyberpunk'),
    );
  });
});
