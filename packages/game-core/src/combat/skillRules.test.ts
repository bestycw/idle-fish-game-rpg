import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createUnitFromTemplate } from '../character/factory.js';
import { getTemplate } from '../character/templates.js';
import { getSkill } from '../character/skills.js';
import { createBattle, stepBattle } from './combat.js';
import {
  qiRefundOnKill,
  skillHealMult,
  skillOutgoingDamageMult,
  statusIncomingDamageMult,
} from './skillRules.js';
import type { UnitRuntime } from '../shared/types.js';

function unit(id: string, slot: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9): UnitRuntime {
  return createUnitFromTemplate(getTemplate(id)!, slot);
}

describe('skillRules hooks', () => {
  it('mark_prey increases incoming damage mult', () => {
    const t = unit('zhangfei', 1);
    t.statuses = [{ statusId: 'mark_prey', remaining: 2, value: 1.2 }];
    assert.equal(statusIncomingDamageMult(t), 1.2);
  });

  it('execute and vs_shield and first_cast multiply outgoing', () => {
    const a = unit('zhaoyun', 8);
    const t = unit('zhangfei', 1);
    t.shield = 40;
    t.hp = 20;
    t.maxHp = 100;
    a.skillCastCount = 0;
    const skill = {
      ...getSkill('skill_zhaoyun_longdan'),
      effects: [
        { kind: 'vs_shield' as const, multiplier: 1.3 },
        { kind: 'execute' as const, value: 0.3, multiplier: 1.5 },
        { kind: 'first_cast' as const, multiplier: 1.2 },
      ],
    };
    assert.ok(skillOutgoingDamageMult(a, t, skill) > 1.3 * 1.4);
  });

  it('heal_low_hp boosts heal mult', () => {
    const t = unit('zhaoyun', 8);
    t.hp = 20;
    t.maxHp = 100;
    const skill = getSkill('skill_huatuo_qingnang');
    assert.ok(skillHealMult(t, skill) >= 1.3);
  });

  it('qiRefundOnKill scales with kills', () => {
    const skill = {
      ...getSkill('skill_zhaoyun_longdan'),
      qiCost: 55,
      effects: [{ kind: 'refund_qi_on_kill' as const, value: 0.5 }],
    };
    assert.equal(qiRefundOnKill(skill, 0), 0);
    assert.equal(qiRefundOnKill(skill, 1), 27);
  });

  it('zhangfei ★3 compose grants team_shield effect', () => {
    const tpl = getTemplate('zhangfei')!;
    const u = createUnitFromTemplate(tpl, 1, {
      templateId: 'zhangfei',
      level: 1,
      exp: 0,
      breakthroughTier: 0,
      cultivationNodes: 0,
      star: 3,
      owned: true,
      cardShards: 0,
    });
    assert.ok(u.skill.effects?.some((e) => e.kind === 'team_shield'));
  });

  it('battle can apply team_shield from zhangfei skill at ★3', () => {
    const zf = createUnitFromTemplate(getTemplate('zhangfei')!, 1, {
      templateId: 'zhangfei',
      level: 1,
      exp: 0,
      breakthroughTier: 0,
      star: 3,
      owned: true,
      cardShards: 0,
    });
    const hero = unit('hero', 2);
    let state = createBattle([zf, hero], 42, 0);
    for (const u of state.player.units) u.qi = 100;
    let steps = 0;
    while (state.status === 'ongoing' && steps < 40) {
      state = stepBattle(state, 42 + steps);
      steps += 1;
      if (state.events.some((e) => e.code === 'shield_gain')) break;
    }
    assert.ok(
      state.events.some((e) => e.code === 'shield_gain'),
      'expected team_shield shield_gain event',
    );
  });
});
