import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { SkillDef, UnitRuntime } from '../shared/types.js';
import {
  applySoftModeThen,
  resolveSoftModes,
  softModeWhenMet,
} from './softModeRuntime.js';

function unit(partial: Partial<UnitRuntime> & { uid: string; name: string }): UnitRuntime {
  return {
    templateId: partial.templateId ?? 't',
    slot: partial.slot ?? 1,
    hp: partial.hp ?? 100,
    maxHp: partial.maxHp ?? 100,
    shield: partial.shield ?? 0,
    qi: partial.qi ?? 100,
    maxQi: partial.maxQi ?? 100,
    atk: 10,
    def: 5,
    res: 5,
    spd: 10,
    critRating: 0,
    critDmgRating: 0,
    penRating: 0,
    toughnessRating: 0,
    masteryRating: 0,
    blockRating: 0,
    dodgeRating: 0,
    lifestealRating: 0,
    fortuneRating: 0,
    statuses: partial.statuses ?? [],
    dead: partial.dead ?? false,
    skill: partial.skill as UnitRuntime['skill'],
    skillCastCount: partial.skillCastCount ?? 0,
    ...partial,
  } as UnitRuntime;
}

const baseSkill: SkillDef = {
  id: 'skill_test',
  name: '试招',
  targetPattern: 'single',
  tags: ['damage'],
  multiplier: 1.5,
  qiCost: 50,
  applyStatus: [],
  effects: [{ kind: 'vs_shield', multiplier: 1.2 }],
  aiWeight: 1,
  softModes: [
    {
      when: { kind: 'target_has_status', statusId: 'mark_prey' },
      then: {
        effectPatches: [{ kind: 'execute', value: 0.3, multiplier: 1.5 }],
        multiplierDelta: 0.1,
      },
      copy: '猎印目标：斩杀加重',
    },
    {
      when: { kind: 'ally_downed' },
      then: { reviveAlly: { hpRatio: 0.35 } },
      copy: '有倒地：招魂',
    },
  ],
};

describe('softModeRuntime', () => {
  it('does not change skill when no condition met', () => {
    const actor = unit({ uid: 'a', name: '甲', skillCastCount: 1 });
    const foe = unit({ uid: 'f', name: '敌' });
    const next = resolveSoftModes(baseSkill, {
      actor,
      allies: [actor],
      foes: [foe],
      targets: [foe],
    });
    assert.equal(next, baseSkill);
  });

  it('applies execute + multiplier when target has mark_prey', () => {
    const actor = unit({ uid: 'a', name: '甲' });
    const foe = unit({
      uid: 'f',
      name: '敌',
      statuses: [{ statusId: 'mark_prey', remaining: 2, layers: 1 }],
    });
    const next = resolveSoftModes(baseSkill, {
      actor,
      allies: [actor],
      foes: [foe],
      targets: [foe],
    });
    assert.notEqual(next, baseSkill);
    assert.ok(Math.abs(next.multiplier - 1.6) < 1e-9);
    assert.ok(next.effects?.some((e) => e.kind === 'execute' && e.multiplier === 1.5));
    assert.ok(next.effects?.some((e) => e.kind === 'vs_shield'));
  });

  it('ally_downed injects revive_ally', () => {
    const actor = unit({ uid: 'a', name: '甲' });
    const fallen = unit({ uid: 'b', name: '乙', hp: 0, dead: true });
    const foe = unit({ uid: 'f', name: '敌' });
    assert.equal(
      softModeWhenMet({ kind: 'ally_downed' }, {
        actor,
        allies: [actor, fallen],
        foes: [foe],
        targets: [actor, fallen],
      }),
      true,
    );
    const next = resolveSoftModes(baseSkill, {
      actor,
      allies: [actor, fallen],
      foes: [foe],
      targets: [actor],
    });
    assert.ok(next.effects?.some((e) => e.kind === 'revive_ally' && e.value === 0.35));
  });

  it('self_hp_below and first_cast evaluate correctly', () => {
    const actor = unit({ uid: 'a', name: '甲', hp: 30, maxHp: 100, skillCastCount: 0 });
    const foe = unit({ uid: 'f', name: '敌' });
    const ctx = { actor, allies: [actor], foes: [foe], targets: [foe] };
    assert.equal(softModeWhenMet({ kind: 'self_hp_below', value: 0.4 }, ctx), true);
    assert.equal(softModeWhenMet({ kind: 'first_cast' }, ctx), true);
    actor.skillCastCount = 1;
    assert.equal(softModeWhenMet({ kind: 'first_cast' }, ctx), false);
  });

  it('applySoftModeThen upgrades existing effect multiplier without double rows', () => {
    const skill: SkillDef = {
      ...baseSkill,
      effects: [{ kind: 'execute', value: 0.3, multiplier: 1.2 }],
      softModes: undefined,
    };
    const next = applySoftModeThen(skill, {
      effectPatches: [{ kind: 'execute', value: 0.3, multiplier: 1.5 }],
    });
    const executes = (next.effects ?? []).filter((e) => e.kind === 'execute');
    assert.equal(executes.length, 1);
    assert.equal(executes[0]!.multiplier, 1.5);
  });
});
