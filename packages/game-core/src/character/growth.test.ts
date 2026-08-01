import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  deriveGrowthStats,
  tryBreakthrough,
  tryLevelUp,
  tryStarUp,
  grantCharacterExp,
  grantCurrency,
  unlockedStarNodes,
  resolveStarNode,
} from './growth.js';
import { applyGrowthTrack, listGrowthTracks } from './growthTracks.js';
import { formationHints, previewStarUp } from './growthHelpers.js';
import { createInitialPlayer } from '../save/player.js';
import { getTemplate } from './templates.js';

describe('character growth', () => {
  it('levels up with enough exp and respects cap', () => {
    let state = createInitialPlayer(1);
    state = grantCharacterExp(state, 'hero', 500);
    const r1 = tryLevelUp(state, 'hero');
    assert.equal(r1.ok, true);
    if (r1.ok) {
      assert.equal(r1.state.roster.hero!.level, 2);
      state = r1.state;
    }
  });

  it('breakthrough needs cap level and xiuwei', () => {
    let state = createInitialPlayer(2);
    state = {
      ...state,
      roster: {
        ...state.roster,
        zhaoyun: {
          templateId: 'zhaoyun',
          level: 20,
          exp: 0,
          breakthroughTier: 0,
          star: 0,
          owned: true,
          cardShards: 0,
        },
      },
    };
    state = grantCurrency(state, 'xiuwei', 100);
    const r = tryBreakthrough(state, 'zhaoyun');
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.state.roster.zhaoyun!.breakthroughTier, 1);
    }
  });

  it('star unlocks shared or override nodes', () => {
    let state = createInitialPlayer(3);
    state = grantCurrency(state, 'stardust', 200);
    for (let i = 0; i < 3; i += 1) {
      const r = tryStarUp(state, 'zhaoyun');
      assert.equal(r.ok, true);
      if (r.ok) state = r.state;
    }
    assert.equal(state.roster.zhaoyun!.star, 3);
    const nodes = unlockedStarNodes('zhaoyun', 3);
    assert.ok(nodes.some((n) => n.label.includes('七进七出') || n.label.includes('连击')));
    const tpl = getTemplate('zhaoyun')!;
    const derived = deriveGrowthStats(tpl, state.roster.zhaoyun!);
    assert.ok(derived.followUp);
    assert.ok(derived.lifesteal > 0);
  });

  it('stack merges shared and override effects', () => {
    const node = resolveStarNode('wukong', 3);
    assert.ok(node);
    assert.equal(node!.label, '筋斗');
    assert.ok(node!.effects.some((e) => e.kind === 'enable_follow_up'));
    assert.ok(node!.effects.some((e) => e.kind === 'rare_stat' && e.stat === 'dodge'));
  });

  it('growth tracks registry exposes enabled axes', () => {
    const tracks = listGrowthTracks();
    assert.deepEqual(
      tracks.map((t) => t.id),
      ['level', 'breakthrough', 'star'],
    );
    let state = createInitialPlayer(5);
    state = grantCharacterExp(state, 'hero', 500);
    const r = applyGrowthTrack(state, 'level', 'hero');
    assert.equal(r.ok, true);
  });

  it('previewStarUp reports shard or dust cost', () => {
    let state = createInitialPlayer(6);
    state = {
      ...state,
      roster: {
        ...state.roster,
        huatuo: { ...state.roster.huatuo!, owned: true, star: 2, cardShards: 1 },
      },
    };
    const preview = previewStarUp(state, 'huatuo');
    assert.equal(preview.costKind, 'shard');
    assert.ok(preview.nodeLine.length > 0);
    assert.equal(preview.ready, true);
  });

  it('formationHints flags missing tank/heal', () => {
    const state = createInitialPlayer(7);
    const next = {
      ...state,
      formation: { hero: 2 as const, zhangfei: 1 as const, zhaoyun: 9 as const },
    };
    const hints = formationHints(next);
    assert.ok(hints.missingRoleLine?.includes('治疗'));
  });
});
