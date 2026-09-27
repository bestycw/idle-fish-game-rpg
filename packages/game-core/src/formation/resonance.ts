import { rowOf } from './grid.js';
import type { GridSlot, Row, UnitRuntime } from '../shared/types.js';

export type ResonanceCondition =
  | { kind: 'row_full'; row: Row }
  | { kind: 'row_count'; row: Row; min: number };

export type ResonanceEffect = { kind: 'team_stat_mult'; stat: 'def' | 'res'; mult: number };

export type FormationResonanceDef = {
  id: string;
  label: string;
  condition: ResonanceCondition;
  effects: ResonanceEffect[];
};

const REGISTRY = new Map<string, FormationResonanceDef>();

export function registerFormationResonance(def: FormationResonanceDef): void {
  REGISTRY.set(def.id, def);
}

export function listFormationResonanceIds(): string[] {
  return [...REGISTRY.keys()];
}

const ROW_SLOTS: Record<Row, GridSlot[]> = {
  front: [1, 2, 3],
  mid: [4, 5, 6],
  back: [7, 8, 9],
};

function matchesCondition(units: UnitRuntime[], cond: ResonanceCondition): boolean {
  if (cond.kind === 'row_full') {
    const need = ROW_SLOTS[cond.row];
    const occupied = new Set(units.map((u) => u.slot));
    return need.every((s) => occupied.has(s));
  }
  const n = units.filter((u) => rowOf(u.slot) === cond.row).length;
  return n >= cond.min;
}

export function resolveFormationResonances(units: UnitRuntime[]): FormationResonanceDef[] {
  const out: FormationResonanceDef[] = [];
  for (const def of REGISTRY.values()) {
    if (matchesCondition(units, def.condition)) out.push(def);
  }
  return out;
}

export function applyFormationResonanceEffects(units: UnitRuntime[], defs: FormationResonanceDef[]): void {
  for (const def of defs) {
    for (const fx of def.effects) {
      if (fx.kind !== 'team_stat_mult') continue;
      for (const u of units) {
        if (fx.stat === 'def') u.def = Math.round(u.def * fx.mult);
        if (fx.stat === 'res') u.res = Math.round(u.res * fx.mult);
      }
    }
  }
}

export function resonanceLogLines(defs: FormationResonanceDef[]): string[] {
  return defs.map((d) => `共鸣【${d.label}】生效。`);
}

registerFormationResonance({
  id: 'iron_wall',
  label: '铁壁共鸣',
  condition: { kind: 'row_full', row: 'front' },
  effects: [{ kind: 'team_stat_mult', stat: 'def', mult: 1.08 }],
});

registerFormationResonance({
  id: 'rearguard',
  label: '守望共鸣',
  condition: { kind: 'row_count', row: 'back', min: 2 },
  effects: [{ kind: 'team_stat_mult', stat: 'res', mult: 1.06 }],
});
