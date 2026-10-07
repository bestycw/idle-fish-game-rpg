import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  pickStarterCompanionId,
  starterGiftIds,
} from '../character/starterRoster.js';
import { createInitialPlayer } from '../save/player.js';
import { ensureStarterTrialRoster } from './starterTrial.js';

describe('starterTrial', () => {
  it('createInitialPlayer is hero + one random epic', () => {
    const p = createInitialPlayer(1);
    const companionId = pickStarterCompanionId(1);
    assert.equal(p.starterCompanionId, companionId);
    const gifts = starterGiftIds(companionId);
    assert.deepEqual(Object.keys(p.formation).sort(), [...gifts].sort());
    for (const id of gifts) {
      assert.ok(p.roster[id]?.owned, id);
      assert.ok(p.formation[id] != null, `${id} on field`);
    }
    assert.equal(p.roster.zhaoyun?.owned, false);
    assert.equal(p.formation.zhaoyun, undefined);
  });

  it('ensureStarterTrialRoster resets stray formation but keeps companion', () => {
    const p = createInitialPlayer(2);
    const companionId = p.starterCompanionId!;
    const messy = {
      ...p,
      formation: { zhangfei: 1 as const, wukong: 5 as const },
      heroManual: true,
    };
    const fixed = ensureStarterTrialRoster(messy);
    assert.equal(fixed.formation.zhangfei, undefined);
    assert.equal(fixed.starterCompanionId, companionId);
    assert.ok(fixed.formation.hero != null);
    assert.ok(fixed.formation[companionId] != null);
    assert.equal(fixed.heroManual, false);
  });

  it('different seeds can yield different epics', () => {
    const a = createInitialPlayer(0).starterCompanionId;
    const b = createInitialPlayer(1).starterCompanionId;
    assert.ok(a);
    assert.ok(b);
    // 池长 ≥2 时相邻 seed 应不同
    assert.notEqual(a, b);
  });
});
