import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { defaultProgress } from '../character/growth.js';
import { getTemplate } from '../character/templates.js';
import { createBattle } from '../combat/combat.js';
import { createInitialPlayer } from '../save/player.js';
import type { CharacterProgress, GridSlot, PlayerState } from '../shared/types.js';
import { buildPlayerParty } from './formation.js';
import { resolveFormationResonances } from './resonance.js';

function partyOnSlots(assignments: [string, GridSlot][]): ReturnType<typeof buildPlayerParty> {
  let state = createInitialPlayer();
  const roster = { ...state.roster };
  const patch: Partial<CharacterProgress> = { level: 8, star: 2, owned: true };
  const formation: PlayerState['formation'] = {};
  for (const [id, slot] of assignments) {
    if (!getTemplate(id)) continue;
    roster[id] = { ...(roster[id] ?? defaultProgress(id)), owned: true, ...patch };
    formation[id] = slot;
  }
  state = { ...state, roster, formation };
  return buildPlayerParty(state);
}

describe('formation resonance E2', () => {
  it('iron_wall when front row 1-2-3 filled', () => {
    const units = partyOnSlots([
      ['linchong', 1],
      ['wusong', 2],
      ['luzhishen', 3],
    ]);
    const ids = resolveFormationResonances(units).map((d) => d.id);
    assert.ok(ids.includes('iron_wall'));
  });

  it('rearguard when two on back row', () => {
    const units = partyOnSlots([
      ['libai', 7],
      ['jingke', 8],
      ['linchong', 1],
    ]);
    const ids = resolveFormationResonances(units).map((d) => d.id);
    assert.ok(ids.includes('rearguard'));
  });

  it('createBattle logs resonance and bumps def for iron wall', () => {
    const party = partyOnSlots([
      ['linchong', 1],
      ['wusong', 2],
      ['luzhishen', 3],
    ]);
    const baseDef = party[0]!.def;
    const battle = createBattle(party, 12, 0);
    assert.match(battle.log.join('\n'), /铁壁共鸣/);
    assert.equal(battle.player.units[0]!.def, Math.round(baseDef * 1.08));
  });
});
