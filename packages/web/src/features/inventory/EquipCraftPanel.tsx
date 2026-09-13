import {
  REROLL_STONE_COST,
  SEAL_GOLD_COST,
  SEAL_STONE_COST,
  applySeal,
  describeSealStamp,
  formatAffixLine,
  formatConditionLine,
  rerollEquipmentLine,
  sealCondition,
  sealPrintBlockedReason,
  type Equipment,
  type PlayerState,
  type RerollLayer,
} from '@moyu/game-core';
import { useState } from 'react';
import { cn } from '@/lib/utils';

type CraftMode = 'reroll' | 'seal' | 'print' | null;

type EquipCraftPanelProps = {
  player: PlayerState;
  item: Equipment;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerState>>;
  notice: (msg: string) => void;
  onGone?: () => void;
};

function liveItem(player: PlayerState, id: string): Equipment | undefined {
  return player.inventory.find((e) => e.id === id);
}

function washLocked(item: Equipment, layer: 'random' | 'condition', index: number): boolean {
  const locked = layer === 'random' ? item.rerollAffixIndex : item.rerollConditionIndex;
  return locked != null && locked !== index;
}

export function SealStampBanner({
  player,
  className,
}: {
  player: PlayerState;
  className?: string;
}) {
  const stamp = player.sealStamp;
  if (!stamp) return null;
  return (
    <div
      className={cn(
        'rounded-lg border border-violet-400/40 bg-violet-500/10 px-2.5 py-2',
        className,
      )}
    >
      <p className="font-mono text-[10px] tracking-[0.14em] text-violet-300/80">封存印</p>
      <p className="mt-0.5 text-[11px] leading-snug text-violet-100/90">
        {describeSealStamp(stamp)}
      </p>
      <p className="mt-1 text-[10px] text-muted-foreground">点一件已有条件的装备，覆盖其中一行。</p>
    </div>
  );
}

