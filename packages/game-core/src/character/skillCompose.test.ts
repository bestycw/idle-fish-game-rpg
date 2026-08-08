import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createInitialPlayer } from '../save/player.js';
import { withMorph } from '../equipment/morphs.js';
import { assertAllCharacterBundlesOrThrow } from './characterBundle.js';
import {
  composeSkill,
  listSkillModifiers,
  skillDiffLines,
  skillWithGrowth,
} from './growth.js';
import { getSkill } from './skills.js';
import { getTemplate } from './templates.js';
import { buildPlayerParty } from '../formation/formation.js';
import { skillDisplayFor, statusText } from './growthHelpers.js';

describe('skill compose foundation', () => {
  it('skillWithGrowth matches compose path for zhaoyun ★3 follow-up', () => {
    const tpl = getTemplate('zhaoyun')!;
    const progress = {
      templateId: 'zhaoyun',
      level: 1,
      exp: 0,
      breakthroughTier: 0,
      star: 3,
      owned: true,
      cardShards: 0,
      starBranch: { 3: 'rush' },
    };
    const skill = skillWithGrowth(tpl, progress);
    assert.ok(skill.followUp);
    assert.ok(skill.followUp!.chance >= 0.3);
    assert.equal(skill.applyStatus[0]?.statusId, 'bleed');
  });

  it('zhaoyun ★6 unlocks execute + kill refund (hunt branch)', () => {
    const tpl = getTemplate('zhaoyun')!;
    const progress = {
      templateId: 'zhaoyun',
      level: 1,
      exp: 0,
      breakthroughTier: 0,
      star: 6,
      owned: true,
      cardShards: 0,
      starBranch: { 3: 'rush', 6: 'hunt' },
    };
    const skill = skillWithGrowth(tpl, progress);
    assert.ok(skill.applyStatus.some((s) => s.statusId === 'bleed'));
    assert.ok(skill.effects?.some((e) => e.kind === 'execute'));
    assert.ok(skill.effects?.some((e) => e.kind === 'refund_qi_on_kill'));
    const base = getSkill(tpl.skillId);
    const diffs = skillDiffLines(base, skill);
    assert.ok(diffs.length > 0);
  });

  it('effectPatches can append purge via compose', () => {
    const base = getSkill('skill_zhaoyun_longdan');
    const next = composeSkill(base, [
      {
        source: 'star',
        label: 'test',
        effectPatches: [{ kind: 'purge' }],
        statusPatches: [{ statusId: 'slow', duration: 1 }],
      },
    ]);
    assert.ok(next.effects?.some((e) => e.kind === 'purge'));
    assert.ok(next.applyStatus.some((s) => s.statusId === 'slow'));
  });

  it('assertAllCharacterBundles passes for 24 cards', () => {
    assert.doesNotThrow(() => assertAllCharacterBundlesOrThrow());
  });

  it('equipment morph changes composed skill on party', () => {
    let state = createInitialPlayer(42);
    const blade = withMorph({
      id: 'eq_morph_test',
      name: '血刃试作',
      slot: 'mainHand',
      rarity: 'epic',
      affixes: [],
    });
    state = {
      ...state,
      inventory: [...state.inventory, blade],
      equipped: { ...state.equipped, mainHand: blade.id },
    };
    const party = buildPlayerParty(state);
    const zy = party.find((u) => u.templateId === 'zhaoyun');
    assert.ok(zy);
    assert.ok(zy!.skill.applyStatus.some((s) => s.statusId === 'bleed'));
    assert.ok(zy!.skill.multiplier > getSkill('skill_zhaoyun_longdan').multiplier);

    const mods = listSkillModifiers(getTemplate('zhaoyun')!, state.roster.zhaoyun!, {
      extraModifiers: [
        {
          source: 'equipment',
          morphId: 'morph_bleed_edge',
          multiplierDelta: 0.05,
          statusPatches: [{ statusId: 'bleed', duration: 2, layers: 1 }],
        },
      ],
    });
    assert.ok(mods.some((m) => m.source === 'equipment'));
  });

  it('skillDisplayFor exposes next-star skill diff', () => {
    const state = createInitialPlayer(7);
    const next = {
      ...state,
      roster: {
        ...state.roster,
        zhaoyun: { ...state.roster.zhaoyun!, star: 5, owned: true },
      },
    };
    const info = skillDisplayFor('zhaoyun', next);
    assert.ok(info);
    assert.ok(info!.nextStarDiffLine || info!.growthModLine);
  });

  it('skillDisplayFor: setup has no必中 tag; swing CC uses lower landBase', () => {
    const state = createInitialPlayer(8);
    const info = skillDisplayFor('zhangfei', state);
    assert.ok(info);
    assert.match(info!.coeffLine, /^伤害 = 力系×/);
    assert.match(info!.statusLine, /附加眩晕/);
    assert.match(info!.statusLine, /命中率40%/); // stun landBase 0.4
    assert.doesNotMatch(info!.statusLine, /必中/);
    const shred = statusText(
      { applyStatus: [{ statusId: 'shred', duration: 2, value: 0.82 }] },
      { role: 'flex', masteryRating: 0 },
    );
    assert.equal(shred, '附加破甲2回（防御×82%）');
    const havoc = statusText(
      { applyStatus: [{ statusId: 'havoc', duration: 1 }] },
      { role: 'flex', masteryRating: 0 },
    );
    assert.match(havoc, /附加混乱1回 · 命中率25%/);
  });
});
