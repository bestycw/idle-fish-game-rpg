import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createInitialPlayer } from '../save/player.js';
import { canClaimDaily, tryClaimDaily, DAILY_CLAIM_TICKET } from './dailyClaim.js';
import { runStardustRealm, STARDUST_REALM_RANGE } from './stardustRealm.js';
import { getDungeon } from './defs.js';

describe('stardust realm', () => {
  it('is registered as instant dungeon', () => {
    const d = getDungeon('stardust_realm');
    assert.equal(d.runMode, 'instant');
    assert.equal(d.name, '星尘秘境');
  });

  it('grants stardust in range', () => {
    const state = createInitialPlayer(42);
    const before = state.currencies.stardust ?? 0;
    const r = runStardustRealm(state);
    assert.ok(r.gainedStardust >= STARDUST_REALM_RANGE[0]);
    assert.ok(r.gainedStardust <= STARDUST_REALM_RANGE[1]);
    assert.equal(r.state.currencies.stardust, before + r.gainedStardust);
  });
});

describe('daily claim', () => {
  it('claims once per local day', () => {
    const t0 = Date.UTC(2026, 6, 29, 4, 0, 0);
    let state = createInitialPlayer(1);
    assert.equal(canClaimDaily(state, t0), true);
    const r1 = tryClaimDaily(state, t0);
    assert.equal(r1.ok, true);
    if (!r1.ok) return;
    state = r1.state;
    assert.equal(canClaimDaily(state, t0), false);
    const tickets = state.currencies.ticket ?? 0;
    const r2 = tryClaimDaily(state, t0);
    assert.equal(r2.ok, false);
    assert.equal(r2.state.currencies.ticket, tickets);

    const nextDay = t0 + 24 * 60 * 60 * 1000;
    assert.equal(canClaimDaily(state, nextDay), true);
    const r3 = tryClaimDaily(state, nextDay);
    assert.equal(r3.ok, true);
    if (r3.ok) {
      assert.equal(r3.state.currencies.ticket, tickets + DAILY_CLAIM_TICKET);
    }
  });
});
