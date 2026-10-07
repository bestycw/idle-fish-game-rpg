import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DEFAULT_STARTER_GIFT_IDS } from '../character/starterRoster.js';
import { createInitialPlayer } from '../save/player.js';
import { ensureStarterTrialRoster } from './starterTrial.js';

describe('starterTrial', () => {
  it('createInitialPlayer matches trial lineup', () => {
    const p = createInitialPlayer(1);
    for (const id of DEFAULT_STARTER_GIFT_IDS) {
      assert.ok(p.roster[id]?.owned, id);
      assert.ok(p.formation[id] != null, `${id} on field`);
    }
  });

  it('ensureStarterTrialRoster resets stray formation', () => {
    const p = createInitialPlayer(1);
    const messy = {
      ...p,
      formation: { zhangfei: 1 as const, wukong: 5 as const },
      heroManual: true,
    };
    const fixed = ensureStarterTrialRoster(messy);
    assert.equal(fixed.formation.zhangfei, undefined);
    assert.ok(fixed.formation.zhaoyun != null);
    assert.equal(fixed.heroManual, false);
  });
});
