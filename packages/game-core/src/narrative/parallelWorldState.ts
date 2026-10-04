/**
 * 平行原世界 · 四轴状态 + 弧末推演（真源：parallel-sync-realworld-line spec）
 */

import type {
  ParallelArcId,
  ParallelArcReportSnapshot,
  ParallelCareerBeat,
  ParallelTier,
  ParallelWorldAxes,
  PlayerState,
} from '../shared/types.js';
import {
  computeParallelSyncScore,
  ownedRosterCount,
  partyPowerForSync,
  resolveParallelTierForChapterClear,
} from './parallel-sync.js';
import {
  composeParallelArcBrief,
  previousParallelArcId,
} from './parallelArcNarrative.zh.js';
import type { ParallelBriefSkinContext } from './parallelBriefSkinContext.js';
import { parallelLifeSkinStatus } from './parallelBriefOverlay.js';
import {
  pickFromPool,
  MAINLINE_DEFEAT_RIPPLE,
  MAINLINE_DEFEAT_BOSS_RIPPLE,
  ODD_CHAPTER_PULSE,
} from './parallelArcNarrativePools.zh.js';
import { CHAPTER_BANDS } from '../chapter/bands.js';
import type { ChapterBattleContext } from '../chapter/battleWaves.js';

const BEAT_ORDER: ParallelCareerBeat[] = [
  'endure',
  'micro_rebel',
  'boundary',
  'side_hustle',
  'quit_or_boss',
];

/** 旧存档字段兼容（autonomy 等） */
export function normalizeParallelWorldAxes(raw: unknown): ParallelWorldAxes | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, number>;
  if (typeof o.grit === 'number') {
    return {
      grit: o.grit,
      officeGrind: o.officeGrind,
      backup: o.backup,
      resonance: o.resonance,
    };
  }
  if (typeof o.autonomy === 'number') {
    return {
      grit: o.autonomy,
      officeGrind: o.bossPressure ?? 88,
      backup: o.anchorStrength ?? 8,
      resonance: o.sync ?? 0,
    };
  }
  return undefined;
}

export function parallelArcIdFromChapterCleared(chapterCleared: number): ParallelArcId | null {
  const k = Math.round(chapterCleared);
  if (k < 2 || k % 2 !== 0) return null;
  const n = k / 2;
  if (n < 1 || n > 5) return null;
  return `arc${n}` as ParallelArcId;
}

export function shouldRunParallelArcDeduction(chapterClearedAfter: number): boolean {
  return parallelArcIdFromChapterCleared(chapterClearedAfter) != null;
}

export function defaultParallelWorldAxes(): ParallelWorldAxes {
  return {
    grit: 12,
    officeGrind: 88,
    backup: 8,
    resonance: 0,
  };
}

function clamp100(n: number): number {
  return Math.round(Math.min(100, Math.max(0, n)));
}

/** 弧末四轴偏置：只跟通关表现走，不读叙事偏好 */
const NEUTRAL_AXIS_BIAS = { grit: 3, grindDrop: 3, backup: 3 };

type AxisDelta = {
  grit?: number;
  officeGrind?: number;
  backup?: number;
};

export function computeParallelAxisDelta(
  state: PlayerState,
  chapterClearedAfter: number,
  tier: ParallelTier,
): AxisDelta {
  const bandIndex = Math.min(CHAPTER_BANDS.length - 1, chapterClearedAfter - 1);
  const band = CHAPTER_BANDS[bandIndex]!;
  const party = partyPowerForSync(state);
  const owned = ownedRosterCount(state);
  const bias = NEUTRAL_AXIS_BIAS;

  const tierGrit = tier === 3 ? 14 : tier === 2 ? 9 : 3;
  const crushBonus = party >= band.crushPower ? 6 : 0;
  const gritGain = tierGrit + crushBonus + bias.grit;

  const tierGrindDrop = tier === 3 ? 16 : tier === 2 ? 10 : 2;
  const grindDrop = tierGrindDrop + bias.grindDrop + Math.floor(owned / 4);

  const backupGain = Math.min(18, Math.floor(owned / 2) + tier * 2 + bias.backup);

  return {
    grit: gritGain,
    officeGrind: -grindDrop,
    backup: backupGain,
  };
}

