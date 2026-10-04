/**
 * 平行原世界 · 弧末简报（玩家向叙事）
 * 异界通关 → 公式改四轴 → band + 种子择句；UI 用 impulses 做手游式结算感。
 */

import type {
  NarrativePreferences,
  ParallelArcId,
  ParallelArcReportSnapshot,
  ParallelCareerBeat,
  ParallelTier,
  ParallelWorldAxes,
  PlayerState,
} from '../shared/types.js';
import {
  buildParallelArcTierCauses,
  parallelArcMainlineAnchor,
} from './parallelArcBriefCauses.js';
import {
  buildParallelImpulses,
  parallelBriefSeedKey,
  syncMoodFromResonance,
  SYNC_MOOD_LABEL,
  TIER_RANK_LABEL,
  type ParallelImpulseTag,
  type ParallelSyncMood,
} from './parallelArcBriefHud.js';
import { resolveLifeLeisureText } from './parallelBriefLife.zh.js';
import {
  type ParallelBriefSkinContext,
  skinContextFromPlayer,
} from './parallelBriefSkinContext.js';
import {
  ARC1_BASELINE,
  axisBand,
  DELTA_BACKUP_UP,
  DELTA_GRIND_DOWN,
  DELTA_GRIND_UP,
  DELTA_GRIT_UP,
  DELTA_NEUTRAL,
  DELTA_RES_UP,
  hashSeed,
  pickFromPool,
  PROMOTION,
  WORK_BOSS,
  WORK_PEERS,
  WORK_VISIBLE,
} from './parallelArcNarrativePools.zh.js';
import {
  getParallelArcCopyBlock,
  parallelArcBeatTitle,
  PARALLEL_TIER_LABEL,
} from './parallelArcCopy.zh.js';

export type { ParallelImpulseTag, ParallelSyncMood } from './parallelArcBriefHud.js';
export { buildParallelImpulses, parallelBriefSeedKey } from './parallelArcBriefHud.js';

export interface ParallelArcBriefSection {
  title: string;
  hint: string;
  body: string;
  /** UI 分页用图标键 */
  icon?: 'delta' | 'life' | 'work' | 'isekai' | 'next';
}

export interface ParallelArcBriefView {
  headline: string;
  subtitle: string;
  tierRank: string;
  careerPhaseLabel: string;
  syncMood: ParallelSyncMood;
  syncMoodLabel: string;
  impulses: ParallelImpulseTag[];
  /** 本段档位原因（最多 3 条） */
  tierCauses: string[];
  /** 主线章节锚点 */
  mainlineAnchor: string;
  /** 向玩家解释「异界怎么推原世界」（无数值） */
  formulaHint: string;
  deltaFromPrev: ParallelArcBriefSection | null;
  lifeLeisure: ParallelArcBriefSection;
  workCareer: ParallelArcBriefSection;
  isekaiRipple: ParallelArcBriefSection;
  nextArc: ParallelArcBriefSection;
  /** 按翻页顺序的卡片 */
  pages: ParallelArcBriefSection[];
}

const CAREER_PHASE_LABEL: Record<ParallelCareerBeat, string> = {
  endure: '硬扛期',
  micro_rebel: '微小反抗',
  boundary: '界线初立',
  side_hustle: '副业试探',
  quit_or_boss: '质变窗口',
};

const TIER_HEADLINE: Record<ParallelTier, string> = {
  1: '原身多数时候仍在被动接招。',
  2: '原身开始还手，局面出现松动。',
  3: '原身占了上风，桎梏上有了裂痕。',
};

const FORMULA_HINT = '';

export function previousParallelArcId(arcId: ParallelArcId): ParallelArcId | null {
  const n = Number(arcId.replace('arc', ''));
  if (!Number.isFinite(n) || n <= 1) return null;
  return `arc${n - 1}` as ParallelArcId;
}

function fillTemplate(text: string, heroName: string, beatTitle: string): string {
  return text
    .replace(/\{\{heroName\}\}/g, heroName)
    .replace(/\{\{beatTitle\}\}/g, beatTitle);
}

