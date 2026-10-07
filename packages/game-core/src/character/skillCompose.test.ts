import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createInitialPlayer } from '../save/player.js';
import { bindMorphStone } from '../equipment/morphs.js';
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
import { listStarTrackRows, skillDisplayFor, statusText } from './growthHelpers.js';

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

  it('tag_mult and later same-kind effectPatches take stronger multiplier', () => {
    const base = getSkill('skill_zhaoyun_longdan');
    const tagged = { ...base, tags: [...base.tags, 'aoe'] };
    const next = composeSkill(tagged, [
      { source: 'star', label: '横扫', tagMults: [{ tag: 'aoe', delta: 0.1 }] },
      {
        source: 'star',
        label: '碎甲',
        effectPatches: [{ kind: 'vs_shield', multiplier: 1.2 }],
      },
      {
        source: 'breakthrough',
        label: '更深',
        effectPatches: [{ kind: 'vs_shield', multiplier: 1.35 }],
      },
    ]);
    assert.ok(Math.abs(next.multiplier - (tagged.multiplier + 0.1)) < 1e-9);
    const vs = next.effects?.find((e) => e.kind === 'vs_shield');
    assert.equal(vs?.multiplier, 1.35);
  });

  it('zhouyu ★6 burn branch unlocks execute', () => {
    const tpl = getTemplate('zhouyu')!;
    const skill = skillWithGrowth(tpl, {
      templateId: 'zhouyu',
      level: 1,
      exp: 0,
      breakthroughTier: 0,
      cultivationNodes: 0,
      star: 6,
      owned: true,
      cardShards: 0,
      starBranch: { 3: 'wind', 6: 'burn' },
    });
    assert.equal(skill.name, '赤壁业火');
    assert.equal(skill.targetPattern, 'row_front');
    assert.ok(skill.effects?.some((e) => e.kind === 'execute'));
  });

  it('deep kits each carry a function hook (softMode or proc)', () => {
    const hooks: Record<string, RegExp> = {
      skill_hero_strike: /破妄/,
      skill_zhangfei_roar: /当阳|锁敌/,
      skill_wukong_sweep: /再扫/,
      skill_huatuo_qingnang: /灌气/,
      skill_houyi_luori: /九日/,
      skill_zhuge_qimen: /东风/,
      skill_baigujing_huagu: /化骨/,
      skill_guanyu_slash: /斩杀/,
      skill_dianwei_guard: /护主/,
      skill_nezha_arms: /风火/,
      skill_daji_charm: /夺气/,
      skill_yangjian_blade: /破妄/,
      skill_xishi_chenyu: /封/,
      skill_sunbin_jianzao: /减灶|合围/,
      skill_xiangyu: /破釜/,
      skill_nuwa: /招魂/,
      skill_yuefei: /精忠/,
      skill_jiangziya: /榜|除名/,
      skill_pangtong: /灼魂/,
      skill_niumowang: /反震/,
      skill_tangseng: /招魂/,
      skill_tieshan: /封招/,
    };
    for (const [id, copy] of Object.entries(hooks)) {
      assert.match(getSkill(id).softModes?.[0]?.copy ?? '', copy, id);
    }
    assert.equal(getSkill('skill_zhuge_qimen').effects?.find((e) => e.kind === 'ally_grant_qi')?.chance, 0.25);
    assert.equal(getSkill('skill_change_moon').effects?.find((e) => e.kind === 'ally_grant_qi')?.chance, 0.25);
    assert.equal(getSkill('skill_tangseng').effects?.find((e) => e.kind === 'ally_grant_qi')?.chance, 0.25);
  });

  it('demo kits expose softModes: lvbu / zhouyu / liubei', () => {
    assert.match(getSkill('skill_lvbu_wushuang').softModes?.[0]?.copy ?? '', /残血/);
    assert.match(getSkill('skill_zhouyu').softModes?.[0]?.copy ?? '', /乘乱|混乱/);
    assert.match(getSkill('skill_liubei').softModes?.[0]?.copy ?? '', /招魂/);
    const lb = skillDisplayFor('liubei', createInitialPlayer(13));
    assert.match(lb!.softModeLine ?? '', /倒下|招魂/);
    const zy = skillDisplayFor('zhouyu', createInitialPlayer(14));
    assert.match(zy!.softModeLine ?? '', /混乱|硬控|乘乱|业火/);
    const lvbu = skillDisplayFor('lvbu', createInitialPlayer(15));
    assert.match(lvbu!.rulesLine, /自身生命低于40%时，伤害提高至×1\.3，并戟影连环/);
    assert.equal((lvbu!.rulesLine.match(/自身生命低于40%/g) ?? []).length, 1);
  });

  it('assertAllCharacterBundles passes for 24 cards', () => {
    assert.doesNotThrow(() => assertAllCharacterBundlesOrThrow());
  });

  it('equipment morph changes composed skill on party', () => {
    let state = createInitialPlayer(42);
    const zyTpl = getTemplate('zhaoyun')!;
    state = {
      ...state,
      morphStones: ['morph_bleed_edge'],
      roster: {
        ...state.roster,
        zhaoyun: { ...state.roster.zhaoyun!, owned: true },
      },
      formation: {
        ...state.formation,
        zhaoyun: zyTpl.preferredSlot,
      },
    };
    const result = bindMorphStone(state, 'zhaoyun', 'morph_bleed_edge');
    assert.ok(result.ok);
    state = result.state;
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

  it('skillDisplayFor surfaces softMode copy for zhaoyun', () => {
    const info = skillDisplayFor('zhaoyun', createInitialPlayer(11));
    assert.ok(info);
    assert.match(info!.softModeLine ?? '', /若目标带有猎印/);
    assert.match(info!.rulesLine, /若目标带有猎印，则斩杀加重/);
    assert.match(info!.rulesLine, /穿透伤害（约\d+）/);
    assert.match(info!.rulesLine, /若目标有护盾/);
    assert.doesNotMatch(info!.rulesLine, /变招/);
  });

  it('star track primary lines use skill language, not bare main_pct', () => {
    const rows = listStarTrackRows('zhaoyun', 0);
    const s1 = rows.find((r) => r.star === 1);
    assert.ok(s1);
    assert.match(s1!.effectLine, /对盾增伤/);
    assert.ok(s1!.effectLine.indexOf('对盾增伤') < s1!.effectLine.indexOf('主属性'));
    assert.doesNotMatch(s1!.effectLine, /根基加深/);
    assert.doesNotMatch(s1!.effectLine, /^主属性\+/);
    assert.doesNotMatch(s1!.effectLine, /技能倍率\+/);
    const s2 = rows.find((r) => r.star === 2);
    assert.ok(s2);
    assert.match(s2!.effectLine, /流血多1回|穿透约提高|穿透/);
    assert.doesNotMatch(s2!.effectLine, /状态\+/);
    const s5 = rows.find((r) => r.star === 5);
    assert.ok(s5);
    assert.match(s5!.effectLine, /伤害倍率\+0\.12/);
    assert.match(s5!.effectLine, /对盾增伤/);
    assert.doesNotMatch(s5!.effectLine, /招式更深/);
    assert.doesNotMatch(s5!.effectLine, /技能倍率\+/);
    const zf = listStarTrackRows('zhangfei', 0).find((r) => r.star === 3);
    assert.match(zf!.branches?.[0]?.effectLine ?? zf!.effectLine, /眩晕多1回|队友结界|伤害倍率/);
    const roar = zf!.branches?.find((b) => (b.identityLabel ?? b.label) === '断喝');
    assert.match(roar!.effectLine, /眩晕多1回/);
    assert.doesNotMatch(roar!.effectLine, /状态\+/);
    assert.match(roar!.effectLine, /伤害倍率\+0\.15/);
    const yu2 = listStarTrackRows('zhouyu', 0).find((r) => r.star === 2);
    assert.match(yu2!.effectLine, /混乱多1回/);
  });

  it('zhaoyun ★0 is a complete kit with softMode', () => {
    const base = getSkill('skill_zhaoyun_longdan');
    assert.ok(base.applyStatus.some((s) => s.statusId === 'bleed'));
    assert.ok(base.effects?.some((e) => e.kind === 'vs_shield'));
    assert.ok(base.softModes?.some((m) => m.when.kind === 'target_has_status'));
    const info = skillDisplayFor('zhaoyun', createInitialPlayer(12));
    assert.match(info!.blurb ?? '', /猎印|流血|护盾/);
    assert.match(info!.softModeLine ?? '', /斩杀加重/);
  });

  it('skillDisplayFor: setup has no必中 tag; swing CC uses lower landBase', () => {
    const state = createInitialPlayer(8);
    const info = skillDisplayFor('zhangfei', state);
    assert.ok(info);
    assert.match(info!.coeffLine, /^伤害 = 力系×/);
    assert.equal(info!.previewLabel, '约伤');
    assert.ok(info!.previewAmount >= 1);
    assert.match(info!.rulesLine, /对敌方/);
    assert.match(info!.rulesLine, /伤害（约\d+）/);
    assert.match(info!.rulesLine, /眩晕/);
    assert.match(info!.statusLine, /附加眩晕/);
    assert.match(info!.statusLine, /命中率40%/); // stun landBase 0.4
    assert.doesNotMatch(info!.statusLine, /必中/);
    const shred = statusText(
      { applyStatus: [{ statusId: 'shred', duration: 2, value: 0.82 }] },
      { role: 'flex', masteryRating: 0 },
    );
    assert.equal(shred, '附加破甲2回（防御×82%）');
    const bleed = statusText(
      { applyStatus: [{ statusId: 'bleed', duration: 3, layers: 1 }] },
      { role: 'st_burst', masteryRating: 0 },
    );
    assert.equal(bleed, '附加流血3回（每回生命上限3%）');
    const havoc = statusText(
      { applyStatus: [{ statusId: 'havoc', duration: 1 }] },
      { role: 'flex', masteryRating: 0 },
    );
    assert.match(havoc, /附加混乱1回 · 命中率25%/);
  });

  it('star unlock lines carry ability numbers, not just 解锁XX', () => {
    const rows = listStarTrackRows('liubei', 0);
    const star3 = rows.find((r) => r.star === 3);
    assert.ok(star3?.branches);
    const jishi = star3!.branches!.find((b) => (b.identityLabel ?? b.label) === '济世');
    assert.ok(jishi);
    assert.match(jishi!.effectLine, /净化（清1道减益）/);
    assert.doesNotMatch(jishi!.effectLine, /解锁净化/);
    const star6 = rows.find((r) => r.star === 6);
    const jishi6 = star6?.branches?.find((b) => (b.identityLabel ?? b.label) === '济世');
    assert.ok(jishi6);
    assert.match(jishi6!.effectLine, /招魂（起身\d+%）/);
    const humin = star3!.branches!.find((b) => (b.identityLabel ?? b.label) === '护民');
    assert.ok(humin);
    assert.match(humin!.effectLine, /队友结界 ×0\.\d+/);
    const healInfo = skillDisplayFor('liubei', createInitialPlayer(9));
    assert.ok(healInfo);
    assert.equal(healInfo!.previewLabel, '约疗');
    assert.ok(healInfo!.previewAmount >= 1);
    assert.match(healInfo!.rulesLine, /为己方全体恢复/);
    assert.match(healInfo!.rulesLine, /气血（约\d+）/);
    assert.match(healInfo!.rulesLine, /残血加疗/);
    assert.match(healInfo!.effectsLine ?? '', /25% 灌气 \+56/);
    assert.match(healInfo!.rulesLine, /25% 灌气 \+56/);
    assert.doesNotMatch(healInfo!.effectsLine ?? '', /命中率/);
  });

  it('liubei grant-qi stays 25% and grows amount at 三顾', () => {
    const base = createInitialPlayer(9);
    const star0 = {
      ...base,
      roster: {
        ...base.roster,
        liubei: { ...base.roster.liubei!, star: 0, owned: true },
      },
    };
    const star2 = {
      ...star0,
      roster: {
        ...star0.roster,
        liubei: { ...star0.roster.liubei!, star: 2, owned: true },
      },
    };
    const s0 = skillDisplayFor('liubei', star0)!;
    const s2 = skillDisplayFor('liubei', star2)!;
    const qi0 = getSkill('skill_liubei').effects?.find((e) => e.kind === 'ally_grant_qi');
    assert.equal(qi0?.chance, 0.25);
    assert.equal(qi0?.value, 56);
    assert.match(s0.effectsLine ?? '', /25% 灌气 \+56/);
    assert.match(s2.effectsLine ?? '', /25% 灌气 \+64/);
    assert.doesNotMatch(s0.effectsLine ?? '', /命中率/);
  });

  it('shanggu expand: huangdi ★3 涿鹿线 first_cast 高于垂衣线', () => {
    const tpl = getTemplate('huangdi')!;
    const progress = {
      templateId: 'huangdi',
      level: 1,
      exp: 0,
      breakthroughTier: 0,
      star: 3,
      owned: true,
      cardShards: 0,
    };
    const zhuolu = skillWithGrowth(tpl, { ...progress, starBranch: { 3: 'a' } });
    const chuiyi = skillWithGrowth(tpl, { ...progress, starBranch: { 3: 'b' } });
    const fcHook = zhuolu.effects!.find((e) => e.kind === 'first_cast')!;
    const fcKit = chuiyi.effects!.find((e) => e.kind === 'first_cast')!;
    assert.ok(fcHook.multiplier! > fcKit.multiplier!);
    assert.equal(fcHook.multiplier, 1.2);
    assert.equal(fcKit.multiplier, 1.16);
  });

  it('shanggu expand: dayu ★3 省能与 purge 与 ★0 可区分', () => {
    const tpl = getTemplate('dayu')!;
    const star0 = {
      templateId: 'dayu',
      level: 1,
      exp: 0,
      breakthroughTier: 0,
      star: 0,
      owned: true,
      cardShards: 0,
    };
    const star3 = { ...star0, star: 3, starBranch: { 3: 'a' } };
    const s0 = skillWithGrowth(tpl, star0);
    const s3 = skillWithGrowth(tpl, star3);
    assert.ok(s3.qiCost < s0.qiCost);
    assert.ok(s3.multiplier > s0.multiplier);
    assert.ok(s3.effects?.some((e) => e.kind === 'purge'));
    const info = skillDisplayFor('dayu', {
      ...createInitialPlayer(20),
      roster: { ...createInitialPlayer(20).roster, dayu: { ...star3, owned: true } },
    });
    assert.match(info!.softModeLine ?? '', /河道/);
  });
});
