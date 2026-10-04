import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createInitialPlayer } from '../save/player.js';
import { createBattleDisplayOpts } from '../dungeon/resolveEncounterDisplay.js';
import { encounterIndexFromId } from '../chapter/battleWaves.js';
import { resolveEnemyUnitName } from './officialEnemyNames.zh.js';

describe('officialEnemyNames', () => {
  it('xianxia skins boss and skirmish display names', () => {
    assert.match(
      resolveEnemyUnitName('xianxia', 'boss_warden', 0, 'Boss'),
      /守门将/,
    );
    assert.match(
      resolveEnemyUnitName('xianxia', 'gate_skirmish', 0, 'Grunt'),
      /关丁/,
    );
  });

  it('createBattleDisplayOpts follows player narrative preset', () => {
    let p = createInitialPlayer(1);
    p = {
      ...p,
      narrative: {
        ...p.narrative!,
        worldPreset: 'xianxia',
      },
    };
    const idx = encounterIndexFromId('gate_skirmish');
    const opts = createBattleDisplayOpts(p, idx);
    assert.match(opts.encounterDisplayName ?? '', /界域/);
    assert.match(opts.enemyDisplayNames?.[0] ?? '', /关丁/);
  });
});