function bossPoolKey(axes: ParallelWorldAxes, tier: ParallelTier): string {
  const tight = axes.officeGrind >= 62;
  const firm = axes.grit >= 42;
  if (tight && !firm) return 'tight_weak';
  if (tight && firm) return 'tight_firm';
  if (!tight && firm) return 'loose_firm';
  if (tier >= 2 && axes.grit >= 55) return 'firm_high';
  return 'default';
}

function promotionBand(
  axes: ParallelWorldAxes,
  tier: ParallelTier,
  careerBeat: ParallelCareerBeat,
): 'low' | 'mid' | 'high' {
  if (careerBeat === 'quit_or_boss' || (tier === 3 && axes.resonance >= 58)) return 'high';
  if (axes.resonance >= 58 && tier >= 2) return 'high';
  if (axes.resonance >= 42) return 'mid';
  return 'low';
}

function workCareerBody(
  seed: string,
  axes: ParallelWorldAxes,
  tier: ParallelTier,
  careerBeat: ParallelCareerBeat,
): string {
  const peers = axisBand(axes.backup, 20, 42);
  const visible = axisBand(axes.resonance, 32, 58);
  const prom = promotionBand(axes, tier, careerBeat);
  const candidates = [
    pickFromPool(`${seed}:work:peers`, WORK_PEERS[peers]),
    pickFromPool(
      `${seed}:work:boss`,
      WORK_BOSS[bossPoolKey(axes, tier)] ?? WORK_BOSS.default,
    ),
    pickFromPool(`${seed}:work:vis`, WORK_VISIBLE[visible]),
    pickFromPool(`${seed}:work:prom`, PROMOTION[prom]),
  ];
  const i = hashSeed(`${seed}:wi`) % 4;
  let j = hashSeed(`${seed}:wj`) % 4;
  if (j === i) j = (j + 1) % 4;
  return candidates[i]! + candidates[j]!;
}

function deltaFromPreviousBody(
  seed: string,
  prev: ParallelWorldAxes,
  curr: ParallelWorldAxes,
  prevTier: ParallelTier,
  currTier: ParallelTier,
): string {
  const lines: string[] = [];
  const dGrind = curr.officeGrind - prev.officeGrind;
  const dGrit = curr.grit - prev.grit;
  const dBackup = curr.backup - prev.backup;
  const dRes = curr.resonance - prev.resonance;

  if (dGrind <= -8) lines.push(pickFromPool(`${seed}:d:grind-`, DELTA_GRIND_DOWN));
  else if (dGrind >= 8) lines.push(pickFromPool(`${seed}:d:grind+`, DELTA_GRIND_UP));

  if (dGrit >= 10) lines.push(pickFromPool(`${seed}:d:grit`, DELTA_GRIT_UP));
  if (dBackup >= 10) lines.push(pickFromPool(`${seed}:d:back`, DELTA_BACKUP_UP));
  if (dRes >= 12) lines.push(pickFromPool(`${seed}:d:res`, DELTA_RES_UP));

  if (currTier > prevTier) {
    lines.push('整体档位：比上一段，原身「占上风」的次数明显多了。');
  } else if (currTier < prevTier) {
    lines.push('整体档位：比上一段略回紧，但异界攒下的硬气还没全丢。');
  }

  if (lines.length === 0) return pickFromPool(`${seed}:d:neutral`, DELTA_NEUTRAL);
  return lines.slice(0, 2).join('');
}

function isekaiRippleBody(
  arcId: ParallelArcId,
  tier: ParallelTier,
  beatTitle: string,
  heroName: string,
): string {
  const block = getParallelArcCopyBlock(arcId, tier);
  return fillTemplate(block.syncNote, heroName, beatTitle);
}

function preferenceSeedSuffix(prefs?: NarrativePreferences): string {
  if (!prefs) return '';
  return `|${prefs.tone}|${prefs.pace}`;
}

