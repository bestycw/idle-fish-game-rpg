/**
 * 战斗强度审计：开局 / 养成 × 多遭遇 × 解法门（错队 vs 对队）。
 *   npx tsc -p tsconfig.json && node dist/tools/combatBalanceAudit.js
 */
import { defaultProgress } from '../character/growth.js';
import { getTemplate } from '../character/templates.js';
import { createBattle, runAutoBattle } from '../combat/combat.js';
import { ENCOUNTERS } from '../dungeon/encounters.js';
import { buildPlayerParty, DEFAULT_DEPLOYED_IDS } from '../formation/formation.js';
import { createInitialPlayer } from '../save/player.js';
import type { BattleEvent, CharacterProgress, PlayerState, UnitRuntime } from '../shared/types.js';

const SEEDS = 30;
const MAX_STEPS = 200;

function withRoster(
  state: PlayerState,
  ids: string[],
  patch: Partial<CharacterProgress>,
): PlayerState {
  const roster = { ...state.roster };
  for (const id of ids) {
    if (!getTemplate(id)) continue;
    const cur = roster[id] ?? defaultProgress(id);
    roster[id] = { ...cur, owned: true, ...patch };
  }
  return { ...state, roster };
}

function partyWith(state: PlayerState, ids: string[]): UnitRuntime[] {
  // 与开局默认一致：按模板 preferredSlot 站位（勿塞满 1–5，会扭曲后排伏击手感）
  const formation: PlayerState['formation'] = {};
  for (const id of ids.slice(0, 5)) {
    const t = getTemplate(id);
    if (t) formation[id] = t.preferredSlot;
  }
  return buildPlayerParty({ ...state, formation });
}

type StatusBucket = { apply: number; resist: number; block: number };

function tallyStatuses(events: BattleEvent[], into: Map<string, StatusBucket>) {
  for (const e of events) {
    if (e.code === 'status_apply') {
      const k = String(e.payload.status ?? '?');
      const b = into.get(k) ?? { apply: 0, resist: 0, block: 0 };
      b.apply += 1;
      into.set(k, b);
    } else if (e.code === 'resist') {
      const k = String(e.payload.status ?? '?');
      const b = into.get(k) ?? { apply: 0, resist: 0, block: 0 };
      b.resist += 1;
      into.set(k, b);
    } else if (e.code === 'status_block') {
      const k = String(e.payload.status ?? '?');
      const b = into.get(k) ?? { apply: 0, resist: 0, block: 0 };
      b.block += 1;
      into.set(k, b);
    }
  }
}

function landRate(b: StatusBucket): string {
  const den = b.apply + b.resist;
  if (den === 0) return '—';
  return `${Math.round((b.apply / den) * 100)}% (${b.apply}/${den})`;
}

type EncRow = { w: number; n: number; turnsW: number[]; allyDown: number[] };

function runSuite(
  label: string,
  state: PlayerState,
  ids: string[],
  encounterIds: string[],
  opts: { seedBase?: number; quietStatus?: boolean; pressure?: number } = {},
): Record<string, EncRow> {
  const seedBase = opts.seedBase ?? 1000;
  const pressure = opts.pressure ?? 1;
  const sample = partyWith(state, ids);
  console.log(`\n======== ${label} ========`);
  console.log(
    `party=${sample.map((u) => u.name).join('/')} | pressure=${pressure}`,
  );
  const statusTotal = new Map<string, StatusBucket>();
  let wins = 0;
  let losses = 0;
  let fights = 0;
  const byEnc: Record<string, EncRow> = {};

  for (const encId of encounterIds) {
    const idx = ENCOUNTERS.findIndex((e) => e.id === encId);
    if (idx < 0) continue;
    byEnc[encId] = { w: 0, n: 0, turnsW: [], allyDown: [] };
    for (let i = 0; i < SEEDS; i += 1) {
      const seed = seedBase + i * 17 + idx * 97;
      let battle = createBattle(partyWith(state, ids), seed, idx, { pressure });
      battle = runAutoBattle(battle, seed, MAX_STEPS);
      fights += 1;
      byEnc[encId]!.n += 1;
      byEnc[encId]!.allyDown.push(battle.player.units.filter((u) => u.dead).length);
      if (battle.status === 'won') {
        wins += 1;
        byEnc[encId]!.w += 1;
        byEnc[encId]!.turnsW.push(battle.turn);
      } else if (battle.status === 'lost') losses += 1;
      tallyStatuses(battle.events, statusTotal);
    }
  }

  for (const encId of encounterIds) {
    const row = byEnc[encId];
    if (!row) continue;
    const wr = Math.round((row.w / row.n) * 100);
    const avgT =
      row.turnsW.length > 0
        ? (row.turnsW.reduce((a, b) => a + b, 0) / row.turnsW.length).toFixed(1)
        : '—';
    const avgDown = (row.allyDown.reduce((a, b) => a + b, 0) / row.allyDown.length).toFixed(2);
    console.log(
      `  ${encId}: win ${wr}% (${row.w}/${row.n}) avgWinTurns=${avgT} avgAllyDown=${avgDown}`,
    );
  }
  console.log(
    `  TOTAL win ${Math.round((wins / fights) * 100)}% (${wins}/${fights}) loss ${losses}`,
  );

  if (!opts.quietStatus) {
    console.log('  key statuses:');
    for (const k of ['破甲', '流血', '眩晕', '混乱', '沉眠', '狂乱', '迟缓']) {
      const b = statusTotal.get(k);
      if (!b) continue;
      console.log(`    ${k}: land ${landRate(b)} block=${b.block}`);
    }
  }
  return byEnc;
}

