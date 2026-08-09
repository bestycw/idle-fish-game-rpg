import {
  SLOT_NAMES,
  getEffectAffixDef,
  getGemDef,
  getSetDef,
  type Equipment,
  type PlayerState,
} from '@moyu/game-core';
import { useMemo } from 'react';
import { ChoiceList } from '@/components/game/ChoiceList';
import { Narrative } from '@/components/game/Narrative';
import { cn } from '@/lib/utils';
import { rarityTone } from '@/lib/tones';

type InventoryPanelProps = {
  player: PlayerState;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerState>>;
  onBack: () => void;
  pushNotice: (msg: string) => void;
};

/** Collect all equipped item ids across all characters */
function allEquippedIds(player: PlayerState): Set<string> {
  const ids = new Set<string>();
  // Legacy shared equipped
  for (const id of Object.values(player.equipped)) {
    if (id) ids.add(id);
  }
  // Per-character equipped
  if (player.characterEquip) {
    for (const slotMap of Object.values(player.characterEquip)) {
      if (!slotMap) continue;
      for (const id of Object.values(slotMap)) {
        if (id) ids.add(id);
      }
    }
  }
  return ids;
}

function ItemDetail({ item }: { item: Equipment }) {
  const setDef = item.setId ? getSetDef(item.setId) : undefined;
  const effectDef1 = item.effectAffixId ? getEffectAffixDef(item.effectAffixId) : undefined;
  const effectDef2 = item.effectAffixId2 ? getEffectAffixDef(item.effectAffixId2) : undefined;
  const gemDef = item.gemId ? getGemDef(item.gemId) : undefined;
  return (
    <div className={cn('rounded-lg border bg-card/60 px-2.5 py-1.5', rarityTone(item.rarity))}>
      <div className="flex items-baseline justify-between gap-1">
        <strong className="text-xs">
          {item.enhanceLevel > 0 ? `+${item.enhanceLevel} ` : ''}{item.name}
        </strong>
        <span className="text-[10px] text-muted-foreground">{SLOT_NAMES[item.slot]}</span>
      </div>
      {/* baseStats */}
      <div className="mt-0.5 font-mono text-[10px] text-foreground/80">
        {Object.entries(item.baseStats).map(([k, v]) => `${k === 'maxHp' ? 'HP' : k.toUpperCase()} +${v}`).join(' · ')}
      </div>
      {/* affixes */}
      {item.affixes.length > 0 && (
        <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
          {item.affixes.map((a) => `${a.name}+${a.value}`).join(' · ')}
        </div>
      )}
      {/* rareAffixes */}
      {item.rareAffixes && item.rareAffixes.length > 0 && (
        <div className="mt-0.5 font-mono text-[10px] text-amber-300/90">
          {item.rareAffixes.map((a) => `${a.name}+${Math.round(a.value * 100)}%`).join(' · ')}
        </div>
      )}
      {/* T3 effects */}
      {effectDef1 && (
        <div className="mt-0.5 text-[10px] text-teal-300/90">T3·{effectDef1.name}：{effectDef1.description}</div>
      )}
      {effectDef2 && (
        <div className="mt-0.5 text-[10px] text-teal-300/90">T3·{effectDef2.name}：{effectDef2.description}</div>
      )}
      {/* gem */}
      {item.socketCount > 0 && (
        <div className="mt-0.5 text-[10px] text-sky-300/80">
          {gemDef ? `宝石·${gemDef.name}（${gemDef.stat} +${gemDef.value}）` : '空孔×1'}
        </div>
      )}
      {/* set */}
      {setDef && (
        <div className="mt-0.5 text-[10px] text-primary/80">套装·{setDef.name}</div>
      )}
    </div>
  );
}

export function InventoryPanel({ player, setPlayer: _setPlayer, onBack, pushNotice }: InventoryPanelProps) {
  const equippedIds = useMemo(() => allEquippedIds(player), [player]);

  // Only show unequipped items
  const unequipped = useMemo(
    () => player.inventory.filter((e) => !equippedIds.has(e.id)),
    [player.inventory, equippedIds],
  );

  const recent = [...unequipped].slice(-10).reverse();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Narrative
          eyebrow="行囊"
          title="背包"
          paragraphs={[
            '未装备的物品在此。装备请在角色详情·装备页操作。',
          ]}
        />
        <button
          type="button"
          onClick={() => pushNotice('商会后置：兑换与补给将挂在背包经济侧。')}
          className="shrink-0 rounded-full border border-dashed border-border/80 px-3.5 py-1.5 text-sm text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
        >
          商会
        </button>
      </div>

      <section className="space-y-2">
        <p className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground">
          闲置装备 · {unequipped.length}
        </p>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">背包空空。</p>
        ) : (
          recent.map((item) => <ItemDetail key={item.id} item={item} />)
        )}
      </section>

      <ChoiceList
        choices={[
          {
            id: 'back',
            label: '回到故事',
            onSelect: onBack,
          },
        ]}
      />
    </div>
  );
}
