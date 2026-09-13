import {
  getTerm,
  splitByTermNames,
  takeLocalNote,
  termIdByName,
} from '@moyu/game-core';
import { useState, type ReactNode } from 'react';
import { Popover } from 'radix-ui';
import { cn } from '@/lib/utils';

export function TermPop({
  id,
  children,
  className,
  localNote,
}: {
  id: string;
  children: ReactNode;
  className?: string;
  localNote?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const focus = getTerm(id);
  const note = localNote?.trim() || null;

  if (!focus) return <>{children}</>;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <span
          role="button"
          tabIndex={0}
          onClick={(ev) => ev.stopPropagation()}
          className={cn(
            'cursor-pointer border-b border-dotted border-primary/55 text-primary/90 hover:border-primary hover:text-primary',
            className,
          )}
        >
          {children}
        </span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={6}
          collisionPadding={12}
          onOpenAutoFocus={(ev) => ev.preventDefault()}
          onClick={(ev) => ev.stopPropagation()}
          className="z-[70] w-[min(17.5rem,calc(100vw-1.5rem))] rounded-lg border border-primary/35 bg-[#10141c] px-3 py-2.5 shadow-[0_10px_28px_rgba(0,0,0,0.55)] outline-none"
        >
          <p className="font-body text-[15px] font-medium tracking-wide text-primary">{focus.name}</p>

          {note ? (
            /^[+×xX−-]/.test(note) || /^\d/.test(note) ? (
              <p className="mt-1.5 font-body text-[1.35rem] leading-none tabular-nums text-primary">
                {note}
              </p>
            ) : (
              <p className="mt-1.5 text-[12px] leading-snug text-primary/90">{note}</p>
            )
          ) : null}

          <p className="mt-2 text-[12px] leading-relaxed text-foreground/78">{focus.blurb}</p>
          <Popover.Arrow className="fill-[#10141c]" width={10} height={6} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function TermLabel({ label, className }: { label: string; className?: string }) {
  const id = termIdByName(label);
  if (!id) return <span className={className}>{label}</span>;
  return (
    <TermPop id={id} className={className}>
      {label}
    </TermPop>
  );
}

export function LinkedCopy({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const spans = splitByTermNames(text);
  return (
    <span className={className}>
      {spans.map((span, i) => {
        if (span.kind === 'text') {
          return <span key={i}>{span.value}</span>;
        }
        const next = spans[i + 1];
        const note = next?.kind === 'text' ? takeLocalNote(next.value) : null;
        return (
          <TermPop key={`${span.id}-${i}`} id={span.id} localNote={note}>
            {span.name}
          </TermPop>
        );
      })}
    </span>
  );
}
