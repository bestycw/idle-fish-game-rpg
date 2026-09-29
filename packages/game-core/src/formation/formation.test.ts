import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { benchUnit, normalizeFormation, placeUnit } from './formation.js';
import { createInitialPlayer } from '../save/player.js';

describe('formation hero lock', () => {
  it('benchUnit does not remove hero', () => {
    const player = createInitialPlayer(1);
    const next = benchUnit(player, 'hero');
    assert.equal(next.formation.hero, player.formation.hero);
  });

  it('placeUnit blocks bench partner from replacing hero slot', () => {
    let player = createInitialPlayer(2);
    player = benchUnit(player, 'huatuo');
    assert.equal(player.formation.huatuo, undefined);
    const heroSlot = player.formation.hero!;
    const next = placeUnit(player, 'huatuo', heroSlot);
    assert.equal(next.formation.hero, heroSlot);
    assert.equal(next.formation.huatuo, undefined);
  });

  it('normalizeFormation always keeps hero on field', () => {
    const player = createInitialPlayer(3);
    const stripped = { ...player, formation: { zhangfei: 1 as const } };
    const norm = normalizeFormation(stripped.formation);
    assert.ok(norm.hero != null);
    assert.equal(norm.zhangfei, 1);
  });
});
