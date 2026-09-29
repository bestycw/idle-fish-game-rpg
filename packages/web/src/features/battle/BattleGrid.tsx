import {
  ALLY_BATTLE_ROWS,
  DISPLAY_ROWS,
  isLiving,
  rowLabel,
  rowOf,
  statusLabel,
  type BattleState,
  type GridSlot,
  type UnitRuntime,
} from '@moyu/game-core';
import { statusToneKey, unitAt } from '../shared/unitViews';
import { cn } from '@/lib/utils';
import { specTone } from '@/lib/tones';

const COL_LABELS = ['左列', '中列', '右列'];

function HpBar({ unit }: { unit: UnitRuntime }) {
  const pct = unit.maxHp > 0 ? Math.round((Math.max(0, unit.hp) / unit.maxHp) * 100) : 0;
  return (
    <div
      className="relative h-2 overflow-hidden rounded-sm bg-muted/80"
      title={`${unit.hp}/${unit.maxHp}`}
    >
      <div
        className={cn(
          'absolute inset-y-0 left-0 transition-[width]',
          pct <= 25 ? 'bg-red-500/85' : pct <= 50 ? 'bg-amber-500/80' : 'bg-emerald-600/80',
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function GridCell({
  slot,
  unit,
  side,
  compact,
}: {
  slot: GridSlot;
  unit: UnitRuntime | undefined;
  side: 'enemy' | 'ally';
  compact?: boolean;
}) {
  if (!unit) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-lg border border-dashed border-border/50 bg-muted/15',
          compact ? 'min-h-[2.75rem]' : 'min-h-[4.25rem]',
          side === 'enemy' ? 'border-rose-500/15' : 'border-teal-500/15',
        )}
      >
        <span className="font-mono text-[10px] text-muted-foreground/45">{slot}</span>
      </div>
    );
  }

  const down = !isLiving(unit);
  const statuses = unit.statuses.filter((s) => s.remaining > 0).slice(0, 4);
  const extraStatus = unit.statuses.filter((s) => s.remaining > 0).length - statuses.length;

  return (
    <div
      className={cn(
        'flex flex-col gap-0.5 rounded-lg border px-1.5 py-1 text-left transition',
        compact ? 'min-h-[2.75rem]' : 'min-h-[4.25rem] gap-1 px-2 py-1.5',
        side === 'enemy' ? 'border-rose-500/25 bg-rose-950/20' : 'border-teal-500/25 bg-teal-950/15',
        down && 'opacity-40 grayscale',
        unit.isHero && side === 'ally' && 'ring-1 ring-primary/45',
      )}
      title={`格 ${slot} · ${rowLabel(rowOf(unit.slot))}`}
    >
      <div className="flex items-start justify-between gap-1">
        <span
          className={cn(
            'truncate text-xs font-medium leading-tight',
            unit.isHero && 'text-primary',
            down && 'line-through',
          )}
        >
          {unit.name.replace('主角·', '')}
        </span>
        <span className="shrink-0 font-mono text-[9px] text-muted-foreground/55">{slot}</span>
      </div>
      <HpBar unit={unit} />
      <div className="flex flex-wrap items-center gap-0.5">
        {unit.shield > 0 ? (
          <span className={specTone('shield')} title="护盾">
            盾{unit.shield}
          </span>
        ) : null}
        {statuses.map((s) => (
          <span
            key={`${s.statusId}-${s.remaining}`}
            className={specTone(statusToneKey(s.statusId))}
            title={`${statusLabel(s.statusId)} · 剩 ${s.remaining} 动`}
          >
            {statusLabel(s.statusId)}
            {s.remaining > 1 ? `${s.remaining}` : ''}
          </span>
        ))}
        {extraStatus > 0 ? (
          <span className="text-[9px] text-muted-foreground">+{extraStatus}</span>
        ) : null}
      </div>
      {!down && unit.maxQi > 0 && side === 'ally' ? (
        <div className="mt-auto flex items-center gap-1 font-mono text-[9px] text-muted-foreground">
          <span className="text-sky-400/90">气</span>
          {unit.qi}/{unit.maxQi}
        </div>
      ) : null}
    </div>
  );
}

