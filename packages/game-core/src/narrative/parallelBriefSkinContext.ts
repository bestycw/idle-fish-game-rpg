import type { NarrativePreferences, WorldPreset } from '../shared/types.js';

export type ParallelBriefSkinContext = {
  heroName?: string;
  worldPreset?: WorldPreset;
  preferences?: NarrativePreferences;
};

export function skinContextFromPlayer(
  narrative?: {
    heroName?: string;
    worldPreset?: WorldPreset;
    preferences?: NarrativePreferences;
  } | null,
): ParallelBriefSkinContext | undefined {
  if (!narrative) return undefined;
  return {
    heroName: narrative.heroName,
    worldPreset: narrative.worldPreset,
    preferences: narrative.preferences,
  };
}
