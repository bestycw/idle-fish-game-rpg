import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createInitialPlayer } from '../save/player.js';
import { getProgress, grantCharacterExpAndLevel, expToNextLevel } from '../character/growth.js';
import { levelUpWithExpPills, rollExpPillDrop } from './expPills.js';
import { createRng } from '../shared/rng.js';

describe('exp curve & pills', () => {
  it('expToNextLevel is non-linear and grows with level', () => {
    const a = expToNextLevel(1);
    const b = expToNextLevel(10);
    const c = expToNextLevel(20);
    assert.ok(a >= 35 && a <= 50, `lv1 need ${a}`);
    assert.ok(b > a * 2, `lv10 ${b} should outpace lv1`);
    assert.ok(c > b * 1.8, `lv20 ${c} should accelerate`);
  });

  it('battle exp auto-levels deployed character', () => {
    let p = createInitialPlayer(3);
    const before = getProgress(p, 'hero').level;
    const r = grantCharacterExpAndLevel(p, 'hero', 200);
    p = r.state;
    assert.ok(r.levelsGained >= 1);
    assert.ok(getProgress(p, 'hero').level > before);
  });

  it('levelUpWithExpPills spends lowest tier first', () => {
    let p = createInitialPlayer(4);
    p = {
      ...p,
      materials: { exp_pill_1: 10, exp_pill_4: 2 },
    };
    const r = levelUpWithExpPills(p, 'hero', 1);
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.ok((r.pillsUsed.exp_pill_1 ?? 0) >= 1);
    assert.equal(r.pillsUsed.exp_pill_4 ?? 0, 0);
    assert.ok((r.state.materials?.exp_pill_1 ?? 0) < 10);
  });

  it('rollExpPillDrop is not guaranteed', () => {
    const rng = createRng(99);
    let hits = 0;
    for (let i = 0; i < 40; i += 1) {
      if (rollExpPillDrop(rng, 0)) hits += 1;
    }
    assert.ok(hits < 40, 'should miss sometimes');
  });
});
