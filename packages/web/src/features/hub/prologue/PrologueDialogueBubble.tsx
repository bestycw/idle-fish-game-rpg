import { cn } from '@/lib/utils';

type DialogueSide = 'player' | 'npc';

function resolveSide(speaker?: string): DialogueSide {
  if (speaker === '你' || speaker === '我') return 'player';
  return 'npc';
}

function avatarLabel(speaker?: string, side?: DialogueSide): string {
  if (side === 'player') return '我';
  if (speaker === '老板') return '老';
  return (speaker?.slice(0, 1) ?? '?');
}

function roleCaption(speaker?: string, side?: DialogueSide): string {
  if (side === 'player') return '你';
  if (speaker === '老板') return '老板 · 语音';
  return speaker ?? '对话';
}

export function PrologueDialogueBubble({
  speaker,
  text,
  className,
  style,
}: {
  speaker?: string;
  text: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const side = resolveSide(speaker);
  const isPlayer = side === 'player';

  return (
    <div
      className={cn(
        'prologue-line-in flex max-w-[96%] gap-2.5',
        isPlayer ? 'ml-auto flex-row-reverse' : 'mr-auto flex-row',
        className,
      )}
      style={style}
    >
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-medium shadow-sm',
          isPlayer
            ? 'border-primary/45 bg-primary/20 text-primary'
            : 'border-slate-400/35 bg-slate-700/50 text-slate-100',
        )}
        aria-hidden
      >
        {avatarLabel(speaker, side)}
      </div>

      <div className={cn('min-w-0 max-w-[min(100%,18rem)]', isPlayer ? 'items-end' : 'items-start')}>
        <p
          className={cn(
            'mb-1 font-mono text-[10px] tracking-wide',
            isPlayer ? 'text-right text-primary/80' : 'text-left text-slate-300/90',
          )}
        >
          {roleCaption(speaker, side)}
        </p>
        <div
          className={cn(
            'prologue-dialogue-bubble relative rounded-2xl border px-3.5 py-2.5 text-sm leading-relaxed sm:text-[15px]',
            isPlayer
              ? 'rounded-tr-md border-primary/35 bg-primary/15 text-foreground'
              : 'rounded-tl-md border-slate-500/40 bg-slate-800/55 text-slate-50',
          )}
        >
          <p>{text}</p>
        </div>
      </div>
    </div>
  );
}
