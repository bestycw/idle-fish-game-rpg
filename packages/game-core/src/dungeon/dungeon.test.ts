import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createInitialPlayer } from '../save/player.js';
import { createRng } from '../shared/rng.js';
import { generateEquipment } from '../equipment/equipment.js';
import { canWearEquipment } from '../equipment/wear.js';
import {
  getDungeon,
  listBattleDungeons,
  pickEncounterIndex,
} from './defs.js';
import {
  gearLootRarityMix,
  maxRarityForGearTier,
  maxRarityInWeights,
  resolveGearRarityWeights,
} from './gearRarityByTier.js';
import { getGearDungeon } from './gearDungeons.js';
import { ABYSS_SOLUTION_T3_WEIGHTS, getLootTable, grantDungeonReward } from './lootTables.js';
import { climbTower } from './tower.js';

describe('dungeon defs', () => {
  it('ships gear instances (battle) and tower (instant)', () => {
    assert.equal(getDungeon('gear_break_wall').runMode, 'battle');
    assert.equal(getDungeon('tower').runMode, 'instant');
    assert.ok(listBattleDungeons().length >= 14);
    assert.ok(getDungeon('gear_break_wall').encounterPool.includes('wall'));
    assert.equal(getDungeon('gear_break_wall').encounterPool.includes('boss_wall'), false);
    assert.ok(getDungeon('gear_warden_trial').encounterPool.includes('boss_warden'));
  });

  it('pickEncounterIndex rotates pool by cursor', () => {
    const poolLen = getDungeon('gear_raider_trail').encounterPool.length;
    assert.ok(poolLen >= 2);
    const a = pickEncounterIndex('gear_raider_trail', 0);
    const b = pickEncounterIndex('gear_raider_trail', 1);
    const wrap = pickEncounterIndex('gear_raider_trail', poolLen);
    assert.notEqual(a, b);
    assert.equal(a, wrap);
  });
});

