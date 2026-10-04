import type { ChapterRouteStop, ChapterTick, PlayerState } from '@moyu/game-core';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { MainlineChapterTicks } from './MainlineChapterTicks';
import { MainlineSectionStrip } from './MainlineSectionStrip';
import { VolumeMapDialog } from './VolumeMapDialog';

export type MainlineJourneyCardProps = {
  player: PlayerState;
  chapterTitle: string;
  chapterFinished: boolean;
  sectionTotal: number;
  sectionCurrent: number;
  here: string | null;
  blurb: string;
  skinStub: boolean;
  battleWaveLine: string | null;
  recommendedPower: number;
  deployedPower: number;
  showBattleMeta: boolean;
  ctaLabel: string;
  onEnter: () => void;
  ticks: ChapterTick[];
  stops: ChapterRouteStop[];
  onSelectStop: (stop: ChapterRouteStop) => void;
  labelForStop: (stop: ChapterRouteStop) => { place: string; title: string };
  onMapNotice?: (message: string) => void;
};

export function MainlineJourneyCard({
  player,
  chapterTitle,
  chapterFinished,
  sectionTotal,
  sectionCurrent,
  here,
  blurb,
  skinStub,
  battleWaveLine,
  recommendedPower,
  deployedPower,
  showBattleMeta,
  ctaLabel,
  onEnter,
  ticks,
  stops,
  onSelectStop,
  labelForStop,
  onMapNotice,
}: MainlineJourneyCardProps) {
  const [mapOpen, setMapOpen] = useState(false);

  return (
    <>
      <article className="rounded-xl border border-primary/20 bg-card/50 p-3 shadow-sm backdrop-blur-sm sm:p-3.5">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] tracking-[0.16em] text-primary/80">主线</p>
            <h2 className="font-display truncate text-lg tracking-wide sm:text-xl">{chapterTitle}</h2>
            {!chapterFinished ? (
              <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                第 {sectionCurrent}/{sectionTotal} 节
                {battleWaveLine ? ` · ${battleWaveLine}` : ''}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setMapOpen(true)}
            className="shrink-0 rounded-lg border border-primary/35 bg-primary/10 px-2.5 py-1.5 font-mono text-[10px] text-primary hover:bg-primary/20"
          >
            地图
          </button>
        </header>

        {!chapterFinished ? (
          <>
            <div className="mt-2.5 space-y-2 border-y border-border/40 py-2">
              <MainlineChapterTicks ticks={ticks} />
              <MainlineSectionStrip
                stops={stops}
                onSelect={onSelectStop}
                labelForStop={labelForStop}
              />
              <button
                type="button"
                onClick={() => setMapOpen(true)}
                className="w-full text-left font-mono text-[10px] text-muted-foreground hover:text-primary"
              >
                地图：选城镇与场景，人物同页
              </button>
            </div>

            <div className="mt-2.5 space-y-1.5">
              {here ? (
                <p className="truncate text-sm font-medium text-primary/90">此地 · {here}</p>
              ) : null}
              {skinStub ? (
                <p className="font-mono text-[9px] text-muted-foreground">定参已保存 · 文案润色后续更新</p>
              ) : null}
              <p className="line-clamp-2 text-sm leading-relaxed text-foreground/85">{blurb}</p>
              {showBattleMeta ? (
                <p className="font-mono text-[10px] text-muted-foreground">
                  建议战力 {recommendedPower}
                  {deployedPower > 0 ? ` · 出战 ${deployedPower}` : ''}
                </p>
              ) : null}
            </div>

            {ctaLabel ? (
              <button
                type="button"
                onClick={onEnter}
                className={cn(
                  'mt-3 w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground',
                  'shadow-md shadow-primary/15 hover:brightness-110',
                )}
              >
                {ctaLabel}
              </button>
            ) : null}
          </>
        ) : (
          <div className="mt-2 space-y-2">
            <p className="line-clamp-2 text-sm text-muted-foreground">{blurb}</p>
            <p className="font-mono text-[10px] text-muted-foreground">卷一主线已通关</p>
            <button
              type="button"
              onClick={() => setMapOpen(true)}
              className="font-mono text-[10px] text-primary underline-offset-2 hover:underline"
            >
              仍要查看卷一地图与人物
            </button>
          </div>
        )}
      </article>

      <VolumeMapDialog
        player={player}
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        onMapNotice={onMapNotice}
      />
    </>
  );
}
