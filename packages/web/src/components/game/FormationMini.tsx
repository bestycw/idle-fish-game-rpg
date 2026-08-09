import {
  DISPLAY_ROWS,
  MAX_PARTY_SIZE,
  UNIT_TEMPLATES,
  getProgress,
  type PlayerState,
} from '@moyu/game-core';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

type FormationMiniProps = {
  player: PlayerState;
  onEdit?: () => void;
  onOpenCharacter?: (id: string) => void;
  className?: string;
  /** compact：窄屏缩略；panel：侧栏完整一点 */
  density?: 'compact' | 'panel';
};

/** Count total equipped items across all deployed characters */
function totalEquippedCount(player: PlayerState): number {
  let count = 0;
  if (player.characterEquip) {
    for (const [tid] of Object.entries(player.formation)) {
      const slotMap = player.characterEquip[tid];
      if (slotMap) count += Object.keys(slotMap).length;
    }
  }
  return count;
}

/** 简易九宫图示 + 装备统计 */
export function FormationMini({
  player,
  onEdit,
  onOpenCharacter,
  className,
  density = 'panel',
}: FormationMiniProps) {
  const count = Object.keys(player.formation).length;
  const equippedCount = useMemo(() => totalEquippedCount(player), [player]);

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
            出战角色装备 · {equippedCount}
          </p>
          {equippedCount === 0 ? (
            <p className="text-xs text-muted-foreground">角色详情页可穿装备。</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              出战 {count} 角色共穿戴 {equippedCount} 件装备
            </p>
          )}
        </div>
      ) : null}
    </aside>
  );
}
