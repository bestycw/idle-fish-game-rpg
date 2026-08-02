import {
  listEquippedSetProgress,
  setDisplayName,
  wearLoot,
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

function ItemLine({ item }: { item: Equipment }) {
  const setName = setDisplayName(item.setId);
  return (
    <div className={cn('border-l-2 pl-3 py-1.5', rarityTone(item.rarity))}>
      <div className="text-sm text-foreground">{item.name}</div>
      <div className="font-mono text-[11px] text-muted-foreground">
        {item.affixes.map((a) => `${a.name}+${a.value}`).join(' · ')}
        {setName ? ` · [${setName}]` : ''}
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

  const setProgress = useMemo(
    () => listEquippedSetProgress(equippedItems.map((i) => i.setId)),
    [equippedItems],
  );

  const recent = [...player.inventory].slice(-10).reverse();

  const wearChoices = recent.slice(0, 6).map((item) => ({
    id: item.id,
    label: `穿戴 ${item.name}`,
    hint: [
      item.affixes.map((a) => `${a.name}+${a.value}`).join(' · '),
      setDisplayName(item.setId),
    ]
      .filter(Boolean)
      .join(' · '),
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
            'V1 全队共用一套装备。猎装试炼掉落会进这里；凑齐套装 2/4 件改全队风格。',
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

      {setProgress.length > 0 ? (
        <section className="space-y-2">
          <p className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground">套装</p>
          {setProgress.map((s) => (
            <div key={s.id} className="border-l-2 border-primary/40 pl-3 py-1">
              <div className="text-sm text-foreground">
                {s.name} · {s.count}/4
              </div>
              <div className="font-mono text-[11px] text-muted-foreground">
                {s.activeLabels.length > 0
                  ? s.activeLabels.join(' · ')
                  : `${s.blurb}（再凑 ${Math.max(0, 2 - s.count)} 件激活 2 件）`}
              </div>
            </div>
          ))}
        </section>
      ) : null}

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
