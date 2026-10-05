import {
  RARITY_LABELS,
  SLOT_NAMES,
  bagCellSignature,
  describeSetOnItem,
  formatAffixLine,
  formatConditionLine,
  formatGemLine,
  itemPower,
  listBaseStatLines,
  listEffectAffixLines,
  type Equipment,
  type RollQuality,
} from '@moyu/game-core';
import { cn } from '@/lib/utils';
import { rarityNameTone } from '@/lib/tones';

type EquipTooltipProps = {
  item: Equipment;
  compact?: boolean;
  setPieceCount?: number;
  className?: string;
};

function TalismanRule() {
  return (
    <div className="my-1 flex items-center gap-1.5" aria-hidden>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-800/40" />
      <span className="size-1 rotate-45 border border-amber-700/55 bg-amber-900/50" />
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-800/40" />
    </div>
  );
}

function DiamondMark() {
  return (
    <span
      className="mt-[0.4em] size-1.5 shrink-0 rotate-45 bg-current opacity-45"
      aria-hidden
    />
  );
}

function qualityClass(quality: RollQuality): string {
  if (quality === 'max') return 'text-primary';
  if (quality === 'min') return 'text-muted-foreground';
  return 'text-foreground/90';
}

function AffixRow({
  affix,
  tone,
  compact,
}: {
  affix: Equipment['affixes'][number];
  tone?: string;
  compact?: boolean;
}) {
  const formatted = formatAffixLine(affix);
  return (
    <div
      className={cn(
        'flex items-start gap-1.5 leading-snug',
        compact ? 'text-[10px]' : 'text-[11px]',
        tone ?? qualityClass(formatted.rollQuality),
      )}
    >
      <DiamondMark />
      <p className="min-w-0 flex-1">
        <span className="tabular-nums">{formatted.valueText}</span>
        {' '}
        {formatted.sentence}
        {' '}
        <span className="font-mono text-[0.92em] text-muted-foreground">
          {formatted.rangeText}
        </span>
      </p>
    </div>
  );
}

/** 暗黑式装备读条：底子 / 随机词 / 效果词 / 孔 / 套装分层。 */
export function EquipTooltip({
  item,
  compact = false,
  setPieceCount,
  className,
}: EquipTooltipProps) {
  const baseRows = listBaseStatLines(item);
  const effects = listEffectAffixLines(item);
  const gemLine = item.gemId ? formatGemLine(item.gemId) : undefined;
  const setInfo = describeSetOnItem(item, setPieceCount);
  const rareAffixes = item.rareAffixes ?? [];
  const signature = bagCellSignature(item);
  const showSignature = Boolean(signature) && !item.name.includes(signature);

  return (
    <div className={cn('max-w-full overflow-hidden text-left', className)}>
      <div className="flex min-w-0 items-baseline justify-between gap-2">
        <strong
          className={cn(
            'min-w-0 break-words font-display tracking-wide',
            compact ? 'text-xs' : 'text-sm',
            rarityNameTone(item.rarity),
          )}
        >
          {item.enhanceLevel > 0 ? `+${item.enhanceLevel} ` : ''}
          {item.name}
          {showSignature ? ` · ${signature}` : ''}
        </strong>
        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
          {SLOT_NAMES[item.slot] ?? item.slot}
        </span>
      </div>
      <p className="mt-0.5 font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
        {RARITY_LABELS[item.rarity]}
        <span className="ml-2">装等 {item.itemLevel ?? 1}</span>
        <span className="ml-2 text-primary/90">战力 {itemPower(item)}</span>
      </p>

      {baseRows.length > 0 ? (
        <>
          <TalismanRule />
          <div className="border-l border-foreground/20 pl-2">
            {baseRows.map((row) => (
              <p
                key={row.stat}
                className={cn(
                  'leading-snug text-foreground/85',
                  compact ? 'text-[10px]' : 'text-[11px]',
                )}
              >
                {row.sentence}{' '}
                <span className="tabular-nums">{row.displayed}</span>
                {row.enhanceDelta > 0 ? (
                  <span className="ml-1 tabular-nums text-emerald-400/90">
                    (+{row.enhanceDelta})
                  </span>
                ) : null}
              </p>
            ))}
          </div>
        </>
      ) : null}

      {item.affixes.length > 0 ? (
        <>
          <TalismanRule />
          <div className="space-y-0.5">
            {item.affixes.map((a) => (
              <AffixRow key={a.defId} affix={a} compact={compact} />
            ))}
          </div>
        </>
      ) : null}

      {(item.conditions ?? []).length > 0 ? (
        <>
          <TalismanRule />
          <div className="space-y-0.5">
            {(item.conditions ?? []).map((c) => {
              const formatted = formatConditionLine(c);
              return (
                <div
                  key={c.defId}
                  className={cn(
                    'flex items-start gap-1.5 leading-snug text-violet-300/90',
                    compact ? 'text-[10px]' : 'text-[11px]',
                  )}
                >
                  <DiamondMark />
                  <p className="min-w-0 flex-1">
                    <span className="tabular-nums">{formatted.valueText}</span>
                    {' '}
                    {formatted.sentence}
                    {' '}
                    <span className="font-mono text-[0.92em] text-muted-foreground">
                      {formatted.rangeText}
                    </span>
                    {c.extreme ? (
                      <span className="ml-1 text-amber-300/80">极</span>
                    ) : null}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      ) : null}

      {rareAffixes.length > 0 ? (
        <>
          <TalismanRule />
          <div className="space-y-0.5">
            {rareAffixes.map((a) => (
              <AffixRow
                key={`rare-${a.defId}`}
                affix={a}
                compact={compact}
                tone="text-amber-300/90"
              />
            ))}
          </div>
        </>
      ) : null}

      {effects.length > 0 ? (
        <>
          <TalismanRule />
          <div className="space-y-1">
            {effects.map((fx) => (
              <div key={fx.name} className="text-teal-300/90">
                <p className={cn('font-medium', compact ? 'text-[10px]' : 'text-[11px]')}>
                  {fx.name}
                </p>
                <p className={cn('text-teal-200/75', compact ? 'text-[10px]' : 'text-[11px]')}>
                  {fx.description}
                </p>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {item.socketCount > 0 ? (
        <>
          <TalismanRule />
          <p
            className={cn(
              'text-sky-300/85',
              compact ? 'text-[10px]' : 'text-[11px]',
            )}
          >
            {gemLine ?? '空孔'}
          </p>
        </>
      ) : null}

      {setInfo ? (
        <>
          <TalismanRule />
          <div className="space-y-0.5">
            <p
              className={cn(
                'font-medium text-primary',
                compact ? 'text-[10px]' : 'text-[11px]',
              )}
            >
              {setInfo.name}
              {setPieceCount != null ? (
                <span className="ml-1.5 font-mono text-[10px] font-normal text-primary/70">
                  {Math.min(setInfo.count, 4)}/4
                </span>
              ) : null}
            </p>
            {!compact ? (
              <p className="text-[10px] text-muted-foreground">{setInfo.blurb}</p>
            ) : null}
            {setInfo.bonuses.map((b) => (
              <p
                key={b.pieces}
                className={cn(
                  compact ? 'text-[10px]' : 'text-[11px]',
                  b.active ? 'text-primary/90' : 'text-muted-foreground/70',
                )}
              >
                {b.label}
              </p>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