function SideGrid({
  label,
  rows,
  units,
  side,
  compact,
}: {
  label: string;
  rows: typeof DISPLAY_ROWS;
  units: UnitRuntime[];
  side: 'enemy' | 'ally';
  compact?: boolean;
}) {
  return (
    <div>
      <p
        className={cn(
          'mb-1.5 font-mono text-[10px] tracking-[0.14em]',
          side === 'enemy' ? 'text-rose-300/80' : 'text-teal-300/80',
        )}
      >
        {label}
      </p>
      {!compact ? (
        <div className="mb-1 grid grid-cols-3 gap-0.5 px-0.5 font-mono text-[9px] text-muted-foreground/50">
          {COL_LABELS.map((c) => (
            <span key={c} className="text-center">
              {c}
            </span>
          ))}
        </div>
      ) : null}
      <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
        {rows.map(({ row, slots }) => (
          <div key={`${side}-${row}`}>
            <p className="mb-0.5 font-mono text-[9px] text-muted-foreground/70">
              {rowLabel(row)}
            </p>
            <div className={cn('grid grid-cols-3', compact ? 'gap-1' : 'gap-1.5')}>
              {slots.map((slot) => (
                <GridCell
                  key={slot}
                  slot={slot}
                  unit={unitAt(units, slot)}
                  side={side}
                  compact={compact}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 战前：仅敌方阵预览 */
export function BattleGridEnemyOnly({
  battle,
  compact = true,
}: {
  battle: BattleState;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-rose-500/20 bg-rose-950/15',
        compact ? 'p-2' : 'p-3',
      )}
    >
      <SideGrid
        label="敌方预览"
        rows={DISPLAY_ROWS}
        units={battle.enemy.units}
        side="enemy"
        compact={compact}
      />
    </div>
  );
}

type BattleGridLayout = 'classic' | 'focus';

/** 战斗九宫：格位与布阵 1–9 一致；focus = 我方常驻可见，敌方可滚 */
export function BattleGrid({
  battle,
  compact,
  layout = 'classic',
}: {
  battle: BattleState;
  compact?: boolean;
  layout?: BattleGridLayout;
}) {
  if (layout === 'focus') {
    return (
      <div className="overflow-hidden rounded-xl border border-border/80 bg-gradient-to-b from-card/60 to-card/30">
        <div className="shrink-0 border-b border-teal-500/25 bg-teal-950/20 p-2">
          <SideGrid
            label="我方"
            rows={ALLY_BATTLE_ROWS}
            units={battle.player.units}
            side="ally"
            compact={compact}
          />
        </div>
        <div className="max-h-[min(22dvh,190px)] overflow-y-auto overscroll-contain border-t border-rose-500/15 bg-rose-950/10 p-2">
          <SideGrid
            label="敌方"
            rows={DISPLAY_ROWS}
            units={battle.enemy.units}
            side="enemy"
            compact={compact}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-border/80 bg-gradient-to-b from-card/60 to-card/30',
        compact ? 'p-2' : 'p-3 sm:p-4',
      )}
    >
      <SideGrid
        label="敌方"
        rows={DISPLAY_ROWS}
        units={battle.enemy.units}
        side="enemy"
        compact={compact}
      />
      <div className={cn('flex items-center gap-2', compact ? 'my-1' : 'my-2')}>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        <span className="font-mono text-[9px] tracking-widest text-muted-foreground">交锋</span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>
      <SideGrid
        label="我方"
        rows={ALLY_BATTLE_ROWS}
        units={battle.player.units}
        side="ally"
        compact={compact}
      />
      {!compact ? (
        <p className="mt-2 text-center font-mono text-[9px] text-muted-foreground/60">
          同列对位 · 格位 1–9 与布阵页一致
        </p>
      ) : null}
    </div>
  );
}
