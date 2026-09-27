import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { defaultProgress } from '../character/growth.js';
import { getTemplate } from '../character/templates.js';
import { createBattle, runAutoBattle } from '../combat/combat.js';
import { buildPlayerParty } from '../formation/formation.js';
import { createInitialPlayer } from '../save/player.js';
import type { CharacterProgress, GridSlot, PlayerState } from '../shared/types.js';
import {
  DEFAULT_ENCOUNTER_MODIFIER_POOL,
  encounterOutgoingSchoolMult,
  listEncounterModifierIds,
  rollEncounterModifiers,
} from './encounterModifiers.js';

function partyOf(ids: string[]) {
  let state = createInitialPlayer();
  const roster = { ...state.roster };
  const patch: Partial<CharacterProgress> = { level: 10, star: 3, owned: true };
  for (const id of ids) {
    if (!getTemplate(id)) continue;
    roster[id] = { ...(roster[id] ?? defaultProgress(id)), owned: true, ...patch };
  }
  state = { ...state, roster };
  const formation: PlayerState['formation'] = {};
  const slots: GridSlot[] = [1, 2, 3, 4, 9];
  ids.slice(0, 5).forEach((id, i) => {
    if (!getTemplate(id)) return;
    formation[id] = slots[i]!;
  });
  state = { ...state, formation };
  return buildPlayerParty(state);
}

describe('encounterModifiers E1', () => {
  it('registers three default pool ids', () => {
    for (const id of DEFAULT_ENCOUNTER_MODIFIER_POOL) {
      assert.ok(listEncounterModifierIds().includes(id), id);
    }
  });

  it('rollEncounterModifiers is stable for seed', () => {
    assert.deepEqual(rollEncounterModifiers(4242), rollEncounterModifiers(4242));
  });

  it('createBattle with spirit_surge logs label and boosts spirit mult', () => {
    const party = partyOf(['libai']);
    const battle = createBattle(party, 77, 0, { encounterModifierIds: ['spirit_surge'] });
    assert.match(battle.log.join('\n'), /灵力潮汐/);
    assert.equal(encounterOutgoingSchoolMult(battle, 'spirit'), 1.4);
    assert.equal(encounterOutgoingSchoolMult(battle, 'phys'), 1);
  });

  it('frontline_pressure runs without breaking auto battle', () => {
    const party = partyOf(['linchong']);
    let battle = createBattle(party, 88, 0, { encounterModifierIds: ['frontline_pressure'] });
    battle = runAutoBattle(battle, 88, 80);
    assert.ok(['won', 'lost', 'ongoing'].includes(battle.status === 'ongoing' ? 'ongoing' : battle.status));
  });
});
