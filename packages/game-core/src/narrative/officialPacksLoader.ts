import type { NarrativeOverlay, WorldPreset } from '../shared/types.js';
import wuxiaOverlay from './officialPacks/wuxia.overlay.json' with { type: 'json' };
import xianxiaOverlay from './officialPacks/xianxia.overlay.json' with { type: 'json' };
import cyberpunkOverlay from './officialPacks/cyberpunk.overlay.json' with { type: 'json' };

const PACKS: Record<WorldPreset, NarrativeOverlay> = {
  wuxia: wuxiaOverlay as NarrativeOverlay,
  xianxia: xianxiaOverlay as NarrativeOverlay,
  cyberpunk: cyberpunkOverlay as NarrativeOverlay,
};

export function getOfficialOverlay(preset: WorldPreset): NarrativeOverlay {
  return PACKS[preset];
}
