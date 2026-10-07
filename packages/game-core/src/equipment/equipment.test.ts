import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createInitialPlayer, wearLoot } from '../save/player.js';
import {
  generateEquipment,
  sumEquipmentBonuses,
  equipItem,
  autoEquipBest,
  previewLoadout,
  itemsForSlot,
} from './equipment.js';
import { grantStarterEquipmentKit, STARTER_KIT_SLOTS } from './starterKit.js';
import { characterPower, equippedPower, nakedPower } from './power.js';
import { applyActiveSetBonuses, countEquippedSets, resolveSetId } from './sets.js';
import { createRng } from '../shared/rng.js';
import { droptableOf, itemLevelBandForChapter } from './catalog/rarity.js';
import { canWearEquipment, wearBlockedReason } from './wear.js';
import { rerollEquipmentLine } from './reroll.js';
import { applySeal, describeSealStamp, sealCondition, sealPrintBlockedReason } from './seal.js';
import { grantSampleEquipment } from './sample.js';
import { tryDisassemble } from './disassemble.js';
import { isItemWorn } from './loadout.js';
import { isItemUnseen, markItemSeen, migrateSeenItemIds } from './unseen.js';
import type { ConditionAffix, Equipment, EquipSlot } from '../shared/types.js';

function stubItem(partial: Partial<Equipment> & Pick<Equipment, 'id' | 'slot' | 'setId'>): Equipment {
  return {
    name: '测',
    rarity: 'rare',
    itemLevel: 1,
    baseStats: {},
    affixes: [],
    socketCount: 0,
    enhanceLevel: 0,
    ...partial,
  };
}

const cond = (over: Partial<ConditionAffix> = {}): ConditionAffix => ({
  defId: 'skill_power',
  name: '技能威力',
  value: 0.1,
  min: 0.08,
  max: 0.14,
  ...over,
});

describe('equipment sets', () => {
  it('aliases old demo set ids', () => {
    assert.equal(resolveSetId('set_demo_1'), 'set_pojun');
    assert.equal(resolveSetId('set_demo_2'), 'set_tiebi');
  });

  it('applies 2pc and 4pc bonuses', () => {
    const counts = countEquippedSets([
      'set_pojun',
      'set_pojun',
      'set_pojun',
      'set_pojun',
    ]);
    const bonus = sumEquipmentBonuses(createInitialPlayer(1));
    const beforeFinal = bonus.penRating;
    const beforeCrit = bonus.critRating;
    applyActiveSetBonuses(bonus, counts);
    assert.ok(bonus.penRating > beforeFinal);
    assert.ok(bonus.critRating > beforeCrit);
  });

  it('sumEquipmentBonuses includes set pieces from per-character equip', () => {
    let p = createInitialPlayer(1);
    const items: Equipment[] = [
      stubItem({ id: 'a', slot: 'weapon', setId: 'set_tiebi' }),
      stubItem({ id: 'b', slot: 'chest', setId: 'set_tiebi' }),
      stubItem({ id: 'c', slot: 'feet', setId: 'set_tiebi', affixes: [{ defId: 'hp', name: '生命', stat: 'maxHp', value: 10 }] }),
    ];
    p = {
      ...p,
      inventory: items,
      characterEquip: { hero: { weapon: 'a', chest: 'b', feet: 'c' } },
    };
    const bonus = sumEquipmentBonuses(p, 'hero');
    assert.ok(bonus.maxHp >= 28);
    assert.ok(bonus.def >= 4);
  });
});

