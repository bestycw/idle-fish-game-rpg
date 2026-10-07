import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createInitialPlayer } from '../save/player.js';
import { ENCOUNTERS } from './encounters.js';
import { resolveEncounterEnemies } from './encounterResolve.js';
import { resolveEncounterTitleForBattle } from './resolveEncounterDisplay.js';

describe('encounterResolve', () => {
  it('defaults to table enemies', () => {
    const enc = ENCOUNTERS.find((e) => e.id === 'wall')!;
    const specs = resolveEncounterEnemies(enc);
    assert.equal(specs.length, enc.enemies.length);
    assert.equal(specs[0]!.slot, enc.enemies[0]!.slot);
  });

  it('overlay battleDisplay overrides preset title only', () => {
    const p = createInitialPlayer(1);
    p.narrative = {
      phase: 'mainline',
      worldPreset: 'xianxia',
      overlay: {
        nodes: {},
        battleDisplay: { encounterTitles: { wall: '自定义盾墙' } },
      },
    };
    assert.equal(resolveEncounterTitleForBattle(p, 'wall', '盾墙巡逻'), '自定义盾墙');
  });
});
