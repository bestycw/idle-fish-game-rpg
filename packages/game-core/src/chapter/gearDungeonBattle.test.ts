import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { grantCharacterExpAndLevel } from '../character/growth.js';
import { buildPlayerParty } from '../formation/formation.js';
import { ensureStarterTrialRoster } from '../formation/starterTrial.js';
import { grantStarterEquipmentKit } from '../equipment/starterKit.js';
import { createInitialPlayer } from '../save/player.js';
import { createBattle, runAutoBattle } from '../combat/combat.js';
import { pickEncounterIndex } from '../dungeon/defs.js';
import { getDungeon } from '../dungeon/defs.js';
import { estimateMainlineExpThroughChapter } from '../reward/battleExp.js';
import { gearDungeonBattlePressure } from './powerSpine.js';

describe('gearDungeonBattlePressure', () => {
  it('first normal dungeon is elite wall, not boss_wall', () => {
    const pool = getDungeon('gear_break_wall').encounterPool;
    assert.deepEqual(pool, ['wall']);
  });

  it('first normal dungeon uses unlock band + normal soften (not current chapter)', () => {
    const p = gearDungeonBattlePressure('gear_break_wall');
    assert.ok(p < 0.72, `expected softened pressure, got ${p}`);
    assert.ok(p > 0.6, `pressure too low ${p}`);
  });

  it('post-ch1 tank starter can clear first gear dungeon (power not fake)', () => {
    const encIdx = pickEncounterIndex('gear_break_wall', 0);
    const pressure = gearDungeonBattlePressure('gear_break_wall');
    const ch1Exp = estimateMainlineExpThroughChapter(1);
    let wins = 0;
    const trials = 80;
    for (let i = 0; i < trials; i++) {
      let state = ensureStarterTrialRoster({
        ...createInitialPlayer(i),
        seed: i,
        starterCompanionId: 'bajie',
      });
      state = grantStarterEquipmentKit(state);
      state = { ...state, chapterCleared: 1 };
      for (const id of Object.keys(state.formation)) {
        state = grantCharacterExpAndLevel(state, id, ch1Exp).state;
      }
      const party = buildPlayerParty(state);
      let battle = createBattle(party, 12000 + i, encIdx, {
        pressure,
        rollEncounterModifiers: true,
      });
      battle = runAutoBattle(battle, 12000 + i);
      if (battle.status === 'won') wins++;
    }
    const rate = wins / trials;
    assert.ok(
      rate >= 0.85,
      `tank opener should farm first gear, got ${(rate * 100).toFixed(1)}% at pressure ${pressure}`,
    );
  });
});
