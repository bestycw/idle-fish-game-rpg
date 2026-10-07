import {
  ALLY_BATTLE_ROWS,
  ENEMY_BATTLE_ROWS,
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
import {
  battleCellKey,
  type BattleCellFloat,
  type BattleCellFx,
} from './battleGridFx';
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

function unitCellFrame(unit: UnitRuntime, side: 'enemy' | 'ally'): string {
  if (unit.rank === 'boss') {
    return side === 'enemy'
      ? 'border-amber-400/85 bg-gradient-to-b from-amber-950/45 via-rose-950/25 to-rose-950/12 shadow-[inset_0_1px_0_rgba(251,191,36,0.25),0_0_16px_rgba(251,191,36,0.14)]'
      : 'border-amber-400/70 bg-gradient-to-b from-amber-950/35 to-teal-950/15 shadow-[inset_0_1px_0_rgba(251,191,36,0.2)]';
  }
  if (unit.rank === 'elite') {
    return side === 'enemy'
      ? 'border-rose-400/55 bg-rose-950/28'
      : 'border-teal-400/50 bg-teal-950/22';
  }
  return side === 'enemy'
    ? 'border-rose-500/25 bg-rose-950/20'
    : 'border-teal-500/25 bg-teal-950/15';
}

const FX_CLASS: Record<BattleCellFx['kind'], string> = {
  hit: 'battle-cell-fx-hit',
  crit: 'battle-cell-fx-crit',
  heal: 'battle-cell-fx-heal',
  block: 'battle-cell-fx-block',
  dodge: 'battle-cell-fx-dodge',
  down: 'battle-cell-fx-down',
  cast: 'battle-cell-fx-cast',
  shield: 'battle-cell-fx-shield',
};

function GridCell({
  slot,
  unit,
  side,
  compact,
  cellFx,
  cellFloats,
}: {
  slot: GridSlot;
  unit: UnitRuntime | undefined;
  side: 'enemy' | 'ally';
  compact?: boolean;
  cellFx?: BattleCellFx;
  cellFloats?: BattleCellFloat[];
}) {
  if (!unit) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-lg border border-dashed border-border/50 bg-muted/15',
          compact ? 'min-h-[2.35rem]' : 'min-h-[4.25rem]',
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
        'relative flex flex-col gap-0.5 rounded-lg border px-1.5 py-1 text-left transition',
        compact ? 'min-h-[2.35rem]' : 'min-h-[4.25rem] gap-1 px-2 py-1.5',
        unitCellFrame(unit, side),
        down && 'opacity-40 grayscale',
        unit.isHero && side === 'ally' && 'ring-1 ring-primary/45',
        cellFx && FX_CLASS[cellFx.kind],
      )}
      title={`格 ${slot} · ${rowLabel(rowOf(unit.slot))}`}
    >
      {unit.rank === 'boss' ? (
        <span
          className="pointer-events-none absolute -right-px -top-px z-[1] rounded-bl rounded-tr-lg border border-amber-400/50 bg-amber-950/90 px-1 py-0.5 font-mono text-[8px] font-bold leading-none tracking-wide text-amber-200"
          aria-hidden
        >
          首领
        </span>
      ) : unit.rank === 'elite' ? (
        <span
          className="pointer-events-none absolute -right-px -top-px z-[1] rounded-bl bg-rose-950/85 px-1 py-0.5 font-mono text-[8px] leading-none text-rose-200/90"
          aria-hidden
        >
          精英
        </span>
      ) : null}
      {cellFloats?.map((f) => (
        <span
          key={f.id}
          className={cn(
            'battle-cell-float pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 font-mono text-[11px] font-bold tabular-nums',
            f.kind === 'heal' && 'text-emerald-300',
            f.kind === 'damage' && 'text-orange-200',
            f.kind === 'crit' && 'text-amber-100 drop-shadow-[0_0_6px_rgba(251,191,36,0.85)]',
            f.kind === 'miss' && 'text-slate-200',
            f.kind === 'block' && 'text-sky-200',
          )}
        >
          {f.text}
        </span>
      ))}
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
  fx,
  floats,
}: {
  label: string;
  rows: typeof ALLY_BATTLE_ROWS;
  units: UnitRuntime[];
  side: 'enemy' | 'ally';
  compact?: boolean;
  fx?: Record<string, BattleCellFx>;
  floats?: BattleCellFloat[];
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
                  cellFx={fx?.[battleCellKey(side, slot)]}
                  cellFloats={floats?.filter((f) => f.side === side && f.slot === slot)}
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
        rows={ENEMY_BATTLE_ROWS}
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
  fx,
  floats,
}: {
  battle: BattleState;
  compact?: boolean;
  layout?: BattleGridLayout;
  fx?: Record<string, BattleCellFx>;
  floats?: BattleCellFloat[];
}) {
  if (layout === 'focus') {
    return (
      <div className="shrink-0 overflow-hidden rounded-xl border border-border/80 bg-gradient-to-b from-card/60 to-card/30">
        <div className="border-b border-rose-500/20 bg-rose-950/12 p-1.5 sm:p-2">
          <SideGrid
            label="敌方"
            rows={ENEMY_BATTLE_ROWS}
            units={battle.enemy.units}
            side="enemy"
            compact={compact}
            fx={fx}
            floats={floats}
          />
        </div>
        <div className="border-t border-teal-500/25 bg-teal-950/18 p-1.5 sm:p-2">
          <SideGrid
            label="我方"
            rows={ALLY_BATTLE_ROWS}
            units={battle.player.units}
            side="ally"
            compact={compact}
            fx={fx}
            floats={floats}
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
        rows={ENEMY_BATTLE_ROWS}
        units={battle.enemy.units}
        side="enemy"
        compact={compact}
        fx={fx}
        floats={floats}
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
        fx={fx}
        floats={floats}
      />
      {!compact ? (
        <p className="mt-2 text-center font-mono text-[9px] text-muted-foreground/60">
          同列对位 · 格位 1–9 与布阵页一致
        </p>
      ) : null}
    </div>
  );
}
