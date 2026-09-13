import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createInitialPlayer } from '../save/player.js';
import { getProgress, isOwned, tryStarUp } from '../character/growth.js';
import { GACHA_SOFT_PITY, gachaPoolIds, pullGacha } from './gacha.js';

describe('gacha', () => {
  it('pool excludes hero; chapter gates baigujing', () => {
    const state = createInitialPlayer(1);
    assert.ok(!gachaPoolIds(state).includes('hero'));
    assert.ok(gachaPoolIds(state).includes('houyi'));
    assert.ok(gachaPoolIds(state).includes('dianwei'));
    assert.ok(!gachaPoolIds(state).includes('heracles'));
    assert.ok(!gachaPoolIds(state).includes('baigujing'));
    assert.ok(gachaPoolIds().includes('baigujing'));
  });

  it('pull consumes ticket and can unlock unowned', () => {
    let state = createInitialPlayer(42);
    assert.equal(isOwned(state, 'houyi'), false);
    state = { ...state, currencies: { ...state.currencies, ticket: 20 } };
    const result = pullGacha(state, 1);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.state.currencies.ticket, 19);
    assert.equal(result.items.length, 1);
  });

  it('duplicate grants card shard usable for star up', () => {
    let state = createInitialPlayer(7);
    state = {
      ...state,
      currencies: { ...state.currencies, ticket: 30, stardust: 0 },
      roster: {
        ...state.roster,
        zhangfei: { ...getProgress(state, 'zhangfei'), owned: true, star: 0, cardShards: 0 },
      },
    };
    let gotDupe = false;
    for (let i = 0; i < 25; i += 1) {
      const r = pullGacha(state, 1);
      assert.equal(r.ok, true);
      if (!r.ok) return;
      state = r.state;
      if (r.items.some((it) => it.kind === 'duplicate')) {
        gotDupe = true;
        break;
      }
    }
    assert.ok(gotDupe);
    const beforeStar = getProgress(state, 'zhangfei').star;
    const shards = getProgress(state, 'zhangfei').cardShards;
    if (shards > 0 && beforeStar === 0) {
      const up = tryStarUp(state, 'zhangfei');
      assert.equal(up.ok, true);
      if (up.ok) {
        assert.equal(getProgress(up.state, 'zhangfei').star, 1);
        assert.equal(getProgress(up.state, 'zhangfei').cardShards, shards - 1);
        assert.equal(up.state.currencies.stardust, 0);
      }
    }
  });

  it('soft pity eventually forces new when missing remain', () => {
    let state = createInitialPlayer(99);
    state = {
      ...state,
      currencies: { ...state.currencies, ticket: 40 },
      gachaPity: GACHA_SOFT_PITY - 1,
    };
    assert.equal(isOwned(state, 'houyi'), false);
    assert.equal(isOwned(state, 'dianwei'), false);
    const r = pullGacha(state, 1);
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal(r.items[0]?.kind, 'new');
    assert.ok(gachaPoolIds(state).includes(r.items[0]!.templateId));
  });
});
