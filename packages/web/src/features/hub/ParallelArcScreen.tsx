import type { ParallelArcReportSnapshot, ParallelImpulseTag, PlayerState } from '@moyu/game-core';
import { composeParallelArcBrief } from '@moyu/game-core';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { PrologueTypewriter } from './prologue/PrologueTypewriter';

type ParallelArcScreenProps = {
  report: ParallelArcReportSnapshot;
  previousReport?: ParallelArcReportSnapshot | null;
  player?: PlayerState | null;
  heroName?: string;
  /** 最后一页：标记已读并关闭 */
  onContinue: () => void;
  /** 稍后查看：关闭但不标记已读 */
  onLater?: () => void;
};

/** 玩家向：不说「弧」，对齐「每两章一次原世界结算」 */
const ARC_LABEL: Record<string, string> = {
  arc1: '第 1–2 章 · 原世界结算',
  arc2: '第 3–4 章 · 原世界结算',
  arc3: '第 5–6 章 · 原世界结算',
  arc4: '第 7–8 章 · 原世界结算',
  arc5: '第 9–10 章 · 原世界结算',
};

const PAGE_ICON: Record<string, string> = {
  delta: '⇄',
  life: '⌂',
  work: '◈',
  isekai: '✦',
  next: '…',
};

function ImpulseChip({ tag }: { tag: ParallelImpulseTag }) {
  const up = tag.trend === 'up';
  const down = tag.trend === 'down';
  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 flex-col items-center rounded-lg border px-1.5 py-1.5',
        up && 'border-red-500/40 bg-red-500/12',
        down && 'border-emerald-500/35 bg-emerald-500/10',
        !up && !down && 'border-border/50 bg-card/40',
      )}
    >
      <span className="font-mono text-[9px] text-muted-foreground">{tag.label}</span>
      <span
        className={cn(
          'mt-0.5 font-mono text-xs font-semibold tracking-tight',
          up && 'text-red-400',
          down && 'text-emerald-400',
          !up && !down && 'text-foreground/70',
        )}
      >
        {tag.flash}
      </span>
    </div>
  );
}

function SyncRing({ moodLabel, tierRank }: { moodLabel: string; tierRank: string }) {
  return (
    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
      <div
        className="absolute inset-0 rounded-full border-2 border-amber-500/30"
        style={{
          background: `conic-gradient(from 200deg, rgba(245,158,11,0.45), rgba(245,158,11,0.05) 55%, transparent)`,
        }}
      />
      <div className="absolute inset-1 rounded-full border border-amber-400/20 bg-[#0c1018]/90" />
      <div className="relative text-center">
        <p className="font-mono text-[8px] tracking-widest text-amber-500/80">同频</p>
        <p className="font-display text-sm leading-none text-amber-100">{moodLabel}</p>
      </div>
      <span
        className={cn(
          'absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border-2 font-display text-sm',
          tierRank === 'S' && 'border-amber-300 bg-amber-500 text-amber-950',
          tierRank === 'B' && 'border-sky-400/80 bg-sky-600/90 text-sky-50',
          tierRank === 'C' && 'border-border bg-muted text-muted-foreground',
        )}
      >
        {tierRank}
      </span>
    </div>
  );
}

