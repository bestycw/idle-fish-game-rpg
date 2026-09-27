import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createInitialPlayer } from '../save/player.js';
import { partyPower } from '../equipment/power.js';
import {
  CHAPTER_BANDS,
  battlePressure,
  getChapterBand,
  powerGate,
} from './bands.js';
import { CHAPTERS, nodePlace } from './defs.js';
import {
  advanceStoryNode,
  completeChapterBattle,
  getChapterRoute,
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
    assert.equal(isContentUnlocked(p, 'gacha_unit', 'baigujing'), true);
    assert.equal(isContentUnlocked(p, 'gacha_unit', 'nuwa'), false);
    assert.ok(listUnlockedIds(p, 'encounter').includes('raiders'));
    assert.match(s2.message, /八题·速攻来袭|解锁：/);
    assert.doesNotMatch(s2.message, /encounter:raiders/);
  });

  it('exposes a place-named route for the current chapter', () => {
    const p = createInitialPlayer(1);
    const route = getChapterRoute(p);
    assert.equal(route.finished, false);
    assert.equal(route.stops.length, 3);
    assert.equal(route.stops[0]?.status, 'current');
    assert.equal(route.stops[1]?.status, 'ahead');
    assert.equal(nodePlace(route.stops[0]!.node), '城门驿道');
    assert.equal(route.ticks[0]?.status, 'current');
    assert.equal(route.ticks[1]?.status, 'ahead');
    for (const ch of CHAPTERS) {
      for (const node of ch.nodes) {
        assert.ok(node.place.trim().length >= 2, `missing place ${node.id}`);
      }
    }
    const after = advanceStoryNode(p);
    assert.ok(after.ok);
    const next = getChapterRoute(after.state);
    assert.equal(next.stops[0]?.status, 'cleared');
    assert.equal(next.stops[1]?.status, 'current');
    assert.equal(nodePlace(next.stops[1]!.node), '盾墙关隘');
  });
});

describe('chapter bands', () => {
  it('has one band per chapter and starter party sits in chapter-1 window', () => {
    assert.equal(CHAPTER_BANDS.length, CHAPTERS.length);
    assert.equal(getChapterBand(0).enemyMult, 1);
    assert.ok(getChapterBand(2).enemyMult > getChapterBand(0).enemyMult);
    assert.equal(getChapterBand(99).index, CHAPTER_BANDS.length - 1);
    assert.equal(battlePressure(0, 1.3), 1.3);
    assert.ok(battlePressure(2, 1) > 1);
    const p = createInitialPlayer(1);
    const power = partyPower(p, Object.keys(p.formation));
    const band = getChapterBand(0);
    assert.ok(power >= band.floorPower, `starter ${power} below floor ${band.floorPower}`);
    assert.ok(power < band.crushPower, `starter ${power} already at crush ${band.crushPower}`);
    assert.equal(powerGate(power, band), 'window');
  });
});
