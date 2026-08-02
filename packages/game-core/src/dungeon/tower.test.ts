import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createInitialPlayer } from '../save/player.js';
import { climbTower, getTowerFloor, xiuweiForFloor } from './tower.js';

describe('tower thin shell', () => {
  it('grants xiuwei and advances floor', () => {
    let state = createInitialPlayer(1);
    assert.equal(getTowerFloor(state), 1);
    const before = state.currencies.xiuwei ?? 0;
    const r1 = climbTower(state);
    assert.equal(r1.clearedFloor, 1);
    assert.equal(r1.gainedXiuwei, xiuweiForFloor(1));
    assert.equal(r1.nextFloor, 2);
    assert.equal(r1.state.currencies.xiuwei, before + r1.gainedXiuwei);
    assert.equal(getTowerFloor(r1.state), 2);

    state = r1.state;
    const r2 = climbTower(state);
    assert.equal(r2.clearedFloor, 2);
    assert.equal(r2.gainedXiuwei, xiuweiForFloor(2));
    assert.equal(getTowerFloor(r2.state), 3);
  });

  it('grants stardust on milestone floors', () => {
    let state = createInitialPlayer(2);
    state = { ...state, towerFloor: 5 };
    const beforeDust = state.currencies.stardust ?? 0;
    const r = climbTower(state);
    assert.equal(r.milestone, true);
    assert.ok(r.gainedStardust > 0);
    assert.equal(r.state.currencies.stardust, beforeDust + r.gainedStardust);
  });
});
