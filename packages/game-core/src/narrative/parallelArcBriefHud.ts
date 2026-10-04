/**
 * 弧末简报 HUD：把公式结果翻译成「游戏感」标签（不展示四轴裸数字）
 */

import type { ParallelTier, ParallelWorldAxes } from '../shared/types.js';

const BASELINE_AXES: ParallelWorldAxes = {
  grit: 12,
  officeGrind: 88,
  backup: 8,
  resonance: 0,
};

export type ParallelImpulseTrend = 'up' | 'down' | 'steady';

export type ParallelImpulseTag = {
  id: 'grit' | 'grind' | 'backup' | 'resonance';
  label: string;
  trend: ParallelImpulseTrend;
  /** 短闪字，类似手游结算词条 */
  flash: string;
};

export type ParallelSyncMood = 'silent' | 'echo' | 'resonate' | 'locked';

export function syncMoodFromResonance(resonance: number): ParallelSyncMood {
  if (resonance < 28) return 'silent';
  if (resonance < 52) return 'echo';
  if (resonance < 72) return 'resonate';
  return 'locked';
}

export const SYNC_MOOD_LABEL: Record<ParallelSyncMood, string> = {
  silent: '沉寂',
  echo: '回响',
  resonate: '共振',
  locked: '同频',
};

export const TIER_RANK_LABEL: Record<ParallelTier, string> = {
  1: 'C',
  2: 'B',
  3: 'S',
};

const DELTA_THRESHOLD = 6;

function trendFromDelta(delta: number, invert = false): ParallelImpulseTrend {
  const d = invert ? -delta : delta;
  if (d >= DELTA_THRESHOLD) return 'up';
  if (d <= -DELTA_THRESHOLD) return 'down';
  return 'steady';
}

function flashGrit(trend: ParallelImpulseTrend): string {
  if (trend === 'up') return '硬气↑';
  if (trend === 'down') return '硬气↓';
  return '硬气·';
}

function flashGrind(trend: ParallelImpulseTrend): string {
  if (trend === 'up') return '班压↓';
  if (trend === 'down') return '班压↑';
  return '班压·';
}

function flashBackup(trend: ParallelImpulseTrend): string {
  if (trend === 'up') return '后援↑';
  if (trend === 'down') return '后援↓';
  return '后援·';
}

function flashRes(trend: ParallelImpulseTrend): string {
  if (trend === 'up') return '同频↑';
  if (trend === 'down') return '同频↓';
  return '同频·';
}

/** 对比上一弧（或 arc1 对比默认基线）生成结算词条 */
export function buildParallelImpulses(
  curr: ParallelWorldAxes,
  prev?: ParallelWorldAxes,
): ParallelImpulseTag[] {
  const base = prev ?? BASELINE_AXES;
  const dGrit = curr.grit - base.grit;
  const dGrind = curr.officeGrind - base.officeGrind;
  const dBackup = curr.backup - base.backup;
  const dRes = curr.resonance - base.resonance;

  const gritTrend = trendFromDelta(dGrit);
  const grindTrend = trendFromDelta(dGrind, true);
  const backupTrend = trendFromDelta(dBackup);
  const resTrend = trendFromDelta(dRes);

  return [
    { id: 'resonance', label: '异界同频', trend: resTrend, flash: flashRes(resTrend) },
    { id: 'grit', label: '原身硬气', trend: gritTrend, flash: flashGrit(gritTrend) },
    { id: 'grind', label: '班味压迫', trend: grindTrend, flash: flashGrind(grindTrend) },
    { id: 'backup', label: '同事后援', trend: backupTrend, flash: flashBackup(backupTrend) },
  ];
}

export function parallelBriefSeedKey(parts: {
  arcId: string;
  tier: ParallelTier;
  axes: ParallelWorldAxes;
  generatedAt: number;
}): string {
  const { arcId, tier, axes, generatedAt } = parts;
  return `${arcId}|t${tier}|g${Math.floor(axes.grit / 10)}|o${Math.floor(axes.officeGrind / 10)}|b${Math.floor(axes.backup / 10)}|r${Math.floor(axes.resonance / 10)}|${generatedAt}`;
}
