/**
 * 章节 battle 节点 · 多波遭遇（引擎默认 · 非 Story Skill）
 */

import { ENCOUNTERS } from '../dungeon/encounters.js';
import type { PlayerState } from '../shared/types.js';
import type { BattleWaveDef, ChapterNodeDef } from './defs.js';
import { getChapterByOrder, maxChapterOrder } from './defs.js';

export type { BattleWaveDef } from './defs.js';

export function encounterIndexFromId(encounterId: string): number {
  const idx = ENCOUNTERS.findIndex((e) => e.id === encounterId);
  return idx >= 0 ? idx : 0;
}

/** 单 encounter 或 battleWaves；无则空 */
export function battleWavesForNode(node: ChapterNodeDef): BattleWaveDef[] {
  if (node.kind !== 'battle') return [];
  if (node.battleWaves?.length) return node.battleWaves;
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
}

function currentBattleNode(state: PlayerState): ChapterNodeDef | null {
  const cleared = Math.max(0, state.chapterCleared ?? 0);
  if (cleared >= maxChapterOrder()) return null;
  const playing = getChapterByOrder(cleared + 1);
  const nodeIndex = Math.max(0, state.chapterNodeIndex ?? 0);
  return playing?.nodes[nodeIndex] ?? null;
}

/** 当前 battle 节点 + 波次 → 本场 encounter */
export function currentChapterBattleContext(state: PlayerState): ChapterBattleContext | null {
  const node = currentBattleNode(state);
  if (!node || node.kind !== 'battle') return null;
  const waves = battleWavesForNode(node);
  if (waves.length === 0) return null;
  const waveIndex = Math.min(chapterBattleWaveIndex(state), waves.length - 1);
  const wave = waves[waveIndex]!;
  return {
    encounterIndex: encounterIndexFromId(wave.encounterId),
    encounterId: wave.encounterId,
    waveIndex,
    waveTotal: waves.length,
    waveLabel: wave.label,
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

/** Hub/结算用：「本节 N 场 · 当前第 k 场」 */
export function formatChapterBattleWaveProgress(ctx: ChapterBattleContext): string {
  const head = `本节 ${ctx.waveTotal} 场战斗`;
  if (ctx.waveTotal <= 1) return head;
  const label = ctx.waveLabel?.trim();
  const cur = `第 ${ctx.waveIndex + 1}/${ctx.waveTotal} 场`;
  return label ? `${head} · ${cur}（${label}）` : `${head} · ${cur}`;
}
