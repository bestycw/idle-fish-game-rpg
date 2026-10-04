import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createInitialPlayer } from '../save/player.js';
import {
  applyParallelWorldAfterChapterClear,
  applyParallelWorldAfterMainlineDefeat,
  parallelArcIdFromChapterCleared,
  shouldRunParallelArcDeduction,
} from './parallelWorldState.js';

describe('parallel world state', () => {
  it('arc triggers on even chapter clears', () => {
    assert.equal(shouldRunParallelArcDeduction(1), false);
    assert.equal(shouldRunParallelArcDeduction(2), true);
    assert.equal(parallelArcIdFromChapterCleared(2), 'arc1');
    assert.equal(parallelArcIdFromChapterCleared(4), 'arc2');
  });

  it('arc1 clear increases autonomy and stores report', () => {
    let p = createInitialPlayer();
    p = applyParallelWorldAfterChapterClear(p, 1);
    assert.ok(!p.narrative?.parallelArcReports?.arc1);
    p = { ...p, chapterCleared: 1 };
    p = applyParallelWorldAfterChapterClear(p, 2);
    const axes = p.narrative?.parallelWorldAxes;
    assert.ok(axes && axes.grit > 12);
    assert.ok(axes.officeGrind < 88);
    assert.ok(p.narrative?.parallelArcReports?.arc1?.workstation);
  });

  it('odd chapter clear sets hub pulse', () => {
    let p = createInitialPlayer();
    p = applyParallelWorldAfterChapterClear(p, 1);
    assert.ok(p.narrative?.parallelOddChapterRipple?.length);
    p = { ...p, chapterCleared: 1 };
    p = applyParallelWorldAfterChapterClear(p, 2);
    assert.equal(p.narrative?.parallelOddChapterRipple, undefined);
  });

  it('mainline defeat nibbles axes and sets ripple', () => {
    let p = createInitialPlayer();
    p = applyParallelWorldAfterMainlineDefeat(p);
    const axes = p.narrative?.parallelWorldAxes;
    assert.ok(axes && axes.grit < 12);
    assert.ok(axes.officeGrind > 88);
    assert.ok(p.narrative?.parallelMainlineDefeatRipple?.length);
  });
});
