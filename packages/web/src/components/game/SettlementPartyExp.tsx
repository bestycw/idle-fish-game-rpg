import { getTemplate, type BattleSettlement } from '@moyu/game-core';
import { cn } from '@/lib/utils';
import { rarityFrame, rarityNameTone } from '@/lib/tones';

type SettlementPartyExpProps = {
  settlement: BattleSettlement;
  className?: string;
};

function ExpBar({
  current,
  need,
  gained,
  rarity,
}: {
  current: number;
  need: number;
  gained: number;
  rarity: string;
}) {
  const pct = need <= 0 ? 0 : Math.min(100, Math.round((current / need) * 100));
  const fill =
    rarity === 'legendary'
      ? 'from-amber-500/85 to-amber-300/90'
      : rarity === 'epic'
        ? 'from-fuchsia-500/80 to-fuchsia-300/90'
        : rarity === 'rare'
          ? 'from-sky-500/80 to-sky-300/90'
          : rarity === 'uncommon'
            ? 'from-emerald-500/80 to-emerald-300/90'
            : 'from-emerald-600/75 to-emerald-400/85';
  return (
    <div className="flex w-full flex-col items-center gap-0.5">
      <div className="h-1 w-full overflow-hidden rounded-full bg-black/45">
        <div
          className={cn('h-full rounded-full bg-gradient-to-r transition-[width] duration-500', fill)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {gained > 0 ? (
        <span className={cn('font-mono text-[8px] tabular-nums leading-none', rarityNameTone(rarity))}>
          +{gained}
        </span>
      ) : null}
    </div>
  );
}

/** 结算底部：上阵方块（品级色）+ 经验条 + LV UP 冒泡 */
export function SettlementPartyExp({ settlement, className }: SettlementPartyExpProps) {
  const rows = settlement.partyExpRows ?? [];
  if (rows.length === 0) return null;

  return (
    <div
      className={cn('mt-3 flex w-full flex-wrap items-end justify-center gap-2', className)}
      aria-label="上阵经验"
    >
      {rows.map((row) => {
        const rarity = getTemplate(row.templateId)?.rarity ?? 'common';
        return (
          <div key={row.templateId} className="relative flex w-12 flex-col items-center gap-1">
            <div
              className={cn(
                'relative flex aspect-square w-12 flex-col items-center justify-center overflow-visible rounded-[3px] border',
                'shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
                rarityFrame(rarity),
              )}
            >
              <span
                className={cn(
                  'max-w-full truncate px-0.5 font-display text-[11px]',
                  rarityNameTone(rarity),
                )}
              >
                {row.name.slice(0, 2)}
              </span>
              <span className="font-mono text-[9px] tabular-nums text-muted-foreground">
                Lv{row.levelAfter}
              </span>
              {row.leveledUp ? (
                <span
                  className="pointer-events-none absolute -top-2 left-1/2 z-10 -translate-x-1/2 animate-[lvUpPop_1.1s_ease-out_forwards] rounded bg-amber-500/95 px-1 py-0.5 font-mono text-[9px] font-bold leading-none text-black shadow"
                  aria-hidden
                >
                  LV UP
                </span>
              ) : null}
            </div>
            <ExpBar
              current={row.expAfter}
              need={row.expToNext}
              gained={row.expGained}
              rarity={rarity}
            />
          </div>
        );
      })}
      <style>{`
        @keyframes lvUpPop {
          0% { opacity: 0; transform: translate(-50%, 6px) scale(0.85); }
          18% { opacity: 1; transform: translate(-50%, -2px) scale(1.08); }
          70% { opacity: 1; transform: translate(-50%, -10px) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -18px) scale(0.96); }
        }
      `}</style>
    </div>
  );
}
