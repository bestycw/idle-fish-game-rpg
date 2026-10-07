import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getChapterBand } from './bands.js';
import {
  MAINLINE_HEADCOUNT_RANGE,
  mainlineWaveThreatTarget,
  pickMainlineHeadcount,
  squadScaleForHeadcount,
} from './mainlineThreatBudget.js';

describe('mainlineThreatBudget', () => {
  it('wave targets grow with band and ramp', () => {
    const band = getChapterBand(2);
    const w0 = mainlineWaveThreatTarget(band, 'skirmish', 0);
    const w2 = mainlineWaveThreatTarget(band, 'skirmish', 2);
    const elite = mainlineWaveThreatTarget(band, 'blend_elite', 1);
    assert.ok(w2 > w0);
    assert.ok(elite > w2);
  });

  it('fewer bodies get higher per-unit scale', () => {
    assert.ok(squadScaleForHeadcount(3, 5) > 1);
    assert.ok(squadScaleForHeadcount(7, 5) < 1);
    assert.equal(squadScaleForHeadcount(5, 5), 1);
  });

  it('headcount pick stays in role band', () => {
    for (let s = 0; s < 40; s += 1) {
      const n = pickMainlineHeadcount(1000 + s, 'skirmish', 9);
      const { min, max } = MAINLINE_HEADCOUNT_RANGE.skirmish;
      assert.ok(n >= min && n <= max);
    }
  });
});
