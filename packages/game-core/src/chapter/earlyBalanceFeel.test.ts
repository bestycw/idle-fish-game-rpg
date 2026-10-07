import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createBattle, runAutoBattle } from '../combat/combat.js';
import { ENCOUNTERS } from '../dungeon/encounters.js';
import { grantDungeonReward } from '../dungeon/lootTables.js';
import { generateEquipment } from '../equipment/generate.js';
import { grantStarterEquipmentKit } from '../equipment/starterKit.js';
import { deployedPartyPower } from '../equipment/power.js';
import { buildPlayerParty } from '../formation/formation.js';
import { ensureStarterTrialRoster } from '../formation/starterTrial.js';
import { grantCharacterExpAndLevel } from '../character/growth.js';
import { pullGacha } from '../gacha/gacha.js';
import { createInitialPlayer, wearLoot } from '../save/player.js';
import type { PlayerState } from '../shared/types.js';
import { createRng } from '../shared/rng.js';
import { estimateMainlineExpThroughChapter } from '../reward/battleExp.js';
import { chapterBattlePressure } from './ch1TeachGate.js';
import { mainlineBattleWaves } from './mainlineBattleWaves.js';

/** 清第一章后的典型状态：入门装 + 教学蓝伴 + 约两级历练 */
function postCh1(seed: number): PlayerState {
  let s = grantStarterEquipmentKit(ensureStarterTrialRoster(createInitialPlayer(seed)));
  s = {
    ...s,
    tutorialFlags: { ...s.tutorialFlags, ch1EliteTicketGranted: true },
    currencies: { ...s.currencies, ticket: Math.max(1, s.currencies.ticket ?? 0) },
    chapterCleared: 0,
    chapterNodeIndex: 1,
    chapterBattleWaveIndex: 2,
  };
  const g = pullGacha(s, 1);
  if (g.ok) s = g.state;

  const exp = estimateMainlineExpThroughChapter(1);
  for (const id of Object.keys(s.roster ?? {})) {
    s = grantCharacterExpAndLevel(s, id, exp).state;
  }
  return { ...s, chapterCleared: 1, chapterNodeIndex: 1, chapterBattleWaveIndex: 0 };
}

function withUncommonWeapon(state: PlayerState, seed: number): PlayerState {
  const item = generateEquipment(createRng(seed + 77), 'weapon', {
    rarity: 'uncommon',
    itemLevel: 1,
    setIdChance: 0,
  });
  let next = { ...state, inventory: [...state.inventory, item] };
  const worn = wearLoot(next, item.id);
  return worn.ok ? worn.state : next;
}

function farmGear(state: PlayerState, runs: number, seed: number): PlayerState {
  let s = state;
  for (let k = 0; k < runs; k++) {
    const r = grantDungeonReward({ ...s, wins: k, seed: seed + k }, 'gear_break_wall');
    s = r.state;
    for (const it of [r.loot, ...r.bonusLoot].filter(Boolean)) {
      const w = wearLoot(s, it!.id);
      if (w.ok) s = w.state;
    }
  }
  return s;
}

function winRate(
  make: (i: number) => PlayerState,
  encounterId: string,
  waveIndex: number,
  trials = 60,
): number {
  const idx = ENCOUNTERS.findIndex((e) => e.id === encounterId);
  let wins = 0;
  for (let i = 0; i < trials; i++) {
    const state: PlayerState = { ...make(i), chapterBattleWaveIndex: waveIndex };
    const pressure = chapterBattlePressure(state);
    let battle = createBattle(buildPlayerParty(state), 40000 + i, idx, {
      pressure,
      rollEncounterModifiers: true,
    });
    battle = runAutoBattle(battle, 40000 + i);
    if (battle.status === 'won') wins += 1;
  }
  return wins / trials;
}

function chapterClearRate(make: (i: number) => PlayerState, trials = 28): number {
  const waves = mainlineBattleWaves(2, 'raiders', 0);
  let clears = 0;
  for (let t = 0; t < trials; t++) {
    let ok = true;
    for (let wi = 0; wi < waves.length; wi++) {
      const state: PlayerState = { ...make(t), chapterBattleWaveIndex: wi };
      const idx = ENCOUNTERS.findIndex((e) => e.id === waves[wi]!.encounterId);
      let battle = createBattle(buildPlayerParty(state), 50000 + t * 40 + wi, idx, {
        pressure: chapterBattlePressure(state),
        rollEncounterModifiers: true,
      });
      battle = runAutoBattle(battle, 50000 + t * 40 + wi);
      if (battle.status !== 'won') {
        ok = false;
        break;
      }
    }
    if (ok) clears += 1;
  }
  return clears / trials;
}

describe('early balance feel', () => {
  it('one green weapon helps ch2 skirmish but does not guarantee clear', () => {
    const waves = mainlineBattleWaves(2, 'raiders', 0);
    const skirmish = waves[0]!.encounterId;
    const bare = winRate(postCh1, skirmish, 0);
    const geared = winRate((i) => withUncommonWeapon(postCh1(i), i), skirmish, 0);
    assert.ok(bare >= 0.28 && bare <= 0.62, `bare ch2 skirmish band, got ${(bare * 100).toFixed(0)}%`);
    assert.ok(geared > bare + 0.06, `green weapon should help (${(bare * 100).toFixed(0)}% → ${(geared * 100).toFixed(0)}%)`);
    assert.ok(geared < 0.85, `one green must not nearly guarantee, got ${(geared * 100).toFixed(0)}%`);
  });

  it('farming gear dungeon enables ch2 clear without one-piece flip', () => {
    const bareClear = chapterClearRate(postCh1);
    const oneClear = chapterClearRate((i) => withUncommonWeapon(postCh1(i), i));
    const farmClear = chapterClearRate((i) => farmGear(postCh1(i), 6, i + 90));
    assert.ok(bareClear < 0.2, `bare should rarely full-clear, got ${(bareClear * 100).toFixed(0)}%`);
    assert.ok(oneClear < 0.35, `one green must not flip full clear, got ${(oneClear * 100).toFixed(0)}%`);
    assert.ok(farmClear > 0.35, `~6 farm runs should often clear, got ${(farmClear * 100).toFixed(0)}%`);
  });

  it('farming first gear dungeon raises power modestly', () => {
    let s = postCh1(3);
    const before = deployedPartyPower(s);
    s = farmGear(s, 6, 33);
    const after = deployedPartyPower(s);
    const gain = after / Math.max(1, before);
    assert.ok(gain > 1.05, `should feel some upgrade ${before}→${after}`);
    assert.ok(gain < 1.45, `should not explode ${before}→${after} (×${gain.toFixed(2)})`);
  });
});
