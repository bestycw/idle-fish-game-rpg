import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createUnitFromTemplate } from '../character/factory.js';
import { getTemplate } from '../character/templates.js';
import { getSkill } from '../character/skills.js';
import { createBattle, stepBattle } from './combat.js';
import {
  atonementHealAmount,
  growRuleMult,
  healFromTakenAmount,
  hpHealOnKill,
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
    a.masteryRating = 0;
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

  it('vs_cc and vs_high_hp multiply outgoing', () => {
    const a = unit('zhaoyun', 8);
    a.masteryRating = 0;
    const t = unit('zhangfei', 1);
    t.hp = 90;
    t.maxHp = 100;
    t.statuses = [{ statusId: 'stun', remaining: 1 }];
    const skill = {
      ...getSkill('skill_zhaoyun_longdan'),
      effects: [
        { kind: 'vs_cc' as const, multiplier: 1.25 },
        { kind: 'vs_high_hp' as const, value: 0.65, multiplier: 1.2 },
      ],
    };
    assert.ok(Math.abs(skillOutgoingDamageMult(a, t, skill) - 1.25 * 1.2) < 1e-9);
    t.hp = 10;
    t.statuses = [];
    assert.equal(skillOutgoingDamageMult(a, t, skill), 1);
  });

  it('hpHealOnKill scales with kills', () => {
    const a = unit('zhaoyun', 8);
    a.masteryRating = 0;
    a.maxHp = 100;
    const skill = {
      ...getSkill('skill_zhaoyun_longdan'),
      effects: [{ kind: 'heal_on_kill' as const, value: 0.12 }],
    };
    assert.equal(hpHealOnKill(a, skill, 0), 0);
    assert.equal(hpHealOnKill(a, skill, 1), 12);
  });

  it('def_up reduces incoming damage mult', () => {
    const t = unit('zhangfei', 1);
    t.statuses = [{ statusId: 'def_up', remaining: 2 }];
    assert.equal(statusIncomingDamageMult(t), 0.88);
  });

  it('self_low_hp vs_rank surround focus_streak multiply outgoing', () => {
    const a = unit('lvbu', 8);
    a.masteryRating = 0;
    const t = unit('zhangfei', 1);
    a.hp = 20;
    a.maxHp = 100;
    t.rank = 'boss';
    const neighbor = unit('zhangfei', 2);
    const skill = {
      ...getSkill('skill_lvbu_wushuang'),
      effects: [
        { kind: 'self_low_hp' as const, value: 0.4, multiplier: 1.3 },
        { kind: 'vs_rank' as const, multiplier: 1.22 },
        { kind: 'surround' as const, multiplier: 1.2 },
        { kind: 'focus_streak' as const, value: 0.08 },
      ],
    };
    a.focusStreak = 2;
    const m = skillOutgoingDamageMult(a, t, skill, { foes: [t, neighbor] });
    assert.ok(Math.abs(m - 1.3 * 1.22 * 1.2 * (1 + 0.16)) < 1e-9);
  });

  it('atonement and heal_from_taken scale', () => {
    const a = unit('guanyu', 8);
    a.masteryRating = 0;
    a.maxHp = 200;
    a.recentDamageTaken = 80;
    const atone = {
      ...getSkill('skill_guanyu_slash'),
      effects: [{ kind: 'atonement' as const, value: 0.22 }],
    };
    const taken = {
      ...getSkill('skill_dianwei_guard'),
      effects: [{ kind: 'heal_from_taken' as const, value: 0.5 }],
    };
    assert.equal(atonementHealAmount(atone, 100), 22);
    assert.equal(healFromTakenAmount(a, taken), 40);
  });

  it('mastery grows unique-verb coefficients above table baseline', () => {
    const a = unit('lvbu', 8);
    a.masteryRating = 0;
    a.hp = 20;
    a.maxHp = 100;
    const t = unit('zhangfei', 1);
    const skill = {
      ...getSkill('skill_lvbu_wushuang'),
      effects: [{ kind: 'self_low_hp' as const, value: 0.4, multiplier: 1.3 }],
    };
    const base = skillOutgoingDamageMult(a, t, skill);
    assert.equal(base, 1.3);
    assert.equal(growRuleMult(a, 1.3), 1.3);
    a.masteryRating = 80;
    const grown = skillOutgoingDamageMult(a, t, skill);
    assert.ok(grown > base);
    assert.ok(growRuleMult(a, 1.3) > 1.3);
  });

  it('zhangfei ★3 compose grants team_shield effect (bulwark branch)', () => {
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
      starBranch: { 3: 'bulwark' },
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
      starBranch: { 3: 'bulwark' },
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
