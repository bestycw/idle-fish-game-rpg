import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatAffixLine, formatConditionLine, listBaseStatLines, bagCellSignature } from './affixDisplay.js';

describe('affixDisplay', () => {
  it('formats rating affixes as D4-style sentence + range', () => {
    const line = formatAffixLine({
      defId: 'masteryRating',
      name: '精通',
      stat: 'masteryRating',
      value: 10,
    });
    assert.equal(line.valueText, '+10');
    assert.equal(line.sentence, '技能与状态效果');
    assert.equal(line.rangeText, '[4 - 10]');
    assert.equal(line.rollQuality, 'max');
    assert.equal(line.line, '+10 技能与状态效果 [4 - 10]');
  });

  it('formats rare percent affixes with one decimal and percent range', () => {
    const line = formatAffixLine({
      defId: 'dodge',
      name: '闪避',
      stat: 'dodge',
      value: 0.06,
    });
    assert.equal(line.valueText, '+6.0%');
    assert.equal(line.rangeText, '[2.0 - 6.0]%');
    assert.equal(line.rollQuality, 'max');
  });

  it('marks minimum rolls', () => {
    const line = formatAffixLine({
      defId: 'critRating',
      name: '暴击',
      stat: 'critRating',
      value: 4,
    });
    assert.equal(line.rollQuality, 'min');
    assert.equal(line.sentence, '暴击几率');
  });

  it('shows enhance delta on base stats', () => {
    const rows = listBaseStatLines({
      baseStats: { atk: 20, maxHp: 40 },
      enhanceLevel: 2,
    });
    assert.equal(rows[0]?.line, '攻击力 22 (+2)');
    assert.equal(rows[1]?.enhanceDelta, 4);
  });

  it('formats condition lines as percent sentences', () => {
    const line = formatConditionLine({
      defId: 'skill_power',
      name: '技能威力',
      value: 0.14,
      min: 0.08,
      max: 0.14,
    });
    assert.equal(line.valueText, '+14.0%');
    assert.equal(line.sentence, '技能威力');
    assert.equal(line.rangeText, '[8.0 - 14.0]%');
    assert.equal(line.rollQuality, 'max');
  });

  it('bag cell signature prefers T3 then condition then affix', () => {
    const base = {
      id: 'x',
      name: '传说武器',
      slot: 'weapon' as const,
      rarity: 'legendary' as const,
      itemLevel: 20,
      baseStats: {},
      affixes: [{ defId: 'atk', name: '攻击', stat: 'atk' as const, value: 8 }],
      socketCount: 0 as const,
      enhanceLevel: 0,
    };
    assert.equal(bagCellSignature(base), '攻击');
    assert.equal(
      bagCellSignature({
        ...base,
        conditions: [{ defId: 'vs_front', name: '对前排', value: 0.1, min: 0.1, max: 0.16 }],
      }),
      '对前排',
    );
    assert.equal(
      bagCellSignature({ ...base, effectAffixId: 'fx_crit_bleed' }),
      '噬血锋',
    );
  });
});
