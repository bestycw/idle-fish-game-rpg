import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createInitialPlayer } from '../save/player.js';
import { createRng } from '../shared/rng.js';
import { generateEquipment } from '../equipment/equipment.js';
import {
  getDungeon,
  listBattleDungeons,
  pickEncounterIndex,
} from './defs.js';
import { getLootTable, grantDungeonReward } from './lootTables.js';
import { climbTower } from './tower.js';

describe('dungeon defs', () => {
  it('ships gear trial (battle) and tower (instant)', () => {
    assert.equal(getDungeon('gear_trial').runMode, 'battle');
    assert.equal(getDungeon('tower').runMode, 'instant');
    assert.equal(listBattleDungeons().length, 2);
    assert.ok(getDungeon('gear_trial').encounterPool.includes('wall'));
    assert.ok(getDungeon('abyss_mirror').encounterPool.includes('boss_warden'));
  });

  it('pickEncounterIndex rotates pool by cursor', () => {
    const poolLen = getDungeon('gear_trial').encounterPool.length;
    const a = pickEncounterIndex('gear_trial', 0);
    const b = pickEncounterIndex('gear_trial', 1);
    const wrap = pickEncounterIndex('gear_trial', poolLen);
    assert.notEqual(a, b);
    assert.equal(a, wrap);
  });
});

describe('dungeon loot', () => {
  it('gear trial always drops equipment and advances cursor', () => {
    const player = createInitialPlayer(99);
    const before = player.encounterIndex;
    const { state, loot } = grantDungeonReward(player, 'gear_trial');
    assert.ok(loot);
    assert.equal(state.inventory.length, player.inventory.length + 1);
    assert.equal(state.wins, player.wins + 1);
    assert.equal(state.encounterIndex, before + 1);
  });

  it('gear trial setId chance is higher than default generate', () => {
    const table = getLootTable('loot_gear_trial');
    assert.ok(table.setIdChance > 0.25);

    let withSet = 0;
    for (let i = 0; i < 200; i += 1) {
      const item = generateEquipment(createRng(1000 + i), undefined, {
        setIdChance: table.setIdChance,
        setIdWeights: table.setIdWeights,
      });
      if (item.setId) withSet += 1;
    }
    assert.ok(withSet > 70, `expected many set drops, got ${withSet}/200`);
  });

  it('rejects instant dungeon on battle reward API', () => {
    const player = createInitialPlayer(1);
    assert.throws(() => grantDungeonReward(player, 'tower'));
  });

  it('tower instant still grants xiuwei', () => {
    const player = createInitialPlayer(2);
    const before = player.currencies.xiuwei;
    const result = climbTower(player);
    assert.ok(result.gainedXiuwei > 0);
    assert.equal(result.state.currencies.xiuwei, before + result.gainedXiuwei);
  });
});
