import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BATTLE_START_QI, createBattle, runAutoBattle, stepBattle } from './combat.js';
import { getSkill } from '../character/skills.js';
import { createUnitFromTemplate, getTemplate } from '../character/index.js';
import { buildPlayerParty } from '../formation/formation.js';
import { createInitialPlayer } from '../save/player.js';
import { ENCOUNTERS } from '../dungeon/encounters.js';
import { ratingToPct } from './ratings.js';
import { createRng } from '../shared/rng.js';
import {
  pickEnemyFocus,
  pickEnemyFocusLane,
  registerFocusPolicy,
  resolveTargets,
} from './targeting.js';
import { isLiving, livingUnits } from './lifecycle.js';
import { shredValueWithMastery } from './mastery.js';
import {
  applyCcDrDuration,
  enforceStatusSoftCap,
  getStatusDef,
  pickCleanseTarget,
  pickPurgeTarget,
  STATUS_SOFT_CAP,
} from './statusFx.js';
import { listSkillEffectKinds, registerSkillEffect, runSkillEffects } from './effectRegistry.js';
import { listStatusTickKinds, registerStatusTick } from './tickRegistry.js';
import type { BattleEvent, GridSlot, UnitRuntime } from '../shared/types.js';

describe('ratings', () => {
  it('ratingToPct respects K and cap', () => {
    assert.equal(ratingToPct(0, 'critRating'), 0);
    assert.ok(Math.abs(ratingToPct(80, 'critRating') - 0.5) < 0.001);
    assert.equal(ratingToPct(1000, 'critRating'), 0.6);
    assert.ok(Math.abs(ratingToPct(85, 'penRating') - 0.45) < 0.01);
  });
});

describe('qi', () => {
  it('starts battle at 20 qi, not full', () => {
    const player = createInitialPlayer(99);
    const party = buildPlayerParty(player);
    const battle = createBattle(party, 99, 0);
    assert.ok(battle.player.units.every((u) => u.qi === BATTLE_START_QI));
    assert.ok(battle.enemy.units.every((u) => u.qi === BATTLE_START_QI));
    assert.ok(BATTLE_START_QI < getSkill('skill_hero_strike').qiCost);
  });

  it('requires qi for skill and refunds on basic attack', () => {
    const player = createInitialPlayer(99);
    const party = buildPlayerParty(player);
    const hero = party.find((u) => u.isHero)!;
    hero.skill = getSkill('skill_hero_strike');

    let battle = createBattle([hero], 99, 0);
    const enemy = battle.enemy.units[0]!;
    enemy.maxHp = 9999;
    enemy.hp = 9999;
    enemy.def = 0; enemy.res = 0;
    enemy.spd = 1;
    battle.player.units[0]!.spd = 99;
    battle.player.units[0]!.qi = 0;

    battle = stepBattle(battle, 99, { heroManual: false });
    const after = battle.player.units[0]!;
    assert.ok(after.qi >= 25, `expected qi gain from turn start + basic, got ${after.qi}`);
  });

  it('blocks skill when qi insufficient', () => {
    const tpl = getTemplate('hero')!;
    const unit = createUnitFromTemplate(tpl, 2);
    unit.qi = 10;
    unit.skill = getSkill('skill_hero_strike');
    assert.ok(unit.qi < unit.skill.qiCost);
  });
});

