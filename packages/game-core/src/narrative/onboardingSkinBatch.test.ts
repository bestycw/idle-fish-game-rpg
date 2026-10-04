import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  generateOnboardingSkinBatch,
  nodeIdsForChapterOrderUpTo,
  ONBOARDING_SKIN_BATCH_CHAPTER_MAX,
} from './onboardingSkinBatch.js';
import { defaultNarrativePreferences } from './narrativeVector.zh.js';
import { validateOverlayChapterRange } from './validateNodeSkin.js';

describe('onboardingSkinBatch', () => {
  it('batch 10 covers all defs nodes', () => {
    const prefs = defaultNarrativePreferences('wuxia');
    const batch = generateOnboardingSkinBatch({
      worldPreset: 'wuxia',
      heroName: '测试',
      preferences: prefs,
    });
    assert.equal(batch.skinChapterReady, ONBOARDING_SKIN_BATCH_CHAPTER_MAX);
    assert.equal(Object.keys(batch.overlay.nodes).length, nodeIdsForChapterOrderUpTo(10).length);
    assert.equal(validateOverlayChapterRange(batch.overlay, 'wuxia', 10).length, 0);
    assert.ok(batch.novelBible.id.includes('wuxia'));
    assert.equal(batch.novelBible.worldSkinNames?.towns?.town_outer, '江渡墟');
    assert.equal(batch.novelBible.worldSkinNames?.locations?.loc_gate, '西郊青石关');
    assert.equal(batch.novelBible.worldSkinNames?.npcs?.npc_handler, '顾行简');
  });

  it('batch 8 only writes ch1–ch8 nodes', () => {
    const prefs = defaultNarrativePreferences('xianxia');
    const batch = generateOnboardingSkinBatch({
      worldPreset: 'xianxia',
      heroName: '甲',
      preferences: prefs,
      maxChapterOrder: 8,
    });
    assert.equal(batch.skinChapterReady, 8);
    assert.equal(Object.keys(batch.overlay.nodes).length, nodeIdsForChapterOrderUpTo(8).length);
    assert.equal(validateOverlayChapterRange(batch.overlay, 'xianxia', 8).length, 0);
  });
});
