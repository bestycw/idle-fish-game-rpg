import {
  DISPLAY_ROWS,
  MAX_PARTY_SIZE,
  RARITY_LABELS,
  UNIT_TEMPLATES,
  benchUnit,
  formationHints,
  getProgress,
  isOwned,
  placeUnit,
  rowLabel,
  type GridSlot,
  type PlayerState,
} from '@moyu/game-core';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { rarityFrame } from '@/lib/tones';

type FormationScreenProps = {
  player: PlayerState;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerState>>;
  onBack: () => void;
  onOpenCharacter: (templateId: string) => void;
  pushNotice: (msg: string) => void;
};

/** 布阵独立页：九宫 + 可选池（从伙伴 Tab 进入） */
export function FormationScreen({
  player,
  setPlayer,
  onBack,
  onOpenCharacter,
  pushNotice,
}: FormationScreenProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const owned = UNIT_TEMPLATES.filter((t) => isOwned(player, t.id));
  const formationCount = Object.keys(player.formation).length;
  const hints = useMemo(() => formationHints(player), [player]);
  const selectedPreferred =
    selectedId != null ? UNIT_TEMPLATES.find((t) => t.id === selectedId)?.preferredSlot : null;

  const onPlace = (slot: GridSlot) => {
    if (!selectedId) {
      pushNotice('先点选下方一名伙伴，再点阵位。');
      return;
    }
    setPlayer((p) => placeUnit(p, selectedId, slot));
  };

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-lg flex-col overflow-hidden pb-2">
      <header className="flex shrink-0 items-start justify-between gap-2">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="font-mono text-[11px] text-muted-foreground hover:text-foreground"
          >
            ← 返回
          </button>
          <h2 className="font-display mt-1 text-2xl tracking-wide">布阵</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            出战 {formationCount}/{MAX_PARTY_SIZE} · 点人再点空位
          </p>
          {hints.missingRoleLine ? (
            <p className="mt-1 font-mono text-[11px] text-amber-200/85">{hints.missingRoleLine}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-primary/40 bg-primary/15 px-3 py-1.5 text-sm text-primary"
        >
          完成
        </button>
      </header>

      <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain">
        <div className="space-y-2.5 rounded-xl border border-border/80 bg-card/40 p-3">
          {DISPLAY_ROWS.map(({ row, slots }) => (
            <div key={row}>
              <p className="mb-1 font-mono text-[10px] tracking-widest text-muted-foreground">
                {rowLabel(row)}
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {slots.map((slot) => {
                  const id = Object.entries(player.formation).find(([, s]) => s === slot)?.[0];
                  const t = id ? UNIT_TEMPLATES.find((u) => u.id === id) : undefined;
                  const prog = id ? getProgress(player, id) : null;
                  const recommendEmpty =
                    !id &&
                    (selectedPreferred === slot ||
                      (!selectedId && hints.preferredSlots.includes(slot)));
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => {
                        if (id) {
                          setSelectedId(id);
                          onOpenCharacter(id);
                        } else {
                          onPlace(slot);
                        }
                      }}
                      className={cn(
                        'min-h-[4rem] rounded-lg border px-2 py-2 text-left transition',
                        id && t
                          ? cn(rarityFrame(t.rarity), 'hover:brightness-110')
                          : 'border-dashed border-border bg-muted/30 hover:border-primary/50',
                        selectedId && !id && 'ring-1 ring-primary/40',
                        recommendEmpty && 'border-primary/45 bg-primary/10',
                      )}
                    >
                      {t ? (
                        <>
                          <div className="truncate text-sm font-medium">{t.name}</div>
                          <div className="font-mono text-[10px] text-muted-foreground">
                            {RARITY_LABELS[t.rarity]} · Lv{prog?.level ?? 1} · ★{prog?.star ?? 0}
                          </div>
                          {!t.isHero ? (
                            <button
                              type="button"
                              className="mt-1 font-mono text-[10px] text-primary/80"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPlayer((p) => benchUnit(p, t.id));
                              }}
                            >
                              下阵
                            </button>
                          ) : null}
                        </>
                      ) : (
                        <span className="font-mono text-xs text-muted-foreground">
                          {recommendEmpty ? '荐 · 空位' : '空位'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div>
          <p className="mb-1.5 font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
            可选伙伴
          </p>
          <div className="flex flex-wrap gap-2">
            {owned.map((t) => {
              const onField = Boolean(player.formation[t.id]);
              const prefer = hints.preferredRowById[t.id];
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  className={cn(
                    'rounded-xl border px-3 py-1.5 text-sm transition',
                    rarityFrame(t.rarity),
                    selectedId === t.id && 'ring-1 ring-primary/50 brightness-110',
                    onField && selectedId !== t.id && 'opacity-55',
                  )}
                >
                  {t.name}
                  {prefer ? (
                    <span className="ml-1 font-mono text-[10px] text-muted-foreground">
                      荐·{prefer.replace('排', '')}
                    </span>
                  ) : null}
                  {onField ? ' · 出战' : ''}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
