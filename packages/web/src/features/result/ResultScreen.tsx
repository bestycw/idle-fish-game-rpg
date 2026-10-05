import {
  EMPTY_SETTLEMENT,
  firstWearableDeployed,
  wearLoot,
  type BattleSettlement,
  type BattleState,
  type Equipment,
  type PlayerState,
} from '@moyu/game-core';
import { useEffect, useState } from 'react';
import { BattleLog } from '../shared/battleLog';
import { cn } from '@/lib/utils';
import {
  BattleSettlementPanel,
  settlementShowsRewardBlock,
} from './BattleSettlementPanel';

type ResultScreenProps = {
  battle: BattleState;
  settlement?: BattleSettlement;
  dungeonName: string;
  battleSource?: 'dungeon' | 'chapter';
  chapterNextBattleHint?: string | null;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerState>>;
  onRestartBattle: () => void;
  onBackToHub: () => void;
  pushNotice: (msg: string) => void;
};

export function ResultScreen({
  battle,
  settlement = EMPTY_SETTLEMENT,
  dungeonName,
  battleSource = 'dungeon',
  chapterNextBattleHint,
  setPlayer,
  onRestartBattle,
  onBackToHub,
  pushNotice,
}: ResultScreenProps) {
  const won = battle.status === 'won';
  const [logOpen, setLogOpen] = useState(false);
  const chapterHasNextBattle =
    battleSource === 'chapter' && won && Boolean(chapterNextBattleHint);
  const restartLabel = chapterHasNextBattle
    ? '下一场战斗'
    : won
      ? '再刷一把'
      : '重整再战';

  const showRewardBlock = won && settlementShowsRewardBlock(settlement);

  useEffect(() => {
    if (!logOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLogOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [logOpen]);

  const wearLootItem = (item: Equipment) => {
    setPlayer((p) => {
      const wearer = firstWearableDeployed(p, item);
      if (!wearer) {
        pushNotice(`无人可穿（装等 ${item.itemLevel}）`);
        return p;
      }
      pushNotice(`已穿戴 ${item.name}`);
      return wearLoot(p, item.id);
    });
  };

  const showSecondaryRestart =
    chapterHasNextBattle || !won || battleSource === 'dungeon';

  return (
    <div className="result-stage relative flex min-h-0 w-full flex-1 flex-col overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 result-stage-vignette"
        aria-hidden
      />
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 h-[min(52vh,28rem)]',
          won
            ? 'bg-[radial-gradient(ellipse_90%_70%_at_50%_0%,rgba(226,160,74,0.16),transparent_72%)]'
            : 'bg-[radial-gradient(ellipse_90%_60%_at_50%_0%,rgba(248,113,113,0.08),transparent_70%)]',
        )}
        aria-hidden
      />

      <div className="relative z-[1] flex min-h-0 flex-1 flex-col px-1 sm:px-2">
        <div className="flex flex-1 flex-col items-center justify-center px-4 pb-6 pt-6 sm:px-8 sm:pt-10">
          <p className="text-xs tracking-[0.25em] text-muted-foreground/90">{dungeonName}</p>

          <div className="result-victory-seal mt-10 sm:mt-14">
            {won ? (
              <>
                <p className="text-center font-display text-5xl tracking-[0.35em] text-foreground sm:text-6xl">
                  胜利
                </p>
                <div
                  className="mx-auto mt-6 h-px w-16 bg-gradient-to-r from-transparent via-primary/70 to-transparent sm:mt-8 sm:w-24"
                  aria-hidden
                />
              </>
            ) : (
              <>
                <p className="text-center font-display text-5xl tracking-[0.28em] text-foreground/90 sm:text-6xl">
                  战败
                </p>
                <p className="mt-8 max-w-xs text-center text-sm leading-relaxed text-muted-foreground">
                  阵脚已散。需要时可翻开战报，自己琢磨下一手。
                </p>
              </>
            )}
          </div>

          {chapterHasNextBattle ? (
            <p className="mt-8 text-center text-sm text-muted-foreground">
              本节尚有后续交战
            </p>
          ) : null}
          {chapterHasNextBattle && chapterNextBattleHint ? (
            <p className="mt-2 text-center text-xs tracking-wide text-primary/80">
              {chapterNextBattleHint}
            </p>
          ) : null}

          {showRewardBlock ? (
            <div className="mt-12 w-full max-w-lg sm:mt-16">
              <BattleSettlementPanel
                variant="stage"
                settlement={settlement}
                onWearLoot={settlement.equipment ? wearLootItem : undefined}
              />
            </div>
          ) : won ? (
            <p className="mt-12 text-center text-sm text-muted-foreground/80">本战无额外掉落</p>
          ) : null}
        </div>

        <footer className="shrink-0 space-y-4 px-4 pb-6 pt-2 sm:px-6 sm:pb-8">
          <div
            className={cn(
              'grid gap-3',
              showSecondaryRestart ? 'grid-cols-2' : 'grid-cols-1',
            )}
          >
            {showSecondaryRestart ? (
              <button
                type="button"
                onClick={onRestartBattle}
                className="rounded-2xl border border-border/60 bg-card/30 py-4 text-sm font-medium text-foreground/85 backdrop-blur-sm transition hover:bg-card/50"
              >
                {restartLabel}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onBackToHub}
              className={cn(
                'rounded-2xl py-4 text-sm font-medium transition',
                showSecondaryRestart
                  ? 'bg-primary text-primary-foreground hover:brightness-110'
                  : 'bg-primary py-[1.125rem] text-base text-primary-foreground shadow-[0_8px_32px_rgba(226,160,74,0.22)] hover:brightness-110',
              )}
            >
              {chapterHasNextBattle ? '稍后继续' : '返回冒险'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setLogOpen(true)}
            className="block w-full py-1 text-center text-xs tracking-[0.2em] text-muted-foreground/80 transition hover:text-foreground/70"
          >
            本场战报
          </button>
        </footer>
      </div>

      {logOpen ? (
        <div
          className="fixed inset-0 z-[60] flex flex-col justify-end bg-black/55 backdrop-blur-[3px]"
          role="dialog"
          aria-modal="true"
          aria-label="本场战报"
          onClick={() => setLogOpen(false)}
        >
          <div
            className="result-log-sheet mx-auto flex max-h-[min(78vh,32rem)] w-full max-w-lg flex-col rounded-t-3xl border border-border/50 bg-[#0a0e14]/98 shadow-[0_-16px_64px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
              <span className="font-display text-sm tracking-[0.2em] text-foreground/90">战报</span>
              <button
                type="button"
                className="rounded-lg px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setLogOpen(false)}
              >
                收起
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
              <BattleLog battle={battle} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
