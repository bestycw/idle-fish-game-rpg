import {
  BREAKTHROUGH_LABELS,
  CULTIVATION_NODE_MAIN_PCT,
  CULTIVATION_NODES_PER_TIER,
  cultivationGainLine,
  formatMainPct,
  previewBreakthroughStep,
} from '@moyu/game-core';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

type PerkChip = { tier: number; label: string; effectLine: string };

const LAYER_LABELS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'] as const;

function layerPos(index: number) {
  const angle = (index / CULTIVATION_NODES_PER_TIER) * Math.PI * 2 - Math.PI / 2;
  return {
    left: `${50 + Math.cos(angle) * 40}%`,
    top: `${50 + Math.sin(angle) * 40}%`,
  };
}

export function RealmMeridian({
  templateId,
  currentTier,
  filled,
  cultivateReady,
  breakthroughReady,
  hint,
  xiuwei,
  unlockedPerks,
  nextPerk: _nextPerk,
  owned,
  onCultivate,
  onBreakthrough,
  onGoGacha,
}: {
  templateId: string;
  currentTier: number;
  filled: number;
  cultivateReady: boolean;
  breakthroughReady: boolean;
  hint: string;
  xiuwei: number;
  unlockedPerks: PerkChip[];
  nextPerk: PerkChip | null;
  owned: boolean;
  onCultivate: () => void;
  onBreakthrough: () => void;
  onGoGacha?: () => void;
}) {
  const realm = BREAKTHROUGH_LABELS[currentTier] ?? '境界';
  const nextRealm =
    currentTier < BREAKTHROUGH_LABELS.length - 1
      ? (BREAKTHROUGH_LABELS[currentTier + 1] ?? null)
      : null;
  const lastRealm = BREAKTHROUGH_LABELS[BREAKTHROUGH_LABELS.length - 1];
  const atMax = nextRealm == null;
  const nodesFull = filled >= CULTIVATION_NODES_PER_TIER;
  const perkHere = unlockedPerks.filter((p) => p.tier === currentTier);
  const nextLayer = LAYER_LABELS[Math.min(filled, LAYER_LABELS.length - 1)] ?? '一';
  const layerGain = cultivationGainLine();
  const stackedHere = filled > 0 ? formatMainPct(filled * CULTIVATION_NODE_MAIN_PCT) : null;
  const nextBreak = previewBreakthroughStep(templateId, currentTier);
  const canCultivate = owned && !nodesFull;
  const canBreak = owned && nodesFull && !atMax;
  const primaryReady = nodesFull ? breakthroughReady : cultivateReady;
  const currentRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [currentTier]);

  return (
    <div className="flex h-full min-h-0 overflow-hidden rounded-xl border border-border/70 bg-[#0a0d12]">
      <ol className="realm-rail flex w-[4.6rem] shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-primary/15 px-1.5 py-2">
        {BREAKTHROUGH_LABELS.map((name, tier) => {
          const here = tier === currentTier;
          const done = tier < currentTier;
          return (
            <li
              key={name}
              ref={here ? currentRef : undefined}
              className={cn(
                'relative flex flex-col items-center rounded-md px-0.5 py-1.5',
                here && 'bg-primary/12',
              )}
            >
              {here ? (
                <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
              ) : null}
              <span
                className={cn(
                  'font-display text-[12px] tracking-widest',
                  here && 'text-primary',
                  done && !here && 'text-foreground/70',
                  !here && !done && 'text-muted-foreground/35',
                )}
              >
                {name}
              </span>
              {here ? (
                <span className="mt-0.5 font-mono text-[9px] text-primary/70">
                  {filled}/{CULTIVATION_NODES_PER_TIER}
                </span>
              ) : done ? (
                <span className="mt-0.5 size-1 rounded-full bg-primary/70" />
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 80% 60% at 50% 42%, rgba(226,160,74,0.1), transparent 58%),
              radial-gradient(circle at 50% 100%, rgba(226,160,74,0.04), transparent 46%)
            `,
          }}
        />

        <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-2 pt-3">
          <div className="relative aspect-square w-full max-w-[17.5rem]">
            <svg className="absolute inset-0 h-full w-full text-primary/25" viewBox="0 0 100 100" aria-hidden>
              <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="0.28" />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.55"
                className="realm-ring"
              />
              <circle cx="50" cy="50" r="22" fill="none" stroke="currentColor" strokeWidth="0.25" />
              <path
                d="M50 4 V12 M50 88 V96 M4 50 H12 M88 50 H96"
                stroke="currentColor"
                strokeWidth="0.35"
              />
            </svg>

            {LAYER_LABELS.map((label, i) => {
              const lit = filled > i;
              const next = !nodesFull && i === filled;
              return (
                <button
                  key={label}
                  type="button"
                  disabled={!owned || !next}
                  onClick={onCultivate}
                  aria-label={`${realm}${label}层 · ${layerGain}`}
                  title={`${realm}${label}层 · ${layerGain}`}
                  className="absolute flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                  style={layerPos(i)}
                >
                  <span
                    className={cn(
                      'flex size-8 items-center justify-center rounded-full border font-display text-[13px] transition',
                      lit
                        ? 'border-primary bg-primary text-primary-foreground shadow-[0_0_10px_rgba(226,160,74,0.35)]'
                        : next
                          ? 'border-primary bg-[#16110a] text-primary realm-breathe'
                          : 'border-border/70 bg-[#0b0e13] text-muted-foreground/35',
                    )}
                  >
                    {label}
                  </span>
                </button>
              );
            })}

            <div className="absolute left-1/2 top-1/2 w-[6.5rem] -translate-x-1/2 -translate-y-1/2 text-center">
              <p className="font-mono text-[9px] tracking-[0.38em] text-muted-foreground/65">
                {atMax && nodesFull ? '至境' : '本境'}
              </p>
              <h3 className="font-display mt-0.5 text-[34px] leading-none tracking-[0.2em] text-foreground">
                {realm}
              </h3>
              <p className="mt-1.5 font-mono text-[10px] text-primary/75">
                {nodesFull
                  ? nextRealm
                    ? `圆满 · ${nextRealm}`
                    : lastRealm
                  : `${nextLayer}层 · ${layerGain}`}
              </p>
              {stackedHere ? (
                <p className="mt-0.5 font-mono text-[9px] text-muted-foreground/80">
                  本境已叠 {stackedHere}
                </p>
              ) : (
                <p className="mt-0.5 font-mono text-[9px] text-muted-foreground/70">
                  每层 {layerGain}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="relative shrink-0 px-3 pb-3 pt-1">
          {perkHere.length ? (
            <p className="mb-1.5 text-center font-display text-[11px] leading-snug text-foreground/70">
              {perkHere.map((p) => `${p.label} · ${p.effectLine}`).join('  ')}
            </p>
          ) : currentTier === 0 ? (
            <p className="mb-1.5 text-center font-mono text-[10px] text-muted-foreground/70">
              炼气无破境神通 · 入筑基按职能开肉身
            </p>
          ) : null}
          {!owned ? (
            <button
              type="button"
              onClick={() => onGoGacha?.()}
              className="flex h-11 w-full items-center justify-center rounded-md border border-primary/45 bg-primary/15 font-display text-base text-primary"
            >
              未获得 · 去召唤
            </button>
          ) : (
            <button
              type="button"
              disabled={nodesFull ? !canBreak : !canCultivate}
              onClick={() => (nodesFull ? onBreakthrough() : onCultivate())}
              className={cn(
                'flex h-11 w-full flex-col items-center justify-center rounded-md border transition',
                primaryReady
                  ? 'border-primary bg-primary text-primary-foreground hover:brightness-110'
                  : 'border-border/70 bg-card/40 text-muted-foreground',
              )}
            >
              <span className="font-display text-[16px] leading-none tracking-[0.22em]">
                {nodesFull
                  ? atMax
                    ? `已至${lastRealm}`
                    : `破境 · 入${nextRealm}`
                  : `修炼 · ${nextLayer}层`}
              </span>
              <span className="mt-0.5 font-mono text-[10px] opacity-75">
                {nodesFull && nextBreak
                  ? `${nextBreak.mainLine} · 上限 Lv${nextBreak.levelCap}`
                  : !nodesFull
                    ? layerGain
                    : hint}
              </span>
            </button>
          )}
          <p className="mt-1.5 text-center font-mono text-[10px] leading-snug tabular-nums text-muted-foreground">
            修为 {xiuwei}
            {hint && nodesFull ? ` · ${hint}` : ''}
          </p>
          {nextBreak && nextRealm ? (
            <p className="mt-1 text-center font-mono text-[10px] leading-snug text-primary/80">
              入{nextBreak.toLabel}：{nextBreak.mainLine}
              {nextBreak.perkLabel
                ? ` · ${nextBreak.perkLabel}${nextBreak.perkLine ? `（${nextBreak.perkLine}）` : ''}`
                : ''}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
