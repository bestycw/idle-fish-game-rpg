import {
  GEAR_TIER_LABELS,
  GEAR_TIER_TAB_ORDER,
  buildGearLineCatalog,
  resolveWorldPreset,
  type DungeonId,
  type GearDungeonTier,
  type GearLineTierSlot,
  type PlayerState,
  type WorldPreset,
} from '@moyu/game-core';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { LootPreviewStrip } from '@/components/game/LootPreviewStrip';

type GearDungeonBrowserProps = {
  player: PlayerState;
  recommendedPower: number;
  deployedPower: number;
  onEnter: (dungeonId: DungeonId) => void;
  className?: string;
};

function tierAccent(tier: GearDungeonTier): string {
  if (tier === 'hell') return 'border-rose-500/45 bg-rose-500/12 text-rose-100/95';
  if (tier === 'hard') return 'border-teal-500/40 bg-teal-500/12 text-teal-100/95';
  if (tier === 'rift') return 'border-violet-500/40 bg-violet-500/12 text-violet-100/95';
  return 'border-primary/35 bg-primary/12 text-foreground/90';
}

function pickDefaultTier(slots: GearLineTierSlot[]): GearDungeonTier {
  const unlocked = slots.find((s) => s.unlocked);
  if (unlocked) return unlocked.tier;
  return slots[0]?.tier ?? 'normal';
}

function DungeonDetailPanel({
  lineName,
  slot,
  recPower,
  deployedPower,
  powerOk,
  tierSlots,
  selectedTier,
  onSelectTier,
  onEnter,
  worldPreset,
}: {
  lineName: string;
  slot: GearLineTierSlot;
  recPower: number;
  deployedPower: number;
  powerOk: boolean;
  tierSlots: GearLineTierSlot[];
  selectedTier: GearDungeonTier;
  onSelectTier: (tier: GearDungeonTier) => void;
  onEnter: () => void;
  worldPreset: WorldPreset;
}) {
  const selected = slot.view;
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-black/20">
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4">
        <p className="font-display text-lg leading-tight text-foreground sm:text-xl">{lineName}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{selected.name}</p>

        <div className="mt-3 flex flex-wrap gap-1.5" role="tablist" aria-label="难度">
          {GEAR_TIER_TAB_ORDER.map((tier) => {
            const offer = tierSlots.find((s) => s.tier === tier);
            if (!offer) {
              return (
                <span
                  key={tier}
                  className="rounded border border-border/25 px-2 py-1 text-[10px] text-muted-foreground/40"
                >
                  {GEAR_TIER_LABELS[tier]}
                </span>
              );
            }
            const active = tier === selectedTier;
            return (
              <button
                key={tier}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSelectTier(tier)}
                className={cn(
                  'rounded border px-2.5 py-1 text-[11px] transition-colors',
                  active
                    ? tierAccent(tier)
                    : 'border-border/40 text-foreground/65 hover:bg-white/[0.04]',
                  !offer.unlocked && 'opacity-55',
                )}
              >
                {GEAR_TIER_LABELS[tier]}
              </button>
            );
          })}
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-2 border-y border-border/30 py-3 text-center text-[11px] tabular-nums">
          <div>
            <dt className="text-muted-foreground">体力</dt>
            <dd className="mt-0.5 font-medium text-foreground/90">{selected.staminaCost}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">建议战力</dt>
            <dd
              className={cn(
                'mt-0.5 font-medium',
                powerOk ? 'text-teal-300/95' : 'text-amber-200/90',
              )}
            >
              {recPower}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">当前</dt>
            <dd className="mt-0.5 text-foreground/85">{deployedPower}</dd>
          </div>
        </dl>

        <p className="mt-3 text-sm leading-relaxed text-foreground/78">{selected.blurb}</p>

        <p className="mt-3 text-sm">
          <span className="text-muted-foreground">遭遇 · </span>
          <span className="text-foreground/85">{selected.encounterLabels.join(' · ')}</span>
        </p>

        <LootPreviewStrip
          tiles={selected.lootPreview}
          preset={worldPreset}
          rarityMix={selected.lootRarityMix}
        />

        {!selected.unlocked ? (
          <p className="mt-3 text-xs text-amber-200/85">解锁：{selected.unlockHint}</p>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-border/45 bg-black/35 px-3 py-3 sm:px-4">
        <button
          type="button"
          disabled={!selected.unlocked}
          onClick={onEnter}
          className={cn(
            'w-full rounded-lg py-3 text-sm font-medium',
            selected.unlocked
              ? 'bg-primary text-primary-foreground hover:bg-primary/92'
              : 'cursor-not-allowed bg-muted/70 text-muted-foreground',
          )}
        >
          {selected.unlocked ? '进入' : '未解锁'}
        </button>
      </div>
    </div>
  );
}

