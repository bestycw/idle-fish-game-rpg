import type { PrologueLine } from '@moyu/game-core';
import { cn } from '@/lib/utils';
import { PrologueDialogueBubble } from './PrologueDialogueBubble';
import { PrologueTypewriter } from './PrologueTypewriter';

export function PrologueLineView({
  line,
  visible,
  index,
  emphasisTyping,
  pageInstant,
}: {
  line: PrologueLine;
  visible: boolean;
  index: number;
  /** 本页唯一正在打字的 emphasis 行 */
  emphasisTyping?: boolean;
  pageInstant?: boolean;
}) {
  if (!visible) return null;

  const delay = `${Math.min(index * 40, 320)}ms`;

  if (line.kind === 'divider') {
    return (
      <div
        className="prologue-line-in my-2 h-px bg-gradient-to-r from-transparent via-border to-transparent"
        style={{ animationDelay: delay }}
      />
    );
  }

  if (line.kind === 'emphasis') {
    return (
      <p
        className="prologue-line-in prologue-emphasis font-display text-lg leading-snug tracking-wide text-primary sm:text-xl"
        style={{ animationDelay: delay }}
      >
        <PrologueTypewriter
          text={line.text}
          visible={visible}
          active={!!emphasisTyping}
          instant={!!pageInstant}
        />
      </p>
    );
  }

  if (line.kind === 'draft') {
    return (
      <div
        className="prologue-line-in prologue-draft rounded-lg border border-slate-500/45 bg-slate-900/50 px-3 py-2"
        style={{ animationDelay: delay }}
      >
        <p className="font-mono text-[9px] tracking-wide text-slate-400">输入框 · 未发送</p>
        <p className="mt-1 font-mono text-[13px] leading-relaxed text-rose-200/90 sm:text-sm">
          {line.text}
        </p>
      </div>
    );
  }

  if (line.kind === 'system') {
    const syncPanel =
      line.speaker?.includes('同步') ||
      line.speaker?.includes('原世界') ||
      line.speaker?.includes('裂隙·预读');
    return (
      <div
        className={cn(
          'prologue-line-in prologue-system rounded-lg border px-3 py-2',
          syncPanel
            ? 'prologue-system-sync border-cyan-500/35 bg-cyan-950/30'
            : 'border-amber-500/40 bg-amber-950/35',
          line.speaker?.includes('补偿') || line.speaker?.includes('跨维')
            ? 'prologue-system-glitch'
            : undefined,
        )}
        style={{ animationDelay: delay }}
      >
        {line.speaker ? (
          <p
            className={cn(
              'font-mono text-[9px] uppercase tracking-[0.16em]',
              syncPanel ? 'text-cyan-200/75' : 'text-amber-200/70',
            )}
          >
            {line.speaker}
          </p>
        ) : null}
        <p
          className={cn(
            'mt-0.5 font-mono text-[12px] leading-relaxed sm:text-[13px]',
            syncPanel ? 'text-cyan-50/95' : 'text-amber-50/95',
          )}
        >
          {line.text}
        </p>
      </div>
    );
  }

  if (line.kind === 'dialogue') {
    return (
      <PrologueDialogueBubble
        speaker={line.speaker}
        text={line.text}
        style={{ animationDelay: delay }}
      />
    );
  }

  if (line.kind === 'inner') {
    return (
      <div className="prologue-line-in flex gap-2.5 sm:gap-3" style={{ animationDelay: delay }}>
        <span className="prologue-inner-tag mt-0.5 shrink-0 self-start rounded-md border border-border/60 bg-muted/30 px-1.5 py-0.5 font-mono text-[9px] tracking-wide text-muted-foreground">
          内心
        </span>
        <p className="min-w-0 text-sm italic leading-relaxed text-muted-foreground sm:text-[15px]">
          {line.text}
        </p>
      </div>
    );
  }

  return (
    <p
      className="prologue-line-in text-sm leading-[1.65] text-foreground/92 sm:text-[15px]"
      style={{ animationDelay: delay }}
    >
      {line.text}
    </p>
  );
}
