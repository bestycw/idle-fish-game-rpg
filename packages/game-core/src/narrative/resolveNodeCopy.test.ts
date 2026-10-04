import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createInitialPlayer } from '../save/player.js';
import { resolveNodeCopy } from './resolveNodeCopy.js';
import { getOfficialOverlay } from './officialPacksLoader.js';
import { overlayPassesValidation } from './validateNodeSkin.js';

describe('resolveNodeCopy', () => {
  it('applies spine location for ch1', () => {
    let p = createInitialPlayer();
    p = {
      ...p,
      narrative: {
        phase: 'mainline',
        worldPreset: 'wuxia',
        heroName: '阿测试',
      },
    };
    const copy = resolveNodeCopy(p, 'ch1_n1');
    assert.ok(copy);
    assert.ok(copy!.place.includes('关') || copy!.blurb.includes('关'));
    assert.ok(copy!.blurb.includes('阿测试') || copy!.blurb.includes('入局'));
  });

  it('official overlay validates against wuxia beats', () => {
    let p = createInitialPlayer();
    p = {
      ...p,
      narrative: { phase: 'mainline', worldPreset: 'wuxia', heroName: '旅人' },
    };
    const overlay = getOfficialOverlay('wuxia');
    assert.ok(Object.keys(overlay.nodes).length >= 15);
    assert.equal(overlayPassesValidation(overlay, 'wuxia'), true);
  });
});
