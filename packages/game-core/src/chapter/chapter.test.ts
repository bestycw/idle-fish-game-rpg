import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createInitialPlayer } from '../save/player.js';
import { deployedPartyPower } from '../equipment/power.js';
import {
  CHAPTER_BANDS,
  battlePressure,
  getChapterBand,
  powerGate,
} from './bands.js';
import { battleWavesForNode } from './battleWaves.js';
import { CHAPTERS, listChapters, nodePlace } from './defs.js';
import {
  advanceStoryNode,
  completeChapterBattle,
  getChapterRoute,
  getChapterView,
  isContentUnlocked,
  listUnlockedIds,
  resolveChapterBattleAfterWin,
} from './progress.js';
import { encounterIndexFromId } from './battleWaves.js';
import {
  MAINLINE_WAVES_PER_UNIT,
  mainlineBattleUnitCount,
  mainlineBattleWaves,
} from './mainlineBattleWaves.js';
import { MAINLINE_BIOME_ENCOUNTERS } from '../dungeon/mainlineBiomeEncounters.js';
import { MAINLINE_CAP_BLEND_ENCOUNTERS } from '../dungeon/mainlineCapBlendEncounters.js';
import {
  MAINLINE_HEADCOUNT_RANGE,
  assertMainlineHeadcount,
} from './mainlineThreatBudget.js';

describe('chapter', () => {
  it('mainline battle unit count grows with chapter order', () => {
    assert.equal(mainlineBattleUnitCount(1), 3);
    assert.equal(mainlineBattleUnitCount(5), 7);
    assert.equal(mainlineBattleUnitCount(10), 9);
    const ch1 = mainlineBattleWaves(1, 'wall', 0);
    assert.equal(ch1.length, 3 * MAINLINE_WAVES_PER_UNIT);
    const ch9 = mainlineBattleWaves(9, 'oil_cask', 0);
    assert.equal(ch9.length, 9 * MAINLINE_WAVES_PER_UNIT);
    const ch2 = mainlineBattleWaves(2, 'raiders', 0);
    assert.ok(ch2[0]!.encounterId.startsWith('biome_forest_'));
    const ch6 = mainlineBattleWaves(6, 'shield_stack', 0);
    assert.equal(ch6[2]!.encounterId, 'mainline_blend_shield_stack');
    assert.equal(ch6[ch6.length - 1]!.encounterId, 'boss_shield_stack');
    const ch1n4 = mainlineBattleWaves(1, 'archers', 1);
    assert.notEqual(ch1n4[0]!.encounterId, ch1[0]!.encounterId);
    for (const e of MAINLINE_BIOME_ENCOUNTERS) {
      assert.ok(
        assertMainlineHeadcount('skirmish', e.enemies.length),
        `${e.id} count ${e.enemies.length} outside skirmish band`,
      );
    }
    for (const e of MAINLINE_CAP_BLEND_ENCOUNTERS) {
      assert.ok(
        assertMainlineHeadcount('blend_elite', e.enemies.length),
        `${e.id} count ${e.enemies.length} outside blend band`,
      );
    }
    assert.equal(MAINLINE_HEADCOUNT_RANGE.skirmish.max, 7);
  });

  it('each chapter has at least five nodes', () => {
    for (const ch of listChapters()) {
      assert.ok(
        ch.nodes.length >= 5,
        `${ch.id} has ${ch.nodes.length} nodes (min 5)`,
      );
    }
  });

  it('starts with START_UNLOCKS only', () => {
    const p = createInitialPlayer(1);
    assert.ok(p.roster.menghuo?.owned);
    assert.ok(p.roster.zhaoyun?.owned);
    assert.equal(Object.keys(p.formation).length, 5);
    assert.equal(p.chapterCleared, 0);
    assert.equal(p.chapterNodeIndex, 0);
    assert.ok(isContentUnlocked(p, 'dungeon', 'gear_break_wall'));
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

  it('chapter battle advances waves before clearing node', () => {
    let p = createInitialPlayer(1);
    const s1 = advanceStoryNode(p);
    assert.ok(s1.ok);
    p = s1.state;
    assert.equal(getChapterView(p).node?.id, 'ch1_n2');
    assert.equal(p.chapterBattleWaveIndex ?? 0, 0);
    const battleNode = CHAPTERS[0].nodes.find((n) => n.id === 'ch1_n2')!;
    const expectedWaves = battleWavesForNode(battleNode, 1).length;
    for (let i = 0; i < expectedWaves; i++) {
      const r = resolveChapterBattleAfterWin(p);
      assert.ok(r.ok);
      assert.equal(r.hasNextWave, i < expectedWaves - 1);
      p = r.state;
      assert.equal(getChapterView(p).node?.kind, i < expectedWaves - 1 ? 'battle' : 'story');
    }
    assert.equal(p.chapterBattleWaveIndex ?? 0, 0);
    assert.equal(getChapterView(p).node?.kind, 'story');
  });

  it('clearing ch1 unlocks raiders', () => {
    let p = createInitialPlayer(1);
    const s1 = advanceStoryNode(p);
    assert.ok(s1.ok);
    p = s1.state;
    assert.equal(getChapterView(p).node?.kind, 'battle');
    for (let i = 0; i < 4; i++) {
      const view = getChapterView(p);
      if (view.node?.kind === 'battle') {
        const b = completeChapterBattle(p);
        assert.ok(b.ok);
        p = b.state;
      } else if (view.node?.kind === 'story') {
        const s = advanceStoryNode(p);
        assert.ok(s.ok);
        p = s.state;
      } else break;
    }
    assert.equal(p.chapterCleared, 1);
    assert.ok(isContentUnlocked(p, 'encounter', 'raiders'));
    assert.equal(isContentUnlocked(p, 'gacha_unit', 'baigujing'), true);
    assert.equal(isContentUnlocked(p, 'gacha_unit', 'nuwa'), false);
    assert.ok(listUnlockedIds(p, 'encounter').includes('raiders'));
    assert.ok(isContentUnlocked(p, 'encounter', 'raiders'));
  });

  it('exposes a place-named route for the current chapter', () => {
    const p = createInitialPlayer(1);
    const route = getChapterRoute(p);
    assert.equal(route.finished, false);
    assert.equal(route.stops.length, 5);
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
    const power = deployedPartyPower(p);
    const band = getChapterBand(0);
    assert.ok(power >= band.floorPower, `starter ${power} below floor ${band.floorPower}`);
    assert.ok(power < band.crushPower, `starter ${power} already at crush ${band.crushPower}`);
    assert.equal(powerGate(power, band), 'window');
  });
});
