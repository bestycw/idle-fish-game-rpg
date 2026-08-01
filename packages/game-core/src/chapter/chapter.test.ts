import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createInitialPlayer } from '../save/player.js';
import {
  advanceStoryNode,
  completeChapterBattle,
  getChapterView,
  isContentUnlocked,
  listUnlockedIds,
} from './progress.js';

describe('chapter', () => {
  it('starts with START_UNLOCKS only', () => {
    const p = createInitialPlayer(1);
    assert.equal(p.chapterCleared, 0);
    assert.equal(p.chapterNodeIndex, 0);
    assert.ok(isContentUnlocked(p, 'dungeon', 'gear_trial'));
    assert.ok(isContentUnlocked(p, 'gacha_unit', 'zhangfei'));
    assert.ok(isContentUnlocked(p, 'gacha_unit', 'houyi'));
    assert.equal(isContentUnlocked(p, 'gacha_unit', 'baigujing'), false);
    assert.equal(isContentUnlocked(p, 'encounter', 'raiders'), false);
  });

  it('advances story then requires battle', () => {
    let p = createInitialPlayer(1);
    const r1 = advanceStoryNode(p);
    assert.ok(r1.ok);
    p = r1.state;
    assert.equal(p.chapterNodeIndex, 1);
    const view = getChapterView(p);
    assert.equal(view.node?.kind, 'battle');
    const bad = advanceStoryNode(p);
    assert.equal(bad.ok, false);
  });

  it('clearing ch1 unlocks raiders', () => {
    let p = createInitialPlayer(1);
    const s1 = advanceStoryNode(p);
    assert.ok(s1.ok);
    p = s1.state;
    assert.equal(getChapterView(p).node?.kind, 'battle');
    const b1 = completeChapterBattle(p);
    assert.ok(b1.ok);
    p = b1.state;
    assert.equal(getChapterView(p).node?.kind, 'story');
    const s2 = advanceStoryNode(p);
    assert.ok(s2.ok);
    p = s2.state;
    assert.equal(p.chapterCleared, 1);
    assert.ok(isContentUnlocked(p, 'encounter', 'raiders'));
    assert.equal(isContentUnlocked(p, 'gacha_unit', 'baigujing'), false);
    assert.ok(listUnlockedIds(p, 'encounter').includes('raiders'));
  });
});
