import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createInitialPlayer } from '../save/player.js';
import {
  STAMINA_COST_GEAR,
  STAMINA_MAX,
  STAMINA_REGEN_MS,
  getStaminaView,
  syncStamina,
  trySpendStamina,
} from './stamina.js';

describe('stamina', () => {
  it('starts full after createInitialPlayer', () => {
    const p = createInitialPlayer(1);
    const v = getStaminaView(p, p.staminaUpdatedAt);
    assert.equal(v.current, STAMINA_MAX);
    assert.equal(v.max, STAMINA_MAX);
  });

  it('spends on gear cost and blocks when empty', () => {
    let state = createInitialPlayer(2);
    const t0 = state.staminaUpdatedAt;
    const ok = trySpendStamina(state, STAMINA_COST_GEAR, t0);
    assert.equal(ok.ok, true);
    if (!ok.ok) return;
    state = ok.state;
    assert.equal(state.stamina, STAMINA_MAX - STAMINA_COST_GEAR);

    state = { ...state, stamina: 3, staminaUpdatedAt: t0 };
    const fail = trySpendStamina(state, STAMINA_COST_GEAR, t0);
    assert.equal(fail.ok, false);
    assert.equal(fail.state.stamina, 3);
  });

  it('regens by elapsed time', () => {
    const t0 = 1_000_000;
    let state = createInitialPlayer(3);
    state = { ...state, stamina: 50, staminaUpdatedAt: t0 };
    state = syncStamina(state, t0 + STAMINA_REGEN_MS * 3 + 100);
    assert.equal(state.stamina, 53);
  });

  it('does not regen above max', () => {
    const t0 = 2_000_000;
    let state = createInitialPlayer(4);
    state = { ...state, stamina: STAMINA_MAX - 1, staminaUpdatedAt: t0 };
    state = syncStamina(state, t0 + STAMINA_REGEN_MS * 10);
    assert.equal(state.stamina, STAMINA_MAX);
  });
});
