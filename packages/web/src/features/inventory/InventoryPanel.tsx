import { wearLoot, type Equipment, type PlayerState } from '@moyu/game-core';
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

function ItemLine({ item }: { item: Equipment }) {
  return (
    <div className={cn('border-l-2 pl-3 py-1.5', rarityTone(item.rarity))}>
      <div className="text-sm text-foreground">{item.name}</div>
      <div className="font-mono text-[11px] text-muted-foreground">
        {item.affixes.map((a) => `${a.name}+${a.value}`).join(' · ')}
        {item.setId ? ` · ${item.setId}` : ''}
      </div>
    </div>
  );
}

export function InventoryPanel({ player, setPlayer, onBack, pushNotice }: InventoryPanelProps) {
  const equippedItems = useMemo(() => {
    return (Object.entries(player.equipped) as [string, string | undefined][])
      .map(([, id]) => player.inventory.find((e) => e.id === id))
      .filter(Boolean) as Equipment[];
  }, [player]);

  const recent = [...player.inventory].slice(-10).reverse();

  const wearChoices = recent.slice(0, 6).map((item) => ({
    id: item.id,
    label: `穿戴 ${item.name}`,
    hint: item.affixes.map((a) => `${a.name}+${a.value}`).join(' · '),
    onSelect: () => {
      setPlayer((p) => wearLoot(p, item.id));
      pushNotice(`已穿戴 ${item.name}`);
    },
  }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Narrative
          eyebrow="行囊"
          title="共用衣柜"
          paragraphs={[
            'V1 全队共用一套装备。猎装试炼掉落会进这里；穿上立刻改全队风格。',
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
        <p className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground">已穿戴</p>
        {equippedItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">还是空手。去猎装试炼碰碰运气。</p>
        ) : (
          equippedItems.map((item) => <ItemLine key={item.id} item={item} />)
        )}
      </section>

      <section className="space-y-2">
        <p className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground">
          最近掉落
        </p>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">背包空空。</p>
        ) : (
          recent.map((item) => <ItemLine key={item.id} item={item} />)
        )}
      </section>

      <ChoiceList
        choices={[
          ...wearChoices,
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
