/**
 * 战斗手感基线：默认开局队 × 多遭遇 × 多种子。
 * 用法（在 packages/game-core）：
 *   npm run feel
 *   npm run feel -- --seeds 20 --dump-loss 2
 */
import { buildPlayerParty } from '../formation/formation.js';
import { createInitialPlayer } from '../save/player.js';
import { createBattle, runAutoBattle } from '../combat/combat.js';
import { ENCOUNTERS } from '../dungeon/encounters.js';
import type { BattleEvent, BattleState } from '../shared/types.js';

interface RunRow {
  encounter: string;
  seed: number;
  result: 'won' | 'lost' | 'ongoing';
  turns: number;
  allyDown: number;
  enemyDown: number;
  skills: number;
  heals: number;
  shields: number;
  crits: number;
  followUps: number;
  stuns: number;
  defeatHint: string | null;
}

function parseArgs(argv: string[]) {
  let seeds = 15;
  let encounterIds = ['wall', 'archers', 'raiders'];
  let dumpLoss = 0;
  let maxSteps = 200;
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i]!;
    if (a === '--seeds') seeds = Math.max(1, Number(argv[++i] ?? 15));
    else if (a === '--encounters') {
      encounterIds = String(argv[++i] ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (a === '--dump-loss') dumpLoss = Math.max(0, Number(argv[++i] ?? 0));
    else if (a === '--max-steps') maxSteps = Math.max(20, Number(argv[++i] ?? 200));
  }
  return { seeds, encounterIds, dumpLoss, maxSteps };
}

function countEvents(events: BattleEvent[], code: BattleEvent['code']): number {
  return events.filter((e) => e.code === code).length;
}

function countStatusApply(events: BattleEvent[], statusSubstr: string): number {
  return events.filter(
    (e) =>
      e.code === 'status_apply' &&
      String(e.payload.status ?? '').includes(statusSubstr),
  ).length;
}

function summarizeBattle(state: BattleState, seed: number, encounter: string): RunRow {
  return {
    encounter,
    seed,
    result: state.status,
    turns: state.turn,
    allyDown: state.player.units.filter((u) => u.dead).length,
    enemyDown: state.enemy.units.filter((u) => u.dead).length,
    skills: state.events.filter(
      (e) => e.code === 'action' && String(e.payload.action ?? '').includes('技能'),
    ).length,
    heals: countEvents(state.events, 'heal'),
    shields: countEvents(state.events, 'shield_gain'),
    crits: countEvents(state.events, 'crit'),
    followUps: countEvents(state.events, 'follow_up'),
    stuns: countStatusApply(state.events, '眩晕'),
    defeatHint: state.defeatHint,
  };
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function pct(n: number, d: number): string {
  if (d <= 0) return '0%';
  return `${Math.round((n / d) * 100)}%`;
}

function clonePartyFresh(party: ReturnType<typeof buildPlayerParty>) {
  return party.map((u) => ({ ...u }));
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const player = createInitialPlayer(1);
  const party = buildPlayerParty(player);
  const allRows: RunRow[] = [];
  const lossLogs: { encounter: string; seed: number; tail: string[] }[] = [];

  const encounterEntries = opts.encounterIds.map((id) => {
    const idx = ENCOUNTERS.findIndex((e) => e.id === id);
    if (idx < 0) throw new Error(`Unknown encounter: ${id}`);
    return { id, idx };
  });

  console.log('=== combat-feel baseline ===');
  console.log(
    `party=${party.map((u) => u.name).join('/')}` +
      ` | seeds=${opts.seeds}` +
      ` | encounters=${opts.encounterIds.join(',')}`,
  );
  console.log('');

  for (const { id: enc, idx } of encounterEntries) {
    for (let i = 0; i < opts.seeds; i += 1) {
      const seed = 1000 + i * 17 + idx * 97;
      let battle = createBattle(clonePartyFresh(party), seed, idx);
      battle = runAutoBattle(battle, seed, opts.maxSteps);
      const row = summarizeBattle(battle, seed, enc);
      allRows.push(row);
      if (row.result === 'lost' && lossLogs.length < opts.dumpLoss) {
        lossLogs.push({ encounter: enc, seed, tail: battle.log.slice(-12) });
      }
    }
  }

  for (const enc of opts.encounterIds) {
    const rows = allRows.filter((r) => r.encounter === enc);
    const wins = rows.filter((r) => r.result === 'won').length;
    const losses = rows.filter((r) => r.result === 'lost').length;
    const timeouts = rows.filter((r) => r.result === 'ongoing').length;
    const winRows = rows.filter((r) => r.result === 'won');
    const lossRows = rows.filter((r) => r.result === 'lost');
    console.log(`## ${enc}`);
    console.log(
      `  win ${pct(wins, rows.length)} (${wins}/${rows.length})` +
        ` | loss ${pct(losses, rows.length)}` +
        (timeouts ? ` | timeout ${timeouts}` : ''),
    );
    console.log(
      `  avgTurns win=${avg(winRows.map((r) => r.turns)).toFixed(1)}` +
        ` loss=${lossRows.length ? avg(lossRows.map((r) => r.turns)).toFixed(1) : '—'}`,
    );
    console.log(
      `  avg skills=${avg(rows.map((r) => r.skills)).toFixed(1)}` +
        ` heal=${avg(rows.map((r) => r.heals)).toFixed(1)}` +
        ` shield=${avg(rows.map((r) => r.shields)).toFixed(1)}` +
        ` crit=${avg(rows.map((r) => r.crits)).toFixed(1)}` +
        ` followUp=${avg(rows.map((r) => r.followUps)).toFixed(1)}` +
        ` stun=${avg(rows.map((r) => r.stuns)).toFixed(1)}`,
    );
    console.log(
      `  avgAllyDown=${avg(rows.map((r) => r.allyDown)).toFixed(2)}` +
        ` avgEnemyDown=${avg(rows.map((r) => r.enemyDown)).toFixed(2)}`,
    );
    const hints = new Map<string, number>();
    for (const r of lossRows) {
      const h = r.defeatHint ?? '(none)';
      hints.set(h, (hints.get(h) ?? 0) + 1);
    }
    if (hints.size > 0) {
      console.log('  lossHints:');
      for (const [h, n] of [...hints.entries()].sort((a, b) => b[1] - a[1])) {
        console.log(`    ×${n} ${h}`);
      }
    }
    console.log('');
  }

  const totalWins = allRows.filter((r) => r.result === 'won').length;
  console.log(
    `TOTAL winRate=${pct(totalWins, allRows.length)} (${totalWins}/${allRows.length})`,
  );

  if (lossLogs.length > 0) {
    console.log('\n=== sample loss logs ===');
    for (const L of lossLogs) {
      console.log(`--- ${L.encounter} seed=${L.seed} ---`);
      for (const line of L.tail) console.log(line);
    }
  }
}

main();
