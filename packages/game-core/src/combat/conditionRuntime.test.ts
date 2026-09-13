import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createUnitFromTemplate } from '../character/factory.js';
import { getTemplate } from '../character/templates.js';
import {
  conditionHealMult,
  conditionIncomingMult,
  conditionOutgoingMult,
} from './conditionRuntime.js';

function unit(id: string, slot: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9) {
  return createUnitFromTemplate(getTemplate(id)!, slot);
}

describe('conditionRuntime', () => {
  it('applies skill_power only on skill hits and caps outgoing', () => {
    const actor = unit('zhaoyun', 8);
    const target = unit('zhangfei', 1);
    actor.conditionAffixes = [
      { defId: 'skill_power', name: '技能威力', value: 0.2, min: 0.08, max: 0.14 },
      { defId: 'skill_power', name: '技能威力', value: 0.2, min: 0.08, max: 0.14 },
    ];
    assert.equal(conditionOutgoingMult(actor, target, 'attack'), 1);
    assert.equal(conditionOutgoingMult(actor, target, 'skill'), 1.35);
  });

  it('vs_front / vs_back look at the target row', () => {
    const actor = unit('zhaoyun', 8);
    const front = unit('zhangfei', 1);
    const back = unit('huatuo', 8);
    actor.conditionAffixes = [
      { defId: 'vs_front', name: '对前排', value: 0.1, min: 0.1, max: 0.16 },
    ];
    assert.ok(conditionOutgoingMult(actor, front, 'attack') > 1);
    assert.equal(conditionOutgoingMult(actor, back, 'attack'), 1);
  });

  it('incoming reduce and back-row taken stack as separate multipliers', () => {
    const target = unit('zhangfei', 1);
    const fromBack = unit('zhaoyun', 8);
    target.conditionAffixes = [
      { defId: 'dmg_taken_reduce', name: '受伤害减少', value: 0.08, min: 0.04, max: 0.08 },
      { defId: 'dmg_taken_from_back', name: '受后排伤害减少', value: 0.1, min: 0.06, max: 0.12 },
    ];
    assert.ok(Math.abs(conditionIncomingMult(target, fromBack) - 0.92 * 0.9) < 1e-9);
  });

  it('heal uses skill_power', () => {
    const healer = unit('huatuo', 5);
    healer.conditionAffixes = [
      { defId: 'skill_power', name: '技能威力', value: 0.1, min: 0.08, max: 0.14 },
    ];
    assert.equal(conditionHealMult(healer), 1.1);
  });
});
