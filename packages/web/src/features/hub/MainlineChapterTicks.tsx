import type { ChapterTick } from '@moyu/game-core';
import { cn } from '@/lib/utils';

const CHAPTER_NUM = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'] as const;

type MainlineChapterTicksProps = {
  ticks: ChapterTick[];
};

/** 卷一十章 · 紧凑章序 */
export function MainlineChapterTicks({ ticks }: MainlineChapterTicksProps) {
  return (
    <ol className="flex flex-wrap gap-1" aria-label="卷一章节">
      {ticks.map((tick) => (
        <li key={tick.order}>
          <span
            title={tick.name}
            className={cn(
              'inline-flex h-5 min-w-5 items-center justify-center rounded font-mono text-[9px]',
              tick.status === 'current' && 'bg-primary text-primary-foreground',
              tick.status === 'cleared' && 'bg-primary/20 text-primary/90',
              tick.status === 'ahead' && 'bg-muted/80 text-muted-foreground',
            )}
          >
            {CHAPTER_NUM[tick.order - 1] ?? tick.order}
          </span>
        </li>
      ))}
    </ol>
  );
}