export function mergeParallelAxes(
  prev: ParallelWorldAxes | undefined,
  delta: AxisDelta,
  resonanceScore: number,
): ParallelWorldAxes {
  const base = prev ?? defaultParallelWorldAxes();
  return {
    grit: clamp100(base.grit + (delta.grit ?? 0)),
    officeGrind: clamp100(base.officeGrind + (delta.officeGrind ?? 0)),
    backup: clamp100(base.backup + (delta.backup ?? 0)),
    resonance: clamp100(resonanceScore),
  };
}

export function resolveCareerBeat(axes: ParallelWorldAxes): ParallelCareerBeat {
  if (axes.grit >= 78 && axes.officeGrind <= 35) return 'quit_or_boss';
  if (axes.grit >= 58 && axes.backup >= 40) return 'side_hustle';
  if (axes.grit >= 38) return 'boundary';
  if (axes.grit >= 22) return 'micro_rebel';
  return 'endure';
}

export function advanceCareerBeat(
  current: ParallelCareerBeat | undefined,
  next: ParallelCareerBeat,
): ParallelCareerBeat {
  if (!current) return next;
  const ci = BEAT_ORDER.indexOf(current);
  const ni = BEAT_ORDER.indexOf(next);
  if (ni <= ci) return current;
  return next;
}

/** 弧末简报（叙事由 composeParallelArcBrief 生成，存档字段保留兼容） */
export function buildParallelArcReport(
  arcId: ParallelArcId,
  tier: ParallelTier,
  axes: ParallelWorldAxes,
  beat: ParallelCareerBeat,
  skinContext?: ParallelBriefSkinContext,
  previousReport?: ParallelArcReportSnapshot,
): ParallelArcReportSnapshot {
  const snapshot: ParallelArcReportSnapshot = {
    arcId,
    tier,
    axes: { ...axes },
    careerBeat: beat,
    skinStatus: parallelLifeSkinStatus(skinContext?.worldPreset, arcId),
    generatedAt: Date.now(),
    workstation: '',
    pressure: '',
    syncNote: '',
    nextHint: '',
  };
  const brief = composeParallelArcBrief(
    snapshot,
    skinContext?.heroName,
    previousReport ?? null,
    null,
    skinContext,
  );

  const deltaLine = brief.deltaFromPrev ? `${brief.deltaFromPrev.body}` : '';

  return {
    ...snapshot,
    workstation: `${brief.lifeLeisure.title}：${brief.lifeLeisure.body}`,
    pressure: `${brief.workCareer.title}：${brief.workCareer.body}`,
    syncNote: `${deltaLine}${brief.isekaiRipple.body}`,
    nextHint: brief.nextArc.body,
  };
}

/** @deprecated 使用 buildParallelArcReport */
export const buildStubParallelArcReport = buildParallelArcReport;

function defeatImpact(battle?: ChapterBattleContext | null): {
  delta: AxisDelta;
  syncDrop: number;
  pool: readonly string[];
  seedTag: string;
} {
  const wave = battle?.waveIndex ?? 0;
  const total = battle?.waveTotal ?? 1;
  const isBossWave = total > 1 && wave === total - 1;
  const isEarlyWave = total > 1 && wave < total - 1;
  if (isBossWave) {
    return {
      delta: { grit: -8, officeGrind: 9, backup: -3 },
      syncDrop: 6,
      pool: MAINLINE_DEFEAT_BOSS_RIPPLE,
      seedTag: 'boss',
    };
  }
  if (isEarlyWave) {
    return {
      delta: { grit: -3, officeGrind: 4, backup: -1 },
      syncDrop: 2,
      pool: MAINLINE_DEFEAT_RIPPLE,
      seedTag: `w${wave}`,
    };
  }
  return {
    delta: { grit: -5, officeGrind: 6, backup: -2 },
    syncDrop: 4,
    pool: MAINLINE_DEFEAT_RIPPLE,
    seedTag: 'solo',
  };
}

