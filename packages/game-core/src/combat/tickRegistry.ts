import type { BattleEvent, BattleState, StatusInstance, UnitRuntime } from '../shared/types.js';
import { markDeadIfNeeded, tryStandFromLethal } from './lifecycle.js';
import { getStatusDef, statusLabel, unitHasStatusFlag } from './statusFx.js';

/** 状态回合开始跳字 id（字符串可扩） */
export type StatusTickKind = string;

export interface StatusTickContext {
  state: BattleState;
  unit: UnitRuntime;
  status: StatusInstance;
  emit: (state: BattleState, code: BattleEvent['code'], payload: Record<string, unknown>) => void;
}

export type StatusTickHandler = (ctx: StatusTickContext) => void;

const ticks = new Map<StatusTickKind, StatusTickHandler>();

export function registerStatusTick(kind: StatusTickKind, handler: StatusTickHandler): void {
  ticks.set(kind, handler);
}

export function listStatusTickKinds(): StatusTickKind[] {
  return [...ticks.keys()];
}

function clearWakeOnDamage(
  state: BattleState,
  unit: UnitRuntime,
  emit: StatusTickContext['emit'],
): void {
  if (!unitHasStatusFlag(unit, 'wakeOnDamage')) return;
  const woke = unit.statuses.filter((s) => {
    if (s.remaining <= 0) return false;
    return Boolean(getStatusDef(s.statusId)?.wakeOnDamage);
  });
  for (const s of woke) {
    unit.statuses = unit.statuses.filter((x) => x.statusId !== s.statusId);
    emit(state, 'status_remove', {
      target: unit.name,
      status: statusLabel(s.statusId),
      reason: '受伤惊醒',
    });
  }
}

/** 回春：maxHp × value(默认 0.04)；禁疗时跳过 */
registerStatusTick('regen_hp_pct', ({ state, unit, status, emit }) => {
  if (unitHasStatusFlag(unit, 'healBlocked')) return;
  const pct = status.value ?? 0.04;
  const heal = Math.max(1, Math.floor(unit.maxHp * pct));
  const before = unit.hp;
  unit.hp = Math.min(unit.maxHp, unit.hp + heal);
  const amount = unit.hp - before;
  if (amount > 0) {
    emit(state, 'heal', { actor: unit.name, target: unit.name, amount });
  }
});

/** 卸力：行动时结算一半推迟伤害 */
registerStatusTick('stagger_hp', ({ state, unit, status, emit }) => {
  const stored = status.value ?? 0;
  if (stored <= 0) return;
  const pay = Math.max(1, Math.ceil(stored / 2));
  status.value = Math.max(0, stored - pay);
  unit.hp = Math.max(0, unit.hp - pay);
  emit(state, 'hit', { actor: unit.name, target: unit.name, amount: pay, knockdown: unit.hp <= 0 });
  if (unit.hp <= 0 && !unit.dead) {
    const save = tryStandFromLethal(unit);
    if (save === 'nirvana') {
      emit(state, 'unit_revive', { target: unit.name, reason: '涅槃' });
    } else {
      markDeadIfNeeded(unit);
      emit(state, 'unit_down', { target: unit.name });
    }
  }
});

/** 侵蚀：每层 2% 生命；满 5 层爆炸 8%×层并清除 */
registerStatusTick('corruption_tick', ({ state, unit, status, emit }) => {
  const layers = status.layers ?? 1;
  const explode = layers >= 5;
  const pct = explode ? 0.08 * layers : 0.02 * layers;
  const dot = Math.max(1, Math.floor(unit.maxHp * pct));
  unit.hp = Math.max(0, unit.hp - dot);
  clearWakeOnDamage(state, unit, emit);
  emit(state, 'hit', { actor: unit.name, target: unit.name, amount: dot, knockdown: unit.hp <= 0 });
  if (explode) {
    unit.statuses = unit.statuses.filter((s) => s.statusId !== 'corruption');
    emit(state, 'status_remove', { target: unit.name, status: statusLabel('corruption'), reason: '侵蚀爆发' });
  }
  if (unit.hp <= 0 && !unit.dead) {
    const save = tryStandFromLethal(unit);
    if (save === 'nirvana') {
      emit(state, 'unit_revive', { target: unit.name, reason: '涅槃' });
    } else {
      markDeadIfNeeded(unit);
      emit(state, 'unit_down', { target: unit.name });
    }
  }
});

/** 流血：maxHp × value(默认 0.03) × 层数 */
registerStatusTick('bleed_hp_pct', ({ state, unit, status, emit }) => {
  const layers = status.layers ?? 1;
  const pct = status.value ?? 0.03;
  const dot = Math.max(1, Math.floor(unit.maxHp * pct * layers));
  unit.hp = Math.max(0, unit.hp - dot);
  clearWakeOnDamage(state, unit, emit);
  if (unit.hp <= 0 && !unit.dead) {
    const save = tryStandFromLethal(unit);
    if (save === 'nirvana') {
      emit(state, 'unit_revive', { target: unit.name, reason: '涅槃' });
    } else {
      markDeadIfNeeded(unit);
      emit(state, 'unit_down', { target: unit.name });
    }
  }
});

/** 行动开始：对单位上所有带 tickKind 的状态各跑一次（同 kind 可多状态） */
export function runStatusTicksOnAct(
  state: BattleState,
  unit: UnitRuntime,
  emit: StatusTickContext['emit'],
): void {
  const snapshot = [...unit.statuses];
  for (const status of snapshot) {
    if (status.remaining <= 0) continue;
    const kind = getStatusDef(status.statusId)?.tickKind;
    if (!kind) continue;
    const handler = ticks.get(kind);
    if (!handler) continue;
    // 状态可能已被前一个 tick 清掉
    if (!unit.statuses.some((s) => s.statusId === status.statusId && s.remaining > 0)) continue;
    handler({ state, unit, status, emit });
  }
}
