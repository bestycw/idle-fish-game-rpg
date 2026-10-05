import {
  tItem,
  type GearLootRarityMixEntry,
  type LootPreviewEquipTile,
  type LootPreviewTile,
  type Rarity,
  type WorldPreset,
} from '@moyu/game-core';
import { cn } from '@/lib/utils';
import { rarityNameTone } from '@/lib/tones';

function rarityEdge(rarity: Rarity): string {
  if (rarity === 'legendary') return 'border-amber-400/80';
  if (rarity === 'epic') return 'border-fuchsia-400/75';
  if (rarity === 'rare') return 'border-sky-400/70';
  if (rarity === 'uncommon') return 'border-emerald-400/65';
  return 'border-[#3a4554]';
}

function rarityFill(rarity: Rarity): string {
  if (rarity === 'legendary') return 'from-amber-500/30 via-[#1a140c] to-[#0e0c0a]';
  if (rarity === 'epic') return 'from-fuchsia-500/22 via-[#161018] to-[#0e0c10]';
  if (rarity === 'rare') return 'from-sky-500/20 via-[#10161c] to-[#0c1014]';
  if (rarity === 'uncommon') return 'from-emerald-500/18 via-[#101814] to-[#0c100e]';
  return 'from-[#2a3340] via-[#141a22] to-[#0c1014]';
}

function formatDropTag(p: number): string {
  if (p >= 1) return '必掉';
  const pct = Math.round(p * 100);
  return pct > 0 ? `${pct}%` : '<1%';
}

function ItemStackPreviewCell({ itemId, preset }: { itemId: string; preset: WorldPreset }) {
  const label = tItem(itemId, preset);
  const mark = label.slice(0, 1);

  return (
    <div
      className="relative flex aspect-square w-12 shrink-0 flex-col items-center justify-center rounded-[3px] border border-border/50 bg-[#0c1018]"
      title={label}
    >
      <span className="font-display text-sm text-foreground/80">{mark}</span>
      <span className="mt-0.5 max-w-full truncate px-0.5 text-[8px] text-muted-foreground">{label}</span>
    </div>
  );
}

function EquipLootPreviewCell({ tile }: { tile: LootPreviewEquipTile }) {
  const tag = formatDropTag(tile.dropChance);
  const frame = tile.rarityFrame;

  return (
    <div
      className={cn(
        'relative aspect-square w-12 shrink-0 overflow-hidden rounded-[3px] border bg-gradient-to-b',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-3px_8px_rgba(0,0,0,0.45)]',
        rarityEdge(frame),
        rarityFill(frame),
      )}
      aria-label={tile.dropChance >= 1 ? '必掉装备' : `${tag} 追加装备`}
    >
      <span className="absolute inset-0 flex items-center justify-center font-display text-lg text-foreground/45">
        ?
      </span>
      <span
        className={cn(
          'absolute left-0.5 top-0.5 rounded px-0.5 text-[7px] leading-tight',
          tile.dropChance >= 1
            ? 'bg-emerald-900/85 text-emerald-100/95'
            : 'bg-black/60 text-foreground/80',
        )}
      >
        {tag}
      </span>
      <span className="pointer-events-none absolute bottom-1 right-1 flex gap-0.5">
        {tile.showSetDot ? <i className="size-1.5 rounded-sm bg-amber-400/85" /> : null}
        {tile.showT3Dot ? <i className="size-1.5 rounded-full bg-teal-400/90" /> : null}
      </span>
    </div>
  );
}

function RarityMixRow({ mix }: { mix: GearLootRarityMixEntry[] }) {
  if (mix.length === 0) return null;
  return (
    <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[10px] tabular-nums">
      {mix.map((row) => (
        <span key={row.rarity} className={cn('whitespace-nowrap', rarityNameTone(row.rarity))}>
          {row.label}
          <span className="ml-0.5 text-foreground/55">{row.pct}%</span>
        </span>
      ))}
    </p>
  );
}

type LootPreviewStripProps = {
  tiles: LootPreviewTile[];
  preset: WorldPreset;
  rarityMix?: GearLootRarityMixEntry[];
  affixHint?: string;
};

export function LootPreviewStrip({ tiles, preset, rarityMix, affixHint }: LootPreviewStripProps) {
  if (tiles.length === 0) return null;

  const equipTiles = tiles.filter((t): t is LootPreviewEquipTile => t.kind === 'equip_random');

  return (
    <div className="mt-3 min-w-0">
      <p className="mb-2 text-[11px] text-muted-foreground">掉落预览</p>
      <div className="flex flex-wrap items-end gap-1">
        {equipTiles.map((tile) => (
          <EquipLootPreviewCell key={`equip-${tile.equipSlot}`} tile={tile} />
        ))}
        {tiles.map((tile, i) => {
          if (tile.kind === 'equip_random') return null;
          return <ItemStackPreviewCell key={`${tile.itemId}-${i}`} itemId={tile.itemId} preset={preset} />;
        })}
      </div>
      {rarityMix && rarityMix.length > 0 ? <RarityMixRow mix={rarityMix} /> : null}
      {affixHint ? (
        <p className="mt-2 text-[11px] leading-relaxed text-foreground/60">{affixHint}</p>
      ) : null}
    </div>
  );
}
