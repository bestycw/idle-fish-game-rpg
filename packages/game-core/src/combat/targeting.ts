import { colOf, rowOf } from '../formation/grid.js';
import { livingUnits } from './lifecycle.js';
import type {
  FocusPolicyId,
  GridSlot,
  Rng,
  TargetPattern,
  UnitRuntime,
} from '../shared/types.js';

/** 默认焦点策略：格子对位 */
export const DEFAULT_FOCUS_POLICY: FocusPolicyId = 'lane';

export interface FocusContext {
  foes: UnitRuntime[];
  actor: UnitRuntime;
  pierce: boolean;
  rng: Rng;
}

export type FocusPolicyFn = (ctx: FocusContext) => UnitRuntime | null;

export interface TargetPatternContext {
  sideUnits: UnitRuntime[];
  focus: UnitRuntime | null;
  rng: Rng;
}

export type TargetPatternFn = (ctx: TargetPatternContext) => UnitRuntime[];

function slotsInRow(row: 'front' | 'mid' | 'back'): GridSlot[] {
  if (row === 'front') return [1, 2, 3];
  if (row === 'mid') return [4, 5, 6];
  return [7, 8, 9];
}

function slotsInCol(col: number): GridSlot[] {
  return [col, col + 3, col + 6] as GridSlot[];
}

/** 同列扫描：普攻由前到后；穿透由后到前（优先中后排） */
function scanSlotsInCol(col: number, pierce: boolean): GridSlot[] {
  const slots = slotsInCol(col);
  return pierce ? [...slots].reverse() : slots;
}

function unitsInSlots(units: UnitRuntime[], slots: GridSlot[]): UnitRuntime[] {
  const set = new Set(slots);
  return livingUnits(units).filter((u) => set.has(u.slot));
}

function unitAtSlot(units: UnitRuntime[], slot: GridSlot): UnitRuntime | null {
  return livingUnits(units).find((u) => u.slot === slot) ?? null;
}

function nearestRowWithUnits(units: UnitRuntime[]): GridSlot[] {
  for (const row of ['front', 'mid', 'back'] as const) {
    const found = unitsInSlots(units, slotsInRow(row));
    if (found.length > 0) return slotsInRow(row);
  }
  return [];
}

function nearestColWithUnits(units: UnitRuntime[], preferredCol: number): GridSlot[] {
  const order = [preferredCol, preferredCol === 1 ? 2 : preferredCol === 3 ? 2 : 1, preferredCol === 2 ? 1 : 3];
  const unique = [...new Set(order)];
  for (const col of unique) {
    if (unitsInSlots(units, slotsInCol(col)).length > 0) return slotsInCol(col);
  }
  return [];
}

/** 列优先顺序：本列 → 邻列 → 更远列 */
function columnPriority(preferredCol: number): number[] {
  if (preferredCol === 1) return [1, 2, 3];
  if (preferredCol === 3) return [3, 2, 1];
  return [2, 1, 3];
}

function pickByLane(foes: UnitRuntime[], actorSlot: GridSlot, pierce: boolean): UnitRuntime | null {
  const living = livingUnits(foes);
  if (living.length === 0) return null;

  const mirror = unitAtSlot(foes, actorSlot);
  if (mirror) return mirror;

  const preferredCol = colOf(actorSlot);
  for (const col of columnPriority(preferredCol)) {
    for (const slot of scanSlotsInCol(col, pierce)) {
      const u = unitAtSlot(foes, slot);
      if (u) return u;
    }
  }
  return living[0] ?? null;
}

function pickLowestHp(foes: UnitRuntime[]): UnitRuntime | null {
  const living = livingUnits(foes);
  if (living.length === 0) return null;
  return [...living].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp || a.slot - b.slot)[0] ?? null;
}

function pickFrontRow(foes: UnitRuntime[]): UnitRuntime | null {
  for (const slot of slotsInRow('front')) {
    const u = unitAtSlot(foes, slot);
    if (u) return u;
  }
  return pickByLane(foes, 2, false);
}

function pickBackline(foes: UnitRuntime[], pierce: boolean): UnitRuntime | null {
  const order = pierce
    ? ([...slotsInRow('back'), ...slotsInRow('mid'), ...slotsInRow('front')] as GridSlot[])
    : ([...slotsInRow('back'), ...slotsInRow('mid')] as GridSlot[]);
  for (const slot of order) {
    const u = unitAtSlot(foes, slot);
    if (u) return u;
  }
  return pickByLane(foes, 8, pierce);
}

const focusPolicies = new Map<FocusPolicyId, FocusPolicyFn>();

focusPolicies.set('lane', (ctx) => pickByLane(ctx.foes, ctx.actor.slot, ctx.pierce));
focusPolicies.set('lowest_hp', (ctx) => pickLowestHp(ctx.foes));
focusPolicies.set('front_row', (ctx) => pickFrontRow(ctx.foes));
focusPolicies.set('backline', (ctx) => pickBackline(ctx.foes, ctx.pierce));
focusPolicies.set('random', (ctx) => {
  const living = livingUnits(ctx.foes);
  if (living.length === 0) return null;
  return living[ctx.rng.int(0, living.length - 1)] ?? null;
});

