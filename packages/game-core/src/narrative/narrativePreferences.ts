/**
 * 序章末叙事锚点 · 归一化（兼容旧 drive/voice / storyFocus / 无 vector）
 */

import type {
  NarrativeBondLine,
  NarrativeControlPoints,
  NarrativeFortuneArc,
  NarrativeHeroEdge,
  NarrativeLens,
  NarrativePreferences,
  NarrativePressureTone,
  NarrativeVoice,
  NovelFrameId,
  PlayerNarrativeState,
  WorldPreset,
} from '../shared/types.js';
import {
  defaultNarrativePreferences,
  defaultNarrativeVector,
  normalizeStoryMotifs,
  textureForPreset,
} from './narrativeVector.zh.js';
import {
  DEFAULT_NARRATIVE_CONTROL,
  defaultNovelFrameId,
  frameMatchesPreset,
} from './novelFrames.zh.js';

export const DEFAULT_NARRATIVE_PREFERENCES: NarrativePreferences =
  defaultNarrativePreferences('xianxia');

const BONDS: NarrativeBondLine[] = ['bond_solo', 'bond_slow', 'bond_warm'];
const FORTUNES: NarrativeFortuneArc[] = ['fortune_uphill', 'fortune_even', 'fortune_roller'];
const EDGES: NarrativeHeroEdge[] = ['edge_banter', 'edge_stoic', 'edge_warm'];
const LENSES: NarrativeLens[] = ['lens_blade', 'lens_bond', 'lens_riddle'];
const PRESSURES: NarrativePressureTone[] = ['pressure_life', 'pressure_honor', 'pressure_hush'];

function voiceToEdge(voice: NarrativeVoice | undefined): NarrativeHeroEdge {
  switch (voice) {
    case 'voice_stoic':
      return 'edge_stoic';
    case 'voice_warm':
      return 'edge_warm';
    default:
      return 'edge_banter';
  }
}

function parseControl(raw: unknown): NarrativeControlPoints | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const bondLine = o.bondLine;
  const fortuneArc = o.fortuneArc;
  const heroEdge = o.heroEdge;
  if (
    typeof bondLine !== 'string' ||
    typeof fortuneArc !== 'string' ||
    typeof heroEdge !== 'string' ||
    !BONDS.includes(bondLine as NarrativeBondLine) ||
    !FORTUNES.includes(fortuneArc as NarrativeFortuneArc) ||
    !EDGES.includes(heroEdge as NarrativeHeroEdge)
  ) {
    return undefined;
  }
  const base: NarrativeControlPoints = {
    bondLine: bondLine as NarrativeBondLine,
    fortuneArc: fortuneArc as NarrativeFortuneArc,
    heroEdge: heroEdge as NarrativeHeroEdge,
    narrativeLens: DEFAULT_NARRATIVE_CONTROL.narrativeLens,
    pressureTone: DEFAULT_NARRATIVE_CONTROL.pressureTone,
  };
  const lens = o.narrativeLens;
  const pressure = o.pressureTone;
  if (typeof lens === 'string' && LENSES.includes(lens as NarrativeLens)) {
    base.narrativeLens = lens as NarrativeLens;
  }
  if (typeof pressure === 'string' && PRESSURES.includes(pressure as NarrativePressureTone)) {
    base.pressureTone = pressure as NarrativePressureTone;
  }
  return base;
}

function parseVector(raw: unknown, preset: WorldPreset): NarrativePreferences['vector'] {
  const fallback = defaultNarrativeVector(preset);
  if (!raw || typeof raw !== 'object') return fallback;
  const o = raw as Record<string, unknown>;
  let worldTexture = o.worldTexture;
  if (typeof worldTexture !== 'string' || !textureForPreset(preset, worldTexture as never)) {
    worldTexture = fallback.worldTexture;
  }
  return {
    worldTexture: worldTexture as NarrativePreferences['vector']['worldTexture'],
    storyMotifs: normalizeStoryMotifs(o.storyMotifs),
  };
}

export function normalizeNarrativePreferences(
  raw: unknown,
  worldPreset: WorldPreset = 'xianxia',
): NarrativePreferences {
  const fallback = defaultNarrativePreferences(worldPreset);
  if (!raw || typeof raw !== 'object') return fallback;
  const o = raw as Record<string, unknown>;
  const tone = o.tone === 'earnest' ? 'earnest' : 'witty';
  const pace = o.pace === 'fast' ? 'fast' : 'slow_burn';

  const vector = parseVector(o.vector ?? o, worldPreset);

  let novelFrameId = o.novelFrameId as NovelFrameId | undefined;
  if (typeof novelFrameId !== 'string' || !frameMatchesPreset(novelFrameId, worldPreset)) {
    novelFrameId = fallback.novelFrameId;
  }

  let control = parseControl(o.control) ?? { ...DEFAULT_NARRATIVE_CONTROL };
  if (!parseControl(o.control) && typeof o.voice === 'string') {
    control = { ...control, heroEdge: voiceToEdge(o.voice as NarrativeVoice) };
  }

  return { vector, novelFrameId, control, tone, pace };
}

export function normalizePlayerNarrative(
  narrative: PlayerNarrativeState | undefined,
): PlayerNarrativeState | undefined {
  if (!narrative) return undefined;
  const preset = narrative.worldPreset ?? 'xianxia';
  const preferences = normalizeNarrativePreferences(narrative.preferences, preset);
  const mainPlot = narrative.mainPlot
    ? {
        ...narrative.mainPlot,
        preferences: normalizeNarrativePreferences(narrative.mainPlot.preferences, preset),
      }
    : undefined;
  return {
    ...narrative,
    preferences,
    mainPlot,
    volumeId: narrative.volumeId ?? 'vol1',
  };
}
