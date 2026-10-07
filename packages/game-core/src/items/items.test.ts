import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createInitialPlayer } from '../save/player.js';
import { grantItem } from './grants.js';
import { tItem } from './locale.js';
import { getItemDef, listItemDefs } from './registry.js';
import { settlementGrantRows } from './settlementDisplay.js';
import { buildBattleSettlement } from '../reward/battleSettlement.js';

describe('item registry', () => {
  it('registers live currencies and planned disabled mats', () => {
    assert.ok(getItemDef('gold')?.enabled);
    assert.equal(getItemDef('mat_herb_mist')?.enabled, false);
    assert.ok(listItemDefs({ enabledOnly: true }).every((d) => d.enabled));
  });

  it('tItem respects world preset', () => {
    assert.equal(tItem('gold', 'xianxia'), '灵石');
    assert.equal(tItem('gold', 'cyberpunk'), '信用点');
    assert.equal(tItem('enhance_stone', 'xianxia'), '淬灵石');
  });

  it('grantItem maps to player fields', () => {
    let p = createInitialPlayer(1);
    const g = grantItem(p, 'gold', 5);
    assert.ok(g.ok);
    p = g.state;
    assert.equal(p.gold, 5);
    const s = grantItem(p, 'enhance_stone', 3);
    assert.ok(s.ok);
    assert.equal(s.state.enhanceStones, 3);
  });

  it('settlementGrantRows use item ids', () => {
    const before = createInitialPlayer(2);
    const after = { ...before, gold: before.gold + 4, enhanceStones: 2 };
    const s = buildBattleSettlement({
      source: 'chapter',
      before,
      after,
      lines: [],
    });
    const rows = settlementGrantRows(s);
    assert.deepEqual(rows, [
      { itemId: 'gold', amount: 4 },
      { itemId: 'enhance_stone', amount: 2 },
    ]);
  });

  it('hides character_exp grant when partyExpRows present', () => {
    const before = createInitialPlayer(3);
    const after = { ...before, gold: before.gold + 2 };
    const s = buildBattleSettlement({
      source: 'dungeon',
      before,
      after,
      characterExpPerMember: 26,
      partyExpRows: [
        {
          templateId: 'hero',
          name: '主角',
          expGained: 26,
          levelBefore: 1,
          levelAfter: 1,
          expAfter: 26,
          expToNext: 40,
          leveledUp: false,
        },
      ],
      lines: [],
    });
    const rows = settlementGrantRows(s);
    assert.deepEqual(rows, [{ itemId: 'gold', amount: 2 }]);
    assert.equal(rows.some((r) => r.itemId === 'character_exp'), false);
  });
});

