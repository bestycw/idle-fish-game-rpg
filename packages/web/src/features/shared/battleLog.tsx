import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { BattleEvent, BattleState } from '@moyu/game-core';
import { cn } from '@/lib/utils';
import { logTone } from '@/lib/tones';
import {
  aggregatedForScroll,
  buildAggregatedLines,
  type AggregatedLogLine,
} from './battleLogAggregate';

/** 紧凑战报刷新间隔（与战斗 tick 解耦，避免连闪） */
const COMPACT_LOG_THROTTLE_MS = 720;

const MOMENT_CODES = new Set<BattleEvent['code']>([
  'crit',
  'unit_down',
  'follow_up',
  'status_apply',
  'block',
  'dodge',
  'heal',
  'shield_gain',
]);

const VERBOSE_ONLY = new Set<BattleEvent['code']>(['turn_start', 'qi_gain']);

const SETUP_LOG =
  /^(遭遇【|共鸣【|词缀【|—— 第 \d+ 回合)/;

function filterLogLine(text: string, verbose: boolean): boolean {
  if (verbose) return true;
  return !SETUP_LOG.test(text.trim());
}

export function eventTone(ev: BattleEvent): string {
  if (ev.code === 'crit') return 'log-crit';
  if (ev.code === 'status_apply') {
    const st = String(ev.payload.status ?? '');
    if (/眩晕|沉默|混乱|禁疗|流血|破甲|迟缓|沉眠|狂乱/.test(st)) return 'log-special';
    return 'log-status';
  }
  if (ev.code === 'status_remove' || ev.code === 'status_block') return 'log-special';
  if (ev.code === 'follow_up' || ev.code === 'effect_miss') return 'log-special';
  if (ev.code === 'resist') return 'log-resist';
  if (ev.code === 'heal') return 'log-heal';
  if (ev.code === 'shield_gain') return 'log-shield';
  if (ev.code === 'block' || ev.code === 'dodge') return 'log-mitigation';
  if (ev.code === 'unit_down') return 'log-down';
  if (ev.code === 'hit') return 'log-hit';
  return '';
}

export function formatEventLine(ev: BattleEvent): string {
  const p = ev.payload;
  switch (ev.code) {
    case 'turn_start':
      return `${p.actor} 行动开始，能量 +${p.qiGain}（${p.qi}/${p.maxQi}）。`;
    case 'action':
      return `${p.actor} 使用${p.action}。`;
    case 'hit':
      return `${p.actor}→${p.target}，伤害 ${p.amount}${p.knockdown ? '，击倒' : ''}。`;
    case 'crit':
      return `${p.actor}→${p.target}【暴击】，伤害 ${p.amount}${p.knockdown ? '，击倒' : ''}。`;
    case 'heal':
      return `${p.actor} 为 ${p.target} 回复 ${p.amount} 点生命。`;
    case 'shield_gain':
      return `${p.actor} 获得 ${p.amount} 点护盾。`;
    case 'resist':
      return `${p.target} 抵抗了 ${p.status}。`;
    case 'status_apply':
      return `${p.target} 获得 ${p.status}（${p.duration} 动）。`;
    case 'status_block':
      return `${p.target} ${p.reason ?? '免疫'}，未能挂上 ${p.status}。`;
    case 'status_remove':
      return `${p.target} 的 ${p.status} 被${p.reason ?? '移除'}。`;
    case 'follow_up':
      return `${p.actor} 连击→${p.target}，伤害 ${p.amount}。`;
    case 'effect_miss':
      return `${p.actor} ${p.effect ?? '效果'}未触发。`;
    case 'block':
      return `${p.target} 格挡，伤害降至 ${p.amount}。`;
    case 'dodge':
      return `${p.target} 闪避。`;
    case 'unit_down':
      return `${p.target} 倒下。`;
    case 'qi_gain':
      return `${p.actor} 能量 +${p.qiGain}（${p.qi}/${p.maxQi}）。`;
    case 'battle_end':
      return p.result === 'won' ? '战斗胜利。' : '队伍溃败。';
    default:
      return '';
  }
}

