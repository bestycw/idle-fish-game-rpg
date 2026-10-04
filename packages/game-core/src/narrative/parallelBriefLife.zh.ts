/**
 * 生活段：Skill overlay 优先，否则池子 + heroName / tone 个性化
 */

import type {
  NarrativePreferences,
  ParallelArcId,
  ParallelWorldAxes,
  WorldPreset,
} from '../shared/types.js';
import {
  hashSeed,
  leisureBand,
  LIFE_FAMILY,
  LIFE_FUN,
  pickFromPool,
  type AxisBand,
} from './parallelArcNarrativePools.zh.js';
import { parallelBriefLifeFromOverlay } from './parallelBriefOverlay.js';

function fillHero(text: string, heroName: string): string {
  const name = heroName.trim() || '你';
  return text.replace(/\{\{heroName\}\}/g, name);
}

function toneSuffix(prefs?: NarrativePreferences): string {
  if (prefs?.tone === 'witty') return '|witty';
  if (prefs?.tone === 'earnest') return '|earnest';
  return '|neutral';
}

function stubLifeLine(seed: string, band: AxisBand, prefs?: NarrativePreferences): string {
  const pool =
    hashSeed(`${seed}:tone`) % 2 === 0 || prefs?.tone === 'earnest'
      ? LIFE_FAMILY[band]
      : LIFE_FUN[band];
  return pickFromPool(`${seed}:stub${toneSuffix(prefs)}`, pool);
}

/** 生活与闲暇正文（玩家向一段） */
export function resolveLifeLeisureText(input: {
  seed: string;
  axes: ParallelWorldAxes;
  arcId: ParallelArcId;
  heroName?: string;
  preferences?: NarrativePreferences;
  preset?: WorldPreset;
}): string {
  const band = leisureBand(input.axes.officeGrind);
  const overlayLine = parallelBriefLifeFromOverlay(input.preset, input.arcId, band);
  const name = input.heroName?.trim() || '你';

  if (overlayLine) {
    return fillHero(overlayLine, name);
  }

  let line = stubLifeLine(input.seed, band, input.preferences);
  line = fillHero(line.replace(/^你/, '{{heroName}}'), name);
  return line;
}
