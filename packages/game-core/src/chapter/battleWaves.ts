/**
 * 章节 battle 节点 · 多波遭遇（引擎默认 · 非 Story Skill）
 */

import { ENCOUNTERS } from '../dungeon/encounters.js';
import type { PlayerState } from '../shared/types.js';
import type { BattleWaveDef, ChapterNodeDef } from './defs.js';
import { getChapterByOrder, maxChapterOrder } from './defs.js';
import {
  chapterOrderFromNodeId,
  mainlineBattleWaves,
  mainlinePlanOffsetFromNodeId,
  MAINLINE_WAVES_PER_UNIT,
} from './mainlineBattleWaves.js';

export type { BattleWaveDef } from './defs.js';

export function encounterIndexFromId(encounterId: string): number {
  const idx = ENCOUNTERS.findIndex((e) => e.id === encounterId);
  return idx >= 0 ? idx : 0;
}

/** 单 encounter、battleCap 或手写 battleWaves */
export function battleWavesForNode(
  node: ChapterNodeDef,
  chapterOrder?: number,
): BattleWaveDef[] {
  if (node.kind !== 'battle') return [];
  if (node.battleWaves?.length) return node.battleWaves;
  if (node.battleCap) {
    const order = chapterOrder ?? chapterOrderFromNodeId(node.id);
    const offset = mainlinePlanOffsetFromNodeId(node.id);
    return mainlineBattleWaves(order, node.battleCap, offset);
  }
  if (node.encounterId) return [{ encounterId: node.encounterId }];
  return [];
}

export function chapterBattleWaveIndex(state: PlayerState): number {
  return Math.max(0, state.chapterBattleWaveIndex ?? 0);
}

export interface ChapterBattleContext {
  encounterIndex: number;
  encounterId: string;
  waveIndex: number;
  waveTotal: number;
  waveLabel?: string;
  unitIndex: number;
  unitTotal: number;
  waveInUnit: number;
  unitLabel?: string;
}

function currentBattleNode(state: PlayerState): ChapterNodeDef | null {
  const cleared = Math.max(0, state.chapterCleared ?? 0);
  if (cleared >= maxChapterOrder()) return null;
  const playing = getChapterByOrder(cleared + 1);
  const nodeIndex = Math.max(0, state.chapterNodeIndex ?? 0);
  return playing?.nodes[nodeIndex] ?? null;
}

function chapterOrderForState(state: PlayerState): number {
  const cleared = Math.max(0, state.chapterCleared ?? 0);
  if (cleared >= maxChapterOrder()) return maxChapterOrder();
  return getChapterByOrder(cleared + 1)?.order ?? 1;
}

/** 当前 battle 节点 + 波次 → 本场 encounter */
export function currentChapterBattleContext(state: PlayerState): ChapterBattleContext | null {
  const node = currentBattleNode(state);
  if (!node || node.kind !== 'battle') return null;
  const waves = battleWavesForNode(node, chapterOrderForState(state));
  if (waves.length === 0) return null;
  const waveIndex = Math.min(chapterBattleWaveIndex(state), waves.length - 1);
  const wave = waves[waveIndex]!;
  const hasUnits = waves.some((w) => w.unitIndex != null);
  const unitTotal = hasUnits
    ? Math.max(1, ...waves.map((w) => (w.unitIndex ?? 0) + 1))
    : 1;
  const unitIndex = hasUnits
    ? (wave.unitIndex ?? Math.floor(waveIndex / MAINLINE_WAVES_PER_UNIT))
    : 0;
  const waveInUnit = hasUnits
    ? waveIndex - unitIndex * MAINLINE_WAVES_PER_UNIT
    : waveIndex;
  return {
    encounterIndex: encounterIndexFromId(wave.encounterId),
    encounterId: wave.encounterId,
    waveIndex,
    waveTotal: waves.length,
    waveLabel: wave.label,
    unitIndex,
    unitTotal,
    waveInUnit,
    unitLabel: wave.unitLabel,
  };
}

export function resetChapterBattleWave(state: PlayerState): PlayerState {
  if ((state.chapterBattleWaveIndex ?? 0) === 0) return state;
  return { ...state, chapterBattleWaveIndex: 0 };
}

/** 主线单场胜利后：若仍停在 battle 节点，表示还有未打完的波次 */
export function pendingChapterBattleWaves(state: PlayerState): ChapterBattleContext | null {
  const node = currentBattleNode(state);
  if (!node || node.kind !== 'battle') return null;
  return currentChapterBattleContext(state);
}

/** Hub/结算用：单元数 + 当前阵内进度 */
export function formatChapterBattleWaveProgress(ctx: ChapterBattleContext): string {
  const head =
    ctx.unitTotal > 1
      ? `本节 ${ctx.unitTotal} 阵 · 共 ${ctx.waveTotal} 场`
      : `本节 ${ctx.waveTotal} 场战斗`;
  if (ctx.waveTotal <= 1) return head;
  const u = ctx.unitLabel?.trim() || `第 ${ctx.unitIndex + 1} 阵`;
  const inUnit = `第 ${ctx.waveInUnit + 1}/${MAINLINE_WAVES_PER_UNIT} 场`;
  const label = ctx.waveLabel?.trim();
  const tail = label ? `${inUnit}（${label}）` : inUnit;
  return `${head} · ${u} · ${tail}`;
}

/** Hub：战斗节规模一句话 */
export function formatMainlineBattleNodeCommitment(
  node: ChapterNodeDef,
  chapterOrder: number,
): string | null {
  if (node.kind !== 'battle') return null;
  const waves = battleWavesForNode(node, chapterOrder);
  if (waves.length <= 1) return null;
  const unitTotal = Math.max(1, ...waves.map((w) => (w.unitIndex ?? 0) + 1));
  return `${unitTotal} 阵连战 · 共 ${waves.length} 场（小怪→精锐/首领）`;
}
