import { cn } from '@/lib/utils';

type SettlementSectionRuleProps = {
  label: string;
  className?: string;
};

/**
 * 结算账本分段：中间题名 + 两侧淡线（手游战利/历练分层，不是网页 hr）。
 */
export function SettlementSectionRule({ label, className }: SettlementSectionRuleProps) {
  return (
    <div
      className={cn('flex w-full items-center gap-2.5 py-1', className)}
      role="separator"
      aria-label={label}
    >
      <span
        className="h-px min-w-[1.5rem] flex-1 bg-gradient-to-r from-transparent via-amber-500/35 to-amber-500/20"
        aria-hidden
      />
      <span className="shrink-0 font-display text-[11px] tracking-[0.18em] text-amber-200/75">
        {label}
      </span>
      <span
        className="h-px min-w-[1.5rem] flex-1 bg-gradient-to-l from-transparent via-amber-500/35 to-amber-500/20"
        aria-hidden
      />
    </div>
  );
}
