/**
 * 弧末简报 · 玩家向「本段因」（解释 tier/轴来源，不暴露四轴数字）
 */

import { getChapterByOrder } from '../chapter/defs.js';
import {
  bandForChapterClear,
  ownedRosterCount,
  partyPowerForSync,
} from './parallel-sync.js';
import type { ParallelArcId, ParallelTier, PlayerState } from '../shared/types.js';
import { parallelArcBeatTitle } from './parallelArcCopy.zh.js';

export function chapterClearedForParallelArc(arcId: ParallelArcId): number {
  const n = Number(arcId.replace('arc', ''));
  return n * 2;
}

export function buildParallelArcTierCauses(
  state: PlayerState,
  arcId: ParallelArcId,
  tier: ParallelTier,
): string[] {
  const cleared = chapterClearedForParallelArc(arcId);
  const band = bandForChapterClear(cleared);
  const party = partyPowerForSync(state);
  const owned = ownedRosterCount(state);
  const lines: string[] = [];

  if (tier === 3) {
    if (party >= band.crushPower) {
      lines.push('异界碾压通关 → 原世界硬气、班压改善最明显');
    } else {
      lines.push('名册与战力双达标 → 后援、同频一起抬升');
    }
  } else if (tier === 1) {
    if (party < band.floorPower) {
      lines.push('通关偏险（战力贴地板）→ 原世界仍多被动接招');
    }
    if (owned < 6) {
      lines.push('伙伴尚少 → 同事后援涨得慢');
    }
    if (lines.length < 2) {
      lines.push('勉强过关 → 生活与工作只松动一点点');
    }
  } else {
    lines.push('稳扎稳打通关 → 硬气、班压有机会往好方向走');
  }

  return lines.slice(0, 2);
}

export function parallelArcMainlineAnchor(arcId: ParallelArcId): string {
  const cleared = chapterClearedForParallelArc(arcId);
  const chLo = getChapterByOrder(cleared - 1);
  const chHi = getChapterByOrder(cleared);
  const beat = parallelArcBeatTitle(arcId);
  if (chLo && chHi) {
    return `对应主线：${chLo.name} → ${chHi.name}（阶段：${beat}）`;
  }
  return `主线阶段：${beat}`;
}
