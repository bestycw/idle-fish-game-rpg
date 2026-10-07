import { ch2GearGuideDialogueBeats } from '@moyu/game-core';
import { useCallback, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { PrologueDialogueBubble } from '../hub/prologue/PrologueDialogueBubble';

type Ch2GearGuideDialogueProps = {
  onGoGear: () => void;
  onDismiss: () => void;
};

/** 第二章碰壁：嘲讽 → 指向猎装（不新开本） */
export function Ch2GearGuideDialogue({ onGoGear, onDismiss }: Ch2GearGuideDialogueProps) {
  const beats = useMemo(() => ch2GearGuideDialogueBeats(), []);
  const [beatIndex, setBeatIndex] = useState(0);
  const isLast = beatIndex >= beats.length - 1;
  const tipBeat = beatIndex >= 2;

  const goNext = useCallback(() => {
    if (isLast) {
      onGoGear();
      return;
    }
    setBeatIndex((i) => i + 1);
  }, [isLast, onGoGear]);

  const visible = beats.slice(0, beatIndex + 1);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-3 sm:items-center sm:p-6"
      role="dialog"
      aria-modal
      aria-labelledby="ch2-gear-guide-title"
    >
      <div className="flex max-h-[min(88vh,34rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-amber-500/35 bg-gradient-to-b from-[#1a1410] via-[#121820] to-[#0a0e14] shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
        <header className="flex items-start justify-between gap-2 border-b border-border/40 px-4 py-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] tracking-[0.18em] text-amber-300/90">
              系统接入 · 变强指引
            </p>
            <h2 id="ch2-gear-guide-title" className="font-display mt-0.5 text-lg tracking-wide">
              {tipBeat ? '去猎装刷装' : '第二章碰壁'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded-lg border border-border/60 px-2.5 py-1 font-mono text-[10px] text-muted-foreground hover:border-amber-500/40 hover:text-amber-200"
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
                ? 'bg-amber-600 text-white shadow-[0_8px_28px_rgba(217,119,6,0.35)] hover:brightness-110'
                : 'bg-primary text-primary-foreground hover:brightness-110',
            )}
          >
            {isLast ? '打开猎装试炼' : '下一句'}
          </button>
        </footer>
      </div>
    </div>
  );
}
