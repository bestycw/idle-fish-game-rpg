import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { defaultProgress } from '../character/growth.js';
import { getTemplate } from '../character/templates.js';
import { createBattle, runAutoBattle } from '../combat/combat.js';
import { buildPlayerParty, DEFAULT_DEPLOYED_IDS } from '../formation/formation.js';
import { createInitialPlayer } from '../save/player.js';
import type { CharacterProgress, PlayerState } from '../shared/types.js';
import { ENCOUNTERS } from './encounters.js';

function encIndex(id: string): number {
  const i = ENCOUNTERS.findIndex((e) => e.id === id);
  assert.ok(i >= 0, `missing ${id}`);
  return i;
}

function withRoster(state: PlayerState, ids: string[], patch: Partial<CharacterProgress>): PlayerState {
  const roster = { ...state.roster };
  for (const id of ids) {
    if (!getTemplate(id)) continue;
    const cur = roster[id] ?? defaultProgress(id);
    roster[id] = { ...cur, owned: true, ...patch };
  }
  return { ...state, roster };
}

function partyOf(state: PlayerState, ids: string[]) {
  const formation: PlayerState['formation'] = {};
  for (const id of ids.slice(0, 5)) {
    const t = getTemplate(id);
    if (t) formation[id] = t.preferredSlot;
  }
  return buildPlayerParty({ ...state, formation });
}

function winRate(
  ids: string[],
  encId: string,
  seeds: number,
  pressure = 1,
  patch: Partial<CharacterProgress> = { level: 8, star: 2 },
): number {
  const state = withRoster(createInitialPlayer(7), ids, patch);
  const idx = encIndex(encId);
  let w = 0;
  for (let i = 0; i < seeds; i += 1) {
    let battle = createBattle(partyOf(state, ids), 1100 + i * 19 + idx * 41, idx, { pressure });
    battle = runAutoBattle(battle, 1100 + i * 19, 200);
    if (battle.status === 'won') w += 1;
  }
  return w / seeds;
}

describe('encounter recipes', () => {
  it('keeps 8 recipe ids; wall no longer double-exams heal_block', () => {
    for (const e of ENCOUNTERS) {
      assert.ok(e.prepHint && e.prepHint.length >= 8, `${e.id} missing prepHint`);
    }

    const ids = ENCOUNTERS.map((e) => e.id);
    for (const id of [
      'wall',
      'archers',
      'raiders',
      'spirit_wall',
      'chaos_rite',
      'boss_warden',
      'oil_cask',
      'shield_stack',
    ]) {
      assert.ok(ids.includes(id), id);
    }
    const wall = ENCOUNTERS.find((e) => e.id === 'wall')!;
    assert.equal(wall.enemies.some((e) => e.skillId === 'mob_heal_block'), false);
    const oil = ENCOUNTERS.find((e) => e.id === 'oil_cask')!;
    assert.equal(oil.enemies.filter((e) => e.skillId === 'mob_mend').length, 2);
    const shields = ENCOUNTERS.find((e) => e.id === 'shield_stack')!;
    assert.equal(shields.enemies.filter((e) => e.skillId === 'mob_stack_shield').length, 3);
    assert.ok(shields.enemies.every((e) => (e.startShield ?? 0) > 0));
    const spirit = ENCOUNTERS.find((e) => e.id === 'spirit_wall')!;
    assert.ok(spirit.enemies.some((e) => e.skillId === 'mob_spirit_bolt'));
  });

  it('defeat hints name the recipe verb', () => {
    const state = createInitialPlayer(3);
    const party = buildPlayerParty(state).map((u) => ({
      ...u,
      atk: 1,
      maxHp: 8,
      hp: 8,
      def: 1,
      res: 1,
    }));
    for (const [id, re] of [
      ['oil_cask', /禁疗|斩杀|医士/],
      ['shield_stack', /对盾|叠盾/],
      ['archers', /后排|穿透|点爆/],
      ['spirit_wall', /物防|破甲|灵伤/],
    ] as const) {
      let battle = createBattle(party, 3, encIndex(id));
      battle = runAutoBattle(battle, 3);
      if (battle.status === 'lost') {
        assert.match(battle.defeatHint ?? '', re, id);
      }
    }
  });

  it('eight recipes reward the matching verb', () => {
    const seeds = 20;
    const core = ['hero', 'zhangfei', 'huatuo'] as const;
    const glass = ['hero', 'baigujing', 'daji', 'xishi', 'diaochan'] as const;
    const rows: [string, number, number, number][] = [
      [
        'oil_cask',
        winRate([...core, 'wukong', 'dianwei'], 'oil_cask', seeds),
        winRate([...core, 'zhaoyun', 'xishi'], 'oil_cask', seeds),
        0.2,
      ],
      [
        'shield_stack',
        winRate([...core, 'wukong', 'dianwei'], 'shield_stack', seeds),
        winRate([...core, 'zhaoyun', 'yangjian'], 'shield_stack', seeds),
        0.2,
      ],
      [
        'archers p1.55',
        winRate([...core, 'wukong', 'dianwei'], 'archers', seeds, 1.55),
        winRate([...core, 'zhaoyun', 'houyi'], 'archers', seeds, 1.55),
        0.2,
      ],
      [
        'raiders p1.55',
        winRate([...glass], 'raiders', seeds, 1.55),
        winRate([...core, 'dianwei', 'zhaoyun'], 'raiders', seeds, 1.55),
        0.2,
      ],
      [
        'wall p1.3',
        winRate([...core, 'wukong', 'dianwei'], 'wall', seeds, 1.3),
        winRate([...core, 'sunbin', 'zhaoyun'], 'wall', seeds, 1.3),
        0.2,
      ],
      [
        'spirit_wall p1.3',
        winRate([...core, 'wukong', 'dianwei'], 'spirit_wall', seeds, 1.3),
        winRate([...core, 'sunbin', 'zhaoyun'], 'spirit_wall', seeds, 1.3),
        0.2,
      ],
      [
        'chaos_rite p1.3',
        winRate([...glass], 'chaos_rite', seeds, 1.3),
        winRate([...core, 'zhaoyun', 'zhuge'], 'chaos_rite', seeds, 1.3),
        0.2,
      ],
      [
        'boss_warden p1.3',
        winRate([...glass], 'boss_warden', seeds, 1.3),
        winRate([...core, 'sunbin', 'zhaoyun'], 'boss_warden', seeds, 1.3),
        0.2,
      ],
    ];
    const failed = rows
      .filter(([, w, r, d]) => r < w + d)
      .map(([n, w, r, d]) => `${n}: ${w.toFixed(2)} → ${r.toFixed(2)} (Δ≥${d})`);
    assert.equal(failed.length, 0, failed.join(' | ') + ' || ' + rows.map(([n, w, r]) => `${n} ${w.toFixed(2)}→${r.toFixed(2)}`).join('; '));
  });

  it('starter hunt stays beatable with default pierce/tank', () => {
    const seeds = 20;
    const ids = [...DEFAULT_DEPLOYED_IDS];
    const patch = { level: 1, star: 0 };
    const wall = winRate(ids, 'wall', seeds, 1, patch);
    const archers = winRate(ids, 'archers', seeds, 1, patch);
    const raiders = winRate(ids, 'raiders', seeds, 1, patch);
    assert.ok(wall >= 0.4, `starter wall ${wall}`);
    assert.ok(archers >= 0.3, `starter archers ${archers}`);
    assert.ok(raiders >= 0.35, `starter raiders ${raiders}`);
  });
});
