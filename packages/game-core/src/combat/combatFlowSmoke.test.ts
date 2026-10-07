import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { defaultProgress } from '../character/growth.js';
import { getTemplate } from '../character/templates.js';
import { buildPlayerParty } from '../formation/formation.js';
import { createInitialPlayer } from '../save/player.js';
import type { BattleEvent, BattleState, CharacterProgress, PlayerState } from '../shared/types.js';
import { ENCOUNTERS } from '../dungeon/encounters.js';
import { createBattle, runAutoBattle } from './combat.js';
import { LOOP_COMBAT_SPOTLIGHT } from './combatFlowSpotlight.js';

const FLOW_SEEDS_PER_ENC = 5;
const MAX_STEPS = 200;

function countEvents(events: BattleEvent[], code: BattleEvent['code']): number {
  return events.filter((e) => e.code === code).length;
}

function assertBattleFlow(state: BattleState, label: string): void {
  assert.notEqual(state.status, 'ongoing', `${label}: battle stuck ongoing`);
  assert.ok(state.turn >= 1, `${label}: no turns`);
  assert.ok(state.events.length > 0, `${label}: no events`);
  const hits = countEvents(state.events, 'hit');
  assert.ok(hits >= 1, `${label}: no hit events (damage flow)`);
  const actions = state.events.filter((e) => e.code === 'action');
  assert.ok(actions.length >= 1, `${label}: no actions`);
  const usedSkill = actions.some((e) => String(e.payload.action ?? '').includes('技能'));
  const usedAtk = actions.some((e) => {
    const label = String(e.payload.action ?? '');
    return label.includes('普攻') || label.includes('攻击');
  });
  assert.ok(usedSkill || usedAtk, `${label}: neither skill nor basic attack`);
  if (state.status === 'won') {
    assert.ok(state.enemy.units.some((u) => u.dead), `${label}: won but no enemy dead`);
  }
}

function withRoster(
  state: PlayerState,
  ids: string[],
  patch: Partial<CharacterProgress> = { level: 10, star: 3, owned: true },
): PlayerState {
  const roster = { ...state.roster };
  for (const id of ids) {
    if (!getTemplate(id)) continue;
    roster[id] = { ...(roster[id] ?? defaultProgress(id)), owned: true, ...patch };
  }
  return { ...state, roster };
}

function partyOf(state: PlayerState, ids: string[]): ReturnType<typeof buildPlayerParty> {
  const formation: PlayerState['formation'] = {};
  const slots = [1, 2, 3, 4, 9] as const;
  ids.slice(0, 5).forEach((id, i) => {
    if (!getTemplate(id)) return;
    formation[id] = slots[i]!;
  });
  return buildPlayerParty({ ...state, formation });
}

function runEncounters(party: ReturnType<typeof buildPlayerParty>, tag: string): void {
  for (let ei = 0; ei < ENCOUNTERS.length; ei += 1) {
    const enc = ENCOUNTERS[ei]!;
    for (let s = 0; s < FLOW_SEEDS_PER_ENC; s += 1) {
      const seed = 5000 + ei * 131 + s * 17;
      let battle = createBattle(party, seed, ei);
      battle = runAutoBattle(battle, seed, MAX_STEPS);
      assertBattleFlow(battle, `${tag} ${enc.id} seed=${s}`);
    }
  }
}

describe('combat flow smoke (loop gate)', () => {
  it('default party finishes all encounters with hits and skills/attacks', () => {
    const player = createInitialPlayer(88);
    const party = buildPlayerParty(player);
    assert.equal(party.length, 5);
    runEncounters(party, 'default');
  });

  it('loop spotlight cards each replace one slot and still flow', () => {
    const baseIds = ['hero', 'zhaoyun', 'machao', 'xushu', 'zhuge'];
    for (const spotlightId of LOOP_COMBAT_SPOTLIGHT) {
      const t = getTemplate(spotlightId);
      assert.ok(t, spotlightId);
      const lineup = [...baseIds.slice(0, 4), spotlightId];
      const state = withRoster(createInitialPlayer(90 + lineup.length), lineup);
      const party = partyOf(state, lineup);
      assert.ok(
        party.some((u) => u.templateId === spotlightId),
        `${spotlightId} not in party`,
      );
      // 每种子只打 wall + oil_cask（快验技能/治疗/控）
      for (const encId of ['wall', 'oil_cask'] as const) {
        const ei = ENCOUNTERS.findIndex((e) => e.id === encId);
        for (let s = 0; s < 3; s += 1) {
          const seed = 8000 + ei * 53 + s * 11 + spotlightId.length;
          let battle = createBattle(party, seed, ei);
          battle = runAutoBattle(battle, seed, MAX_STEPS);
          assertBattleFlow(battle, `${spotlightId}@${encId} s${s}`);
          if (spotlightId === 'shengongbao' || spotlightId === 'xiwangmu') {
            const skillActs = battle.events.filter(
              (e) => e.code === 'action' && String(e.payload.action ?? '').includes('技能'),
            );
            assert.ok(skillActs.length >= 1, `${spotlightId} never cast skill`);
          }
        }
      }
    }
  });
});
