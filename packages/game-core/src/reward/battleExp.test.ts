import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getProgress, grantCharacterExpAndLevel } from '../character/growth.js';
import { createInitialPlayer } from '../save/player.js';
import { ensureStarterTrialRoster } from '../formation/starterTrial.js';
import {
  approxMainlineLevelEnteringChapter,
  estimateMainlineExpThroughChapter,
  expSumForLevelSpan,
  mainlineClearLevelGainTarget,
  mainlineFightCountForChapter,
} from './battleExp.js';

describe('mainline battle exp pacing', () => {
  it('ch1 has six fights and targets two level-ups', () => {
    assert.equal(mainlineFightCountForChapter(1), 6);
    assert.equal(mainlineClearLevelGainTarget(1), 2);
    assert.equal(approxMainlineLevelEnteringChapter(1), 1);
    const need = expSumForLevelSpan(1, 2);
    const total = estimateMainlineExpThroughChapter(1);
    assert.ok(total >= need, `ch1 exp ${total} < need ${need} for 1→3`);
    assert.ok(total < need * 1.35, `ch1 exp ${total} overshoots too hard vs ${need}`);
  });

  it('clearing ch1 levels deployed party by about two', () => {
    let state = ensureStarterTrialRoster(createInitialPlayer(11));
    const total = estimateMainlineExpThroughChapter(1);
    const heroBefore = getProgress(state, 'hero').level;
    state = grantCharacterExpAndLevel(state, 'hero', total).state;
    const heroAfter = getProgress(state, 'hero').level;
    assert.equal(heroBefore, 1);
    assert.ok(heroAfter >= 3, `hero Lv ${heroAfter} after ch1 exp`);
    assert.ok(heroAfter <= 4, `hero Lv ${heroAfter} jumped too far`);
  });
});