export function EquipCraftPanel({
  player,
  item: itemProp,
  setPlayer,
  notice,
  onGone,
}: EquipCraftPanelProps) {
  const [mode, setMode] = useState<CraftMode>(null);
  const [sealIndex, setSealIndex] = useState<number | null>(null);
  const item = liveItem(player, itemProp.id) ?? itemProp;
  const stones = player.enhanceStones ?? 0;
  const stamp = player.sealStamp;
  const printBlocked = stamp ? sealPrintBlockedReason(player, item) : '没有封存印';
  const canWash =
    item.affixes.length > 0 || (item.conditions?.length ?? 0) > 0 || (item.rareAffixes?.length ?? 0) > 0;
  const canSeal = (item.conditions?.length ?? 0) > 0;

  if (!canWash && !canSeal && !stamp) return null;

  const toggle = (next: CraftMode) => {
    setSealIndex(null);
    setMode((cur) => (cur === next ? null : next));
  };

  const onWash = (layer: RerollLayer, index: number) => {
    setPlayer((p) => {
      const r = rerollEquipmentLine(p, item.id, layer, index);
      notice(r.message);
      return r.ok ? r.state : p;
    });
  };

  const onSeal = (index: number) => {
    setPlayer((p) => {
      const r = sealCondition(p, item.id, index);
      notice(r.message);
      if (r.ok) onGone?.();
      return r.ok ? r.state : p;
    });
  };

  const onPrint = (index: number) => {
    setPlayer((p) => {
      const r = applySeal(p, item.id, index);
      notice(r.message);
      return r.ok ? r.state : p;
    });
    setMode(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {canWash ? (
          <button
            type="button"
            onClick={() => toggle('reroll')}
            className={cn(
              'rounded border px-2 py-1 text-[11px]',
              mode === 'reroll'
                ? 'border-primary/50 bg-primary/15 text-primary'
                : 'border-primary/40 bg-primary/10 text-primary',
            )}
          >
            洗练 ({REROLL_STONE_COST}石)
          </button>
        ) : null}
        {canSeal ? (
          <button
            type="button"
            onClick={() => toggle('seal')}
            className={cn(
              'rounded border px-2 py-1 text-[11px]',
              mode === 'seal'
                ? 'border-violet-400/60 bg-violet-400/20 text-violet-200'
                : 'border-violet-400/40 bg-violet-400/10 text-violet-300',
            )}
          >
            封存 ({SEAL_STONE_COST}石{SEAL_GOLD_COST}金)
          </button>
        ) : null}
        {stamp ? (
          <button
            type="button"
            onClick={() => toggle('print')}
            className={cn(
              'rounded border px-2 py-1 text-[11px]',
              mode === 'print'
                ? 'border-amber-400/60 bg-amber-400/20 text-amber-200'
                : 'border-amber-400/40 bg-amber-400/10 text-amber-300',
            )}
          >
            印上
          </button>
        ) : null}
      </div>

      {mode === 'reroll' ? (
        <div className="space-y-2 rounded border border-primary/25 bg-card/60 p-2">
          <p className="text-[10px] text-muted-foreground">
            每层锁定一行。石 {stones} · 洗一次 {REROLL_STONE_COST} 石
          </p>
          <WashLayer
            title="随机"
            lockedIndex={item.rerollAffixIndex}
            lines={item.affixes.map((a, i) => ({
              key: `r-${a.defId}-${i}`,
              text: formatAffixLine(a).line,
              locked: washLocked(item, 'random', i),
              onWash: () => onWash('random', i),
            }))}
          />
          <WashLayer
            title="条件"
            lockedIndex={item.rerollConditionIndex}
            tone="text-violet-300/90"
            lines={(item.conditions ?? []).map((c, i) => ({
              key: `c-${c.defId}-${i}`,
              text: `${formatConditionLine(c).line}${c.extreme ? ' 极' : ''}`,
              locked: washLocked(item, 'condition', i),
              onWash: () => onWash('condition', i),
            }))}
          />
          <WashLayer
            title="稀有"
            tone="text-amber-300/90"
            lines={(item.rareAffixes ?? []).map((a, i) => ({
              key: `q-${a.defId}-${i}`,
              text: formatAffixLine(a).line,
              locked: false,
              onWash: () => onWash('rare', i),
            }))}
          />
        </div>
      ) : null}

      {mode === 'seal' ? (
        <div className="space-y-2 rounded border border-violet-400/30 bg-card/60 p-2">
          <p className="text-[10px] leading-snug text-muted-foreground">
            封存一条条件成印，源件销毁（宝石退回）。石 {stones} · 金 {player.gold}
          </p>
          {(item.conditions ?? []).map((c, i) => {
            const line = formatConditionLine(c);
            const confirming = sealIndex === i;
            return (
              <div key={`seal-${c.defId}-${i}`} className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 flex-1 text-[11px] leading-snug text-violet-200/90">
                    {line.line}
                    {c.extreme ? <span className="ml-1 text-amber-300/80">极</span> : null}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSealIndex(confirming ? null : i)}
                    className="shrink-0 rounded border border-violet-400/40 px-1.5 py-0.5 text-[10px] text-violet-200"
                  >
                    {confirming ? '取消' : '封此行'}
                  </button>
                </div>
                {confirming ? (
                  <button
                    type="button"
                    onClick={() => onSeal(i)}
                    className="w-full rounded border border-red-400/50 bg-red-500/15 py-1 text-[11px] text-red-200"
                  >
                    确认销毁并封存
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {mode === 'print' ? (
        <div className="space-y-2 rounded border border-amber-400/30 bg-card/60 p-2">
          {printBlocked ? (
            <p className="text-[11px] text-muted-foreground">{printBlocked}</p>
          ) : (
            <>
              <p className="text-[10px] text-muted-foreground">覆盖哪一行？印上后印消失。</p>
              {(item.conditions ?? []).map((c, i) => (
                <div key={`print-${c.defId}-${i}`} className="flex items-start justify-between gap-2">
                  <p className="min-w-0 flex-1 text-[11px] leading-snug text-violet-200/90">
                    {formatConditionLine(c).line}
                  </p>
                  <button
                    type="button"
                    onClick={() => onPrint(i)}
                    className="shrink-0 rounded border border-amber-400/40 bg-amber-400/10 px-1.5 py-0.5 text-[10px] text-amber-200"
                  >
                    印此行
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function WashLayer({
  title,
  lines,
  lockedIndex,
  tone,
}: {
  title: string;
  lockedIndex?: number;
  tone?: string;
  lines: { key: string; text: string; locked: boolean; onWash: () => void }[];
}) {
  if (lines.length === 0) return null;
  return (
    <div className="space-y-1">
      <p className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
        {title}
        {lockedIndex != null ? ` · 已锁第 ${lockedIndex + 1} 行` : ''}
      </p>
      {lines.map((line, i) => (
        <div key={line.key} className="flex items-start justify-between gap-2">
          <p className={cn('min-w-0 flex-1 text-[11px] leading-snug', tone ?? 'text-foreground/85')}>
            {line.text}
            {lockedIndex === i ? (
              <span className="ml-1 font-mono text-[10px] text-primary/80">锁</span>
            ) : null}
          </p>
          {line.locked ? (
            <span className="shrink-0 pt-0.5 font-mono text-[10px] text-muted-foreground">他行</span>
          ) : (
            <button
              type="button"
              onClick={line.onWash}
              className="shrink-0 rounded border border-primary/35 bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary"
            >
              洗
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