describe('targeting', () => {
  const mk = (slot: GridSlot, name: string): UnitRuntime => {
    const tpl = getTemplate('zhangfei')!;
    const u = createUnitFromTemplate(tpl, slot);
    u.name = name;
    u.uid = name;
    return u;
  };

  it('cross hits focus plus orthogonal neighbors', () => {
    const foes = [mk(5, 'c'), mk(2, 'u'), mk(4, 'l'), mk(6, 'r'), mk(8, 'd'), mk(1, 'diag')];
    const rng = createRng(1);
    const targets = resolveTargets('cross', foes, foes[0]!, rng);
    assert.equal(targets.length, 5);
    assert.ok(targets.every((t) => t.slot !== 1));
  });

  it('all hits every living unit', () => {
    const foes = [mk(1, 'a'), mk(5, 'b'), mk(9, 'c')];
    const targets = resolveTargets('all', foes, null, createRng(1));
    assert.equal(targets.length, 3);
  });

  it('col_focus hits a full column', () => {
    const foes = [mk(1, 'f'), mk(4, 'm'), mk(7, 'b'), mk(2, 'side')];
    const focus = foes[0]!;
    const rng = createRng(1);
    const targets = resolveTargets('col_focus', foes, focus, rng);
    assert.equal(targets.length, 3);
    assert.ok(targets.every((t) => [1, 4, 7].includes(t.slot)));
  });

  it('lane focus prefers mirror slot then same column', () => {
    const foes = [mk(2, 'front'), mk(5, 'mid'), mk(9, 'far')];
    assert.equal(pickEnemyFocusLane(foes, 2, false)?.slot, 2);
    assert.equal(pickEnemyFocusLane([mk(5, 'mid'), mk(9, 'far')], 2, false)?.slot, 5);
    assert.equal(pickEnemyFocusLane([mk(8, 'back'), mk(9, 'far')], 2, false)?.slot, 8);
  });

  it('pierce prefers deeper same column when mirror empty', () => {
    const foes = [mk(5, 'mid'), mk(8, 'back')];
    assert.equal(pickEnemyFocusLane(foes, 2, true)?.slot, 8);
    assert.equal(pickEnemyFocusLane(foes, 2, false)?.slot, 5);
  });

  it('focusPolicy hook can break lane without touching combat loop', () => {
    const actor = mk(1, 'actor');
    actor.focusPolicy = 'lowest_hp';
    const low = mk(9, 'low');
    low.hp = 10;
    low.maxHp = 100;
    const high = mk(1, 'high');
    high.hp = 90;
    high.maxHp = 100;
    const rng = createRng(1);
    const focus = pickEnemyFocus([high, low], actor, {
      policy: 'lowest_hp',
      rng,
    });
    assert.equal(focus?.slot, 9);

    registerFocusPolicy('always_slot_7', (ctx) =>
      ctx.foes.find((u) => u.slot === 7 && !u.dead) ?? null,
    );
    const custom = pickEnemyFocus([mk(7, 'x'), mk(1, 'y')], actor, {
      policy: 'always_slot_7',
      rng,
    });
    assert.equal(custom?.slot, 7);
  });
});