describe('generateEquipment droptable', () => {
  it('produces valid Equipment', () => {
    const rng = createRng(42);
    const eq = generateEquipment(rng);
    assert.ok(eq.id);
    assert.ok(eq.slot);
    assert.ok(eq.rarity);
    assert.ok(eq.baseStats);
    assert.equal(eq.enhanceLevel, 0);
    assert.ok(eq.socketCount === 0 || eq.socketCount === 1);
    assert.ok(eq.itemLevel >= 1);
  });

  it('never duplicates random affix stats', () => {
    const rng = createRng(123);
    for (let i = 0; i < 50; i++) {
      const eq = generateEquipment(rng);
      const stats = eq.affixes.map((a) => a.stat);
      assert.equal(stats.length, new Set(stats).size, `Duplicate stats: ${JSON.stringify(stats)}`);
    }
  });

  it('always rolls life on the base and respects rarity layers', () => {
    const rng = createRng(7);
    const slots: EquipSlot[] = ['weapon', 'hands', 'neck', 'chest', 'offhand'];
    for (const slot of slots) {
      for (const rarity of ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const) {
        const eq = generateEquipment(rng, slot, { rarity, itemLevel: 12 });
        const table = droptableOf(rarity);
        assert.ok((eq.baseStats.maxHp ?? 0) > 0, `${slot} ${rarity} missing HP`);
        assert.equal(eq.affixes.length, table.guaranteedSubs + table.openRolls);
        if (rarity === 'common') {
          assert.equal(eq.conditions, undefined);
          assert.equal(eq.effectAffixId, undefined);
          assert.equal(eq.socketCount, 0);
        }
        if (rarity === 'rare') assert.equal(eq.effectAffixId, undefined);
        if (rarity === 'legendary') {
          assert.ok(eq.effectAffixId);
          assert.equal(eq.socketCount, 1);
          assert.ok((eq.conditions?.length ?? 0) >= 1);
        }
      }
    }
  });

  it('blue never rolls T3 across many samples', () => {
    const rng = createRng(99);
    for (let i = 0; i < 80; i++) {
      const eq = generateEquipment(rng, 'weapon', { rarity: 'rare' });
      assert.equal(eq.effectAffixId, undefined);
    }
  });
});

