import { cn } from '@/lib/utils';

type NarrativeProps = {
  title?: string;
  eyebrow?: string;
  paragraphs: string[];
  className?: string;
  children?: React.ReactNode;
};

/** 叙事主栏：像在读章节正文 */
export function Narrative({ title, eyebrow, paragraphs, className, children }: NarrativeProps) {
  return (
    <article className={cn('narrative-enter space-y-4', className)}>
      {eyebrow ? (
        <p className="font-mono text-[11px] tracking-[0.18em] text-primary/80 uppercase">
          {eyebrow}
        </p>
      ) : null}
      {title ? (
        <h2 className="font-display text-2xl leading-tight tracking-wide text-foreground sm:text-[1.7rem]">
          {title}
        </h2>
      ) : null}
      <div className="space-y-3 text-[15px] leading-[1.85] text-foreground/90">
        {paragraphs.map((p, i) => (
          <p key={`${i}-${p.slice(0, 12)}`} className="text-pretty">
            {p}
          </p>
        ))}
      </div>
      {children}
    </article>
  );
}
