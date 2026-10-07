import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { grantStarterEquipmentKit } from '../equipment/starterKit.js';
import { createInitialPlayer } from '../save/player.js';
import { deployedPartyPower } from '../equipment/power.js';
import { getChapterBand } from './bands.js';
import {
  PLAYER_MILESTONES,
  gearDungeonCombatReadout,
  gearDungeonPlayerTarget,
  milestoneForChapterOrder,
  storyCombatScaleBrief,
  unlockAtChapterCleared,
} from './powerSpine.js';

describe('powerSpine', () => {
  it('milestones align one per chapter', () => {
    assert.equal(PLAYER_MILESTONES.length, 10);
    assert.ok(milestoneForChapterOrder(1).powerClearMin === getChapterBand(0).recommendedPower);
    assert.ok(
      milestoneForChapterOrder(1).powerClearStretch === getChapterBand(0).crushPower,
    );
  });

  it('starter sits in chapter-1 window below crush', () => {
    const p = grantStarterEquipmentKit(createInitialPlayer(1));
    const power = deployedPartyPower(p);
    const band = getChapterBand(0);
    const m = milestoneForChapterOrder(1);
    assert.ok(power >= m.powerEnterLow * 0.9, `starter ${power} vs enterLow ${m.powerEnterLow}`);
    assert.ok(power < band.crushPower, `starter ${power} at/above crush ${band.crushPower}`);
    assert.ok(
      power <= band.recommendedPower * 1.35,
      `starter ${power} far above rec ${band.recommendedPower}`,
    );
  });

  it('gear unlock chapter and targets are stable', () => {
    assert.equal(unlockAtChapterCleared('dungeon', 'gear_break_wall'), 0);
    assert.equal(unlockAtChapterCleared('dungeon', 'gear_raider_trail'), 1);
    const t0 = gearDungeonPlayerTarget('gear_break_wall', 0);
    const t1 = gearDungeonPlayerTarget('gear_break_wall', 2);
    assert.ok(t1 > t0);
    const ro = gearDungeonCombatReadout('gear_wall_hell', 5);
    assert.ok(ro);
    assert.ok(ro.unlockAtChapterCleared >= 1);
    assert.ok(ro.playerTargetNow >= ro.playerTargetAtUnlock);
  });

  it('story brief exposes tier for narrative tools', () => {
    const b = storyCombatScaleBrief(3);
    assert.equal(b.chapterOrder, 3);
    assert.ok(b.narrativePressureTier >= 1 && b.narrativePressureTier <= 5);
    assert.ok(b.milestone.powerClearTarget > b.milestone.powerEnterLow);
  });
});