describe('wear / reroll / seal / disassemble', () => {
  it('gates wear by item level band', () => {
    const item = stubItem({ id: 'x', slot: 'weapon', setId: undefined, itemLevel: 45 });
    assert.equal(canWearEquipment(item, 0), false);
    assert.equal(canWearEquipment(item, 3), false);
    assert.equal(canWearEquipment(item, 4), true);
    assert.ok(wearBlockedReason(item, 0)?.includes('金丹'));
  });

  it('locks reroll to a single random line', () => {
    let p = createInitialPlayer(3);
    const item = generateEquipment(createRng(3), 'weapon', { rarity: 'epic', itemLevel: 1 });
    p = { ...p, inventory: [item], enhanceStones: 10 };
    const first = rerollEquipmentLine(p, item.id, 'random', 0);
    assert.equal(first.ok, true);
    p = first.state;
    const same = rerollEquipmentLine(p, item.id, 'random', 0);
    assert.equal(same.ok, true);
    const other = rerollEquipmentLine(same.state, item.id, 'random', 1);
    assert.equal(other.ok, false);
  });

  it('seal destroys source and prints onto a matching-tier target', () => {
    let p = createInitialPlayer(4);
    const source = stubItem({
      id: 'src',
      slot: 'weapon',
      setId: undefined,
      rarity: 'epic',
      itemLevel: 10,
      conditions: [cond()],
    });
    const target = stubItem({
      id: 'dst',
      slot: 'weapon',
      setId: undefined,
      rarity: 'epic',
      itemLevel: 12,
      conditions: [cond({ defId: 'basic_attack', name: '普攻伤害', value: 0.08 })],
    });
    p = { ...p, inventory: [source, target], enhanceStones: 20, gold: 5000 };
    const sealed = sealCondition(p, 'src', 0);
    assert.equal(sealed.ok, true);
    assert.equal(sealed.state.inventory.some((e) => e.id === 'src'), false);
    const printed = applySeal(sealed.state, 'dst', 0);
    assert.equal(printed.ok, true);
    assert.equal(printed.state.inventory.find((e) => e.id === 'dst')?.conditions?.[0]?.defId, 'skill_power');
    assert.equal(printed.state.sealStamp, undefined);
  });

  it('sealPrintBlockedReason explains slot and tier mismatch', () => {
    let p = createInitialPlayer(4);
    const source = stubItem({
      id: 'src',
      slot: 'weapon',
      setId: undefined,
      rarity: 'epic',
      itemLevel: 10,
      conditions: [cond()],
    });
    const armor = stubItem({
      id: 'helm',
      slot: 'head',
      setId: undefined,
      rarity: 'epic',
      itemLevel: 10,
      conditions: [cond({ defId: 'dmg_taken_reduce', name: '受伤害减少', value: 0.06 })],
    });
    p = { ...p, inventory: [source, armor], enhanceStones: 20, gold: 5000 };
    const sealed = sealCondition(p, 'src', 0);
    assert.ok(describeSealStamp(sealed.state.sealStamp!).includes('炼气'));
    assert.equal(sealPrintBlockedReason(sealed.state, armor), '槽位池不匹配');
  });

  it('blue disassemble guarantees reroll dust; gold drops a morph stone', () => {
    let p = createInitialPlayer(5);
    const blue = stubItem({ id: 'blue', slot: 'weapon', setId: undefined, rarity: 'rare' });
    const gold = stubItem({ id: 'gold', slot: 'weapon', setId: undefined, rarity: 'legendary' });
    p = { ...p, inventory: [blue, gold] };
    const d1 = tryDisassemble(p, 'blue');
    assert.equal(d1.ok, true);
    assert.equal(d1.reward?.dust, 1);
    const d2 = tryDisassemble(d1.state, 'gold');
    assert.equal(d2.ok, true);
    assert.ok(d2.reward?.morphStone);
    assert.ok((d2.state.morphStones?.length ?? 0) >= 1);
  });

  it('fx_disassemble on the acting character grants an extra stone', () => {
    let p = createInitialPlayer(6);
    const bone = stubItem({
      id: 'bone',
      slot: 'trinket1',
      setId: undefined,
      rarity: 'epic',
      effectAffixId: 'fx_disassemble',
    });
    const junk = stubItem({ id: 'junk', slot: 'weapon', setId: undefined, rarity: 'common' });
    p = {
      ...p,
      inventory: [bone, junk],
      characterEquip: { hero: { trinket1: 'bone' } },
    };
    const without = tryDisassemble(p, 'junk');
    const withBone = tryDisassemble(p, 'junk', 'hero');
    assert.equal(without.ok, true);
    assert.equal(withBone.ok, true);
    assert.equal((withBone.reward?.stones ?? 0) - (without.reward?.stones ?? 0), 1);
  });

  it('leftover shared equipped does not count as worn', () => {
    let p = createInitialPlayer(7);
    const ghost = stubItem({ id: 'ghost', slot: 'weapon', setId: undefined, rarity: 'common' });
    p = { ...p, inventory: [ghost], equipped: { weapon: 'ghost' } };
    assert.equal(isItemWorn(p, 'ghost'), false);
    const d = tryDisassemble(p, 'ghost');
    assert.equal(d.ok, true);
  });

  it('equipItem writes characterEquip only', () => {
    let p = createInitialPlayer(9);
    const item = stubItem({ id: 'w', slot: 'weapon', setId: undefined, itemLevel: 1 });
    p = { ...p, inventory: [item], equipped: {} };
    const next = equipItem(p, 'w', 'hero');
    assert.equal(next.characterEquip?.hero?.weapon, 'w');
    assert.deepEqual(next.equipped, {});
  });

  it('equipItem refuses items above the character wear tier', () => {
    let p = createInitialPlayer(8);
    const item = stubItem({ id: 'high', slot: 'weapon', setId: undefined, itemLevel: 90 });
    p = { ...p, inventory: [item] };
    const next = equipItem(p, 'high', 'hero');
    assert.equal(next.characterEquip?.hero?.weapon, undefined);
  });

  it('previewLoadout shows atk gain without writing the loadout', () => {
    let p = createInitialPlayer(12);
    const weak = stubItem({
      id: 'w1',
      slot: 'weapon',
      setId: undefined,
      baseStats: { atk: 2, maxHp: 8 },
    });
    const strong = stubItem({
      id: 'w2',
      slot: 'weapon',
      setId: undefined,
      baseStats: { atk: 40, maxHp: 80 },
    });
    p = {
      ...p,
      inventory: [weak, strong],
      characterEquip: { hero: { weapon: 'w1' } },
    };
    const before = sumEquipmentBonuses(p, 'hero').atk;
    const preview = previewLoadout(p, 'hero', { weapon: 'w2' });
    assert.ok(sumEquipmentBonuses(preview, 'hero').atk > before);
    assert.equal(p.characterEquip?.hero?.weapon, 'w1');
  });

  it('autoEquipBest wears the highest-power wearable piece per slot', () => {
    let p = createInitialPlayer(9);
    const weak = stubItem({
      id: 'w1',
      slot: 'weapon',
      setId: undefined,
      rarity: 'common',
      itemLevel: 1,
      baseStats: { atk: 1, maxHp: 8 },
    });
    const strong = stubItem({
      id: 'w2',
      slot: 'weapon',
      setId: undefined,
      rarity: 'legendary',
      itemLevel: 8,
      baseStats: { atk: 40, maxHp: 80 },
      effectAffixId: 'fx_crit_bleed',
    });
    const blocked = stubItem({
      id: 'w3',
      slot: 'weapon',
      setId: undefined,
      rarity: 'legendary',
      itemLevel: 90,
      baseStats: { atk: 400, maxHp: 800 },
    });
    p = { ...p, inventory: [weak, strong, blocked] };
    const first = autoEquipBest(p, 'hero');
    assert.equal(first.state.characterEquip?.hero?.weapon, 'w2');
    assert.equal(first.changed, 1);
    const again = autoEquipBest(first.state, 'hero');
    assert.equal(again.changed, 0);
  });

  it('autoEquipBest does not steal another character\'s gear', () => {
    let p = createInitialPlayer(10);
    const weak = stubItem({
      id: 'w1',
      slot: 'weapon',
      setId: undefined,
      baseStats: { atk: 1, maxHp: 8 },
    });
    const strong = stubItem({
      id: 'w2',
      slot: 'weapon',
      setId: undefined,
      baseStats: { atk: 40, maxHp: 80 },
    });
    p = {
      ...p,
      inventory: [weak, strong],
      characterEquip: { zhaoyun: { weapon: 'w2' } },
    };
    const r = autoEquipBest(p, 'hero');
    assert.equal(r.state.characterEquip?.hero?.weapon, 'w1');
    assert.equal(r.state.characterEquip?.zhaoyun?.weapon, 'w2');
  });

  it('itemsForSlot excludes gear worn by other characters', () => {
    let p = createInitialPlayer(99);
    const mine = stubItem({ id: 'w_mine', slot: 'weapon', setId: undefined, baseStats: { atk: 1 } });
    const theirs = stubItem({ id: 'w_theirs', slot: 'weapon', setId: undefined, baseStats: { atk: 2 } });
    p = { ...p, inventory: [...p.inventory, mine, theirs] };
    p = equipItem(p, 'w_theirs', 'zhaoyun');
    assert.equal(p.characterEquip?.zhaoyun?.weapon, 'w_theirs');
    const heroOnly = itemsForSlot(p, 'weapon', 'hero');
    assert.ok(heroOnly.some((e) => e.id === 'w_mine'));
    assert.equal(heroOnly.some((e) => e.id === 'w_theirs'), false);
    assert.equal(equipItem(p, 'w_theirs', 'hero'), p);
  });

  it('wearLoot refuses gear worn by another character', () => {
    let p = createInitialPlayer(12);
    const w = stubItem({ id: 'w_shared', slot: 'weapon', setId: undefined, baseStats: { atk: 3 } });
    p = { ...p, inventory: [...p.inventory, w] };
    p = equipItem(p, 'w_shared', 'zhaoyun');
    const r = wearLoot(p, 'w_shared');
    assert.equal(r.ok, false);
    assert.match(r.message ?? '', /其他角色/);
  });

  it('grantStarterEquipmentKit equips six slots per deployed member', () => {
    const p = grantStarterEquipmentKit(createInitialPlayer(7));
    const deployed = Object.keys(p.formation);
    assert.ok(deployed.includes('hero'));
    assert.equal(deployed.length, 2);
    for (const charId of deployed) {
      for (const slot of STARTER_KIT_SLOTS) {
        assert.equal(p.characterEquip?.[charId]?.[slot], `kit_${charId}_${slot}`);
      }
    }
  });

  it('grantSampleEquipment drops one of each rarity', () => {
    const p = grantSampleEquipment(createInitialPlayer(11));
    const rarities = new Set(p.inventory.map((e) => e.rarity));
    assert.ok(rarities.has('common'));
    assert.ok(rarities.has('uncommon'));
    assert.ok(rarities.has('rare'));
    assert.ok(rarities.has('epic'));
    assert.ok(rarities.has('legendary'));
    assert.equal(grantSampleEquipment(p).inventory.length, p.inventory.length);
    assert.ok(p.inventory.every((e) => isItemUnseen(p, e.id)));
    const seen = markItemSeen(p, p.inventory[0]!.id);
    assert.equal(isItemUnseen(seen, p.inventory[0]!.id), false);
    assert.equal(isItemUnseen(seen, p.inventory[1]!.id), true);
    const migrated = migrateSeenItemIds({
      unseenItemIds: [p.inventory[0]!.id],
      inventory: p.inventory,
    });
    assert.ok(migrated?.includes(p.inventory[1]!.id));
    assert.equal(migrated?.includes(p.inventory[0]!.id), false);
  });
});

