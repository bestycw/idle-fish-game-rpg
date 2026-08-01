import type { Rng, StatusId, UnitRuntime } from '../shared/types.js';
import { getStatusDef } from './statusRegistry.js';

export {
  getStatusDef,
  rankGate,
  registerStatus,
  statusCcDrBucket,
  statusLabel,
  enforceStatusSoftCap,
  STATUS_SOFT_CAP,
  type RankGate,
  type StatusDef,
} from './statusRegistry.js';

/** 硬控 DR 窗口：自上次挂上起目标行动次数 */
export const CC_DR_WINDOW_ACTS = 6;

/** 单位行动时推进所有 DR 桶窗口 */
export function tickCcDrOnAct(unit: UnitRuntime): void {
  for (const kind of Object.keys(unit.ccDr)) {
    const entry = unit.ccDr[kind];
    if (!entry) continue;
    entry.actsLeft -= 1;
    if (entry.actsLeft <= 0) {
      delete unit.ccDr[kind];
    }
  }
}

/**
 * 硬控 DR：第 1 次满时长 → 第 2 次 ×0.5 → 第 3 次起免疫直至窗口结束。
 * 返回调整后时长；null 表示本窗口免疫。
 */
export function applyCcDrDuration(
  unit: UnitRuntime,
  bucket: string,
  baseDuration: number,
): number | null {
  let entry = unit.ccDr[bucket];
  if (!entry || entry.actsLeft <= 0) {
    unit.ccDr[bucket] = { applications: 1, actsLeft: CC_DR_WINDOW_ACTS };
    return baseDuration;
  }
  entry.applications += 1;
  entry.actsLeft = CC_DR_WINDOW_ACTS;
  if (entry.applications >= 3) return null;
  if (entry.applications === 2) return Math.max(1, Math.floor(baseDuration * 0.5));
  return baseDuration;
}

/** purge：优先拆护盾，再拆 purgeable 增益 */
export function pickPurgeTarget(unit: UnitRuntime, rng: Rng): 'shield' | StatusId | null {
  if (unit.shield > 0) return 'shield';
  const buffs = unit.statuses.filter((s) => {
    if (s.remaining <= 0) return false;
    return Boolean(getStatusDef(s.statusId)?.purgeable);
  });
  if (buffs.length === 0) return null;
  return rng.pick(buffs).statusId;
}

export function pickCleanseTarget(unit: UnitRuntime, rng: Rng): StatusId | null {
  const candidates = unit.statuses.filter((s) => {
    if (s.remaining <= 0) return false;
    return Boolean(getStatusDef(s.statusId)?.cleanseable);
  });
  if (candidates.length === 0) return null;
  return rng.pick(candidates).statusId;
}

export function unitHasStatusFlag(
  unit: UnitRuntime,
  flag: keyof import('./statusRegistry.js').StatusDef,
): boolean {
  return unit.statuses.some((s) => {
    if (s.remaining <= 0) return false;
    const def = getStatusDef(s.statusId);
    return Boolean(def && def[flag]);
  });
}