export function registerFocusPolicy(id: FocusPolicyId, fn: FocusPolicyFn): void {
  focusPolicies.set(id, fn);
}

export function resolveFocusPolicy(
  skillPolicy?: FocusPolicyId,
  unitPolicy?: FocusPolicyId,
): FocusPolicyId {
  return skillPolicy ?? unitPolicy ?? DEFAULT_FOCUS_POLICY;
}

/**
 * 敌方伤害焦点。默认 `lane` 对位；破例改 skill/unit.focusPolicy 或 registerFocusPolicy。
 */
export function pickEnemyFocus(
  foes: UnitRuntime[],
  actor: UnitRuntime,
  opts: { pierce?: boolean; policy?: FocusPolicyId; rng: Rng },
): UnitRuntime | null {
  const policyId = opts.policy ?? DEFAULT_FOCUS_POLICY;
  const fn = focusPolicies.get(policyId) ?? focusPolicies.get(DEFAULT_FOCUS_POLICY)!;
  return fn({
    foes,
    actor,
    pierce: Boolean(opts.pierce),
    rng: opts.rng,
  });
}

/** @deprecated 测试/兼容：按格子对位，等价 policy=lane */
export function pickEnemyFocusLane(
  foes: UnitRuntime[],
  actorSlot: GridSlot,
  pierce = false,
): UnitRuntime | null {
  return pickByLane(foes, actorSlot, pierce);
}

/** 友方治疗焦点：气血比例最低（不对位） */
export function pickAllyHealFocus(units: UnitRuntime[]): UnitRuntime | null {
  const living = livingUnits(units);
  if (living.length === 0) return null;
  return [...living].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0] ?? null;
}

/** 十字邻格（不含斜角） */
const CROSS_ADJ: Record<GridSlot, GridSlot[]> = {
  1: [2, 4],
  2: [1, 3, 5],
  3: [2, 6],
  4: [1, 5, 7],
  5: [2, 4, 6, 8],
  6: [3, 5, 9],
  7: [4, 8],
  8: [5, 7, 9],
  9: [6, 8],
};

function resolveRowPattern(
  sideUnits: UnitRuntime[],
  row: 'front' | 'mid' | 'back',
): UnitRuntime[] {
  let slots = slotsInRow(row);
  let targets = unitsInSlots(sideUnits, slots);
  if (targets.length === 0) {
    slots = nearestRowWithUnits(sideUnits);
    targets = unitsInSlots(sideUnits, slots);
  }
  return targets;
}

const targetPatterns = new Map<TargetPattern, TargetPatternFn>();

function registerBuiltinPatterns(): void {
  targetPatterns.set('single', ({ focus }) => (focus ? [focus] : []));
  targetPatterns.set('all', ({ sideUnits }) => livingUnits(sideUnits));
  targetPatterns.set('row_front', ({ sideUnits }) => resolveRowPattern(sideUnits, 'front'));
  targetPatterns.set('row_mid', ({ sideUnits }) => resolveRowPattern(sideUnits, 'mid'));
  targetPatterns.set('row_back', ({ sideUnits }) => resolveRowPattern(sideUnits, 'back'));
  targetPatterns.set('row_focus', ({ sideUnits, focus }) => {
    if (!focus) return [];
    return unitsInSlots(sideUnits, slotsInRow(rowOf(focus.slot)));
  });
  targetPatterns.set('col_focus', ({ sideUnits, focus }) => {
    if (!focus) return [];
    return unitsInSlots(sideUnits, nearestColWithUnits(sideUnits, colOf(focus.slot)));
  });
  targetPatterns.set('col_left', ({ sideUnits }) =>
    unitsInSlots(sideUnits, nearestColWithUnits(sideUnits, 1)),
  );
  targetPatterns.set('col_mid', ({ sideUnits }) =>
    unitsInSlots(sideUnits, nearestColWithUnits(sideUnits, 2)),
  );
  targetPatterns.set('col_right', ({ sideUnits }) =>
    unitsInSlots(sideUnits, nearestColWithUnits(sideUnits, 3)),
  );
  /** 十字：焦点 + 上下左右（无斜角） */
  targetPatterns.set('cross', ({ sideUnits, focus }) => {
    if (!focus) return [];
    const slots = [focus.slot, ...CROSS_ADJ[focus.slot]];
    return unitsInSlots(sideUnits, slots);
  });
}

registerBuiltinPatterns();

/** 注册/覆盖形状解析；未知 pattern 回落 single */
export function registerTargetPattern(id: TargetPattern, fn: TargetPatternFn): void {
  targetPatterns.set(id, fn);
}

export function resolveTargets(
  pattern: TargetPattern,
  sideUnits: UnitRuntime[],
  focus: UnitRuntime | null,
  rng: Rng,
): UnitRuntime[] {
  const living = livingUnits(sideUnits);
  if (living.length === 0) return [];
  const fn = targetPatterns.get(pattern) ?? targetPatterns.get('single')!;
  return fn({ sideUnits, focus, rng });
}
