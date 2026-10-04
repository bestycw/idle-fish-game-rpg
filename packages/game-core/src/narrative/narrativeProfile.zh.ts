/**
 * 序章末：角色名 + 小说类型 + 控制点 → 剧本皮槽位
 */

import type {
  MainPlotOutline,
  NarrativePreferences,
  SkinGenerationStatus,
  WorldPreset,
} from '../shared/types.js';
import { DEFAULT_NARRATIVE_PREFERENCES } from './narrativePreferences.js';
import {
  BOND_LINE_LABEL,
  defaultNovelFrameId,
  FORTUNE_ARC_LABEL,
  getNovelFrame,
  HERO_EDGE_LABEL,
  NARRATIVE_LENS_LABEL,
  PRESSURE_TONE_LABEL,
} from './novelFrames.zh.js';
import { STORY_MOTIF_OPTIONS, WORLD_TEXTURE_OPTIONS } from './narrativeVector.zh.js';
import { VOLUME1_BEATS } from './volumeBeats.js';

export { DEFAULT_NARRATIVE_PREFERENCES } from './narrativePreferences.js';

const WORLD_NAME: Record<WorldPreset, string> = {
  xianxia: '九州劫域',
  wuxia: '江湖裂隙',
  cyberpunk: '下层霓虹域',
};

const TONE_LABEL = { witty: '诙谐', earnest: '偏正剧' } as const;
const PACE_LABEL = { slow_burn: '慢热', fast: '开门见山' } as const;

export const DEFAULT_HERO_NAME = '旅人';

export function normalizeHeroName(raw: string): string {
  const t = raw.trim().replace(/\s+/g, '');
  if (!t) return DEFAULT_HERO_NAME;
  return t.slice(0, 12);
}

/** 序章末主线提纲：卷骨来自 Spine；节点文案由官方/玩家 overlay 提供 */
export function createStubNarrativeBible(
  worldPreset: WorldPreset,
  heroName: string,
  preferences: NarrativePreferences,
  options?: { skinStatus?: SkinGenerationStatus },
): MainPlotOutline {
  const worldName = WORLD_NAME[worldPreset];
  const frameId = preferences.novelFrameId ?? defaultNovelFrameId(worldPreset);
  const frame = getNovelFrame(frameId);
  const tex =
    WORLD_TEXTURE_OPTIONS[worldPreset].find((t) => t.id === preferences.vector.worldTexture)?.title ??
    '默认';
  const motifs = preferences.vector.storyMotifs
    .map((m) => STORY_MOTIF_OPTIONS.find((o) => o.id === m)?.title ?? m)
    .join('·');
  const skinStatus: SkinGenerationStatus = options?.skinStatus ?? 'ready';
  const chapters = VOLUME1_BEATS.map((b) => ({
    order: b.chapterOrder,
    title: `第${b.chapterOrder}章 · ${b.beatTitle}`,
    blurb: b.beatSummary,
    fillStatus: skinStatus === 'ready' ? ('filled' as const) : ('placeholder' as const),
  }));

  const { control } = preferences;
  const logline =
    `${heroName} · ${worldName} · ${tex} · ${motifs} ·「${frame.title}」：` +
    frame.pitch +
    ` 控制：${BOND_LINE_LABEL[control.bondLine]} · ${FORTUNE_ARC_LABEL[control.fortuneArc]} · ${HERO_EDGE_LABEL[control.heroEdge]} · ${NARRATIVE_LENS_LABEL[control.narrativeLens]} · ${PRESSURE_TONE_LABEL[control.pressureTone]}；` +
    `${TONE_LABEL[preferences.tone]} · ${PACE_LABEL[preferences.pace]}。`;

  return {
    worldPreset,
    heroName,
    preferences,
    skinStatus,
    logline,
    chapters,
    generatedAt: Date.now(),
  };
}

export function narrativeProfileSummary(state: {
  narrative?: {
    heroName?: string;
    mainPlot?: MainPlotOutline;
    skinGenerationStatus?: SkinGenerationStatus;
  };
}): string | null {
  const plot = state.narrative?.mainPlot;
  if (plot?.logline) return plot.logline;
  const name = state.narrative?.heroName;
  if (name) return `${name} · 卷一主线`;
  return null;
}

export function skinStatusLabel(status: SkinGenerationStatus | undefined): string {
  switch (status) {
    case 'ready':
      return '卷一主线 · 已编织';
    case 'stub':
      return '卷一主线 · 定参已录（文案待润色）';
    case 'pending_skill':
      return '卷一主线 · 生成中';
    default:
      return '卷一主线';
  }
}
