/**
 * 生成 official overlay（脚本用）· 运行时读包见 officialPacksLoader
 */

import { CHAPTERS } from '../chapter/defs.js';
import type { NarrativeOverlay, PlayerState, WorldPreset } from '../shared/types.js';
import { resolveNodeCopyWithoutOfficial } from './resolveNodeCopy.js';

/** 生成 JSON 时勿读已有 official，避免循环 */
export function buildOfficialOverlayFromBaseline(state: PlayerState): NarrativeOverlay {
  const nodes: NarrativeOverlay['nodes'] = {};
  for (const ch of CHAPTERS) {
    for (const n of ch.nodes) {
      const resolved = resolveNodeCopyWithoutOfficial(
        { ...state, narrative: { ...state.narrative, phase: 'mainline', overlay: undefined } },
        n.id,
      );
      if (resolved) {
        nodes[n.id] = {
          title: resolved.title,
          place: resolved.place,
          blurb: resolved.blurb,
        };
      }
    }
  }
  return { nodes };
}

export function emptyOverlayForPreset(_preset: WorldPreset): NarrativeOverlay {
  return { nodes: {} };
}

export { getOfficialOverlay } from './officialPacksLoader.js';
