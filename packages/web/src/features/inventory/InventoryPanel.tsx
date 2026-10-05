import {
  isItemUnseen,
  markItemSeen,
  tryDisassemble,
  wornItemIds,
  type Equipment,
  type PlayerState,
} from '@moyu/game-core';
import { useMemo, useState } from 'react';
import { Popover } from 'radix-ui';
import { cn } from '@/lib/utils';
import { EquipBagCell } from './EquipBagCell';
import { EquipCraftPanel, SealStampBanner } from './EquipCraftPanel';
import { EquipPopoverContent } from './EquipPopoverContent';
import { EquipTooltip } from './EquipTooltip';

const BAG_COLS = 8;
const BAG_MIN_ROWS = 5;

type InventoryPanelProps = {
  player: PlayerState;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerState>>;
  onBack: () => void;
  pushNotice: (msg: string) => void;
};

function allEquippedIds(player: PlayerState): Set<string> {
  return wornItemIds(player);
}

export function InventoryPanel({
  player,
  setPlayer,
  onBack: _onBack,
  pushNotice,
}: InventoryPanelProps) {
  void _onBack;
  const [openId, setOpenId] = useState<string | null>(null);
  const equippedIds = useMemo(() => allEquippedIds(player), [player]);
  const unequipped = useMemo(
    () => [...player.inventory.filter((e) => !equippedIds.has(e.id))].reverse(),
    [player.inventory, equippedIds],
  );
  const selected = unequipped.find((e) => e.id === openId);

  const cellCount = Math.max(
    BAG_COLS * BAG_MIN_ROWS,
    Math.ceil(Math.max(unequipped.length, 1) / BAG_COLS) * BAG_COLS,
  );
  const cells: Array<Equipment | undefined> = Array.from(
    { length: cellCount },
    (_, i) => unequipped[i],
  );

  const onDisassemble = (itemId: string) => {
    setPlayer((p) => {
      const r = tryDisassemble(p, itemId);
      pushNotice(r.message);
      return r.ok ? r.state : p;
    });
    setOpenId(null);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-1.5 flex shrink-0 items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <h2 className="font-display text-xl tracking-wide">行囊</h2>
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {unequipped.length}/{cellCount}
          </span>
        </div>
        <button
          type="button"
          onClick={() => pushNotice('商会后置：兑换与补给将挂在背包经济侧。')}
          className="font-mono text-[11px] tracking-wide text-muted-foreground/80 transition hover:text-primary"
        >
          商会
        </button>
      </div>
      {player.sealStamp ? <SealStampBanner player={player} className="mb-1.5 shrink-0" /> : null}
      <div
        className={cn(
          'min-h-0 flex-1 overflow-y-auto overflow-x-hidden rounded-lg border border-[#243040] p-2',
          'bg-[#07090d] shadow-[inset_0_2px_12px_rgba(0,0,0,0.55)]',
        )}
      >
        {unequipped.length === 0 ? (
          <div className="flex h-full min-h-40 flex-col items-center justify-center px-6 py-10 text-center">
            <span className="size-2 rotate-45 border border-amber-700/50 bg-amber-900/40" />
            <p className="font-display mt-3 text-lg tracking-wide text-foreground/50">空囊</p>
            <p className="mt-1 text-[12px] text-muted-foreground">猎装入袋后，点格子检视。</p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,3rem)] gap-1">
            {cells.map((item, i) => {
              if (!item) {
                return <EquipBagCell key={`empty-${i}`} />;
              }
              const open = item.id === openId;
              const activeItem = selected?.id === item.id ? selected : item;
              return (
                <Popover.Root
                  key={item.id}
                  modal={false}
                  open={open}
                  onOpenChange={(next) => {
                    if (!next) setOpenId((cur) => (cur === item.id ? null : cur));
                  }}
                >
                  <Popover.Anchor asChild>
                    <div className="min-w-0 w-full">
                      <EquipBagCell
                        item={item}
                        selected={open}
                        unseen={isItemUnseen(player, item.id)}
                        onSelect={() => {
                          setPlayer((p) => markItemSeen(p, item.id));
                          setOpenId((cur) => (cur === item.id ? null : item.id));
                        }}
                      />
                    </div>
                  </Popover.Anchor>
                  <EquipPopoverContent
                    rarity={item.rarity}
                    side="bottom"
                    align="center"
                    footer={
                      <div className="border-t border-white/5 px-2.5 py-2">
                        <EquipCraftPanel
                          player={player}
                          item={activeItem}
                          setPlayer={setPlayer}
                          notice={pushNotice}
                          onGone={() => setOpenId(null)}
                        />
                        <button
                          type="button"
                          onClick={() => onDisassemble(item.id)}
                          className="mt-2 font-mono text-[11px] text-red-300/80 transition hover:text-red-200"
                        >
                          分解此件
                        </button>
                      </div>
                    }
                  >
                    <EquipTooltip item={activeItem} />
                  </EquipPopoverContent>
                </Popover.Root>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
