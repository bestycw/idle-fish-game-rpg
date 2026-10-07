import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createInitialPlayer } from '../save/player.js';
import {
  applyCh2GearGuideOnDefeat,
  markCh2GearGuideSeen,
} from './ch2GearGuide.js';
import { isContentUnlocked } from './progress.js';

describe('ch2GearGuide', () => {
  it('does nothing before ch1 clear', () => {
    const p = createInitialPlayer(1);
    const r = applyCh2GearGuideOnDefeat(p);
    assert.equal(r.showDialogue, false);
    assert.equal(r.state.tutorialFlags?.ch2GearGuidePending, undefined);
  });

  it('pends dialogue once after ch1 clear with gear unlocked', () => {
    let p = createInitialPlayer(1);
    p = { ...p, chapterCleared: 1 };
    assert.ok(isContentUnlocked(p, 'dungeon', 'gear_break_wall'));
    const r1 = applyCh2GearGuideOnDefeat(p);
    assert.equal(r1.showDialogue, true);
    assert.equal(r1.state.tutorialFlags?.ch2GearGuidePending, true);
    const r2 = applyCh2GearGuideOnDefeat(r1.state);
    assert.equal(r2.showDialogue, false);
    const seen = markCh2GearGuideSeen(r1.state);
    assert.equal(seen.tutorialFlags?.ch2GearGuidePending, false);
    assert.equal(seen.tutorialFlags?.ch2GearGuideSeen, true);
    const r3 = applyCh2GearGuideOnDefeat(seen);
    assert.equal(r3.showDialogue, false);
  });
});
