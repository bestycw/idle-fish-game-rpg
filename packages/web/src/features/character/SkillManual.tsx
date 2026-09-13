import type { SkillDisplayInfo, StarTrackRow } from '@moyu/game-core';
import { useEffect, useRef } from 'react';
import { LinkedCopy } from '../shared/TermGloss';
import { cn } from '@/lib/utils';

type PerkChip = { label: string; text: string };

export function SkillManual({
  skill,
  specLabel,
  currentStar,
  starCap,
  rows,
  pendingStars,
  focusStar,
  respecCost,
  owned,
  starReady,
  starCostLine,
  starEffectLine,
  starPct,
  exchangeReady,
  exchangeHint,
  onPickBranch,
  onStarUp,
  onExchange,
  onGoGacha,
}: {
  skill: SkillDisplayInfo;
  specLabel?: string | null;
  currentStar: number;
  starCap: number;
  rows: StarTrackRow[];
  pendingStars: number[];
  focusStar: number | null;
  respecCost: number;
  owned: boolean;
  starReady: boolean;
  starCostLine: string;
  starEffectLine: string;
  starPct: number;
  exchangeReady: boolean;
  exchangeHint: string;
  onPickBranch: (star: number, branchId: string) => void;
  onStarUp: () => void;
  onExchange: () => void;
  onGoGacha?: () => void;
}) {
  const focusRef = useRef<HTMLLIElement | null>(null);
  const meta = [specLabel, skill.targetPattern, skill.damageSchool === 'spirit' ? '灵系' : '力系']
    .filter(Boolean)
    .join(' · ');

  const inscriptions: PerkChip[] = [];
  if (skill.morphLine) inscriptions.push({ label: '形态', text: skill.morphLine });

  const pending = pendingStars[0];

  useEffect(() => {
    focusRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [focusStar, pending]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border/70 bg-[#0a0d12]">
      <section className="relative shrink-0 border-b border-primary/15 px-3 pb-2.5 pt-2.5">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 90% 70% at 18% 0%, rgba(226,160,74,0.1), transparent 52%),
              linear-gradient(180deg, rgba(226,160,74,0.04), transparent 70%)
            `,
          }}
        />
        <div className="relative flex items-start gap-2.5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-md border border-primary/40 bg-primary/12 font-display text-xl text-primary">
            {skill.name.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display truncate text-[1.15rem] leading-tight tracking-wide">
              {skill.name}
            </h3>
            <p className="mt-0.5 font-mono text-[10px] text-primary/70">
              瞬发 · 耗能 {skill.qiCost}
              {owned ? '' : ' · 预览'}
              {meta ? ` · ${meta}` : ''}
            </p>
          </div>
        </div>

        <p className="relative mt-2.5 text-[13px] leading-[1.65] text-foreground/90">
          <LinkedCopy text={skill.rulesLine} />
        </p>

        {inscriptions.length > 0 ? (
          <ul className="relative mt-2 space-y-1">
            {inscriptions.map((row) => (
              <li key={row.label} className="flex gap-2 text-[11px] leading-snug">
                <span className="shrink-0 font-mono tracking-[0.12em] text-primary/70">{row.label}</span>
                <span className="min-w-0 text-foreground/80">
                  <LinkedCopy text={row.text} />
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between px-3 py-2">
          <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground">
            星章 · ★{currentStar}/{starCap}
          </p>
          <ol className="flex items-center gap-1" aria-hidden>
            {Array.from({ length: starCap }, (_, i) => {
              const n = i + 1;
              const lit = n <= currentStar;
              const next = n === currentStar + 1;
              return (
                <li
                  key={n}
                  className={cn(
                    'size-1.5 rounded-full',
                    lit && 'bg-primary',
                    next && 'skill-star-pulse bg-primary/50',
                    !lit && !next && 'bg-primary/18',
                  )}
                />
              );
            })}
          </ol>
        </div>

        {pendingStars.length > 0 ? (
          <p className="mx-3 mb-1.5 font-mono text-[11px] tracking-[0.08em] text-primary/80">
            ★{pendingStars.join('、★')} 选定分支
          </p>
        ) : null}

        <ol className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 pb-3">
          {rows.map((n) => {
            const isBranchRow = Boolean(n.branches?.length);
            const canChoose = isBranchRow && !n.followsIdentity;
            const needsPick = n.unlocked && canChoose && !n.chosenBranch;
            const focused = focusStar === n.star || pendingStars.includes(n.star);
            const here = n.star === currentStar || needsPick || focused;
            return (
              <li
                key={n.star}
                ref={focused || needsPick ? focusRef : undefined}
                className={cn(
                  'relative rounded-lg border px-2.5 py-2',
                  n.unlocked
                    ? 'border-primary/20 bg-primary/6'
                    : 'border-border/40 bg-transparent',
                  here && 'border-primary/45 bg-primary/10',
                )}
              >
                <div className="flex items-baseline gap-2">
                  <span
                    className={cn(
                      'font-display text-[13px] tracking-widest',
                      n.unlocked ? 'text-primary' : 'text-muted-foreground/45',
                    )}
                  >
                    ★{n.star}
                  </span>
                  <span
                    className={cn(
                      'min-w-0 truncate text-[13px]',
                      n.unlocked ? 'text-foreground' : 'text-muted-foreground/70',
                    )}
                  >
                    {n.label}
                  </span>
                  {isBranchRow ? (
                    <span
                      className={cn(
                        'shrink-0 rounded border px-1 py-px font-mono text-[9px] tracking-[0.16em]',
                        n.unlocked
                          ? 'border-primary/30 text-primary/80'
                          : 'border-border/50 text-muted-foreground/55',
                      )}
                    >
                      分支
                    </span>
                  ) : null}
                  {!n.unlocked ? (
                    <span className="ml-auto shrink-0 font-mono text-[9px] text-muted-foreground/50">
                      未点亮
                    </span>
                  ) : needsPick ? (
                    <span className="ml-auto shrink-0 font-mono text-[9px] text-primary">待选</span>
                  ) : null}
                </div>

                {!isBranchRow ? (
                  <p className="mt-1 text-[12px] leading-[1.55] text-foreground/80">
                    <LinkedCopy text={n.effectLine} />
                  </p>
                ) : null}

                {isBranchRow && n.branches ? (
                  <div
                    className={cn(
                      'mt-2 grid gap-1.5',
                      n.branches.length === 2 ? 'grid-cols-2' : 'grid-cols-1',
                    )}
                  >
                    {n.branches.map((b) => {
                      const chosen = n.chosenBranch === b.id;
                      const locked = !n.unlocked;
                      const canPick = n.unlocked && canChoose && !chosen && owned;
                      const respecLabel = respecCost === 0 ? '今日首次免费' : `${respecCost} 星尘`;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          disabled={!canPick}
                          onClick={() => onPickBranch(n.star, b.id)}
                          className={cn(
                            'min-h-11 rounded-md border px-2 py-2 text-left transition',
                            chosen && 'border-primary/55 bg-primary/16 text-foreground',
                            locked &&
                              'cursor-default border-border/35 bg-transparent text-muted-foreground/55',
                            n.followsIdentity && 'cursor-default',
                            n.followsIdentity &&
                              !chosen &&
                              'border-border/35 bg-transparent text-muted-foreground/55',
                            canPick &&
                              !n.chosenBranch &&
                              'border-primary/40 bg-primary/8 hover:bg-primary/14',
                            canPick &&
                              n.chosenBranch &&
                              'border-border/50 bg-card/20 text-muted-foreground hover:border-primary/40 hover:text-foreground',
                          )}
                        >
                          <span className="flex items-baseline justify-between gap-1">
                            <span className="min-w-0 truncate text-[12px] font-medium leading-tight">
                              {b.identityLabel ?? b.label}
                            </span>
                            {chosen ? (
                              <span className="shrink-0 font-mono text-[9px] tracking-[0.14em] text-primary">
                                当前
                              </span>
                            ) : null}
                          </span>
                          <span className="mt-0.5 block text-[11px] leading-[1.5] text-foreground/75">
                            <LinkedCopy text={b.effectLine} />
                          </span>
                          {n.unlocked && canChoose && n.chosenBranch && !chosen ? (
                            <span className="mt-1 block text-[10px] text-primary/80">
                              重洗 · {respecLabel}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>

        <div className="shrink-0 border-t border-primary/15 px-3 py-2.5">
          {!owned ? (
            <button
              type="button"
              onClick={() => onGoGacha?.()}
              className="flex h-11 w-full items-center justify-center rounded-md border border-primary/45 bg-primary/15 font-display text-base text-primary"
            >
              未获得 · 去召唤
            </button>
          ) : (
            <div className="flex overflow-hidden rounded-md border border-primary/40">
              <button
                type="button"
                disabled={!starReady}
                onClick={onStarUp}
                className={cn(
                  'flex min-h-11 min-w-0 flex-1 flex-col justify-center px-3 py-1.5 text-left transition',
                  starReady
                    ? 'bg-primary text-primary-foreground hover:brightness-110'
                    : 'bg-card/40 text-muted-foreground',
                )}
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-display text-[16px] tracking-[0.18em]">升星</span>
                  <span className="truncate font-mono text-[10px] opacity-80">{starCostLine}</span>
                </span>
                {starEffectLine ? (
                  <span className="mt-0.5 truncate font-mono text-[10px] opacity-75">
                    <LinkedCopy text={starEffectLine} />
                  </span>
                ) : null}
                <span className="mt-1.5 h-0.5 overflow-hidden rounded-full bg-black/25">
                  <span
                    className="block h-full bg-current opacity-70"
                    style={{ width: `${starPct}%` }}
                  />
                </span>
              </button>
              <button
                type="button"
                title={exchangeHint}
                disabled={!exchangeReady}
                onClick={onExchange}
                className={cn(
                  'shrink-0 border-l px-3 font-display text-[15px] tracking-[0.2em]',
                  exchangeReady
                    ? 'border-primary/40 bg-primary/15 text-primary hover:brightness-110'
                    : 'cursor-not-allowed border-border/50 bg-card/30 text-muted-foreground/45',
                )}
              >
                兑
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