export function GearDungeonBrowser({
  player,
  recommendedPower,
  deployedPower,
  onEnter,
  className,
}: GearDungeonBrowserProps) {
  const preset = resolveWorldPreset(player);
  const lines = useMemo(() => buildGearLineCatalog(player, preset), [player, preset]);

  const defaultLineId =
    lines.find((l) => l.tiers.some((t) => t.unlocked))?.lineId ?? lines[0]?.lineId ?? 'line_wall';
  const [selectedLineId, setSelectedLineId] = useState(defaultLineId);
  const [selectedTier, setSelectedTier] = useState<GearDungeonTier>('normal');

  const activeLine = lines.find((l) => l.lineId === selectedLineId) ?? lines[0];
  const activeSlot =
    activeLine?.tiers.find((t) => t.tier === selectedTier) ??
    activeLine?.tiers[0];

  useEffect(() => {
    if (!lines.some((l) => l.lineId === selectedLineId)) {
      setSelectedLineId(defaultLineId);
    }
  }, [lines, defaultLineId, selectedLineId]);

  useEffect(() => {
    if (!activeLine) return;
    if (!activeLine.tiers.some((t) => t.tier === selectedTier)) {
      setSelectedTier(pickDefaultTier(activeLine.tiers));
    }
  }, [activeLine, selectedTier]);

  if (!activeLine || !activeSlot) {
    return <p className="text-xs text-muted-foreground">猎装秘境数据未就绪。</p>;
  }

  const recPower = Math.round(recommendedPower * activeSlot.view.pressure);
  const powerOk = deployedPower >= recPower * 0.85;

  return (
    <div
      className={cn(
        'flex min-h-0 flex-1 flex-row overflow-hidden rounded-lg border border-border/60 bg-card/25',
        className,
      )}
      aria-label="猎装秘境"
    >
      <aside
        className="flex w-[38%] min-w-[7.5rem] max-w-[10.5rem] shrink-0 flex-col border-r border-border/50 bg-black/30 sm:max-w-[12rem]"
        aria-label="副本列表"
      >
        <div className="shrink-0 border-b border-border/40 px-2 py-2">
          <p className="text-[11px] text-foreground/80">副本</p>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <ul>
            {lines.map((line) => {
              const active = line.lineId === selectedLineId;
              const anyUnlocked = line.tiers.some((t) => t.unlocked);
              return (
                <li key={line.lineId} className="border-b border-border/20 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLineId(line.lineId);
                      setSelectedTier(pickDefaultTier(line.tiers));
                    }}
                    className={cn(
                      'flex w-full items-stretch text-left',
                      active ? 'bg-primary/15' : 'hover:bg-white/[0.03]',
                    )}
                  >
                    <span
                      className={cn('w-0.5 shrink-0', active ? 'bg-primary' : 'bg-transparent')}
                    />
                    <span
                      className={cn(
                        'px-2.5 py-2.5 text-[13px] leading-snug sm:px-3',
                        active ? 'font-medium text-foreground' : 'text-foreground/75',
                        !anyUnlocked && 'text-foreground/45',
                      )}
                    >
                      {line.lineName}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col" aria-label="副本详情">
        <DungeonDetailPanel
          lineName={activeLine.lineName}
          slot={activeSlot}
          recPower={recPower}
          deployedPower={deployedPower}
          powerOk={powerOk}
          tierSlots={activeLine.tiers}
          selectedTier={activeSlot.tier}
          onSelectTier={setSelectedTier}
          onEnter={() => onEnter(activeSlot.dungeonId)}
          worldPreset={preset}
        />
      </div>
    </div>
  );
}