export function composeParallelArcBrief(
  report: ParallelArcReportSnapshot,
  heroName?: string,
  previousReport?: ParallelArcReportSnapshot | null,
  playerForCauses?: PlayerState | null,
  skinContext?: ParallelBriefSkinContext,
): ParallelArcBriefView {
  const ctx = skinContext ?? (playerForCauses ? skinContextFromPlayer(playerForCauses.narrative) : undefined);
  const name = heroName?.trim() || ctx?.heroName?.trim() || '你';
  const { axes, tier, careerBeat, arcId } = report;
  const beatTitle = parallelArcBeatTitle(arcId);
  const block = getParallelArcCopyBlock(arcId, tier);
  const prefs = ctx?.preferences ?? playerForCauses?.narrative?.preferences;
  const seed =
    parallelBriefSeedKey({
      arcId,
      tier,
      axes,
      generatedAt: report.generatedAt,
    }) + preferenceSeedSuffix(prefs);

  const prevAxes =
    previousReport && previousReport.arcId === previousParallelArcId(arcId)
      ? previousReport.axes
      : undefined;
  const impulses = buildParallelImpulses(axes, prevAxes);
  const syncMood = syncMoodFromResonance(axes.resonance);

  const headline = `${PARALLEL_TIER_LABEL[tier]} · ${CAREER_PHASE_LABEL[careerBeat]}`;
  const subtitle = TIER_HEADLINE[tier];

  let deltaFromPrev: ParallelArcBriefSection | null = null;
  if (previousReport && previousReport.arcId === previousParallelArcId(arcId)) {
    deltaFromPrev = {
      icon: 'delta',
      title: '相较上一段',
      hint: '',
      body: deltaFromPreviousBody(
        seed,
        previousReport.axes,
        axes,
        previousReport.tier,
        tier,
      ),
    };
  } else if (arcId === 'arc1') {
    deltaFromPrev = {
      icon: 'delta',
      title: '相较上一段',
      hint: '',
      body: pickFromPool(`${seed}:arc1`, ARC1_BASELINE),
    };
  }

  const lifeLeisure: ParallelArcBriefSection = {
    icon: 'life',
    title: '生活与闲暇',
    hint: '',
    body: resolveLifeLeisureText({
      seed,
      axes,
      arcId,
      heroName: name,
      preferences: prefs,
      preset: ctx?.worldPreset ?? playerForCauses?.narrative?.worldPreset,
    }),
  };

  const workCareer: ParallelArcBriefSection = {
    icon: 'work',
    title: '工作与前途',
    hint: '',
    body: workCareerBody(seed, axes, tier, careerBeat),
  };

  const mainlineAnchor = parallelArcMainlineAnchor(arcId);
  const isekaiRipple: ParallelArcBriefSection = {
    icon: 'isekai',
    title: '异界本章 · 落到现实',
    hint: mainlineAnchor,
    body: isekaiRippleBody(arcId, tier, beatTitle, name),
  };

  const nextArc: ParallelArcBriefSection = {
    icon: 'next',
    title: '接下来',
    hint: '',
    body: fillTemplate(block.nextHint, name, beatTitle),
  };

  const pages: ParallelArcBriefSection[] = [];
  if (deltaFromPrev) pages.push(deltaFromPrev);
  pages.push(lifeLeisure, workCareer, isekaiRipple, nextArc);

  const tierCauses =
    playerForCauses != null
      ? buildParallelArcTierCauses(playerForCauses, arcId, tier)
      : [];

  return {
    headline,
    subtitle,
    tierRank: TIER_RANK_LABEL[tier],
    careerPhaseLabel: CAREER_PHASE_LABEL[careerBeat],
    syncMood,
    syncMoodLabel: SYNC_MOOD_LABEL[syncMood],
    impulses,
    tierCauses,
    mainlineAnchor,
    formulaHint: FORMULA_HINT,
    deltaFromPrev,
    lifeLeisure,
    workCareer,
    isekaiRipple,
    nextArc,
    pages,
  };
}
