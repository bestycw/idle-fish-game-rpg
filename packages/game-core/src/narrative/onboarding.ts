import type { NarrativePreferences, PlayerState, WorldPreset } from '../shared/types.js';
import { DEFAULT_HERO_NAME, normalizeHeroName } from './narrativeProfile.zh.js';
import { normalizeNarrativePreferences } from './narrativePreferences.js';
import { defaultNarrativePreferences } from './narrativeVector.zh.js';
import { PROLOGUE_SKIP_DEFAULT_PRESET } from './prologue.zh.js';
import {
  applyOnboardingSkinBatch,
  generateOnboardingSkinBatch,
  ONBOARDING_SKIN_BATCH_CHAPTER_MAX,
} from './onboardingSkinBatch.js';

export interface NarrativeOnboardingProfile {
  heroName: string;
  preferences: NarrativePreferences;
}

export { ONBOARDING_SKIN_BATCH_CHAPTER_MAX };

export function needsPrologue(state: PlayerState): boolean {
  return state.narrative?.phase !== 'mainline';
}

export function narrativeWorldPreset(state: PlayerState): WorldPreset {
  return state.narrative?.worldPreset ?? PROLOGUE_SKIP_DEFAULT_PRESET;
}

/** 序章结束：一次性批量 Skin 写入存档（玩法中不再生成） */
export function completeNarrativeOnboarding(
  state: PlayerState,
  worldPreset: WorldPreset,
  profile: NarrativeOnboardingProfile,
): PlayerState {
  const heroName = normalizeHeroName(profile.heroName);
  const preferences = normalizeNarrativePreferences(profile.preferences, worldPreset);
  const batch = generateOnboardingSkinBatch({
    worldPreset,
    heroName,
    preferences,
    maxChapterOrder: ONBOARDING_SKIN_BATCH_CHAPTER_MAX,
  });
  return applyOnboardingSkinBatch(state, worldPreset, heroName, preferences, batch);
}

export function skipPrologueToMainline(state: PlayerState): PlayerState {
  const preset = PROLOGUE_SKIP_DEFAULT_PRESET;
  const preferences = defaultNarrativePreferences(preset);
  return completeNarrativeOnboarding(state, preset, {
    heroName: DEFAULT_HERO_NAME,
    preferences,
  });
}

/** 新档默认：从序章开始 */
export function defaultNewNarrativeState(): PlayerState['narrative'] {
  return { phase: 'prologue' };
}

/** 旧档迁移：视为已看完序章 */
export function migratedMainlineNarrative(): PlayerState['narrative'] {
  const worldPreset = PROLOGUE_SKIP_DEFAULT_PRESET;
  const preferences = defaultNarrativePreferences(worldPreset);
  const heroName = DEFAULT_HERO_NAME;
  const batch = generateOnboardingSkinBatch({
    worldPreset,
    heroName,
    preferences,
    maxChapterOrder: ONBOARDING_SKIN_BATCH_CHAPTER_MAX,
  });
  return {
    phase: 'mainline',
    worldPreset,
    heroName,
    preferences,
    bibleId: batch.bibleId,
    novelBible: batch.novelBible,
    mainPlot: batch.mainPlot,
    skinGenerationStatus: batch.skinGenerationStatus,
    skinChapterReady: batch.skinChapterReady,
    volumeId: 'vol1',
    overlay: batch.overlay,
  };
}
