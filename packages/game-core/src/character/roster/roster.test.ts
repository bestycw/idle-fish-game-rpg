import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { assertAllCharacterBundlesOrThrow } from '../characterBundle.js';
import {
  CORE_TEMPLATES,
  DEEP_TEMPLATE_IDS,
  STUB_CORE_IDS,
  UNIT_TEMPLATES,
} from '../templates.js';
import { DEEP_SKILL_OVERRIDES } from '../deepKits.js';
import { getSkill } from '../skills.js';
import { STAR_OVERRIDES, isBranchStar, listIdentityTracks } from '../starTracks.js';
import { skillWithGrowth } from '../growth.js';
import { listStarTrackRows } from '../growthHelpers.js';
import { EXPAND_ROSTER, HAND_TEMPLATE_IDS } from './expandRoster.js';
import { ZHONGTU_ROSTER } from './zhongtuRoster.js';
import { characterIntro } from '../intros.js';
import { makePlaceholderSkill, ROLE_PLACEHOLDER_SKILLS } from './placeholderSkills.js';
import { skillFingerprint } from './kitCompose.js';
import { REMOVED_FOREIGN_IDS } from '../../save/zhongtuMigrate.js';
import { migrateZhongtuV16 } from '../../save/zhongtuMigrate.js';
import { createInitialPlayer } from '../../save/player.js';
import { defaultProgress } from '../growth.js';

