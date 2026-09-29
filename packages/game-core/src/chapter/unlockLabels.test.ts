import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CHAPTERS } from './defs.js';
import { formatUnlockSummary } from './unlockLabels.js';

describe('unlockLabels', () => {
  it('summarizes ch2 unlocks without listing every gacha id', () => {
    const ch2 = CHAPTERS.find((c) => c.id === 'ch2');
    assert.ok(ch2);
    const msg = formatUnlockSummary(ch2!.unlocksOnClear);
    assert.match(msg, /镜渊试炼/);
    assert.match(msg, /八题·铁壁灵阵/);
    assert.match(msg, /召唤入池/);
    assert.doesNotMatch(msg, /召唤池·caocao/);
    assert.ok(msg.length < 220, `toast too long: ${msg.length}`);
  });
});