function wr(row: EncRow | undefined): number {
  if (!row || row.n === 0) return 0;
  return Math.round((row.w / row.n) * 100);
}

function main() {
  const fresh = createInitialPlayer(42);
  const allEnc = ENCOUNTERS.map((e) => e.id);
  const starterIds = [...DEFAULT_DEPLOYED_IDS];
  const pool = [
    ...starterIds,
    'baigujing',
    'daji',
    'xishi',
    'diaochan',
    'zhuge',
    'houyi',
    'guanyu',
    'nezha',
    'dianwei',
  ];

  const starterState = withRoster(fresh, starterIds, { level: 1, star: 0 });
  runSuite('开局队 lv1 ★0 · pressure1（猎装/章战）', starterState, starterIds, [
    'wall',
    'archers',
    'raiders',
  ]);

  const midState = withRoster(fresh, pool, { level: 8, star: 2 });
  runSuite(
    '养成默认 lv8 ★2 · pressure1 猎装三遇',
    midState,
    starterIds,
    ['wall', 'archers', 'raiders'],
  );
  const abyssEnc = ['spirit_wall', 'chaos_rite', 'boss_warden'];
  runSuite(
    '养成默认 lv8 ★2 · pressure1.3 镜渊（逼解法）',
    midState,
    starterIds,
    abyssEnc,
    { pressure: 1.3 },
  );
  runSuite(
    '养成破阵 lv8 ★2 · pressure1.3 镜渊（核+诸葛）',
    midState,
    ['hero', 'zhangfei', 'zhuge', 'zhaoyun', 'huatuo'],
    abyssEnc,
    { quietStatus: true, pressure: 1.3 },
  );
  runSuite(
    '养成控场 lv8 ★2 · pressure1.3 镜渊',
    midState,
    ['hero', 'baigujing', 'daji', 'xishi', 'diaochan'],
    abyssEnc,
    { quietStatus: true, pressure: 1.3 },
  );

  // —— 解法门：同战力错队 vs 对队 ——
  console.log('\n======== 解法门 Δ（lv8★2，错队应明显低于对队）========');
  // 同核：张飞/赵云/华佗 + 第五人（盾辅 vs 破甲辅；勿用关羽等高物伤冒充「无解法」）
  const noShred = runSuite(
    '门·无破甲 · 核+典韦（盾）',
    midState,
    ['hero', 'zhangfei', 'zhaoyun', 'huatuo', 'dianwei'],
    ['wall', 'boss_warden', 'spirit_wall'],
    { quietStatus: true, pressure: 1.3 },
  );
  const deepShred = runSuite(
    '门·深破甲 · 核+孙膑',
    midState,
    ['hero', 'zhangfei', 'zhaoyun', 'huatuo', 'sunbin'],
    ['wall', 'boss_warden', 'spirit_wall'],
    { quietStatus: true, pressure: 1.3 },
  );
  const lightShred = runSuite(
    '门·轻破甲 · 开局五人（悟空）打铁壁灵阵',
    midState,
    starterIds,
    ['spirit_wall'],
    { quietStatus: true, pressure: 1.3 },
  );
  const noPierce = runSuite(
    '门·无穿透 · 张飞/悟空/华佗/关羽打弓手',
    midState,
    ['hero', 'zhangfei', 'wukong', 'huatuo', 'guanyu'],
    ['archers'],
    { quietStatus: true, pressure: 1 },
  );
  const withPierce = runSuite(
    '门·有穿透 · 开局五人打弓手',
    midState,
    starterIds,
    ['archers'],
    { quietStatus: true, pressure: 1 },
  );
  const ctrlBoss = runSuite(
    '门·硬控 · 白骨/妲己/西施/貂蝉',
    midState,
    ['hero', 'baigujing', 'daji', 'xishi', 'diaochan'],
    ['boss_warden', 'chaos_rite'],
    { quietStatus: true, pressure: 1.3 },
  );

  console.log('\n=== 解法门摘要（错→对）===');
  console.log(
    `  盾墙/Boss 破甲 p1.3：wall ${wr(noShred.wall)}% → ${wr(deepShred.wall)}%` +
      ` · boss ${wr(noShred.boss_warden)}% → ${wr(deepShred.boss_warden)}%`,
  );
  console.log(
    `  铁壁灵阵：轻破甲 ${wr(lightShred.spirit_wall)}% → 深破甲 ${wr(deepShred.spirit_wall)}%` +
      ` · 盾辅无破甲 ${wr(noShred.spirit_wall)}%`,
  );
  console.log(
    `  后排弓 p1：无穿 ${wr(noPierce.archers)}% → 有穿 ${wr(withPierce.archers)}%`,
  );
  console.log(
    `  Boss/乱心：硬控 boss ${wr(ctrlBoss.boss_warden)}% / chaos ${wr(ctrlBoss.chaos_rite)}%` +
      ` · 破阵 boss ${wr(deepShred.boss_warden)}%`,
  );

  console.log('\n=== 目标带 ===');
  console.log('开局 p1：wall/archers 70–88% · raiders 50–70%');
  console.log('养成默认镜渊 p1.3：spirit 宜 <40%（卡关上诸葛）；破阵 spirit/boss 明显高于默认');
  console.log('解法门：轻破甲 << 深破甲（铁壁）；硬控 Boss ≈0%；盾辅可另开生存解但不该全面碾压破甲');
}

main();
