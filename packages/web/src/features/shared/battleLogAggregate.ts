import type { BattleEvent, BattleState } from '@moyu/game-core';
import { eventTone, formatEventLine } from './battleLog';

export type AggregatedLogLine = {
  key: string;
  kind: 'setup' | 'turn' | 'action' | 'end' | 'note';
  turn?: number;
  headline: string;
  details?: string[];
  tone?: string;
};

const SKIP_LOG =
  /（主角|轮到 |改回自动|手动：|无法行动，跳过|战斗胜利|队伍溃败|战败提示|战局过久|回合已尽/;

function setupLinesFromLog(battle: BattleState): string[] {
  const lines: string[] = [];
  for (const line of battle.log) {
    if (SKIP_LOG.test(line)) break;
    if (/^—— 第 \d+ 回合/.test(line.trim())) continue;
    if (/遭遇【|词缀|共鸣|开战/.test(line)) lines.push(line);
  }
  return lines;
}

function detailFromEvent(ev: BattleEvent): string | null {
  const p = ev.payload;
  switch (ev.code) {
    case 'hit':
      return `${p.actor}→${p.target} ${p.amount}${p.knockdown ? ' 击倒' : ''}`;
    case 'crit':
      return `${p.actor}→${p.target} 暴击 ${p.amount}${p.knockdown ? ' 击倒' : ''}`;
    case 'follow_up':
      return `连击→${p.target} ${p.amount}`;
    case 'heal':
      return `治疗 ${p.target} +${p.amount}`;
    case 'shield_gain':
      return `护盾 +${p.amount}`;
    case 'status_apply':
      return `${p.target} ${p.status}（${p.duration}动）`;
    case 'status_remove':
      return `${p.target} ${p.status} 解除`;
    case 'status_block':
      return `${p.target} 免疫 ${p.status}`;
    case 'resist':
      return `${p.target} 抵抗 ${p.status}`;
    case 'block':
      return `${p.target} 格挡→${p.amount}`;
    case 'dodge':
      return `${p.target} 闪避`;
    case 'unit_down':
      return `${p.target} 倒下`;
    case 'effect_miss':
      return `${p.actor} ${p.effect ?? '效果'}未触发`;
    case 'qi_gain':
      return `能量 +${p.qiGain}`;
    default:
      return null;
  }
}

function pushTurnHeader(out: AggregatedLogLine[], turn: number) {
  if (out.some((l) => l.kind === 'turn' && l.turn === turn)) return;
  out.push({
    key: `turn-${turn}`,
    kind: 'turn',
    turn,
    headline: `—— 第 ${turn} 回合 ——`,
  });
}

/** 按回合/行动聚合，减少战报刷屏；保留开局与第 1 回合标题 */
export function buildAggregatedLines(battle: BattleState, verbose: boolean): AggregatedLogLine[] {
  if (verbose || battle.events.length === 0) {
    return [];
  }

  const out: AggregatedLogLine[] = [];
  for (const line of setupLinesFromLog(battle)) {
    out.push({ key: `setup-${line}`, kind: 'setup', headline: line });
  }
  pushTurnHeader(out, 1);

  let lastTurnHeader = 1;
  let group: { key: string; turn: number; headline: string; details: string[]; tone: string } | null =
    null;

  const flushGroup = () => {
    if (!group) return;
    out.push({
      key: group.key,
      kind: 'action',
      turn: group.turn,
      headline: group.headline,
      details: group.details.length > 0 ? [...group.details] : undefined,
      tone: group.tone,
    });
    group = null;
  };

  for (let i = 0; i < battle.events.length; i += 1) {
    const ev = battle.events[i]!;
    if (ev.turn > lastTurnHeader) {
      flushGroup();
      pushTurnHeader(out, ev.turn);
      lastTurnHeader = ev.turn;
    }

    if (ev.code === 'turn_start' || ev.code === 'qi_gain') continue;

    if (ev.code === 'action') {
      flushGroup();
      const actor = String(ev.payload.actor ?? '');
      const action = String(ev.payload.action ?? '行动');
      group = {
        key: `act-${ev.turn}-${i}-${actor}`,
        turn: ev.turn,
        headline: `${actor} · ${action}`,
        details: [],
        tone: '',
      };
      continue;
    }

    if (ev.code === 'battle_end') {
      flushGroup();
      const won = ev.payload.result === 'won';
      out.push({
        key: `end-${i}`,
        kind: 'end',
        headline: won ? '战斗胜利。' : '队伍溃败。',
        tone: won ? 'log-heal' : 'log-down',
      });
      continue;
    }

    const bit = detailFromEvent(ev);
    if (!bit) continue;

    if (group) {
      group.details.push(bit);
      const t = eventTone(ev);
      if (t === 'log-crit' || t === 'log-down') group.tone = t;
      else if (!group.tone && t) group.tone = t;
    } else {
      out.push({
        key: `solo-${ev.turn}-${i}-${ev.code}`,
        kind: 'action',
        turn: ev.turn,
        headline: formatEventLine(ev) || bit,
        tone: eventTone(ev),
      });
    }
  }
  flushGroup();

  for (const line of battle.log) {
    if (/回合已尽|战局过久|强制收场/.test(line)) {
      out.push({ key: `note-${line}`, kind: 'note', headline: line, tone: 'log-down' });
    }
  }

  return out;
}

/** 滚动列表：开局多行压成一条，减少首屏噪音 */
export function aggregatedForScroll(aggregated: AggregatedLogLine[]): AggregatedLogLine[] {
  const out: AggregatedLogLine[] = [];
  const setupBuf: string[] = [];

  const flushSetup = () => {
    if (setupBuf.length === 0) return;
    out.push({
      key: `setup-${setupBuf.join('|')}`,
      kind: 'setup',
      headline: setupBuf.join(' · '),
    });
    setupBuf.length = 0;
  };

  for (const line of aggregated) {
    if (line.kind === 'setup') {
      setupBuf.push(line.headline);
      continue;
    }
    flushSetup();
    out.push(line);
  }
  flushSetup();
  return out;
}
