import { rowOf } from '../formation/grid.js';
import type { BattleState, DamageSchool, Row, UnitRuntime } from '../shared/types.js';
import { createRng } from '../shared/rng.js';

export type ModifierEffect =
  | { kind: 'damage_school_mult'; school: DamageSchool; mult: number }
  | { kind: 'row_dot'; row: Row; pctPerTurn: number; side?: 'player' | 'enemy' }
  | { kind: 'qi_regen_mult'; mult: number; side?: 'player' | 'enemy' };

export type EncounterModifierDef = {
  id: string;
  label: string;
  effects: ModifierEffect[];
};

const REGISTRY = new Map<string, EncounterModifierDef>();

export function registerEncounterModifier(def: EncounterModifierDef): void {
  REGISTRY.set(def.id, def);
}

export function getEncounterModifier(id: string): EncounterModifierDef | undefined {
  return REGISTRY.get(id);
}

export function listEncounterModifierIds(): string[] {
  return [...REGISTRY.keys()];
}

/** 默认猎装/八题共用池（W10 MVP） */
export const DEFAULT_ENCOUNTER_MODIFIER_POOL: readonly string[] = [
  'spirit_surge',
  'frontline_pressure',
  'qi_overflow',
];

registerEncounterModifier({
  id: 'spirit_surge',
  label: '灵力潮汐',
  effects: [{ kind: 'damage_school_mult', school: 'spirit', mult: 1.4 }],
});

registerEncounterModifier({
  id: 'frontline_pressure',
  label: '前线压迫',
  effects: [{ kind: 'row_dot', row: 'front', pctPerTurn: 0.02, side: 'player' }],
});

registerEncounterModifier({
  id: 'qi_overflow',
  label: '能量涌流',
  effects: [{ kind: 'qi_regen_mult', mult: 1.25, side: 'player' }],
});

/** 0–1 条词缀（seed 稳定） */
export function rollEncounterModifiers(seed: number, pool: readonly string[] = DEFAULT_ENCOUNTER_MODIFIER_POOL): string[] {
  const rng = createRng(seed);
  if (pool.length === 0 || rng.next() < 0.35) return [];
  const id = pool[Math.floor(rng.next() * pool.length)]!;
  return getEncounterModifier(id) ? [id] : [];
}

export function resolveEncounterModifiers(ids: string[]): EncounterModifierDef[] {
  return ids.map((id) => getEncounterModifier(id)).filter((d): d is EncounterModifierDef => d != null);
}

export function modifierLogLines(defs: EncounterModifierDef[]): string[] {
  return defs.map((d) => `词缀【${d.label}】生效。`);
}

function activeDefs(state: BattleState): EncounterModifierDef[] {
  return resolveEncounterModifiers(state.encounterModifierIds ?? []);
}

export function encounterOutgoingSchoolMult(state: BattleState, school: DamageSchool): number {
  let mult = 1;
  for (const def of activeDefs(state)) {
    for (const fx of def.effects) {
      if (fx.kind === 'damage_school_mult' && fx.school === school) mult *= fx.mult;
    }
  }
  return mult;
}

export function encounterQiRegenMult(state: BattleState, side: 'player' | 'enemy'): number {
  let mult = 1;
  for (const def of activeDefs(state)) {
    for (const fx of def.effects) {
      if (fx.kind === 'qi_regen_mult' && (fx.side ?? 'player') === side) mult *= fx.mult;
    }
  }
  return mult;
}

/** turn_start 前排队 dot（不改管道顺序，只追加伤害） */
export function applyEncounterRowDots(state: BattleState, unit: UnitRuntime, side: 'player' | 'enemy'): number {
  let total = 0;
  for (const def of activeDefs(state)) {
    for (const fx of def.effects) {
      if (fx.kind !== 'row_dot') continue;
      if ((fx.side ?? 'player') !== side) continue;
      if (rowOf(unit.slot) !== fx.row) continue;
      const dmg = Math.max(1, Math.floor(unit.maxHp * fx.pctPerTurn));
      unit.hp = Math.max(0, unit.hp - dmg);
      total += dmg;
    }
  }
  return total;
}