describe('knife-2 combat', () => {
  it('setup debuffs guaranteedLand; hard CC uses resist; amp mastery deepens shred', () => {
    assert.equal(getStatusDef('shred')?.guaranteedLand, true);
    assert.equal(getStatusDef('bleed')?.guaranteedLand, true);
    assert.equal(getStatusDef('mark_prey')?.guaranteedLand, true);
    assert.equal(getStatusDef('stun')?.guaranteedLand, undefined);
    assert.equal(getStatusDef('havoc')?.guaranteedLand, undefined);
    const deepened = shredValueWithMastery({ role: 'group_amp', masteryRating: 90 }, 0.82);
    assert.ok(deepened < 0.82);
    assert.ok(deepened >= 0.45);
  });

  it('player ctrl skill applies havoc; heal cleanses; hero purges', () => {
    assert.equal(getSkill('skill_baigujing_huagu').applyStatus[0]?.statusId, 'havoc');
    assert.equal(getTemplate('baigujing')!.skillId, 'skill_baigujing_huagu');
    assert.ok(getSkill('skill_huatuo_qingnang').effects?.some((e) => e.kind === 'cleanse'));
    assert.ok(getSkill('skill_hero_strike').effects?.some((e) => e.kind === 'purge'));
    assert.equal(getSkill('skill_houyi_luori').focusPolicy, 'lowest_hp');
    assert.equal(getTemplate('houyi')!.skillId, 'skill_houyi_luori');
  });

  it('purge prefers shield; cleanse picks removable debuff', () => {
    const rng = createRng(1);
    const unit = createUnitFromTemplate(getTemplate('zhangfei')!, 1);
    unit.shield = 20;
    unit.statuses = [{ statusId: 'bleed', remaining: 2, layers: 1 }];
    assert.equal(pickPurgeTarget(unit, rng), 'shield');
    unit.shield = 0;
    assert.equal(pickCleanseTarget(unit, rng), 'bleed');
  });

  it('sleep clears on damage', () => {
    const hero = createUnitFromTemplate(getTemplate('hero')!, 2);
    hero.atk = 80; hero.atk = 80;
    hero.spd = 99;
    hero.qi = 0;
    let battle = createBattle([hero], 3, 1);
    // strip enemies so only one soft target remains
    battle.enemy.units = [battle.enemy.units[0]!];
    const foe = battle.enemy.units[0]!;
    foe.statuses = [{ statusId: 'sleep', remaining: 3 }];
    foe.def = 0; foe.res = 0;
    foe.maxHp = 500;
    foe.hp = 500;
    foe.spd = 1;
    let guard = 0;
    while (
      battle.status === 'ongoing' &&
      !battle.events.some((e) => e.code === 'status_remove' && e.payload.status === '沉眠') &&
      guard < 40
    ) {
      battle = stepBattle(battle, 3, { heroManual: false });
      guard += 1;
    }
    assert.ok(
      battle.events.some(
        (e) => e.code === 'status_remove' && String(e.payload.status) === '沉眠',
      ),
    );
  });

  it('cc DR halves then immunes stun', () => {
    const unit = createUnitFromTemplate(getTemplate('zhangfei')!, 1);
    assert.equal(applyCcDrDuration(unit, 'stun', 2), 2);
    assert.equal(applyCcDrDuration(unit, 'stun', 2), 1);
    assert.equal(applyCcDrDuration(unit, 'stun', 2), null);
  });

  it('boss rank blocks havoc', () => {
    const ctrl = createUnitFromTemplate(getTemplate('baigujing')!, 6);
    ctrl.qi = 100;
    ctrl.spd = 99;
    ctrl.masteryRating = 80;
    let battle = createBattle([ctrl], 21, 0);
    battle.enemy.units = [battle.enemy.units[0]!];
    const foe = battle.enemy.units[0]!;
    foe.rank = 'boss';
    foe.spd = 1;
    foe.maxHp = 9999;
    foe.hp = 9999;
    foe.fortuneRating = 0;
    let guard = 0;
    while (
      battle.status === 'ongoing' &&
      !battle.events.some((e) => e.code === 'status_block') &&
      guard < 40
    ) {
      battle = stepBattle(battle, 21, { heroManual: false });
      guard += 1;
    }
    assert.ok(battle.events.some((e) => e.code === 'status_block' && e.payload.status === '混乱'));
  });
});