describe('zhongtu roster 200', () => {
  it('has 200 unique templates (hand core + expand)', () => {
    assert.equal(ZHONGTU_ROSTER.length, 200);
    assert.equal(CORE_TEMPLATES.length, HAND_TEMPLATE_IDS.length);
    assert.equal(EXPAND_ROSTER.length, 200 - HAND_TEMPLATE_IDS.length);
    assert.equal(UNIT_TEMPLATES.length, 200);
    const ids = new Set(UNIT_TEMPLATES.map((t) => t.id));
    assert.equal(ids.size, 200);
    assert.equal(ZHONGTU_ROSTER.filter((e) => e.rarity === 'legendary').length, 81);
    assert.equal(ZHONGTU_ROSTER.filter((e) => e.rarity === 'epic').length, 45);
    assert.equal(ZHONGTU_ROSTER.filter((e) => e.rarity === 'rare').length, 44);
    assert.equal(ZHONGTU_ROSTER.filter((e) => e.rarity === 'common').length, 30);
  });

  it('drops western ids', () => {
    const ids = new Set(UNIT_TEMPLATES.map((t) => t.id));
    for (const id of REMOVED_FOREIGN_IDS) {
      assert.equal(ids.has(id), false, `foreign still in pool: ${id}`);
    }
  });

  it('maps heracles progress onto xingtian', () => {
    const base = createInitialPlayer(1);
    const heracles = {
      ...defaultProgress('heracles'),
      owned: true,
      star: 2,
      level: 8,
      cardShards: 0,
    };
    const migrated = migrateZhongtuV16({
      ...base,
      roster: { ...base.roster, heracles },
      formation: { ...base.formation, heracles: 3 },
    });
    assert.equal(migrated.roster.heracles, undefined);
    assert.equal(migrated.roster.xingtian?.owned, true);
    assert.equal(migrated.roster.xingtian?.star, 2);
    assert.equal(migrated.formation.heracles, undefined);
    assert.ok(migrated.formation.xingtian != null);
  });

  it('deep kits keep personal star tracks; stub list is empty', () => {
    assert.equal(DEEP_TEMPLATE_IDS.length, 27);
    assert.equal(STUB_CORE_IDS.length, 0);
    for (const id of DEEP_TEMPLATE_IDS) {
      assert.ok(STAR_OVERRIDES[id], `missing deep track ${id}`);
      assert.equal(Object.keys(STAR_OVERRIDES[id]!).length, 6);
      const n3 = STAR_OVERRIDES[id]![3];
      const n6 = STAR_OVERRIDES[id]![6];
      assert.ok((n3?.branches?.length ?? 0) >= 2, `missing ★3 fork ${id}`);
      assert.ok((n6?.branches?.length ?? 0) >= 2, `missing ★6 fork ${id}`);
    }
  });

  it('deep skill overrides merge; everyone has a unique skill id/name', () => {
    for (const id of DEEP_TEMPLATE_IDS) {
      const t = UNIT_TEMPLATES.find((u) => u.id === id)!;
      const patch = DEEP_SKILL_OVERRIDES[t.skillId];
      assert.ok(patch, `missing deep skill override ${t.skillId}`);
      assert.ok(patch.blurb && patch.blurb.length > 4, `missing blurb ${id}`);
    }
    const names = new Set<string>();
    const skillIds = new Set<string>();
    for (const t of UNIT_TEMPLATES) {
      assert.ok(!skillIds.has(t.skillId), `dup skillId ${t.skillId}`);
      skillIds.add(t.skillId);
      const live = getSkill(t.skillId);
      assert.ok(live.name.length >= 2, `short name ${t.id}`);
      assert.ok(!names.has(live.name), `dup skill name ${live.name}`);
      names.add(live.name);
    }
    assert.equal(getSkill('skill_wukong_sweep').targetPattern, 'cross');
    assert.equal(getSkill('skill_zhouyu').targetPattern, 'row_front');
    const trap = getSkill('skill_sunbin_jianzao');
    assert.ok(trap.applyStatus.some((s) => s.statusId === 'shred'));
    for (const t of UNIT_TEMPLATES) {
      const live = getSkill(t.skillId);
      assert.ok(live.blurb && live.blurb.length >= 6, `empty blurb ${t.id}`);
      assert.equal(live.blurb.includes('本事'), false, `placeholder blurb ${t.id}: ${live.blurb}`);
    }
  });

  it('凡/良 skills are not role-placeholder clones; shred only 孙膑/公输班', () => {
    const allowedShred = new Set(['sunbin', 'gongshuban']);
    for (const t of UNIT_TEMPLATES) {
      const live = getSkill(t.skillId);
      const hasShred = live.applyStatus.some((s) => s.statusId === 'shred');
      if (hasShred) {
        assert.ok(allowedShred.has(t.id), `unexpected shred on ${t.id}`);
      }
      if (t.rarity === 'common' || t.rarity === 'rare') {
        const ph = makePlaceholderSkill('ph', 'ph', t.role);
        assert.notEqual(
          skillFingerprint(live),
          skillFingerprint({
            targetPattern: ph.targetPattern,
            multiplier: ph.multiplier,
            applyStatus: ph.applyStatus,
            effects: ph.effects,
            focusPolicy: ph.focusPolicy,
          }),
          `placeholder clone ${t.id}`,
        );
      }
    }
    assert.ok(ROLE_PLACEHOLDER_SKILLS.tank);
  });

  it('every template has a short intro', () => {
    for (const t of UNIT_TEMPLATES) {
      const line = characterIntro(t.id);
      assert.ok(line.length >= 6, `missing intro ${t.id}`);
    }
    assert.ok(characterIntro('wukong').includes('齐天'));
    assert.ok(characterIntro('zhouyu').includes('赤壁'));
  });

  it('all character bundles resolve', () => {
    assertAllCharacterBundlesOrThrow();
  });

  it('hard-control deep skills sit in coeff band ≥1.05', () => {
    const hardCtrl = [
      'skill_zhangfei_roar',
      'skill_xishi_chenyu',
      'skill_baigujing_huagu',
      'skill_daji_charm',
      'skill_tieshan',
    ];
    for (const id of hardCtrl) {
      assert.ok(getSkill(id).multiplier >= 1.05, `${id} below hard-ctrl floor`);
    }
    assert.ok(getSkill('skill_zhuge_qimen').multiplier >= 0.9);
  });

  it('knife2 batch1 kits match identity gates', () => {
    const liubei = getSkill('skill_liubei');
    assert.equal(liubei.name, '桃园结义');
    assert.equal(liubei.targetPattern, 'all');
    assert.ok(liubei.tags.includes('heal'));
    assert.equal(
      liubei.applyStatus.some((s) => s.statusId === 'shred'),
      false,
    );
    assert.equal(
      (liubei.effects ?? []).some((e) => e.kind === 'cleanse' || e.kind === 'team_shield'),
      false,
    );

    const pangtong = getSkill('skill_pangtong');
    assert.equal(pangtong.name, '落凤坡');
    assert.equal(
      pangtong.applyStatus.some((s) => s.statusId === 'shred' || s.statusId === 'qi_drought'),
      false,
    );
    assert.ok(pangtong.applyStatus.some((s) => s.statusId === 'slow'));

    const niu = getSkill('skill_niumowang');
    assert.equal(niu.name, '混世魔王');
    assert.ok(niu.applyStatus.some((s) => s.statusId === 'taunt'));
    assert.equal(niu.applyStatus.some((s) => s.statusId === 'stun'), false);

    const tang = getSkill('skill_tangseng');
    assert.equal(tang.name, '紧箍咒');
    assert.ok(tang.tags.includes('heal'));
    assert.equal(
      (tang.effects ?? []).some((e) => e.kind === 'team_shield'),
      false,
    );
    const tangStatuses = [
      ...tang.applyStatus.map((s) => s.statusId),
      ...STAR_OVERRIDES.tangseng![3]!.branches!.flatMap((b) =>
        b.effects.flatMap((fx) => (fx.kind === 'status_unlock' ? [fx.status.statusId] : [])),
      ),
      ...STAR_OVERRIDES.tangseng![6]!.branches!.flatMap((b) =>
        b.effects.flatMap((fx) => (fx.kind === 'status_unlock' ? [fx.status.statusId] : [])),
      ),
    ];
    for (const id of ['silence', 'stun', 'heal_block']) {
      assert.equal(tangStatuses.includes(id), false, `tang seng leaked ${id}`);
    }

    const fan = getSkill('skill_tieshan');
    assert.equal(fan.name, '芭蕉扇');
    assert.ok(fan.applyStatus.some((s) => s.statusId === 'silence'));
    assert.equal(fan.applyStatus.some((s) => s.statusId === 'havoc'), false);
    assert.ok(fan.multiplier >= 1.05);
  });

  it('identity pick at ★3 locks ★6; paths do not mix', () => {
    assert.equal(isBranchStar('liubei', 3), true);
    assert.equal(isBranchStar('liubei', 6), false);
    assert.equal(isBranchStar('zhaoyun', 6), false);
    const tracks = listIdentityTracks('liubei');
    assert.equal(tracks.length, 2);
    const heal = tracks.find((t) => t.id === 'heal')!;
    const ward = tracks.find((t) => t.id === 'ward')!;
    const hasKind = (
      effects: { kind: string; effect?: { kind: string } }[],
      kind: string,
    ) =>
      effects.some(
        (fx) => fx.kind === 'effect_unlock' && fx.effect?.kind === kind,
      );
    assert.equal(hasKind(heal.star6!.effects, 'team_shield'), false);
    assert.equal(hasKind(heal.star6!.effects, 'revive_ally'), true);
    assert.equal(hasKind(ward.star3.effects, 'team_shield'), true);
    assert.equal(hasKind(ward.star6!.effects, 'revive_ally'), false);

    const tpl = UNIT_TEMPLATES.find((u) => u.id === 'liubei')!;
    const baseProgress = {
      templateId: 'liubei',
      level: 1,
      exp: 0,
      breakthroughTier: 0,
      star: 6,
      owned: true,
      cardShards: 0,
    };
    const healSkill = skillWithGrowth(tpl, { ...baseProgress, starBranch: { 3: 'heal' } });
    assert.ok(healSkill.effects?.some((e) => e.kind === 'revive_ally'));
    assert.equal(healSkill.effects?.some((e) => e.kind === 'team_shield'), false);
    const wardSkill = skillWithGrowth(tpl, { ...baseProgress, starBranch: { 3: 'ward' } });
    assert.ok(wardSkill.effects?.some((e) => e.kind === 'team_shield'));
    assert.equal(wardSkill.effects?.some((e) => e.kind === 'revive_ally'), false);

    const zy = UNIT_TEMPLATES.find((u) => u.id === 'zhaoyun')!;
    const zySkill = skillWithGrowth(zy, {
      templateId: 'zhaoyun',
      level: 1,
      exp: 0,
      breakthroughTier: 0,
      star: 6,
      owned: true,
      cardShards: 0,
      starBranch: { 3: 'rush' },
    });
    assert.ok(zySkill.effects?.some((e) => e.kind === 'execute'));

    for (const id of DEEP_TEMPLATE_IDS) {
      const tracks = listIdentityTracks(id);
      assert.equal(tracks.length, 2, `${id} needs 2 branches`);
      for (const t of tracks) {
        assert.ok(t.label.length >= 2, `${id} branch missing short name`);
        assert.equal(t.star3.identityLabel, t.label);
        assert.equal(t.star6?.identityLabel, t.label);
      }
      const hasShredUnlock = [
        ...(STAR_OVERRIDES[id]![3]?.branches ?? []),
        ...(STAR_OVERRIDES[id]![6]?.branches ?? []),
      ].some(
        (b) =>
          b.effects.some(
            (fx) => fx.kind === 'status_unlock' && fx.status.statusId === 'shred',
          ),
      );
      if (id !== 'sunbin') {
        assert.equal(hasShredUnlock, false, `${id} star track must not unlock shred`);
      }
    }

    const zyRows = listStarTrackRows('zhaoyun', 6, { 3: 'rush' });
    const zy3 = zyRows.find((r) => r.star === 3)!;
    assert.deepEqual(
      zy3.branches?.map((b) => b.identityLabel),
      ['突阵', '猎印'],
    );

    const rows = listStarTrackRows('liubei', 0);
    const star3 = rows.find((r) => r.star === 3)!;
    const star6 = rows.find((r) => r.star === 6)!;
    assert.equal(star3.label, '仁德');
    assert.equal(star6.label, '汉中王');
    assert.equal(star3.branches?.length, 2);
    assert.equal(star6.branches?.length, 2);
    assert.equal(star3.followsIdentity, false);
    assert.equal(star6.followsIdentity, true);
    const heal3 = star3.branches!.find((b) => b.id === 'heal')!;
    const heal6 = star6.branches!.find((b) => b.id === 'heal')!;
    assert.equal(heal3.identityLabel, '济世');
    assert.equal(heal6.identityLabel, '济世');
    assert.match(heal3.effectLine, /净化/);
    assert.equal(heal3.effectLine.includes('招魂'), false);
    assert.match(heal6.effectLine, /招魂/);
    assert.equal(heal6.effectLine.includes('净化'), false);
  });
});
