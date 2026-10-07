import {
  GACHA_TICKET_COST,
  RARITY_LABELS,
  pullGacha,
  shouldForceCh1TeachRare,
  type GachaPullItem,
  type PlayerState,
} from '@moyu/game-core';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { rarityFrame } from '@/lib/tones';

type GachaScreenProps = {
  player: PlayerState;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerState>>;
  onBack: () => void;
  pushNotice: (msg: string) => void;
};

/** 召唤页：手游卡池舞台 + 大按钮，文字只做规则说明 */
export function GachaScreen({ player, setPlayer, onBack: _onBack, pushNotice }: GachaScreenProps) {
  void _onBack;
  const [lastItems, setLastItems] = useState<GachaPullItem[]>([]);
  const tickets = player.currencies?.ticket ?? 0;
  const teachPull = shouldForceCh1TeachRare(player);

  const doPull = (times: number) => {
    const result = pullGacha(player, times);
    if (!result.ok) {
      pushNotice(result.message);
      return;
    }
    setPlayer(result.state);
    setLastItems(result.items);
    pushNotice(result.message);
  };

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-4">
      <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-b from-primary/25 via-card to-[#0c1118] px-4 pb-6 pt-8 text-center sm:px-6">
        <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full border-2 border-primary/50 bg-primary/15 font-display text-3xl text-primary shadow-[0_0_28px_rgba(226,160,74,0.25)]">
          召
        </div>
        <p className="font-mono text-[11px] tracking-[0.2em] text-primary/80">常驻池</p>
        <h2 className="font-display mt-1 text-3xl tracking-wide">召唤伙伴</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {teachPull
            ? '教学抽：本次单抽必出良品（蓝）。抽完记得上阵，再回去破精锐。'
            : '新人补解法，重复变碎片。缺职能加权；软保底。'}{' '}
          手中券 <span className="font-mono text-primary">{tickets}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={tickets < 1}
          onClick={() => doPull(1)}
          className={cn(
            'rounded-xl border py-4 transition disabled:opacity-40',
            teachPull
              ? 'border-teal-400/55 bg-teal-950/40 hover:brightness-110'
              : 'border-border/80 bg-card/70 hover:border-primary/50',
          )}
        >
          <div className="font-display text-lg">{teachPull ? '教学召唤 ×1' : '召唤 ×1'}</div>
          <div className="mt-1 font-mono text-xs text-muted-foreground">{GACHA_TICKET_COST} 券</div>
        </button>
        <button
          type="button"
          disabled={tickets < 10}
          onClick={() => doPull(10)}
          className="rounded-xl border border-primary/40 bg-primary/15 py-4 transition hover:brightness-110 disabled:opacity-40"
        >
          <div className="font-display text-lg text-primary">召唤 ×10</div>
          <div className="mt-1 font-mono text-xs text-primary/80">
            {GACHA_TICKET_COST * 10} 券
          </div>
        </button>
      </div>

      {lastItems.length > 0 ? (
        <div className="rounded-xl border border-border/70 bg-card/40 px-3 py-3">
          <p className="mb-2 font-mono text-[11px] tracking-[0.14em] text-muted-foreground">
            本次结果
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {lastItems.map((it, i) => (
              <div
                key={`${it.templateId}-${i}`}
                className={cn('rounded-xl border px-2 py-2.5 text-center', rarityFrame(it.rarity))}
              >
                <p className="font-mono text-[9px] text-muted-foreground">
                  {RARITY_LABELS[it.rarity]}
                  {it.kind === 'new' ? ' · 新' : ' · 碎片'}
                </p>
                <p className="font-display mt-1 text-sm leading-tight">{it.name}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