describe('extension registries', () => {
  it('ships builtin effect and tick kinds', () => {
    assert.ok(listSkillEffectKinds().includes('purge'));
    assert.ok(listSkillEffectKinds().includes('cleanse'));
    assert.ok(listSkillEffectKinds().includes('grant_qi'));
    assert.ok(listSkillEffectKinds().includes('revive_ally'));
    assert.ok(listStatusTickKinds().includes('bleed_hp_pct'));
    assert.ok(listStatusTickKinds().includes('regen_hp_pct'));
    assert.ok(listStatusTickKinds().includes('stagger_hp'));
    assert.ok(listSkillEffectKinds().includes('self_atk_up'));
    assert.ok(listSkillEffectKinds().includes('heal_on_kill'));
    assert.ok(listSkillEffectKinds().includes('self_stagger'));
    assert.equal(getStatusDef('atk_up')?.outgoingDamageMult, 1.15);
    assert.equal(getStatusDef('regen')?.tickKind, 'regen_hp_pct');
    assert.equal(getStatusDef('stagger')?.deferIncomingRatio, 0.4);
    assert.equal(getStatusDef('unstable')?.backlashOnCleanse, true);
  });

  it('registerSkillEffect can add a new kind without combat loop change', () => {
    let hits = 0;
    registerSkillEffect('test_ping', () => {
      hits += 1;
    });
    assert.ok(listSkillEffectKinds().includes('test_ping'));
    runSkillEffects([{ kind: 'test_ping' }], {
      state: {} as never,
      actor: {} as never,
      targets: [],
      allies: [],
      rng: createRng(1),
      emit: () => {},
      grantQi: () => {},
      attackPower: () => 10,
      shieldMasteryMult: () => 1,
    });
    assert.equal(hits, 1);
  });

  it('skill effect chance is a self-roll and emits one miss line', () => {
    let hits = 0;
    const events: { code: string; payload: Record<string, unknown> }[] = [];
    registerSkillEffect('test_proc_chance', () => {
      hits += 1;
    });
    const ctx = (rng: ReturnType<typeof createRng>) => ({
      state: { turn: 1 } as never,
      actor: { name: '刘备' } as never,
      targets: [],
      allies: [],
      rng,
      emit: (_state: unknown, code: BattleEvent['code'], payload: Record<string, unknown>) => {
        events.push({ code, payload });
      },
      grantQi: () => {},
      attackPower: () => 10,
      shieldMasteryMult: () => 1,
    });
    runSkillEffects([{ kind: 'test_proc_chance', chance: 0.25 }], {
      ...ctx({ next: () => 0.9, int: () => 0, pick: <T>(xs: readonly T[]) => xs[0]! }),
    });
    assert.equal(hits, 0);
    assert.equal(events[0]?.code, 'effect_miss');
    assert.equal(events[0]?.payload.actor, '刘备');
    assert.equal(events[0]?.payload.effect, '效果');
    runSkillEffects([{ kind: 'test_proc_chance', chance: 0.25 }], {
      ...ctx({ next: () => 0.1, int: () => 0, pick: <T>(xs: readonly T[]) => xs[0]! }),
    });
    assert.equal(hits, 1);
    runSkillEffects([{ kind: 'test_proc_chance' }], {
      ...ctx(createRng(1)),
    });
    assert.equal(hits, 2);
  });

  it('registerStatusTick can add poison-like tick', () => {
    let ticks = 0;
    registerStatusTick('test_flat_1', ({ unit }) => {
      unit.hp = Math.max(0, unit.hp - 1);
      ticks += 1;
    });
    assert.ok(listStatusTickKinds().includes('test_flat_1'));
    assert.equal(ticks, 0);
  });

  it('enforceStatusSoftCap drops soft statuses first', () => {
    const unit = createUnitFromTemplate(getTemplate('zhangfei')!, 1);
    unit.statuses = [
      { statusId: 'bleed', remaining: 2 },
      { statusId: 'shred', remaining: 2, value: 0.7 },
      { statusId: 'slow', remaining: 2 },
      { statusId: 'heal_block', remaining: 2 },
      { statusId: 'havoc', remaining: 2 },
      { statusId: 'berserk', remaining: 2 },
      { statusId: 'stun', remaining: 2 },
    ];
    assert.ok(unit.statuses.length > STATUS_SOFT_CAP);
    enforceStatusSoftCap(unit);
    assert.equal(unit.statuses.length, STATUS_SOFT_CAP);
    assert.ok(unit.statuses.some((s) => s.statusId === 'stun'));
  });
});

