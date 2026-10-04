import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveLifeLeisureText } from './parallelBriefLife.zh.js';

describe('resolveLifeLeisureText', () => {
  it('uses xianxia overlay for arc1 with heroName', () => {
    const text = resolveLifeLeisureText({
      seed: 'test',
      axes: { grit: 20, officeGrind: 70, backup: 10, resonance: 30 },
      arcId: 'arc1',
      heroName: '老叶',
      preset: 'xianxia',
    });
    assert.ok(text.includes('老叶'));
    assert.ok(!text.includes('{{heroName}}'));
  });
});
