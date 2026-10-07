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

  it('gear dungeon uses line-themed titles and boss names', () => {
    const p = createInitialPlayer(42);
    const idx = ENCOUNTERS.findIndex((e) => e.id === 'boss_wall');
    const opts = createBattleDisplayOpts(p, idx, {
      dungeonId: 'gear_break_wall',
      battleSeed: 99,
    });
    assert.match(opts.encounterDisplayName ?? '', /不动关|瓮城/);
    const names = opts.enemyDisplayNames ?? [];
    assert.ok(names.some((n) => /不动关尉/.test(n)), `expected boss in ${names.join(',')}`);
    const add = names.find((n) => !/不动关尉/.test(n)) ?? '';
    assert.ok(/关丁|戍卒|伕|驿卒|巡丁|盾/.test(add), `expected line pool name, got ${add}`);
  });

  it('gear dungeon browser chips use same boss names as battle', () => {
    const def = getGearDungeon('gear_break_wall');
    assert.ok(def);
    const view = buildGearDungeonView(def, 'xianxia', true);
    assert.equal(view.encounters[0]?.label, '不动关尉·石鸣');
    const multi = getGearDungeon('gear_warden_rift');
    assert.ok(multi);
    const rift = buildGearDungeonView(multi, 'xianxia', true);
    assert.ok(rift.encounters.some((e) => e.label.includes('镜渊') || e.label.includes('厍长渊')));
  });
});