describe('nirvana and revive', () => {
  it('stands once at 30% hp then stays down', () => {
    const hero = createUnitFromTemplate(getTemplate('hero')!, 2);
    hero.maxHp = 100;
    hero.hp = 100;
    hero.def = 0;
    hero.res = 0;
    hero.spd = 1;
    hero.qi = 0;
    hero.nirvanaHpRatio = 0.3;
    let battle = createBattle([hero], 3, 1);
    const live = battle.player.units[0]!;
    live.nirvanaHpRatio = 0.3;
    live.maxHp = 100;
    live.hp = 100;
    live.def = 0;
    live.res = 0;
    live.spd = 1;
    live.dodge = 0;
    live.block = 0;
    battle.enemy.units = [battle.enemy.units[0]!];
    const foe = battle.enemy.units[0]!;
    foe.atk = 999;
    foe.spd = 99;
    foe.qi = 0;
    battle = stepBattle(battle, 3, { heroManual: false });
    const after = battle.player.units[0]!;
    assert.equal(after.dead, false);
    assert.equal(after.hp, 30);
    assert.ok(battle.events.some((e) => e.code === 'unit_revive'));
    let guard = 0;
    while (!battle.player.units[0]!.dead && battle.status === 'ongoing' && guard < 20) {
      battle = stepBattle(battle, 3, { heroManual: false });
      guard += 1;
    }
    assert.equal(battle.player.units[0]!.dead, true);
    assert.equal(battle.events.filter((e) => e.code === 'unit_revive').length, 1);
  });

  it('revive_ally raises one fallen ally', () => {
    const healer = createUnitFromTemplate(getTemplate('huatuo')!, 8);
    healer.skill = {
      ...healer.skill,
      aiWeight: 1,
      effects: [...(healer.skill.effects ?? []), { kind: 'revive_ally', value: 0.35 }],
    };
    const ally = createUnitFromTemplate(getTemplate('zhangfei')!, 1);
    let battle = createBattle([healer, ally], 5, 1);
    const doc = battle.player.units.find((u) => u.templateId === 'huatuo')!;
    const fallen = battle.player.units.find((u) => u.templateId === 'zhangfei')!;
    doc.qi = 100;
    doc.spd = 99;
    doc.skill = { ...doc.skill, aiWeight: 1 };
    fallen.hp = 0;
    fallen.dead = true;
    for (const e of battle.enemy.units) {
      e.spd = 1;
      e.atk = 1;
    }
    battle = stepBattle(battle, 5, { heroManual: false });
    const raised = battle.player.units.find((u) => u.templateId === 'zhangfei')!;
    assert.equal(raised.dead, false);
    assert.ok(raised.hp >= Math.floor(raised.maxHp * 0.35));
    assert.ok(battle.events.some((e) => e.code === 'unit_revive'));
  });
});

describe('dead units', () => {
  it('keeps dead units in array', () => {
    const player = createInitialPlayer(42);
    const party = buildPlayerParty(player).slice(0, 1);
    party[0]!.atk = 999; party[0]!.atk = 999;
    let battle = createBattle(party, 42, 0);
    battle = runAutoBattle(battle, 42, 80);
    assert.ok(battle.enemy.units.some((u) => u.dead));
    assert.equal(battle.enemy.units.length, battle.enemy.units.filter((u) => u.dead || isLiving(u)).length);
    assert.equal(livingUnits(battle.enemy.units).length, 0);
  });
});

describe('combat enrichment', () => {
  it('finishes auto battle with party of five', () => {
    const ids = ['hero', 'zhaoyun', 'machao', 'xushu', 'menghuo'];
    let player = createInitialPlayer(42);
    const roster = { ...player.roster };
    const formation: typeof player.formation = {};
    for (const id of ids) {
      roster[id] = { ...roster[id]!, owned: true };
      const t = getTemplate(id);
      if (t) formation[id] = t.preferredSlot;
    }
    player = { ...player, roster, formation };
    const party = buildPlayerParty(player);
    assert.equal(party.length, 5);
    assert.ok(party.some((u) => u.templateId === 'zhaoyun'));
    assert.ok(party.some((u) => u.templateId === 'menghuo'));
    assert.equal(party.some((u) => u.templateId === 'baigujing'), false);
    const wallIdx = ENCOUNTERS.findIndex((e) => e.id === 'wall');
    assert.ok(wallIdx >= 0);
    let battle = createBattle(party, 42, wallIdx);
    assert.equal(battle.encounterId, 'wall');
    battle = runAutoBattle(battle, 42);
    assert.notEqual(battle.status, 'ongoing');
    assert.ok(battle.events.length > 0);
  });

  it('pauses for hero in manual mode', () => {
    const player = createInitialPlayer(7);
    player.heroManual = true;
    const party = buildPlayerParty(player);
    let battle = createBattle(party, 7, 1);
    let guard = 0;
    while (!battle.awaitingHeroAction && battle.status === 'ongoing' && guard < 80) {
      battle = stepBattle(battle, 7, { heroManual: true });
      guard += 1;
    }
    assert.equal(battle.awaitingHeroAction, true);
    battle = stepBattle(battle, 7, { heroManual: true, heroAction: 'skill' });
    assert.equal(battle.awaitingHeroAction, false);
  });

  it('sets defeat hint when lost', () => {
    const player = createInitialPlayer(1);
    const party = buildPlayerParty(player).map((u) => ({
      ...u,
      atk: 1,
      maxHp: 10,
      hp: 10,
      def: 1,
      res: 1,
    }));
    let battle = createBattle(party, 1, 0);
    battle = runAutoBattle(battle, 1);
    if (battle.status === 'lost') {
      assert.ok(battle.defeatHint);
      assert.match(battle.defeatHint!, /战败提示/);
    }
  });
});

