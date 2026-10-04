import type { TownHubNpcView } from '@moyu/game-core';
import { TownNpcKindBadge } from './TownNpcKindBadge';

type TownNpcActionSheetProps = {
  npc: TownHubNpcView;
  onTalk: () => void;
  onService: () => void;
  onClose: () => void;
};

const SERVICE_LABEL: Record<string, string> = {
  merchant: '看看货单',
  quest: '查看悬赏',
  inn: '歇脚',
};

export function TownNpcActionSheet({ npc, onTalk, onService, onClose }: TownNpcActionSheetProps) {
  const serviceLabel = SERVICE_LABEL[npc.kind] ?? '互动';

  return (
    <div
      className="fixed inset-0 z-[62] flex items-end justify-center bg-black/45"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-2xl border border-border/60 bg-[#0c1016] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl"
        role="dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center gap-2">
          <TownNpcKindBadge kind={npc.kind} />
          <div>
            <p className="font-medium">{npc.name}</p>
            <p className="font-mono text-[9px] text-muted-foreground">{npc.epithet ?? npc.roleLabel}</p>
          </div>
        </div>
        <div className="space-y-2">
          <button
            type="button"
            onClick={onTalk}
            className="w-full rounded-xl border border-border/60 py-3 text-sm hover:bg-card/50"
          >
            交谈
          </button>
          <button
            type="button"
            onClick={onService}
            className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground"
          >
            {serviceLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
