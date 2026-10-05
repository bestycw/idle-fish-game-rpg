/**
 * Hub · 平行原世界入口文案
 */

import type { ParallelArcId, PlayerState } from '../shared/types.js';
import { SYNC_MOOD_LABEL, syncMoodFromResonance } from './parallelArcBriefHud.js';
import { composeParallelArcBrief, previousParallelArcId } from './parallelArcNarrative.zh.js';
import { unseenParallelArcReport } from './applyParallelReport.js';
import { normalizeParallelWorldAxes } from './parallelWorldState.js';

export function latestParallelArcReportId(state: PlayerState): ParallelArcId | null {
  for (let i = 5; i >= 1; i--) {
    const id = `arc${i}` as ParallelArcId;
    if (state.narrative?.parallelArcReports?.[id]) return id;
  }
  return null;
}

export function hubParallelTeaser(state: PlayerState): {
  title: string;
  subtitle: string;
  hasUnread: boolean;
} {
  const unread = unseenParallelArcReport(state) != null;
  const oddRipple = state.narrative?.parallelOddChapterRipple;
  const axes = normalizeParallelWorldAxes(state.narrative?.parallelWorldAxes);
  if (!axes) {
    return {
      title: '原世界',
      subtitle: '通主线后，异界会牵动你的工位与生活',
      hasUnread: unread,
    };
  }
  const mood = SYNC_MOOD_LABEL[syncMoodFromResonance(axes.resonance)];
  const latest = latestParallelArcReportId(state);
  if (!latest) {
    return {
      title: '原世界',
      subtitle: `信道${mood} · 继续推章解锁结算`,
      hasUnread: unread,
    };
  }
  if (unread) {
    return { title: '原世界', subtitle: '有新的现实线结算', hasUnread: true };
  }
  if (oddRipple) {
    return { title: '原世界', subtitle: oddRipple, hasUnread: false };
  }
  const report = state.narrative!.parallelArcReports![latest]!;
  const brief = composeParallelArcBrief(
    report,
    state.narrative?.heroName,
    previousParallelArcId(latest)
      ? state.narrative?.parallelArcReports?.[previousParallelArcId(latest)!]
      : null,
  );
  return {
    title: '原世界',
    subtitle: `${mood} · ${brief.headline}`,
    hasUnread: false,
  };
}
