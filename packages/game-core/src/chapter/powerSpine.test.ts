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
    assert.equal(unlockAtChapterCleared('dungeon', 'gear_break_wall'), 1);
    assert.equal(unlockAtChapterCleared('dungeon', 'gear_raider_trail'), 2);
    const wall = gearDungeonPlayerTarget('gear_break_wall', 0);
    const wallLater = gearDungeonPlayerTarget('gear_break_wall', 2);
    assert.equal(wallLater, wall, 'first gear dungeon stays on ch1 band after ch2');
    assert.equal(wall, milestoneForChapterOrder(1).powerEnterTarget);
    assert.ok(wall < getChapterBand(0).recommendedPower, 'first normal gear below ch1 hub rec');
    const laterLine = gearDungeonPlayerTarget('gear_arrow_lane', 2);
    assert.ok(laterLine > wall, `later line ${laterLine} vs first ${wall}`);
    const starter = grantStarterEquipmentKit(createInitialPlayer(1));
    const power = deployedPartyPower(starter);
    assert.ok(
      power >= wall * 0.9,
      `post-ch1 farm target ${wall} should be reachable from starter ${power}`,
    );
    assert.equal(unlockAtChapterCleared('dungeon', 'gear_wall_hard'), 3);
    assert.equal(unlockAtChapterCleared('dungeon', 'gear_wall_hell'), 5);
    assert.equal(unlockAtChapterCleared('dungeon', 'gear_warden_rift'), 7);
    const hard = gearDungeonPlayerTarget('gear_wall_hard');
    const hell = gearDungeonPlayerTarget('gear_wall_hell');
    const rift = gearDungeonPlayerTarget('gear_warden_rift');
    assert.ok(hard > laterLine, `hard ${hard} should beat early normal ${laterLine}`);
    assert.ok(hell > hard * 1.4, `hell ${hell} should sit well above hard ${hard}`);
    assert.ok(rift > hell, `rift ${rift} should top hell ${hell}`);
    const ro = gearDungeonCombatReadout('gear_wall_hell', 5);
    assert.ok(ro);
    assert.equal(ro.unlockAtChapterCleared, 5);
    assert.ok(ro.playerTargetNow >= ro.playerTargetAtUnlock);
  });

  it('story brief exposes tier for narrative tools', () => {
    const b = storyCombatScaleBrief(3);
    assert.equal(b.chapterOrder, 3);
    assert.ok(b.narrativePressureTier >= 1 && b.narrativePressureTier <= 5);
    assert.ok(b.milestone.powerClearTarget > b.milestone.powerEnterLow);
  });
});