/** 主线战败：小幅反噬四轴（规略失败感），并写一行 ripple 文案 */
export function applyParallelWorldAfterMainlineDefeat(
  state: PlayerState,
  battle?: ChapterBattleContext | null,
): PlayerState {
  const prevAxes = normalizeParallelWorldAxes(state.narrative?.parallelWorldAxes);
  const sync = state.narrative?.parallelSyncScore ?? computeParallelSyncScore(state);
  const { delta, syncDrop, pool, seedTag } = defeatImpact(battle);
  const resonanceAfter = clamp100(Math.max(0, sync - syncDrop));
  const axes = mergeParallelAxes(prevAxes, delta, resonanceAfter);
  const seed = `${state.seed}|defeat|${seedTag}|${state.chapterCleared ?? 0}|${state.chapterNodeIndex ?? 0}`;
  const ripple = pickFromPool(seed, pool);
  const beat = state.narrative?.parallelCareerBeat;
  return {
    ...state,
    narrative: {
      ...state.narrative,
      phase: state.narrative?.phase ?? 'mainline',
      parallelSyncScore: resonanceAfter,
      parallelWorldAxes: axes,
      parallelCareerBeat: beat,
      parallelMainlineDefeatRipple: ripple,
    },
  };
}

export function clearParallelMainlineDefeatRipple(state: PlayerState): PlayerState {
  if (!state.narrative?.parallelMainlineDefeatRipple) return state;
  const { parallelMainlineDefeatRipple: _, ...rest } = state.narrative;
  return { ...state, narrative: rest };
}

export function applyParallelWorldAfterChapterClear(
  state: PlayerState,
  chapterClearedAfter: number,
): PlayerState {
  const sync = computeParallelSyncScore({ ...state, chapterCleared: chapterClearedAfter });
  const prevAxes = normalizeParallelWorldAxes(state.narrative?.parallelWorldAxes);
  const narrativeBase = {
    ...state.narrative,
    phase: state.narrative?.phase ?? 'mainline',
    parallelSyncScore: sync,
  };

  if (!shouldRunParallelArcDeduction(chapterClearedAfter)) {
    const oddPulse =
      chapterClearedAfter >= 1 && chapterClearedAfter % 2 === 1
        ? pickFromPool(
            `odd|${chapterClearedAfter}|${state.seed}`,
            ODD_CHAPTER_PULSE,
          )
        : state.narrative?.parallelOddChapterRipple;
    return {
      ...state,
      narrative: {
        ...narrativeBase,
        parallelWorldAxes: mergeParallelAxes(prevAxes, {}, sync),
        parallelOddChapterRipple: oddPulse,
      },
    };
  }

  const arcId = parallelArcIdFromChapterCleared(chapterClearedAfter)!;
  const tier = resolveParallelTierForChapterClear(state, chapterClearedAfter);
  const delta = computeParallelAxisDelta(state, chapterClearedAfter, tier);
  const axes = mergeParallelAxes(prevAxes, delta, sync);
  const beat = advanceCareerBeat(
    state.narrative?.parallelCareerBeat,
    resolveCareerBeat(axes),
  );
  const prevArcId = previousParallelArcId(arcId);
  const previousReport =
    prevArcId != null ? state.narrative?.parallelArcReports?.[prevArcId] : undefined;
  const report = buildParallelArcReport(
    arcId,
    tier,
    axes,
    beat,
    {
      heroName: state.narrative?.heroName,
      worldPreset: state.narrative?.worldPreset,
      preferences: state.narrative?.preferences,
    },
    previousReport,
  );

  return {
    ...state,
    narrative: {
      ...narrativeBase,
      parallelWorldAxes: axes,
      parallelCareerBeat: beat,
      parallelTierByArc: {
        ...state.narrative?.parallelTierByArc,
        [arcId]: tier,
      },
      parallelArcReports: {
        ...state.narrative?.parallelArcReports,
        [arcId]: report,
      },
      parallelOddChapterRipple: undefined,
    },
  };
}
