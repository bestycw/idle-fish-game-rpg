import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createInitialPlayer } from '../save/player.js';
import { grantStarterEquipmentKit } from '../equipment/starterKit.js';
import { pullGacha } from '../gacha/gacha.js';
import {
  applyCh1EliteDefeatReward,
  ch1EliteDefeatDialogueBeats,
  chapterBattlePressure,
  hasOwnedRareCompanion,
  isCh1FirstUnitElite,
  shouldForceCh1TeachRare,
} from './ch1TeachGate.js';
import { mainlineBattleWaves } from './mainlineBattleWaves.js';
import { chapterBattleAfterDefeat } from './progress.js';

describe('ch1 teach gate', () => {
  it('ch1 battle node is one unit: two skirmish + elite', () => {
    const waves = mainlineBattleWaves(1, 'wall', 0);
    assert.equal(waves.length, 3);
    assert.equal(waves[0]?.unitIndex, 0);
    assert.equal(waves[2]?.label, '精锐');
  });

  it('grants ticket once on first-unit elite defeat', () => {
    let p = grantStarterEquipmentKit(createInitialPlayer(3));
    p = { ...p, chapterCleared: 0, chapterNodeIndex: 1, chapterBattleWaveIndex: 2 };
    assert.ok(isCh1FirstUnitElite(p));
    const before = p.currencies.ticket ?? 0;
    const r1 = applyCh1EliteDefeatReward(p);
    assert.equal(r1.grantedTicket, true);
    assert.equal(r1.showDialogue, true);
    assert.equal(r1.state.currencies.ticket, before + 1);
    assert.equal(r1.state.tutorialFlags?.ch1EliteDialoguePending, true);
    const r2 = applyCh1EliteDefeatReward(r1.state);
    assert.equal(r2.grantedTicket, false);
    assert.equal(r2.showDialogue, false);
    assert.equal(r2.state.currencies.ticket, before + 1);
  });

  it('defeat dialogue beats tease then grant', () => {
    const beats = ch1EliteDefeatDialogueBeats();
    assert.ok(beats.length >= 4);
    assert.match(beats[0]!.text, /精锐|硬凿/);
    assert.match(beats[3]!.text, /抽卡券|券/);
  });

  it('forced gacha pull after ticket is a rare and auto-deploys', () => {
    let p = grantStarterEquipmentKit(createInitialPlayer(5));
    p = {
      ...p,
      chapterCleared: 0,
      chapterNodeIndex: 1,
      chapterBattleWaveIndex: 2,
      tutorialFlags: { ch1EliteTicketGranted: true },
      currencies: { ...p.currencies, ticket: 2 },
    };
    assert.ok(shouldForceCh1TeachRare(p));
    const r = pullGacha(p, 1);
    assert.ok(r.ok);
    if (!r.ok) return;
    assert.equal(r.items[0]?.rarity, 'rare');
    assert.equal(r.items[0]?.kind, 'new');
    assert.ok(hasOwnedRareCompanion(r.state));
    assert.ok(r.state.formation[r.items[0]!.templateId] != null, 'teach rare auto-deployed');
    assert.match(r.message, /自动上阵/);
    assert.equal(shouldForceCh1TeachRare(r.state), false);
  });

  it('skirmish pressure softer than elite gate before blue', () => {
    let p = grantStarterEquipmentKit(createInitialPlayer(2));
    p = { ...p, chapterCleared: 0, chapterNodeIndex: 1, chapterBattleWaveIndex: 0 };
    const sk = chapterBattlePressure(p);
    p = { ...p, chapterBattleWaveIndex: 2 };
    const elite = chapterBattlePressure(p);
    assert.ok(elite > sk * 1.5, `elite ${elite} vs skirmish ${sk}`);
  });

  it('defeat keeps wave progress (no rewind to wave 0)', () => {
    let p = grantStarterEquipmentKit(createInitialPlayer(4));
    p = { ...p, chapterCleared: 0, chapterNodeIndex: 1, chapterBattleWaveIndex: 2 };
    const after = chapterBattleAfterDefeat(p);
    assert.equal(after.chapterBattleWaveIndex, 2);
    assert.equal(after.chapterNodeIndex, 1);
  });
});
