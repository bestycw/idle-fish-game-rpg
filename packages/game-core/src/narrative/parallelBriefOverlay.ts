import type { ParallelArcId, SkinGenerationStatus, WorldPreset } from '../shared/types.js';
import type { AxisBand } from './parallelArcNarrativePools.zh.js';
import xianxiaParallel from './officialPacks/xianxia.parallel.overlay.json' with { type: 'json' };

export type ParallelBriefLifeBands = Partial<Record<AxisBand, string>>;

export interface ParallelBriefSegmentOverlay {
  life?: ParallelBriefLifeBands;
}

export interface ParallelBriefOverlayFile {
  schemaVersion: number;
  preset: WorldPreset;
  segments: Partial<Record<ParallelArcId, ParallelBriefSegmentOverlay>>;
}

const PACKS: Partial<Record<WorldPreset, ParallelBriefOverlayFile>> = {
  xianxia: xianxiaParallel as ParallelBriefOverlayFile,
};

export function getParallelBriefOverlay(preset: WorldPreset | undefined): ParallelBriefOverlayFile | null {
  if (!preset) return null;
  return PACKS[preset] ?? null;
}

const BANDS: AxisBand[] = ['low', 'mid', 'high'];

export function parallelLifeSkinStatus(
  preset: WorldPreset | undefined,
  arcId: ParallelArcId,
): SkinGenerationStatus {
  const life = getParallelBriefOverlay(preset)?.segments?.[arcId]?.life;
  if (!life) return 'stub';
  return BANDS.every((b) => Boolean(life[b]?.trim())) ? 'ready' : 'stub';
}

export function parallelBriefLifeFromOverlay(
  preset: WorldPreset | undefined,
  arcId: ParallelArcId,
  band: AxisBand,
): string | null {
  const pack = getParallelBriefOverlay(preset);
  const raw = pack?.segments?.[arcId]?.life?.[band]?.trim();
  if (!raw) return null;
  return raw;
}
