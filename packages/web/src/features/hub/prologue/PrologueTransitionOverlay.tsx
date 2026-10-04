import { cn } from '@/lib/utils';

export type PrologueTransitionKind = 'flash-white' | 'flash-glitch' | 'fade-void';

export function PrologueTransitionOverlay({ kind }: { kind: PrologueTransitionKind }) {
  return (
    <div
      className={cn(
        'prologue-transition pointer-events-none fixed inset-0 z-[200] flex items-center justify-center',
        kind === 'flash-white' && 'prologue-transition-white',
        kind === 'flash-glitch' && 'prologue-transition-glitch',
        kind === 'fade-void' && 'prologue-transition-void',
      )}
      aria-hidden
    >
      {kind === 'fade-void' ? (
        <p className="prologue-transition-caption font-mono text-[11px] tracking-[0.2em] text-indigo-200/90">
          裂隙通道
        </p>
      ) : null}
    </div>
  );
}
