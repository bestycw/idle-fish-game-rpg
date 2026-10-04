import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createInitialPlayer } from '../save/player.js';
import {
  computeParallelSyncScore,
  parallelChapterIdFromCleared,
  resolveParallelTierForChapterClear,
} from './parallel-sync.js';

describe('parallel sync', () => {
  it('maps chapterCleared to ch id', () => {
    assert.equal(parallelChapterIdFromCleared(1), 'ch1');
    assert.equal(parallelChapterIdFromCleared(6), 'ch6');
    assert.equal(parallelChapterIdFromCleared(0), null);
  });

  it('sync score is bounded 0–100', () => {
    const p = createInitialPlayer();
    const s = computeParallelSyncScore(p);
    assert.ok(s >= 0 && s <= 100);
  });

  it('low roster and power yields tier 1 on ch1 clear', () => {
    const p = createInitialPlayer();
    p.chapterCleared = 0;
    const tier = resolveParallelTierForChapterClear(p, 1);
    assert.equal(tier, 1);
  });
});
