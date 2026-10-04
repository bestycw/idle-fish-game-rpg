import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createInitialPlayer } from '../save/player.js';
import { completeNarrativeOnboarding } from './onboarding.js';
import { resolveMainlineDialogue, synthesizeDialogueFromBlurb } from './mainlineDialogue.js';
import { defaultNarrativePreferences } from './narrativeVector.zh.js';

describe('mainlineDialogue', () => {
  it('uses overlay dialogue for ch1_n1 wuxia', () => {
    let p = createInitialPlayer();
    p = completeNarrativeOnboarding(p, 'wuxia', {
      heroName: '阿测试',
      preferences: defaultNarrativePreferences('wuxia'),
    });
    const lines = resolveMainlineDialogue(p, 'ch1_n1');
    assert.ok(lines && lines.length >= 2);
    assert.ok(lines.some((l) => l.speaker.includes('顾行简')));
    assert.ok(lines.some((l) => l.speaker === '阿测试' || l.text.includes('…')));
  });

  it('synthesizes from blurb when no dialogue field', () => {
    let p = createInitialPlayer();
    p = completeNarrativeOnboarding(p, 'wuxia', {
      heroName: '路人',
      preferences: defaultNarrativePreferences('wuxia'),
    });
    const lines = resolveMainlineDialogue(p, 'ch2_n1');
    assert.ok(lines && lines.length >= 1);
  });

  it('returns null for battle nodes', () => {
    let p = createInitialPlayer();
    p = completeNarrativeOnboarding(p, 'wuxia', {
      heroName: '路人',
      preferences: defaultNarrativePreferences('wuxia'),
    });
    assert.equal(resolveMainlineDialogue(p, 'ch1_n2'), null);
  });

  it('splits quoted lines', () => {
    let p = createInitialPlayer();
    p = completeNarrativeOnboarding(p, 'wuxia', {
      heroName: '甲',
      preferences: defaultNarrativePreferences('wuxia'),
    });
    const lines = synthesizeDialogueFromBlurb(
      '顾行简道：「别分兵。」',
      p,
      'ch2',
    );
    assert.ok(lines.some((l) => l.text.includes('别分兵')));
  });
});
