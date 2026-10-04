/**
 * 运行时地名/NPC 显示名：bible > 存档 overlay > official 包 > preset 默认表
 */

import type { PlayerState } from '../shared/types.js';
import { narrativeWorldPreset } from './onboarding.js';
import { getOfficialOverlay } from './officialPacksLoader.js';
import type { WorldSkinNames } from '../shared/types.js';

function mergeSkinNames(
  official?: WorldSkinNames,
  overlay?: WorldSkinNames,
  bible?: WorldSkinNames,
): WorldSkinNames | undefined {
  const has =
    official?.towns ||
    official?.locations ||
    official?.npcs ||
    official?.npcEpithets ||
    overlay?.towns ||
    overlay?.locations ||
    overlay?.npcs ||
    overlay?.npcEpithets ||
    bible?.towns ||
    bible?.locations ||
    bible?.npcs ||
    bible?.npcEpithets;
  if (!has) return undefined;
  return {
    towns: { ...official?.towns, ...overlay?.towns, ...bible?.towns },
    locations: { ...official?.locations, ...overlay?.locations, ...bible?.locations },
    npcs: { ...official?.npcs, ...overlay?.npcs, ...bible?.npcs },
    npcEpithets: {
      ...official?.npcEpithets,
      ...overlay?.npcEpithets,
      ...bible?.npcEpithets,
    },
  };
}

export function resolveWorldSkinNames(state: PlayerState): WorldSkinNames | undefined {
  const preset = narrativeWorldPreset(state);
  const official = getOfficialOverlay(preset).worldSkinNames as WorldSkinNames | undefined;
  const overlay = state.narrative?.overlay?.worldSkinNames as WorldSkinNames | undefined;
  const bible = state.narrative?.novelBible?.worldSkinNames as WorldSkinNames | undefined;
  return mergeSkinNames(official, overlay, bible);
}