function isMoment(ev: BattleEvent): boolean {
  return MOMENT_CODES.has(ev.code);
}

function EventLineBody({ ev, text }: { ev: BattleEvent; text: string }) {
  const p = ev.payload;
  if (ev.code === 'crit') {
    return (
      <span className="inline-flex flex-wrap items-baseline gap-1">
        <span>
          {String(p.actor)}→{String(p.target)}
        </span>
        <span className="log-crit-pop rounded bg-amber-500/25 px-1.5 py-0.5 text-xs font-bold tracking-wide text-amber-100">
          暴击
        </span>
        <span className="font-semibold tabular-nums text-amber-200">{String(p.amount)}</span>
        {p.knockdown ? <span className="text-destructive">击倒</span> : null}
      </span>
    );
  }
  if (ev.code === 'hit' || ev.code === 'follow_up') {
    const parts = text.split(String(p.amount));
    if (parts.length === 2) {
      return (
        <>
          {parts[0]}
          <span className="font-semibold tabular-nums text-orange-200/95">{String(p.amount)}</span>
          {parts[1]}
        </>
      );
    }
  }
  if (ev.code === 'heal') {
    return (
      <>
        {String(p.actor)} 为 {String(p.target)} 回复{' '}
        <span className="font-semibold tabular-nums text-emerald-300">{String(p.amount)}</span> 生命
      </>
    );
  }
  if (/【暴击】/.test(text)) {
    const [a, b] = text.split('【暴击】');
    return (
      <>
        {a}
        <span className="log-crit-pop font-bold text-amber-100">【暴击】</span>
        {b}
      </>
    );
  }
  return text;
}

type LogLine = { key: string; text: string; tone: string; ev?: BattleEvent; moment?: boolean };

function buildLines(battle: BattleState, verbose: boolean): LogLine[] {
  if (battle.events.length > 0) {
    const chronological = [...battle.events].reverse();
    return chronological
      .filter((ev) => verbose || !VERBOSE_ONLY.has(ev.code))
      .map((ev, i) => {
        const text = formatEventLine(ev);
        if (!text) return null;
        return {
          key: `${ev.turn}-${ev.code}-${i}-${text.slice(0, 24)}`,
          text,
          tone: eventTone(ev),
          ev,
          moment: isMoment(ev),
        };
      })
      .filter(Boolean) as LogLine[];
  }
  return [...battle.log]
    .reverse()
    .filter((line) => filterLogLine(line, verbose))
    .map((line, i) => ({
      key: `${line}-${i}`,
      text: line,
      tone: /【暴击】|暴击/.test(line)
        ? 'log-crit'
        : /获得|沉默|眩晕|混乱|禁疗|流血|破甲|迟缓/.test(line)
          ? 'log-special'
          : /伤害 \d+/.test(line)
            ? 'log-hit'
            : '',
      moment: /【暴击】|倒下|连击|闪避|格挡/.test(line),
    }));
}

/** 进行中战斗：降低战报 UI 刷新频率 */
function useThrottledBattleForLog(
  battle: BattleState,
  enabled: boolean,
): BattleState {
  const [snap, setSnap] = useState(battle);
  const latestRef = useRef(battle);
  latestRef.current = battle;

  useEffect(() => {
    if (!enabled) {
      setSnap(battle);
      return;
    }
    if (battle.status !== 'ongoing') {
      setSnap(battle);
      return;
    }
    const id = window.setInterval(() => {
      const b = latestRef.current;
      setSnap({ ...b, events: [...b.events], log: [...b.log] });
    }, COMPACT_LOG_THROTTLE_MS);
    return () => window.clearInterval(id);
  }, [enabled, battle.status]);

  useEffect(() => {
    setSnap(battle);
  }, [battle.encounterId]);

  useEffect(() => {
    if (battle.status !== 'ongoing') setSnap(battle);
  }, [battle, battle.status, battle.events.length]);

  if (!enabled || battle.status !== 'ongoing') return battle;
  return snap;
}

