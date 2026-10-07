import { ch1EliteDefeatDialogueBeats } from '@moyu/game-core';
import { useCallback, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { PrologueDialogueBubble } from '../hub/prologue/PrologueDialogueBubble';

type TeachGateDialogueProps = {
  onGoGacha: () => void;
  onDismiss: () => void;
};

/**
 * 第一章第一阵精锐战败：嘲讽 → 发券 → 推向召唤。
 */
export function TeachGateDialogue({ onGoGacha, onDismiss }: TeachGateDialogueProps) {
  const beats = useMemo(() => ch1EliteDefeatDialogueBeats(), []);
  const [beatIndex, setBeatIndex] = useState(0);
  const isLast = beatIndex >= beats.length - 1;
  const grantBeat = beatIndex >= 3;

  const goNext = useCallback(() => {
    if (isLast) {
      onGoGacha();
      return;
    }
    setBeatIndex((i) => i + 1);
  }, [isLast, onGoGacha]);

  const visible = beats.slice(0, beatIndex + 1);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-3 sm:items-center sm:p-6"
      role="dialog"
      aria-modal
      aria-labelledby="teach-gate-title"
    >
      <div className="flex max-h-[min(88vh,34rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-teal-500/35 bg-gradient-to-b from-[#0f1a1c] via-[#121820] to-[#0a0e14] shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
        <header className="flex items-start justify-between gap-2 border-b border-border/40 px-4 py-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] tracking-[0.18em] text-teal-300/90">
              系统接入 · 教学门
            </p>
            <h2 id="teach-gate-title" className="font-display mt-0.5 text-lg tracking-wide">
              {grantBeat ? '新人福利到账' : '精锐把门'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded-lg border border-border/60 px-2.5 py-1 font-mono text-[10px] text-muted-foreground hover:border-teal-500/40 hover:text-teal-200"
          >
            稍后再说
          </button>
        </header>

        <div
          role="button"
          tabIndex={0}
          onClick={goNext}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              goNext();
            }
          }}
          className="min-h-0 flex-1 cursor-pointer space-y-3 overflow-y-auto px-3 py-4"
        >
          {visible.map((line, i) => (
            <PrologueDialogueBubble
              key={`${i}-${line.speaker}`}
              speaker={line.speaker}
              text={line.text}
            />
          ))}
          {grantBeat ? (
            <div className="mx-auto max-w-xs rounded-xl border border-amber-400/40 bg-amber-950/35 px-3 py-2.5 text-center">
              <p className="font-mono text-[10px] tracking-widest text-amber-200/80">获得</p>
              <p className="font-display mt-0.5 text-xl text-amber-100">抽卡券 ×1</p>
            </div>
          ) : null}
          {!isLast ? (
            <p className="text-center font-mono text-[10px] text-muted-foreground/80">
              点击继续 · 下一句
            </p>
          ) : null}
        </div>

        <footer className="border-t border-border/40 p-3">
          <button
            type="button"
            onClick={goNext}
            className={cn(
              'w-full rounded-xl py-3 text-sm font-medium transition',
              isLast
                ? 'bg-teal-600 text-white shadow-[0_8px_28px_rgba(13,148,136,0.35)] hover:brightness-110'
                : 'bg-primary text-primary-foreground hover:brightness-110',
            )}
          >
            {isLast ? '去召唤补蓝卡' : '下一句'}
          </button>
        </footer>
      </div>
    </div>
  );
}
