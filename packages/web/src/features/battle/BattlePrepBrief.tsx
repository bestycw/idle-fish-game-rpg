import { encounterDisplayTier } from '@moyu/game-core';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type BattlePrepBriefProps = {
  encounterId: string;
  encounterName: string;
  modifierLabels: string[];
  resonanceLabels: string[];
  prepHint?: string;
};

type PrepPanel = 'hint' | 'mods' | 'res' | null;

function MetaIconButton({
  active,
  label,
  title,
  onClick,
  className,
}: {
  active: boolean;
  label: string;
  title: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={cn(
        'flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full border px-1.5 font-mono text-[10px] font-semibold leading-none transition',
        active
          ? 'border-primary/70 bg-primary/20 text-primary'
          : 'border-border/70 bg-muted/40 text-muted-foreground hover:border-primary/45 hover:text-foreground',
        className,
      )}
    >
      {label}
    </button>
  );
}

/** 战前情报：单行关名 + 图标条，详情按需展开（不占布阵空间） */
export function BattlePrepBrief({
  encounterId,
  encounterName,
  modifierLabels,
  resonanceLabels,
  prepHint,
}: BattlePrepBriefProps) {
  const [panel, setPanel] = useState<PrepPanel>(null);
  const tier = encounterDisplayTier(encounterId);

  const toggle = (next: PrepPanel) => {
    setPanel((cur) => (cur === next ? null : next));
  };

  useEffect(() => {
    if (!prepHint) return;
    const key = `moyu_prep_hint_seen_${encounterId}`;
    try {
      if (!localStorage.getItem(key)) {
        setPanel('hint');
        localStorage.setItem(key, '1');
      }
    } catch {
      /* private mode */
    }
  }, [encounterId, prepHint]);

  return (
    <div
      className={cn(
        'shrink-0 space-y-1.5 rounded-lg border px-2 py-1.5',
        tier === 'boss'
          ? 'border-amber-400/40 bg-amber-950/20 shadow-[inset_0_1px_0_rgba(251,191,36,0.12)]'
          : tier === 'elite'
            ? 'border-rose-400/35 bg-rose-950/15 shadow-[inset_0_1px_0_rgba(244,63,94,0.08)]'
            : 'border-transparent',
      )}
    >
      <div className="flex items-center gap-2">
        <h2 className="font-display flex min-w-0 flex-1 items-center gap-1.5 truncate text-lg leading-tight tracking-wide">
          {tier === 'boss' ? (
            <span className="shrink-0 rounded border border-amber-400/50 bg-amber-950/55 px-1 py-0.5 font-mono text-[9px] font-semibold text-amber-200">
              首领
            </span>
          ) : tier === 'elite' ? (
            <span className="shrink-0 rounded border border-rose-400/45 bg-rose-950/55 px-1 py-0.5 font-mono text-[9px] font-semibold text-rose-200">
              精锐
            </span>
          ) : null}
          <span className="truncate">{encounterName}</span>
        </h2>
        <div className="flex shrink-0 items-center gap-1">
          {modifierLabels.length > 0 ? (
            <MetaIconButton
              active={panel === 'mods'}
              label={modifierLabels.length > 1 ? `缀${modifierLabels.length}` : '缀'}
              title="遭遇词缀"
              onClick={() => toggle('mods')}
              className="border-amber-500/40 text-amber-100/90"
            />
          ) : null}
          {resonanceLabels.length > 0 ? (
            <MetaIconButton
              active={panel === 'res'}
              label="鸣"
              title="阵型共鸣"
              onClick={() => toggle('res')}
              className="border-teal-500/40 text-teal-100/90"
            />
          ) : null}
          {prepHint ? (
            <MetaIconButton
              active={panel === 'hint'}
              label="?"
              title="战前攻略"
              onClick={() => toggle('hint')}
            />
          ) : null}
        </div>
      </div>

      {panel === 'mods' ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 px-2.5 py-2">
          <p className="mb-1 font-mono text-[9px] tracking-widest text-amber-200/70">遭遇词缀</p>
          <ul className="space-y-0.5 font-mono text-[11px] leading-snug text-amber-100/90">
            {modifierLabels.map((l) => (
              <li key={l}>· {l}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {panel === 'res' ? (
        <div className="rounded-lg border border-teal-500/30 bg-teal-950/15 px-2.5 py-2">
          <p className="mb-1 font-mono text-[9px] tracking-widest text-teal-200/70">阵型共鸣</p>
          <ul className="space-y-0.5 font-mono text-[11px] leading-snug text-teal-100/90">
            {resonanceLabels.map((l) => (
              <li key={l}>· {l}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {panel === 'hint' && prepHint ? (
        <div className="rounded-lg border border-primary/35 bg-primary/10 px-2.5 py-2">
          <p className="mb-1 font-mono text-[9px] tracking-widest text-primary/80">战前攻略</p>
          <p className="font-mono text-[11px] leading-relaxed text-foreground/90">{prepHint}</p>
        </div>
      ) : null}
    </div>
  );
}