describe('characterPower', () => {
  it('counts naked panel when nothing is worn', () => {
    const p = createInitialPlayer(1);
    assert.equal(equippedPower(p, 'hero'), 0);
    assert.ok(nakedPower(p, 'hero') > 0);
    assert.equal(characterPower(p, 'hero'), nakedPower(p, 'hero'));
  });

  it('adds gear on top of naked panel', () => {
    let p = createInitialPlayer(1);
    const item = stubItem({
      id: 'w',
      slot: 'weapon',
      setId: undefined,
      baseStats: { atk: 20, maxHp: 40 },
    });
    const before = characterPower(p, 'hero');
    p = { ...p, inventory: [item], characterEquip: { hero: { weapon: 'w' } } };
    const after = characterPower(p, 'hero');
    assert.ok(after > before);
    assert.equal(after, nakedPower(p, 'hero') + equippedPower(p, 'hero'));
  });

  it('rises when the character levels', () => {
    const p = createInitialPlayer(1);
    const low = characterPower(p, 'hero');
    const high = characterPower(
      {
        ...p,
        roster: {
          ...p.roster,
          hero: { ...p.roster.hero!, level: 10, exp: 0 },
        },
      },
      'hero',
    );
    assert.ok(high > low);
  });
});

describe('itemLevelBandForChapter', () => {
  it('covers six chapters and stays within wear-tier 100', () => {
    assert.deepEqual(itemLevelBandForChapter(0), { min: 1, max: 20 });
    assert.deepEqual(itemLevelBandForChapter(3), { min: 61, max: 80 });
    assert.deepEqual(itemLevelBandForChapter(4), { min: 81, max: 92 });
    assert.deepEqual(itemLevelBandForChapter(5), { min: 93, max: 100 });
    assert.deepEqual(itemLevelBandForChapter(99), { min: 93, max: 100 });
  });
});
