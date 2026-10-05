import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createInitialPlayer } from '../save/player.js';
import { getChapterByOrder } from '../chapter/defs.js';
import { applyChapterFirstClear, hasClaimedChapterFirstClear } from './chapterFirstClear.js';
import { settlementHasLoot } from './battleSettlement.js';

describe('chapter first clear', () => {
  it('grants pack once per chapter order', () => {
    const p = createInitialPlayer(42);
    const ch = getChapterByOrder(1)!;
    const r1 = applyChapterFirstClear(p, ch);
    assert.ok(r1.applied);
    assert.equal(r1.state.gold, p.gold + r1.applied!.gold);
    assert.ok(hasClaimedChapterFirstClear(r1.state, 1));

    const r2 = applyChapterFirstClear(r1.state, ch);
    assert.equal(r2.applied, null);
    assert.equal(r2.state.gold, r1.state.gold);
  });
});

describe('battle settlement', () => {
  it('detects currency rewards', () => {
    assert.ok(
      settlementHasLoot({
        source: 'chapter',
        equipment: null,
        bonusEquipment: [],
        gold: 3,
        stardust: 0,
        xiuwei: 0,
        ticket: 0,
        enhanceStones: 0,
        lines: [],
      }),
    );
  });
});