function AggregatedScrollRow({ line }: { line: AggregatedLogLine }) {
  if (line.kind === 'turn') {
    return (
      <p className="py-1 text-center font-mono text-[9px] tracking-wide text-muted-foreground/75">
        {line.headline}
      </p>
    );
  }
  if (line.kind === 'setup') {
    return (
      <p className="text-[10px] leading-snug text-muted-foreground/90">{line.headline}</p>
    );
  }
  if (line.kind === 'end' || line.kind === 'note') {
    return (
      <p className={cn('py-0.5 text-[12px] font-medium', logTone(line.tone ?? 'log-down'))}>
        {line.headline}
      </p>
    );
  }
  const detailLine =
    line.details && line.details.length > 0 ? line.details.join(' · ') : undefined;
  return (
    <p
      className={cn(
        'py-0.5 text-[11px] leading-snug sm:text-[12px]',
        logTone(line.tone ?? ''),
      )}
    >
      {line.headline}
      {detailLine ? (
        <span className="text-muted-foreground">
          {' '}
          · {detailLine}
        </span>
      ) : null}
    </p>
  );
}

export function BattleLog({
  battle,
  tall,
  compact,
}: {
  battle: BattleState;
  tall?: boolean;
  compact?: boolean;
}) {
  const [verbose, setVerbose] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickBottomRef = useRef(true);

  const throttled = useThrottledBattleForLog(battle, Boolean(compact && !verbose));
  const source = compact && !verbose ? throttled : battle;

  const lines = useMemo(() => buildLines(source, verbose), [source, verbose]);
  const scrollRows = useMemo(() => {
    if (verbose) return null;
    const aggregated = buildAggregatedLines(source, false);
    if (aggregated.length === 0) return null;
    return aggregatedForScroll(aggregated);
  }, [source, verbose]);

  const useAggregatedScroll = compact && !verbose && scrollRows && scrollRows.length > 0;

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || !stickBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [scrollRows?.length, source.events.length, verbose]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    stickBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 28;
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-2 px-0.5 pb-1">
        <p className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground">战报</p>
        <button
          type="button"
          onClick={() => setVerbose((v) => !v)}
          className="font-mono text-[10px] text-primary/85 hover:text-primary"
        >
          {verbose ? '收起细节' : '详细日志'}
        </button>
      </div>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className={cn(
          'formation-scroll min-h-0 flex-1 rounded-md border border-border/80 bg-card/50 font-mono',
          tall && !compact && 'max-h-[min(48vh,420px)]',
          !tall && !compact && 'max-h-[min(32vh,240px)]',
          compact && 'min-h-[5rem] max-h-[12rem]',
        )}
      >
        <div className="space-y-0.5 p-2.5 sm:p-3">
          {useAggregatedScroll ? (
            scrollRows!.map((row) => <AggregatedScrollRow key={row.key} line={row} />)
          ) : lines.length === 0 ? (
            <p className="text-[12px] text-muted-foreground">等待首回合…</p>
          ) : (
            lines.map((line, idx) => (
              <p
                key={line.key}
                style={compact ? undefined : { animationDelay: `${Math.min(idx, 8) * 20}ms` }}
                className={cn(
                  'text-[12px] leading-relaxed sm:text-[13px]',
                  !compact && 'log-line-enter',
                  logTone(line.tone),
                  line.ev?.code === 'crit' && !compact && 'log-crit-pop',
                )}
              >
                <span className="mr-1.5 text-muted-foreground/45">›</span>
                {line.ev ? <EventLineBody ev={line.ev} text={line.text} /> : line.text}
              </p>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