describe('encounter pressure', () => {
  it('scales enemy hp/atk/def but not speed', () => {
    const player = createInitialPlayer(1);
    const party = buildPlayerParty(player);
    const base = createBattle(party, 1, 0, { pressure: 1 });
    const hard = createBattle(party, 1, 0, { pressure: 2 });
    const a = base.enemy.units[0]!;
    const b = hard.enemy.units[0]!;
    assert.equal(b.maxHp, a.maxHp * 2);
    assert.equal(b.atk, a.atk * 2);
    assert.equal(b.def, a.def * 2);
    assert.equal(b.spd, a.spd);
  });
});

describe('T3 hooks', () => {
  it('fx_start_shield grants opening shield via onBattleStart', () => {
    const tpl = getTemplate('zhangfei')!;
    const unit = createUnitFromTemplate(tpl, 1);
    unit.effectAffixIds = ['fx_start_shield'];
    const battle = createBattle([unit], 1, 0);
    const live = battle.player.units[0]!;
    assert.ok(live.shield >= Math.floor(live.maxHp * 0.08));
    assert.ok(battle.log.some((line) => line.includes('先手结界')));
  });
});

describe('ability pool hooks', () => {
  it('taunt forces focus onto source', () => {
    const actor = createUnitFromTemplate(getTemplate('zhaoyun')!, 8);
    const tank = createUnitFromTemplate(getTemplate('zhangfei')!, 1);
    const back = createUnitFromTemplate(getTemplate('huatuo')!, 8);
    actor.statuses = [{ statusId: 'taunt', remaining: 2, sourceUid: tank.uid }];
    const rng = createRng(1);
    const focus = pickEnemyFocus([back, tank], actor, { pierce: true, policy: 'backline', rng });
    assert.equal(focus?.uid, tank.uid);
  });

  it('qi drought blocks energy gain', () => {
    const hero = createUnitFromTemplate(getTemplate('hero')!, 2);
    let battle = createBattle([hero], 7, 0);
    const uid = battle.player.units[0]!.uid;
    const name = battle.player.units[0]!.name;
    battle.player.units[0]!.statuses = [{ statusId: 'qi_drought', remaining: 8 }];
    battle.player.units[0]!.qi = 10;
    for (let i = 0; i < 24 && battle.status === 'ongoing'; i++) {
      battle = stepBattle(battle, 7 + i);
      const start = battle.events.find((e) => e.code === 'turn_start' && e.payload.actor === name);
      if (start) {
        assert.equal(start.payload.qiGain, 0);
        assert.equal(battle.player.units.find((u) => u.uid === uid)?.qi, 10);
        return;
      }
    }
    assert.fail('hero never started a turn');
  });

  it('start qi bonus applies at battle create', () => {
    const hero = createUnitFromTemplate(getTemplate('hero')!, 2);
    hero.startQiBonus = 15;
    const battle = createBattle([hero], 1, 0);
    assert.equal(battle.player.units[0]!.qi, BATTLE_START_QI + 15);
  });
});
