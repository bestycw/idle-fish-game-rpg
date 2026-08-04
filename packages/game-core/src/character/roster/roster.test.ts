import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { assertAllCharacterBundlesOrThrow } from '../characterBundle.js';
import {
  CORE_TEMPLATES,
  DEEP_TEMPLATE_IDS,
  STUB_CORE_IDS,
  UNIT_TEMPLATES,
} from '../templates.js';
import { DEEP_SKILL_OVERRIDES } from '../deepKits.js';
import { getSkill } from '../skills.js';
import { STAR_OVERRIDES } from '../starTracks.js';
import { EXPAND_ROSTER } from './expandRoster.js';

describe('roster 100', () => {
  it('has exactly 100 templates (24 core + 76 expand)', () => {
    assert.equal(CORE_TEMPLATES.length, 24);
    assert.equal(EXPAND_ROSTER.length, 76);
    assert.equal(UNIT_TEMPLATES.length, 100);
    const ids = new Set(UNIT_TEMPLATES.map((t) => t.id));
    assert.equal(ids.size, 100);
  });

  it('deep 20 have personal star tracks; stub 4 fall back to shared', () => {
    assert.equal(DEEP_TEMPLATE_IDS.length, 20);
    for (const id of DEEP_TEMPLATE_IDS) {
      assert.ok(STAR_OVERRIDES[id], `missing deep track ${id}`);
      assert.equal(Object.keys(STAR_OVERRIDES[id]!).length, 6);
    }
    for (const id of STUB_CORE_IDS) {
      assert.equal(STAR_OVERRIDES[id], undefined, `stub should use shared: ${id}`);
    }
  });

  it('deep 20 skill overrides have motif blurbs and merge into SKILLS', () => {
    const skillIds = Object.keys(DEEP_SKILL_OVERRIDES);
    assert.equal(skillIds.length, 20);
    for (const id of skillIds) {
      const patch = DEEP_SKILL_OVERRIDES[id]!;
      assert.ok(patch.blurb && patch.blurb.length > 4, `missing blurb ${id}`);
      assert.ok(patch.name, `missing name ${id}`);
      const live = getSkill(id);
      assert.equal(live.name, patch.name);
      assert.equal(live.blurb, patch.blurb);
    }
    assert.equal(getSkill('skill_wukong_sweep').targetPattern, 'cross');
  });

  it('all character bundles resolve', () => {
    assertAllCharacterBundlesOrThrow();
  });

  it('hard-control deep skills sit in coeff band ≥1.05', () => {
    const hardCtrl = [
      'skill_zhangfei_roar',
      'skill_medusa_gaze',
      'skill_xishi_chenyu',
      'skill_baigujing_huagu',
      'skill_daji_charm',
      'skill_thor_hammer',
    ];
    for (const id of hardCtrl) {
      assert.ok(getSkill(id).multiplier >= 1.05, `${id} below hard-ctrl floor`);
    }
    assert.ok(getSkill('skill_zhuge_qimen').multiplier >= 0.9);
  });
});
