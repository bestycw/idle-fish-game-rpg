import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  deriveGrowthStats,
  tryBreakthrough,
  tryLevelUp,
  tryStarUp,
  tryCultivateNode,
  grantCharacterExp,
  BREAKTHROUGH_LABELS,
  LEVEL_CAP_BY_TIER,
  migrateLegacyRealmTier,
  resolveStarNode,
  roleStarNode,
  grantCurrency,
  unlockedStarNodes,
  starShardCost,
} from './growth.js';
import {
  STARDUST_PER_SHARD,
  tryExchangeStardustForShard,
} from './stardustExchange.js';
import { applyGrowthTrack, listGrowthTracks } from './growthTracks.js';
import {
  formationHints,
  listBreakthroughPerkRows,
  listStarTrackRows,
  previewStarUp,
  cultivationGainLine,
  previewBreakthroughStep,
} from './growthHelpers.js';
import { ROLE_BREAKTHROUGH_LADDERS } from './breakthroughPerks.js';
import { createInitialPlayer } from '../save/player.js';
import { getTemplate } from './templates.js';
import { MAX_STAR } from './starTracks.js';
import { UNIT_TEMPLATES } from './templates.js';

describe('character growth', () => {
  it('levels up with enough exp and respects cap', () => {
    let state = createInitialPlayer(1);
    state = grantCharacterExp(state, 'hero', 500);
    const r1 = tryLevelUp(state, 'hero');
    assert.equal(r1.ok, true);
    if (r1.ok) {
      assert.equal(r1.state.roster.hero!.level, 2);
      state = r1.state;
    }
  });

  it('breakthrough needs full cultivation nodes and xiuwei', () => {
    let state = createInitialPlayer(2);
    state = {
      ...state,
      roster: {
        ...state.roster,
        zhaoyun: {
          templateId: 'zhaoyun',
          level: 1,
          exp: 0,
          breakthroughTier: 0,
          cultivationNodes: 10,
          star: 0,
          owned: true,
          cardShards: 0,
        },
      },
    };
    state = grantCurrency(state, 'xiuwei', 800);
    const r = tryBreakthrough(state, 'zhaoyun');
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.state.roster.zhaoyun!.breakthroughTier, 1);
      assert.equal(r.state.roster.zhaoyun!.cultivationNodes, 0);
    }
  });

  it('star unlocks shared or override nodes', () => {
    let state = createInitialPlayer(3);
    state = {
      ...state,
      roster: {
        ...state.roster,
        zhaoyun: { ...state.roster.zhaoyun!, owned: true, cardShards: 10 },
      },
    };
    for (let i = 0; i < 3; i += 1) {
      const r = tryStarUp(state, 'zhaoyun');
      assert.equal(r.ok, true);
      if (r.ok) state = r.state;
    }
    assert.equal(state.roster.zhaoyun!.star, 3);
    const branch = { 3: 'rush' };
    const nodes = unlockedStarNodes('zhaoyun', 3, branch);
    assert.ok(nodes.some((n) => n.label.includes('突阵') || n.label.includes('连击')));
    const tpl = getTemplate('zhaoyun')!;
    const progress = { ...state.roster.zhaoyun!, starBranch: branch };
    const derived = deriveGrowthStats(tpl, progress);
    assert.ok(derived.followUp);
    assert.ok(derived.penRating > tpl.penRating || derived.followUp.chance >= 0.34);
    assert.ok(derived.skillMods.multiplierDelta === 0 || derived.followUp);
  });

  it('star track goes to ★6 with skill mods', () => {
    let state = createInitialPlayer(4);
    state = {
      ...state,
      roster: {
        ...state.roster,
        huatuo: { ...state.roster.huatuo!, owned: true, cardShards: 20 },
      },
    };
    for (let i = 0; i < 4; i += 1) {
      const r = tryStarUp(state, 'huatuo');
      assert.equal(r.ok, true);
      if (r.ok) state = r.state;
    }
    assert.equal(state.roster.huatuo!.star, 4);
    const tpl = getTemplate('huatuo')!;
    const derived = deriveGrowthStats(tpl, state.roster.huatuo!);
    assert.ok(derived.skillMods.multiplierDelta > 0 || derived.skillMods.qiCostDelta < 0);
  });

  it('breakthrough grants perk labels', () => {
    let state = createInitialPlayer(6);
    state = {
      ...state,
      roster: {
        ...state.roster,
        zhangfei: {
          templateId: 'zhangfei',
          level: 1,
          exp: 0,
          breakthroughTier: 0,
          cultivationNodes: 10,
          star: 0,
          owned: true,
          cardShards: 0,
        },
      },
    };
    state = grantCurrency(state, 'xiuwei', 800);
    const r = tryBreakthrough(state, 'zhangfei');
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.match(r.message, /通脉|虎侯/);
      const tpl = getTemplate('zhangfei')!;
      const d = deriveGrowthStats(tpl, r.state.roster.zhangfei!);
      assert.ok(d.breakthroughLabels.length >= 1);
      assert.ok(d.block > 0 || d.masteryRating > tpl.masteryRating);
    }
  });

  it('cultivate nodes spend xiuwei then unlock breakthrough', () => {
    let state = createInitialPlayer(11);
    state = {
      ...state,
      currencies: { ...state.currencies, xiuwei: 0 },
      roster: {
        ...state.roster,
        huatuo: {
          ...state.roster.huatuo!,
          owned: true,
          cultivationNodes: 0,
          breakthroughTier: 0,
        },
      },
    };
    assert.equal(tryCultivateNode(state, 'huatuo').ok, false);
    state = grantCurrency(state, 'xiuwei', 900);
    for (let i = 0; i < 10; i += 1) {
      const r = tryCultivateNode(state, 'huatuo');
      assert.equal(r.ok, true);
      if (r.ok) state = r.state;
    }
    assert.equal(state.roster.huatuo!.cultivationNodes, 10);
    assert.equal(tryCultivateNode(state, 'huatuo').ok, false);
    const bt = tryBreakthrough(state, 'huatuo');
    assert.equal(bt.ok, true);
  });

  it('stack merges shared and override effects', () => {
    const node = resolveStarNode('wukong', 3, 'evade');
    assert.ok(node);
    assert.ok(node!.label.includes('腾云'));
    assert.ok(node!.effects.some((e) => e.kind === 'enable_follow_up'));
    assert.ok(node!.effects.some((e) => e.kind === 'rare_stat' && e.stat === 'dodge'));
  });

  it('growth tracks registry exposes enabled axes', () => {
    const tracks = listGrowthTracks();
    assert.deepEqual(
      tracks.map((t) => t.id),
      ['level', 'cultivate', 'breakthrough', 'star'],
    );
    let state = createInitialPlayer(5);
    state = grantCharacterExp(state, 'hero', 500);
    const r = applyGrowthTrack(state, 'level', 'hero');
    assert.equal(r.ok, true);
  });

  it('previewStarUp reports shard or dust cost', () => {
    let state = createInitialPlayer(6);
    state = {
      ...state,
      roster: {
        ...state.roster,
        huatuo: { ...state.roster.huatuo!, owned: true, star: 2, cardShards: 1 },
      },
    };
    const preview = previewStarUp(state, 'huatuo');
    assert.equal(preview.costKind, 'shard');
    assert.equal(preview.shardsNeed, 1);
    assert.ok(preview.nodeLine.length > 0);
    assert.equal(preview.ready, true);
  });

  it('star costs scale: ★1-3=1 shard, ★4-5=2, ★6=3', () => {
    assert.equal(starShardCost(0), 1);
    assert.equal(starShardCost(2), 1);
    assert.equal(starShardCost(3), 2);
    assert.equal(starShardCost(4), 2);
    assert.equal(starShardCost(5), 3);
    let state = createInitialPlayer(8);
    state = {
      ...state,
      roster: {
        ...state.roster,
        zhaoyun: {
          ...state.roster.zhaoyun!,
          owned: true,
          star: 5,
          cardShards: 2,
        },
      },
    };
    const fail = tryStarUp(state, 'zhaoyun');
    assert.equal(fail.ok, false);
    state = {
      ...state,
      roster: {
        ...state.roster,
        zhaoyun: { ...state.roster.zhaoyun!, cardShards: 3 },
      },
    };
    const ok = tryStarUp(state, 'zhaoyun');
    assert.equal(ok.ok, true);
    if (ok.ok) {
      assert.equal(ok.state.roster.zhaoyun!.star, 6);
      assert.equal(ok.state.roster.zhaoyun!.cardShards, 0);
    }
  });

  it('stardust exchanges to shard; daily limit; cap at ★4', () => {
    const t0 = Date.UTC(2026, 7, 2, 12, 0, 0);
    let state = createInitialPlayer(9);
    state = grantCurrency(state, 'stardust', STARDUST_PER_SHARD * 2);
    state = {
      ...state,
      roster: {
        ...state.roster,
        zhaoyun: { ...state.roster.zhaoyun!, owned: true, star: 0, cardShards: 0 },
      },
    };
    const dustBefore = state.currencies.stardust ?? 0;
    const r1 = tryExchangeStardustForShard(state, 'zhaoyun', t0);
    assert.equal(r1.ok, true);
    if (r1.ok) {
      state = r1.state;
      assert.equal(state.roster.zhaoyun!.cardShards, 1);
      assert.equal(state.currencies.stardust, dustBefore - STARDUST_PER_SHARD);
    }
    const r2 = tryExchangeStardustForShard(state, 'zhaoyun', t0);
    assert.equal(r2.ok, false);

    state = {
      ...state,
      roster: {
        ...state.roster,
        zhaoyun: { ...state.roster.zhaoyun!, star: 4, cardShards: 0 },
      },
      stardustExchangeDay: undefined,
      stardustExchangesToday: 0,
    };
    const r3 = tryExchangeStardustForShard(state, 'zhaoyun', t0 + 86400000);
    assert.equal(r3.ok, false);
    assert.match(r3.message, /★4|抽卡/);
  });

  it('keeps early ladder stable and appends 太乙 / 大罗', () => {
    assert.equal(BREAKTHROUGH_LABELS[5], '元婴');
    assert.equal(BREAKTHROUGH_LABELS[6], '化神');
    assert.equal(BREAKTHROUGH_LABELS[7], '炼虚');
    assert.equal(BREAKTHROUGH_LABELS[14], '金仙');
    assert.equal(BREAKTHROUGH_LABELS[15], '太乙');
    assert.equal(BREAKTHROUGH_LABELS[16], '大罗');
    assert.equal(BREAKTHROUGH_LABELS.length, LEVEL_CAP_BY_TIER.length);
    assert.equal(BREAKTHROUGH_LABELS[BREAKTHROUGH_LABELS.length - 1], '大罗');
    assert.equal(migrateLegacyRealmTier(0), 0);
    assert.equal(migrateLegacyRealmTier(2), 4);
    assert.equal(migrateLegacyRealmTier(4), 6);
  });

  it('gives every default star a role passive from the ability pool', () => {
    const tank = roleStarNode('tank', 3);
    assert.ok(tank?.effects.some((e) => e.kind === 'effect_unlock'));
    const tank5 = roleStarNode('tank', 5);
    assert.ok(tank5?.effects.some((e) => e.kind === 'nirvana'));
    const burst = roleStarNode('st_burst', 6);
    assert.ok(burst?.effects.some((e) => e.kind === 'effect_unlock' && e.effect.kind === 'execute'));
    const heal5 = roleStarNode('st_heal', 5);
    assert.ok(heal5?.effects.some((e) => e.kind === 'effect_unlock' && e.effect.kind === 'revive_ally'));
    const ctrl6 = roleStarNode('st_ctrl', 6);
    assert.ok(ctrl6?.effects.some((e) => e.kind === 'status_unlock' && e.status.statusId === 'stun'));
    const stub = resolveStarNode('menghuo', 3);
    assert.ok(stub);
    assert.notEqual(stub.label, '主属性强化');
    assert.ok(stub.effects.some((e) => e.kind !== 'stat_pct'));
    const wukong1 = resolveStarNode('wukong', 1);
    assert.ok(wukong1);
    assert.ok(wukong1.effects.some((e) => e.kind === 'stat_pct'));
    assert.ok(wukong1.effects.some((e) => e.kind !== 'stat_pct' && e.kind !== 'rare_stat' && e.kind !== 'rating'));
    const zy2 = resolveStarNode('zhaoyun', 2);
    assert.ok(zy2);
    assert.ok(zy2.label.includes('常山'));
    assert.ok(zy2.effects.some((e) => e.kind === 'rating' && e.stat === 'penRating'));
  });

  it('shows numbered cultivation and role-colored realm perks', () => {
    assert.match(cultivationGainLine(), /主属性\+1\.2%/);
    for (const role of ['tank', 'st_burst', 'aoe_dps', 'st_ctrl', 'aoe_ctrl', 'group_amp', 'st_heal', 'aoe_heal', 'flex'] as const) {
      const ladder = ROLE_BREAKTHROUGH_LADDERS[role];
      assert.equal(ladder.length, BREAKTHROUGH_LABELS.length - 1);
      assert.ok(ladder.every((p) => p.effects.every((e) => e.kind === 'rating' || e.kind === 'rare_stat')));
    }
    const burst = previewBreakthroughStep('zhaoyun', 0);
    assert.ok(burst);
    assert.equal(burst.toLabel, '筑基');
    assert.match(burst.mainLine, /主属性\+4%/);
    assert.match(burst.perkLine, /暴击约/);
    const tank = previewBreakthroughStep('menghuo', 0);
    assert.ok(tank);
    assert.match(tank.perkLine, /坚韧/);
    assert.notEqual(burst.perkLine, tank.perkLine);
    const open = previewBreakthroughStep('hero', 1);
    assert.ok(open);
    assert.match(open.perkLine, /暴击|气运/);
    const zf = previewBreakthroughStep('zhangfei', 0);
    assert.ok(zf);
    assert.match(zf.perkLabel, /虎侯/);
  });

  it('lists full star track and breakthrough rows', () => {
    const rows = listStarTrackRows('zhaoyun', 2);
    assert.equal(rows.length, MAX_STAR); // legendary → ★6
    assert.equal(rows.filter((r) => r.unlocked).length, 2);
    assert.ok(rows.every((r) => r.effectLine.length > 0));
    assert.match(rows[1]!.effectLine, /主属性\+3%|状态\+|穿透/);
    assert.equal(listStarTrackRows('huatuo', 0).length, 6); // legendary
    assert.equal(listStarTrackRows('zhangfei', 0).length, 6); // legendary
    const bt = listBreakthroughPerkRows('zhangfei', 0);
    assert.ok(bt.next);
    assert.equal(UNIT_TEMPLATES.length, 200);
  });

  it('star cap follows rarity (凡3/良4/珍5/绝6)', () => {
    let state = createInitialPlayer(3);
    state = {
      ...state,
      roster: {
        ...state.roster,
        xushu: {
          ...state.roster.xushu!,
          owned: true,
          star: 4,
          cardShards: 99,
        },
        menghuo: {
          templateId: 'menghuo',
          level: 1,
          exp: 0,
          breakthroughTier: 0,
          cultivationNodes: 0,
          star: 3,
          owned: true,
          cardShards: 99,
        },
      },
    };
    assert.equal(tryStarUp(state, 'xushu').ok, false); // rare max ★4
    assert.equal(tryStarUp(state, 'menghuo').ok, false); // common max ★3
    assert.match(tryStarUp(state, 'xushu').message, /良品|上限/);
  });

  it('formationHints flags missing tank/heal', () => {
    const state = createInitialPlayer(7);
    const next = {
      ...state,
      formation: { hero: 2 as const, zhangfei: 1 as const, zhaoyun: 9 as const },
    };
    const hints = formationHints(next);
    assert.ok(hints.missingRoleLine?.includes('治疗'));
  });

  it('formationHints shows iron wall when front row full', () => {
    const state = createInitialPlayer(8);
    const next = {
      ...state,
      formation: { zhangfei: 1 as const, hero: 2 as const, zhaoyun: 3 as const },
    };
    const hints = formationHints(next);
    assert.match(hints.resonanceLine ?? '', /铁壁共鸣/);
  });
});
