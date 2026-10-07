import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createInitialPlayer } from '../save/player.js';
import { createBattleDisplayOpts } from '../dungeon/resolveEncounterDisplay.js';
import { encounterIndexFromId } from '../chapter/battleWaves.js';
import { buildGearDungeonView } from '../dungeon/gearDungeonDisplay.js';
import { getGearDungeon } from '../dungeon/gearDungeons.js';
import { ENCOUNTERS } from '../dungeon/encounters.js';
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

  it('first gear dungeon uses elite wall (not full boss)', () => {
    const p = createInitialPlayer(42);
    const idx = ENCOUNTERS.findIndex((e) => e.id === 'wall');
    const opts = createBattleDisplayOpts(p, idx, {
      dungeonId: 'gear_break_wall',
      battleSeed: 99,
    });
    assert.match(opts.encounterDisplayName ?? '', /盾廊|巡阵|青石关/);
    const names = opts.enemyDisplayNames ?? [];
    assert.ok(names.length >= 2, `expected wall lineup, got ${names.join(',')}`);
    assert.ok(
      names.every((n) => /关丁|戍卒|伕|驿卒|巡丁|盾|队长/.test(n)),
      `expected line pool names, got ${names.join(',')}`,
    );
  });

  it('gear dungeon browser chips use same names as battle', () => {
    const def = getGearDungeon('gear_break_wall');
    assert.ok(def);
    const view = buildGearDungeonView(def, 'xianxia', true);
    assert.equal(view.encounters[0]?.label, '巡廊盾队长·石鸣');
    const multi = getGearDungeon('gear_warden_rift');
    assert.ok(multi);
    const rift = buildGearDungeonView(multi, 'xianxia', true);
    assert.ok(rift.encounters.some((e) => e.label.includes('镜渊') || e.label.includes('厍长渊')));
  });
});
