import {
  DISPLAY_ROWS,
  MAX_PARTY_SIZE,
  UNIT_TEMPLATES,
  getProgress,
  type Equipment,
  type PlayerState,
} from '@moyu/game-core';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { rarityTone } from '@/lib/tones';

type FormationMiniProps = {
  player: PlayerState;
  onEdit?: () => void;
  onOpenCharacter?: (id: string) => void;
  className?: string;
  /** compact：窄屏缩略；panel：侧栏完整一点 */
  density?: 'compact' | 'panel';
};

/** 简易九宫图示 + 已穿摘要（文字游戏的「轻图形」） */
export function FormationMini({
  player,
  onEdit,
  onOpenCharacter,
  className,
  density = 'panel',
}: FormationMiniProps) {
  const count = Object.keys(player.formation).length;
  const equipped = useMemo(() => {
    return (Object.entries(player.equipped) as [string, string | undefined][])
      .map(([, id]) => player.inventory.find((e) => e.id === id))
      .filter(Boolean) as Equipment[];
  }, [player]);

  const cell = density === 'compact' ? 'min-h-9 text-[10px]' : 'min-h-11 text-xs';

  return (
    <aside
      className={cn(
        'rounded-lg border border-border/80 bg-card/50 p-3',
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground">
          阵图 · {count}/{MAX_PARTY_SIZE}
        </p>
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="font-mono text-[11px] text-primary hover:underline"
          >
            调整
          </button>
        ) : null}
      </div>

      <div className="space-y-1">
        {DISPLAY_ROWS.map(({ row, slots }) => (
          <div key={row} className="grid grid-cols-3 gap-1">
            {slots.map((slot) => {
              const id = Object.entries(player.formation).find(([, s]) => s === slot)?.[0];
              const t = id ? UNIT_TEMPLATES.find((u) => u.id === id) : undefined;
              const prog = id ? getProgress(player, id) : null;
              return (
                <button
                  key={slot}
                  type="button"
                  disabled={!id || !onOpenCharacter}
                  onClick={() => id && onOpenCharacter?.(id)}
                  className={cn(
                    'rounded border px-1 py-1 text-left transition',
                    cell,
                    id
                      ? 'border-primary/35 bg-accent/40 hover:border-primary'
                      : 'border-dashed border-border/70 bg-muted/20',
                  )}
                >
                  {t ? (
                    <span className="block truncate leading-tight">
                      {t.name}
                      {density === 'panel' && prog ? (
                        <span className="mt-0.5 block font-mono text-[9px] text-muted-foreground">
                          ★{prog.star}
                        </span>
                      ) : null}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/50">·</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {density === 'panel' ? (
        <div className="mt-3 border-t border-border/60 pt-2">
          <p className="mb-1.5 font-mono text-[11px] tracking-[0.14em] text-muted-foreground">
            已穿 · {equipped.length}
          </p>
          {equipped.length === 0 ? (
            <p className="text-xs text-muted-foreground">猎装掉落可穿，改全队风格。</p>
          ) : (
            <ul className="space-y-1">
              {equipped.slice(0, 4).map((item) => (
                <li
                  key={item.id}
                  className={cn('truncate border-l-2 pl-2 text-xs', rarityTone(item.rarity))}
                >
                  {item.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </aside>
  );
}
