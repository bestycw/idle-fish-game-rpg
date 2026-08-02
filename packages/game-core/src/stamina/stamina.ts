import type { PlayerState } from '../shared/types.js';

/** 体力上限 */
export const STAMINA_MAX = 100;

/** 恢复 1 点间隔（毫秒）· 6 分钟 */
export const STAMINA_REGEN_MS = 6 * 60 * 1000;

/** 猎装试炼开战消耗（与 DungeonDef.staminaCost 对齐；保留常量兼容 UI） */
export const STAMINA_COST_GEAR = 10;

/** 修炼塔爬一层消耗 */
export const STAMINA_COST_TOWER = 5;

/** 星尘秘境单次消耗 */
export const STAMINA_COST_STARDUST = 8;

/** 镜渊试炼 */
export const STAMINA_COST_ABYSS = 12;

export type StaminaView = {
  current: number;
  max: number;
  /** 距下一点恢复的毫秒；已满则为 0 */
  msToNext: number;
};

function clampStamina(n: number): number {
  return Math.max(0, Math.min(STAMINA_MAX, Math.floor(n)));
}

/** 按时间补满可恢复部分；不改其它字段语义 */
export function syncStamina(state: PlayerState, now = Date.now()): PlayerState {
  const max = STAMINA_MAX;
  let current = state.stamina ?? max;
  let updatedAt = state.staminaUpdatedAt ?? now;

  if (current >= max) {
    return {
      ...state,
      stamina: max,
      staminaUpdatedAt: now,
    };
  }

  if (updatedAt > now) updatedAt = now;
  const elapsed = Math.max(0, now - updatedAt);
  const gained = Math.floor(elapsed / STAMINA_REGEN_MS);
  if (gained <= 0) {
    return {
      ...state,
      stamina: clampStamina(current),
      staminaUpdatedAt: updatedAt,
    };
  }

  const next = clampStamina(current + gained);
  const consumedMs = gained * STAMINA_REGEN_MS;
  const nextUpdatedAt = next >= max ? now : updatedAt + consumedMs;
  return {
    ...state,
    stamina: next,
    staminaUpdatedAt: nextUpdatedAt,
  };
}

export function getStaminaView(state: PlayerState, now = Date.now()): StaminaView {
  const synced = syncStamina(state, now);
  const current = synced.stamina ?? STAMINA_MAX;
  if (current >= STAMINA_MAX) {
    return { current: STAMINA_MAX, max: STAMINA_MAX, msToNext: 0 };
  }
  const updatedAt = synced.staminaUpdatedAt ?? now;
  const msToNext = Math.max(0, STAMINA_REGEN_MS - (now - updatedAt));
  return { current, max: STAMINA_MAX, msToNext };
}

export type SpendStaminaResult =
  | { ok: true; state: PlayerState }
  | { ok: false; message: string; state: PlayerState };

export function trySpendStamina(
  state: PlayerState,
  cost: number,
  now = Date.now(),
): SpendStaminaResult {
  const synced = syncStamina(state, now);
  const need = Math.max(0, Math.floor(cost));
  const current = synced.stamina ?? STAMINA_MAX;
  if (current < need) {
    return {
      ok: false,
      state: synced,
      message: `体力不足（${current}/${need}）。稍后再来或等自然恢复。`,
    };
  }
  return {
    ok: true,
    state: {
      ...synced,
      stamina: current - need,
      staminaUpdatedAt: now,
    },
  };
}

/** 调试/薄壳：直接回满 */
export function refillStamina(state: PlayerState, now = Date.now()): PlayerState {
  return {
    ...state,
    stamina: STAMINA_MAX,
    staminaUpdatedAt: now,
  };
}