export function ParallelArcScreen({
  report,
  previousReport,
  player,
  heroName,
  onContinue,
  onLater,
}: ParallelArcScreenProps) {
  const arcLabel = ARC_LABEL[report.arcId] ?? report.arcId;
  const brief = useMemo(
    () => composeParallelArcBrief(report, heroName, previousReport ?? null, player ?? null),
    [report, heroName, previousReport, player],
  );

  const [channelOpen, setChannelOpen] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageInstant, setPageInstant] = useState(false);
  const pages = brief.pages;
  const page = pages[pageIndex]!;
  const isLast = pageIndex >= pages.length - 1;

  useEffect(() => {
    const t = window.setTimeout(() => setChannelOpen(true), 520);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    setPageInstant(false);
  }, [pageIndex]);

  const goNext = useCallback(() => {
    if (!pageInstant) {
      setPageInstant(true);
      return;
    }
    if (isLast) {
      onContinue();
      return;
    }
    setPageIndex((i) => Math.min(i + 1, pages.length - 1));
  }, [isLast, onContinue, pageInstant, pages.length]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal
      aria-labelledby="parallel-arc-title"
    >
      <div
        className={cn(
          'relative flex h-[min(100dvh,44rem)] w-full max-w-lg flex-col overflow-hidden sm:h-auto sm:max-h-[min(92vh,44rem)] sm:rounded-2xl',
          'border-amber-500/20 bg-gradient-to-b from-[#161c28] via-[#10151f] to-[#080b10] shadow-2xl sm:border',
        )}
      >
        {!channelOpen ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[#06080c]/96">
            <div className="h-14 w-14 animate-pulse rounded-full border-2 border-cyan-400/40 border-t-cyan-300" />
            <p className="font-mono text-[11px] tracking-[0.35em] text-cyan-300/90">平行信道接入中</p>
          </div>
        ) : null}

        <header
          className={cn(
            'relative overflow-hidden border-b border-amber-500/15 px-4 pb-3 pt-4 transition-opacity duration-500',
            channelOpen ? 'opacity-100' : 'opacity-0',
          )}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.15) 2px, rgba(255,255,255,0.15) 3px)',
            }}
          />
          <div className="relative flex gap-3">
            <SyncRing moodLabel={brief.syncMoodLabel} tierRank={brief.tierRank} />
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] tracking-[0.25em] text-cyan-400/90">平行信道 · 结算</p>
              <h2 id="parallel-arc-title" className="font-display mt-0.5 text-lg leading-tight tracking-wide">
                {arcLabel}
              </h2>
              <p className="mt-1 font-mono text-[11px] text-amber-200/90">{brief.headline}</p>
              {brief.subtitle ? (
                <p className="mt-1 line-clamp-2 text-xs leading-snug text-foreground/75">{brief.subtitle}</p>
              ) : null}
            </div>
          </div>

          {brief.tierCauses.length > 0 ? (
            <p className="relative mt-2 text-[11px] leading-snug text-foreground/80">
              {brief.tierCauses.join(' ')}
            </p>
          ) : null}

          <div className="relative mt-2 flex gap-1.5">
            {brief.impulses.map((tag) => (
              <ImpulseChip key={tag.id} tag={tag} />
            ))}
          </div>
        </header>

        <div
          className={cn(
            'flex min-h-0 flex-1 flex-col px-4 py-3 transition-opacity duration-500',
            channelOpen ? 'opacity-100' : 'opacity-0',
          )}
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/25 bg-amber-500/10 font-mono text-sm text-amber-300">
                {PAGE_ICON[page.icon ?? 'isekai'] ?? '·'}
              </span>
              <div>
                <p className="font-mono text-[11px] tracking-wide text-foreground/95">{page.title}</p>
                {page.hint ? (
                  <p className="font-mono text-[9px] text-muted-foreground">{page.hint}</p>
                ) : null}
              </div>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">
              {pageIndex + 1}/{pages.length}
            </span>
          </div>

          <div
            className={cn(
              'min-h-0 flex-1 overflow-y-auto rounded-xl border border-border/40',
              'bg-gradient-to-b from-card/50 to-card/20 px-3.5 py-3',
            )}
          >
            <p className="text-[15px] leading-[1.65] tracking-wide text-foreground/92">
              <PrologueTypewriter
                text={page.body}
                active={channelOpen}
                instant={pageInstant}
                visible
              />
            </p>
          </div>

          <div className="mt-3 flex justify-center gap-1.5">
            {pages.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`第 ${i + 1} 页`}
                onClick={() => {
                  setPageIndex(i);
                  setPageInstant(false);
                }}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === pageIndex ? 'w-6 bg-amber-500' : 'w-1.5 bg-muted-foreground/35 hover:bg-muted-foreground/55',
                )}
              />
            ))}
          </div>
        </div>

        <footer
          className={cn(
            'space-y-2 border-t border-border/40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-opacity duration-500',
            channelOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
        >
          <button
            type="button"
            onClick={goNext}
            disabled={!channelOpen}
            className="w-full rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 py-3 text-sm font-medium text-amber-950 shadow-lg shadow-amber-900/30 hover:from-amber-500 hover:to-amber-400 disabled:opacity-40"
          >
            {!pageInstant ? '点击显示全文' : isLast ? '收下情报' : '下一条情报 →'}
          </button>
          {onLater ? (
            <button
              type="button"
              onClick={onLater}
              className="w-full rounded-xl border border-border/60 py-2.5 text-xs text-muted-foreground hover:bg-card/50"
            >
              稍后查看
            </button>
          ) : null}
        </footer>
      </div>
    </div>
  );
}
