/**
 * 序章提交 · 一次性批量 Skin（Phase A + B）
 * 玩法过程中不再生成；未覆盖的章仍由 resolveNodeCopy 回退 official。
 */

import { CHAPTERS } from '../chapter/defs.js';
import type {
  NarrativeOverlay,
  NarrativePreferences,
  NovelBible,
  PlayerState,
  SkinGenerationStatus,
  WorldPreset,
} from '../shared/types.js';
import { getOfficialOverlay } from './officialPacksLoader.js';
import { createStubNarrativeBible } from './narrativeProfile.zh.js';
import { normalizeNarrativePreferences } from './narrativePreferences.js';
import { defaultNovelFrameId, getNovelFrame } from './novelFrames.zh.js';
import { defaultNarrativePreferences } from './narrativeVector.zh.js';
import { normalizeHeroName } from './narrativeProfile.zh.js';
import { validateOverlayChapterRange } from './validateNodeSkin.js';
import { VOLUME1_BEATS } from './volumeBeats.js';
import { presetWorldSkinNames } from './worldSpine.js';
import { getOfficialVolumeOutline } from './volumeOutline.js';

export interface OnboardingSkinBatchInput {
  worldPreset: WorldPreset;
  heroName: string;
  preferences: NarrativePreferences;
  maxChapterOrder?: number;
}

/** 序章一次性生成的最大章序（1–10；改 8 则只写入 ch1–ch8 节点，ch9+ 运行时读 official） */
export const ONBOARDING_SKIN_BATCH_CHAPTER_MAX = 10;

const WORLD_DISPLAY: Record<WorldPreset, string> = {
  wuxia: '江湖裂隙',
  xianxia: '九州劫域',
  cyberpunk: '下层霓虹域',
};

export interface OnboardingSkinBatchResult {
  bibleId: string;
  novelBible: NovelBible;
  mainPlot: ReturnType<typeof createStubNarrativeBible>;
  overlay: NarrativeOverlay;
  skinChapterReady: number;
  skinGenerationStatus: SkinGenerationStatus;
}

export function nodeIdsForChapterOrderUpTo(maxChapterOrder: number): string[] {
  const ids: string[] = [];
  for (const ch of CHAPTERS) {
    if (ch.order > maxChapterOrder) break;
    for (const n of ch.nodes) ids.push(n.id);
  }
  return ids;
}

function bibleIdFor(preferences: NarrativePreferences, preset: WorldPreset): string {
  const frame = preferences.novelFrameId ?? defaultNovelFrameId(preset);
  const motifs = preferences.vector.storyMotifs.join('+');
  return `${preset}:${frame}:${preferences.vector.worldTexture}:${motifs}`;
}

export function createNovelBibleFromPreferences(
  worldPreset: WorldPreset,
  heroName: string,
  preferences: NarrativePreferences,
): NovelBible {
  const frameId = preferences.novelFrameId ?? defaultNovelFrameId(worldPreset);
  const frame = getNovelFrame(frameId);
  const seed = frame.seed;
  return {
    id: bibleIdFor(preferences, worldPreset),
    preset: worldPreset,
    heroRole: `${heroName} · ${seed.heroRole}`,
    worldDisplayName: WORLD_DISPLAY[worldPreset],
    lexicon: [...seed.lexiconHints],
    forbidden: [...seed.avoidMixing],
    rosterRule: seed.rosterHook,
    chapterThesis: VOLUME1_BEATS.map((b) => b.beatSummary),
  };
}

function preferencesMatchDefault(
  preferences: NarrativePreferences,
  preset: WorldPreset,
): boolean {
  const d = defaultNarrativePreferences(preset);
  return JSON.stringify(preferences) === JSON.stringify(d);
}

/** 从官方包截取批量范围（Skill/LLM 未接时 = 默认皮一次性写入存档） */
export function sliceOfficialOverlay(
  preset: WorldPreset,
  maxChapterOrder: number,
): NarrativeOverlay {
  const full = getOfficialOverlay(preset);
  const allow = new Set(nodeIdsForChapterOrderUpTo(maxChapterOrder));
  const nodes: NarrativeOverlay['nodes'] = {};
  for (const [id, copy] of Object.entries(full.nodes)) {
    if (allow.has(id)) nodes[id] = { ...copy };
  }
  const fromOutline = getOfficialVolumeOutline(preset, 'vol1')?.worldSkinNames;
  const worldSkinNames =
    full.worldSkinNames ?? fromOutline ?? presetWorldSkinNames(preset);
  return { nodes, worldSkinNames };
}

/**
 * 同步批量：写入 overlay 片段 + bible + mainPlot。
 * 后续可在此函数前/后接 LLM（同输入输出形状），不必改 Hub/战斗。
 */
export function generateOnboardingSkinBatch(
  input: OnboardingSkinBatchInput,
): OnboardingSkinBatchResult {
  const worldPreset = input.worldPreset;
  const heroName = normalizeHeroName(input.heroName);
  const preferences = normalizeNarrativePreferences(input.preferences, worldPreset);
  const maxChapterOrder = Math.min(
    10,
    Math.max(1, input.maxChapterOrder ?? ONBOARDING_SKIN_BATCH_CHAPTER_MAX),
  );

  let overlay = sliceOfficialOverlay(worldPreset, maxChapterOrder);
  const skinNames = overlay.worldSkinNames ?? presetWorldSkinNames(worldPreset);
  const novelBible: NovelBible = {
    ...createNovelBibleFromPreferences(worldPreset, heroName, preferences),
    worldSkinNames: {
      towns: skinNames.towns ? { ...skinNames.towns } : undefined,
      locations: skinNames.locations ? { ...skinNames.locations } : undefined,
      npcs: skinNames.npcs ? { ...skinNames.npcs } : undefined,
      npcEpithets: skinNames.npcEpithets ? { ...skinNames.npcEpithets } : undefined,
    },
  };
  const usingDefaultPrefs = preferencesMatchDefault(preferences, worldPreset);
  const skinGenerationStatus: SkinGenerationStatus = usingDefaultPrefs ? 'ready' : 'stub';
  const mainPlot = createStubNarrativeBible(worldPreset, heroName, preferences, {
    skinStatus: skinGenerationStatus,
  });

  const issues = validateOverlayChapterRange(overlay, worldPreset, maxChapterOrder);
  if (issues.length > 0) {
    overlay = sliceOfficialOverlay(worldPreset, maxChapterOrder);
  }

  return {
    bibleId: novelBible.id,
    novelBible,
    mainPlot,
    overlay,
    skinChapterReady: maxChapterOrder,
    skinGenerationStatus,
  };
}

export function applyOnboardingSkinBatch(
  state: PlayerState,
  worldPreset: WorldPreset,
  heroName: string,
  preferences: NarrativePreferences,
  batch: OnboardingSkinBatchResult,
): PlayerState {
  return {
    ...state,
    narrative: {
      phase: 'mainline',
      worldPreset,
      heroName: normalizeHeroName(heroName),
      preferences: normalizeNarrativePreferences(preferences, worldPreset),
      bibleId: batch.bibleId,
      novelBible: batch.novelBible,
      mainPlot: batch.mainPlot,
      skinGenerationStatus: batch.skinGenerationStatus,
      skinChapterReady: batch.skinChapterReady,
      volumeId: 'vol1',
      overlay: batch.overlay,
    },
  };
}
