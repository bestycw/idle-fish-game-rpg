import type { NarrativeDialogueBeat } from '@moyu/game-core';
import { useCallback, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { PrologueDialogueBubble } from './prologue/PrologueDialogueBubble';

type MainlineStoryDialogueProps = {
  place: string;
  title: string;
  heroName: string;
  beats: NarrativeDialogueBeat[];
  onComplete: () => void;
};

function isPlayerSpeaker(speaker: string, heroName: string): boolean {
  return speaker === heroName || speaker === '你' || speaker === '我' || speaker === '旅人';
}

export function MainlineStoryDialogue({
  place,
  title,
  heroName,
  beats,
  onComplete,
}: MainlineStoryDialogueProps) {
  const [beatIndex, setBeatIndex] = useState(0);
  /** choice beat 下标 → 玩家选中的 reply 文本 */
  const [choiceReplyByBeat, setChoiceReplyByBeat] = useState<Record<number, string>>({});

  const current = beats[beatIndex];
  const choicePending =
    current?.kind === 'choice' && choiceReplyByBeat[beatIndex] === undefined;

  const displayLines = useMemo(() => {
    const out: { speaker: string; text: string; key: string }[] = [];
    for (let i = 0; i < beats.length; i++) {
      if (i > beatIndex) break;
      const b = beats[i]!;
      if (b.kind === 'line') {
        out.push({ speaker: b.speaker, text: b.text, key: `line-${i}` });
      } else {
        const reply = choiceReplyByBeat[i];
        if (reply) {
          out.push({ speaker: heroName, text: reply, key: `choice-reply-${i}` });
        }
      }
    }
    return out;
  }, [beats, beatIndex, choiceReplyByBeat, heroName]);

  const goNextBeat = useCallback(() => {
    if (beatIndex >= beats.length - 1) {
      onComplete();
      return;
    }
    setBeatIndex((i) => i + 1);
  }, [beatIndex, beats.length, onComplete]);

  const pickChoice = useCallback(
    (beatIdx: number, reply: string) => {
      setChoiceReplyByBeat((m) => ({ ...m, [beatIdx]: reply }));
      if (beatIdx >= beats.length - 1) {
        onComplete();
        return;
      }
      setBeatIndex(beatIdx + 1);
    },
    [beats.length, onComplete],
  );

  const skipAll = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const tapAdvance = useCallback(() => {
    if (choicePending) return;
    if (current?.kind === 'line') goNextBeat();
  }, [choicePending, current?.kind, goNextBeat]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-3 sm:items-center sm:p-6"
      role="dialog"
      aria-modal
      aria-labelledby="mainline-dialogue-title"
    >
      <div className="flex max-h-[min(88vh,32rem)] w-full max-w-lg flex-col rounded-2xl border border-primary/30 bg-gradient-to-b from-[#121820] to-[#0a0e14] shadow-2xl">
        <header className="flex items-start justify-between gap-2 border-b border-border/40 px-4 py-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] tracking-widest text-primary/85">主线 · {place}</p>
            <h2 id="mainline-dialogue-title" className="font-display mt-0.5 text-lg tracking-wide">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={skipAll}
            className="shrink-0 rounded-lg border border-border/60 px-2.5 py-1 font-mono text-[10px] text-muted-foreground hover:border-primary/40 hover:text-primary"
          >
            跳过
          </button>
        </header>

        <div
          role="button"
          tabIndex={0}
          onClick={tapAdvance}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              tapAdvance();
            }
          }}
          className="min-h-0 flex-1 cursor-pointer space-y-3 overflow-y-auto px-3 py-4"
        >
          {displayLines.map((line) => (
            <PrologueDialogueBubble
              key={line.key}
              speaker={isPlayerSpeaker(line.speaker, heroName) ? '你' : line.speaker}
              text={line.text}
            />
          ))}
          {choicePending && current?.kind === 'choice' ? (
            <div
              className="rounded-xl border border-primary/20 bg-card/40 p-3"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <p className="mb-2 text-sm text-foreground/90">
                {current.speaker ? (
                  <>
                    <span className="text-primary/90">{current.speaker}：</span>
                    {current.prompt}
                  </>
                ) : (
                  current.prompt
                )}
              </p>
              <div className="flex flex-col gap-2">
                {current.options.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => pickChoice(beatIndex, opt.reply)}
                    className={cn(
                      'rounded-lg border border-border/60 bg-background/60 px-3 py-2.5 text-left text-sm',
                      'hover:border-primary/40 hover:bg-primary/10',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {!choicePending && current?.kind === 'line' ? (
            <p className="text-center font-mono text-[10px] text-muted-foreground/80">
              点击空白或按空格 · 下一句
            </p>
          ) : null}
        </div>

        <footer className="border-t border-border/40 p-3">
          {choicePending ? (
            <p className="text-center text-xs text-muted-foreground">选一句作回应（或点右上角跳过）</p>
          ) : (
            <button
              type="button"
              onClick={goNextBeat}
              className={cn(
                'w-full rounded-xl py-3 text-sm font-medium',
                'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:brightness-110',
              )}
            >
              {beatIndex >= beats.length - 1 ? '继续路程' : '下一句'}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