describe('dungeon loot', () => {
  it('gear dungeon always drops equipment and advances cursor', () => {
    const player = createInitialPlayer(99);
    const before = player.encounterIndex;
    const { state, loot, bonusLoot } = grantDungeonReward(player, 'gear_break_wall');
    assert.ok(loot);
    const dropN = 1 + bonusLoot.length;
    assert.equal(state.inventory.length, player.inventory.length + dropN);
    assert.equal(state.wins, player.wins + 1);
    assert.equal(state.encounterIndex, before + 1);
  });

  it('same gear dungeon grants fixed character exp', () => {
    const a = grantDungeonReward(
      { ...createInitialPlayer(1), chapterCleared: 1 },
      'gear_break_wall',
    );
    const b = grantDungeonReward(
      { ...createInitialPlayer(2), chapterCleared: 1, wins: 3 },
      'gear_break_wall',
    );
    assert.equal(a.characterExpPerMember, 24);
    assert.equal(b.characterExpPerMember, 24);
  });

  it('first gear dungeon drops wear-tier 0 gear after ch1 clear', () => {
    const player = { ...createInitialPlayer(7), chapterCleared: 1, chapterNodeIndex: 4 };
    for (let i = 0; i < 12; i++) {
      const { loot, bonusLoot, state } = grantDungeonReward(
        { ...player, wins: i, seed: player.seed + i },
        'gear_break_wall',
      );
      const drops = [loot, ...bonusLoot].filter(Boolean);
      assert.ok(drops.length > 0);
      for (const item of drops) {
        assert.ok((item!.itemLevel ?? 1) <= 20, `ilvl ${item!.itemLevel} should be 炼气档`);
        assert.ok(
          canWearEquipment(item!, 0),
          `炼气应能穿装等 ${item!.itemLevel}`,
        );
      }
      void state;
    }
  });

  it('gear tier rarity pools are progressive', () => {
    const normal = getGearDungeon('gear_break_wall')!;
    const hard = getGearDungeon('gear_arrow_hard')!;
    const hell = getGearDungeon('gear_wall_hell')!;
    const rift = getGearDungeon('gear_warden_rift')!;
    assert.equal(maxRarityForGearTier('normal'), 'uncommon');
    assert.equal(maxRarityForGearTier('hard'), 'rare');
    assert.equal(maxRarityForGearTier('hell'), 'epic');
    assert.equal(maxRarityForGearTier('rift'), 'legendary');
    assert.equal(maxRarityInWeights(resolveGearRarityWeights(normal)), 'uncommon');
    assert.equal(maxRarityInWeights(resolveGearRarityWeights(hard)), 'rare');
    assert.equal(maxRarityInWeights(resolveGearRarityWeights(hell)), 'epic');
    assert.equal(maxRarityInWeights(resolveGearRarityWeights(rift)), 'legendary');
    const normalWeights = resolveGearRarityWeights(normal);
    assert.equal(normalWeights.rare ?? 0, 0);
    assert.equal(normalWeights.epic ?? 0, 0);
    assert.equal(normalWeights.legendary ?? 0, 0);
    assert.equal(resolveGearRarityWeights(hard).epic ?? 0, 0);
    assert.equal(resolveGearRarityWeights(hell).legendary ?? 0, 0);
    const mix = gearLootRarityMix(normal, 'xianxia');
    assert.equal(mix.reduce((s, r) => s + r.pct, 0), 100);
    assert.equal(mix.find((r) => r.rarity === 'common')?.pct, 62);
    assert.equal(mix.find((r) => r.rarity === 'uncommon')?.pct, 38);
  });

  it('first normal gear dungeon never drops blue+', () => {
    for (let i = 0; i < 120; i++) {
      const { loot, bonusLoot } = grantDungeonReward(
        { ...createInitialPlayer(5000 + i), chapterCleared: 1, wins: i },
        'gear_break_wall',
      );
      for (const item of [loot, ...bonusLoot].filter(Boolean)) {
        assert.ok(
          item!.rarity === 'common' || item!.rarity === 'uncommon',
          `unexpected rarity ${item!.rarity}`,
        );
      }
    }
  });

  it('gear normal can roll bonus equipment with decaying chances', () => {
    let sawBonus = false;
    for (let i = 0; i < 400; i += 1) {
      const player = createInitialPlayer(4000 + i);
      const { loot, bonusLoot, state } = grantDungeonReward(player, 'gear_break_wall');
      assert.ok(loot);
      const n = 1 + bonusLoot.length;
      assert.equal(state.inventory.length, player.inventory.length + n);
      if (bonusLoot.length > 0) sawBonus = true;
    }
    assert.ok(sawBonus, 'expected some 2nd-piece drops at ~22%');
  });

  it('gear loot setId chance is accent not core', () => {
    const table = getLootTable('loot_gear_normal');
    assert.ok(table.setIdChance <= 0.12);

    let withSet = 0;
    for (let i = 0; i < 200; i += 1) {
      const item = generateEquipment(createRng(1000 + i), undefined, {
        setIdChance: table.setIdChance,
        setIdWeights: table.setIdWeights,
      });
      if (item.setId) withSet += 1;
    }
    assert.ok(withSet < 50, `expected few set drops, got ${withSet}/200`);
  });

  it('rejects instant dungeon on battle reward API', () => {
    const player = createInitialPlayer(1);
    assert.throws(() => grantDungeonReward(player, 'tower'));
  });

  it('hell warden trial drops gear biased to solution T3', () => {
    const solutionIds = new Set(ABYSS_SOLUTION_T3_WEIGHTS.map((w) => w.id));
    let withSolutionT3 = 0;
    let n = 0;
    for (let i = 0; i < 120; i += 1) {
      const player = createInitialPlayer(2000 + i);
      const { loot } = grantDungeonReward(player, 'gear_warden_trial');
      assert.ok(loot, 'hell gear dungeon should guarantee equipment');
      n += 1;
      if (loot.effectAffixId && solutionIds.has(loot.effectAffixId)) withSolutionT3 += 1;
    }
    assert.ok(withSolutionT3 > 25, `expected solution T3 bias, got ${withSolutionT3}/${n}`);
  });

  it('tower instant still grants xiuwei', () => {
    const player = createInitialPlayer(2);
    const before = player.currencies.xiuwei;
    const result = climbTower(player);
    assert.ok(result.gainedXiuwei > 0);
    assert.equal(result.state.currencies.xiuwei, before + result.gainedXiuwei);
  });
});
