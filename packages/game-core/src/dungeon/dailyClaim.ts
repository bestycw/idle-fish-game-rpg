import { grantCurrency } from '../character/growth.js';
import { syncStamina, STAMINA_MAX } from '../stamina/stamina.js';
import type { PlayerState } from '../shared/types.js';

/** 摸鱼补给 · 体力 */
export const DAILY_CLAIM_STAMINA = 20;
/** 摸鱼补给 · 召唤券 */
export const DAILY_CLAIM_TICKET = 1;

export function localDayKey(now = Date.now()): string {
  const d = new Date(now);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function canClaimDaily(state: PlayerState, now = Date.now()): boolean {
  return (state.lastDailyClaimDay ?? '') !== localDayKey(now);
}

export type DailyClaimResult =
  | { ok: true; state: PlayerState; message: string }
  | { ok: false; message: string; state: PlayerState };

/**
 * 每日摸鱼补给：体力 + 券，按本地日历日限一次。
 */
export function tryClaimDaily(state: PlayerState, now = Date.now()): DailyClaimResult {
  const synced = syncStamina(state, now);
  const day = localDayKey(now);
  if ((synced.lastDailyClaimDay ?? '') === day) {
    return { ok: false, state: synced, message: '今日补给已领过，明日再来。' };
  }
  let next: PlayerState = {
    ...synced,
    lastDailyClaimDay: day,
  };
  const before = next.stamina ?? 0;
  next = {
    ...next,
    stamina: Math.min(STAMINA_MAX, before + DAILY_CLAIM_STAMINA),
    staminaUpdatedAt: now,
  };
  next = grantCurrency(next, 'ticket', DAILY_CLAIM_TICKET);
  const staminaGot = (next.stamina ?? 0) - before;
  return {
    ok: true,
    state: next,
    message: `摸鱼补给：体力 +${staminaGot} · 券 +${DAILY_CLAIM_TICKET}`,
  };
}
