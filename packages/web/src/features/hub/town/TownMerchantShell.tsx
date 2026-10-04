import { cn } from '@/lib/utils';

type TownMerchantShellProps = {
  shopName: string;
  locked: boolean;
  lockedHint: string;
  onClose: () => void;
};

const TABS = ['丹药', '材料', '装备', '杂物'] as const;

export function TownMerchantShell({ shopName, locked, lockedHint, onClose }: TownMerchantShellProps) {
  return (
    <div
      className="fixed inset-0 z-[65] flex items-end justify-center bg-black/60 p-3 sm:items-center"
      role="dialog"
      aria-modal
      aria-label={`${shopName}货单`}
    >
      <div className="flex max-h-[min(80vh,28rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-b from-[#141820] to-[#0a0e14] shadow-2xl">
        <header className="border-b border-border/40 px-4 py-3">
          <p className="font-mono text-[10px] text-amber-400/90">商店 · 预览</p>
          <h2 className="font-display text-lg tracking-wide">{shopName}</h2>
          {locked ? (
            <p className="mt-2 text-xs leading-relaxed text-amber-100/80">{lockedHint}</p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">交易尚未接入，仅供浏览货架分类。</p>
          )}
        </header>
        <div className="flex gap-1 border-b border-border/40 px-2 py-2">
          {TABS.map((tab) => (
            <span
              key={tab}
              className={cn(
                'flex-1 rounded-lg py-1.5 text-center font-mono text-[10px]',
                locked ? 'bg-muted/30 text-muted-foreground' : 'bg-amber-500/10 text-amber-200/90',
              )}
            >
              {tab}
            </span>
          ))}
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl border border-dashed border-border/50 px-3 py-3 opacity-60"
            >
              <span className="text-sm text-muted-foreground">──────</span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {locked ? '未开放' : '敬请期待'}
              </span>
            </div>
          ))}
        </div>
        <footer className="border-t border-border/40 p-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-border/60 py-2.5 text-sm text-foreground hover:bg-card/50"
          >
            离开
          </button>
        </footer>
      </div>
    </div>
  );
}
