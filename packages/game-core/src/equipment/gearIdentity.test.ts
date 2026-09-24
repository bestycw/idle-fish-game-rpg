import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { defaultProgress } from '../character/growth.js';
import { getTemplate } from '../character/templates.js';
import { createBattle, runAutoBattle } from '../combat/combat.js';
import { ENCOUNTERS } from '../dungeon/encounters.js';
import { buildPlayerParty } from '../formation/formation.js';
import { createInitialPlayer } from '../save/player.js';
import type { ConditionId, Equipment, PlayerState } from '../shared/types.js';
import { equipItem } from './equipment.js';
import { listEquipmentSkillModifiers } from './morphs.js';

const PARTY = ['hero', 'zhangfei', 'huatuo', 'zhaoyun', 'wukong'] as const;

function encIndex(id: string): number {
  const i = ENCOUNTERS.findIndex((e) => e.id === id);
  assert.ok(i >= 0, id);
  return i;
}

function stubItem(partial: Partial<Equipment> & Pick<Equipment, 'id' | 'slot'>): Equipment {
  return {
    name: '测装',
    rarity: 'epic',
    itemLevel: 1,
    baseStats: {},
    affixes: [],
    socketCount: 0,
    enhanceLevel: 0,
    ...partial,
  };
}

function midRoster(ids: readonly string[]): PlayerState {
  let state = createInitialPlayer(7);
  const roster = { ...state.roster };
  for (const id of ids) {
    if (!getTemplate(id)) continue;
    roster[id] = { ...defaultProgress(id), ...(roster[id] ?? {}), owned: true, level: 8, star: 2 };
  }
  const formation: PlayerState['formation'] = {};
  for (const id of ids.slice(0, 5)) {
    const t = getTemplate(id);
    if (t) formation[id] = t.preferredSlot;
  }
  return { ...state, roster, formation };
}

function dressWeapons(
  state: PlayerState,
  ids: readonly string[],
  patch: Pick<Equipment, 'effectAffixId'> | { condition: ConditionId; value: number },
): PlayerState {
  const inventory = [...(state.inventory ?? [])];
  let next = { ...state, inventory };
  let n = 0;
  for (const tid of ids) {
    n += 1;
    const item = stubItem({
      id: `w_${tid}_${n}`,
      slot: 'weapon',
      ...('condition' in patch
        ? {
            conditions: [
              {
                defId: patch.condition,
                name: patch.condition,
                value: patch.value,
                min: patch.value,
                max: patch.value,
              },
            ],
          }
        : { effectAffixId: patch.effectAffixId }),
    });
    inventory.push(item);
    next = { ...next, inventory };
    next = equipItem(next, item.id, tid);
  }
  return next;
}

function dressMorph(state: PlayerState, ids: readonly string[], morphId: string): PlayerState {
  const morphs = { ...(state.characterMorphs ?? {}) };
  for (const id of ids) morphs[id] = morphId;
  return { ...state, characterMorphs: morphs, morphStones: [...(state.morphStones ?? []), ...ids.map(() => morphId)] };
}

function winRate(state: PlayerState, encId: string, seeds: number, pressure: number): number {
  const idx = encIndex(encId);
  let w = 0;
  for (let i = 0; i < seeds; i += 1) {
    let battle = createBattle(buildPlayerParty(state), 2100 + i * 23 + idx * 37, idx, { pressure });
    battle = runAutoBattle(battle, 2100 + i * 23, 200);
    if (battle.status === 'won') w += 1;
  }
  return w / seeds;
}

describe('gear identity', () => {
  it('morph_shield_break lands vs_shield on the composed skill', () => {
    const state = dressMorph(midRoster(PARTY), ['zhaoyun'], 'morph_shield_break');
    const mods = listEquipmentSkillModifiers(state, 'zhaoyun');
    assert.ok(mods[0]?.effectPatches?.some((e) => e.kind === 'vs_shield'));
    const zy = buildPlayerParty(state).find((u) => u.templateId === 'zhaoyun');
    assert.ok(zy?.skill.effects?.some((e) => e.kind === 'vs_shield'));
  });

  it('same party, only T3: matching verb beats the mismatch', () => {
    const seeds = 20;
    const base = midRoster(PARTY);
    const rows: [string, number, number][] = [
      [
        'shield purge T3',
        winRate(dressWeapons(base, PARTY, { effectAffixId: 'fx_start_shield' }), 'shield_stack', seeds, 1),
        winRate(dressWeapons(base, PARTY, { effectAffixId: 'fx_purge_hit' }), 'shield_stack', seeds, 1),
      ],
      [
        'spirit shred T3',
        winRate(dressWeapons(base, PARTY, { effectAffixId: 'fx_start_shield' }), 'spirit_wall', seeds, 1.3),
        winRate(dressWeapons(base, PARTY, { effectAffixId: 'fx_skill_shred' }), 'spirit_wall', seeds, 1.3),
      ],
    ];
    const failed = rows
      .filter(([, w, r]) => r < w + 0.12)
      .map(([n, w, r]) => `${n}: ${w.toFixed(2)}→${r.toFixed(2)}`);
    assert.equal(
      failed.length,
      0,
      failed.join(' | ') +
        ' || ' +
        rows.map(([n, w, r]) => `${n} ${w.toFixed(2)}→${r.toFixed(2)}`).join('; '),
    );
  });
});
