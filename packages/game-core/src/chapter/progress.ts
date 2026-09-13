import { getDungeon, type DungeonId } from '../dungeon/defs.js';
import { ENCOUNTERS } from '../dungeon/encounters.js';
import type { PlayerState } from '../shared/types.js';
import {
  CHAPTERS,
  getChapterByOrder,
  listChapters,
  maxChapterOrder,
  START_UNLOCKS,
  type ChapterDef,
  type ChapterNodeDef,
  type ContentUnlock,
  type UnlockKind,
} from './defs.js';

export type RouteStopStatus = 'cleared' | 'current' | 'ahead';

export interface ChapterRouteStop {
  index: number;
  node: ChapterNodeDef;
  status: RouteStopStatus;
}

export interface ChapterTick {
  order: number;
  name: string;
  status: RouteStopStatus;
}

export interface ChapterRouteView {
  chapter: ChapterDef | null;
  stops: ChapterRouteStop[];
  ticks: ChapterTick[];
  currentIndex: number;
  finished: boolean;
}

/** 当前章的场地关卡条。未到的站不能进。不是地图。 */
export function getChapterRoute(state: PlayerState): ChapterRouteView {
  const view = getChapterView(state);
  const ticks: ChapterTick[] = listChapters().map((ch) => ({
    order: ch.order,
    name: ch.name,
    status: view.finished
      ? 'cleared'
      : ch.order <= view.cleared
        ? 'cleared'
        : ch.order === view.cleared + 1
          ? 'current'
          : 'ahead',
  }));
  if (view.finished) {
    const last = getChapterByOrder(maxChapterOrder()) ?? null;
    return {
      chapter: last,
      stops: (last?.nodes ?? []).map((node, index) => ({
        index,
        node,
        status: 'cleared',
      })),
      ticks,
      currentIndex: last?.nodes.length ?? 0,
      finished: true,
    };
  }
  const chapter = view.playing!;
  return {
    chapter,
    stops: chapter.nodes.map((node, index) => ({
      index,
      node,
      status: index < view.nodeIndex ? 'cleared' : index === view.nodeIndex ? 'current' : 'ahead',
    })),
    ticks,
    currentIndex: view.nodeIndex,
    finished: false,
  };
}

export interface ChapterView {
  /** 已通关最高章 order；0=尚未通关第 1 章 */
  cleared: number;
  /** 正在打的章；通关全部后为 null */
  playing: ChapterDef | null;
  /** 当前节点；通关全部后为 null */
  node: ChapterNodeDef | null;
  nodeIndex: number;
  /** 是否已打完表内全部章 */
  finished: boolean;
}

function unlockKey(u: ContentUnlock): string {
  return `${u.kind}:${u.id}`;
}

/** 汇总：开局解锁 + 已通关各章 unlocksOnClear */
export function collectUnlocks(state: PlayerState): ContentUnlock[] {
  const cleared = state.chapterCleared ?? 0;
  const map = new Map<string, ContentUnlock>();
  for (const u of START_UNLOCKS) map.set(unlockKey(u), u);
  for (const ch of CHAPTERS) {
    if (ch.order <= cleared) {
      for (const u of ch.unlocksOnClear) map.set(unlockKey(u), u);
    }
  }
  return [...map.values()];
}

export function isContentUnlocked(state: PlayerState, kind: UnlockKind, id: string): boolean {
  return collectUnlocks(state).some((u) => u.kind === kind && u.id === id);
}

export function listUnlockedIds(state: PlayerState, kind: UnlockKind): string[] {
  return collectUnlocks(state)
    .filter((u) => u.kind === kind)
    .map((u) => u.id);
}

export function getChapterView(state: PlayerState): ChapterView {
  const cleared = Math.max(0, state.chapterCleared ?? 0);
  const nodeIndex = Math.max(0, state.chapterNodeIndex ?? 0);
  const maxOrder = maxChapterOrder();
  if (cleared >= maxOrder) {
    return {
      cleared,
      playing: null,
      node: null,
      nodeIndex: 0,
      finished: true,
    };
  }
  const playing = getChapterByOrder(cleared + 1) ?? null;
  const node = playing?.nodes[nodeIndex] ?? null;
  return { cleared, playing, node, nodeIndex, finished: false };
}

export type AdvanceStoryResult =
  | { ok: true; state: PlayerState; clearedChapter: ChapterDef | null; message: string }
  | { ok: false; message: string };

function finishNode(state: PlayerState): {
  state: PlayerState;
  clearedChapter: ChapterDef | null;
  message: string;
} {
  const view = getChapterView(state);
  if (!view.playing || !view.node) {
    return { state, clearedChapter: null, message: '主线已全部通关。' };
  }
  const ch = view.playing;
  const nextIndex = view.nodeIndex + 1;
  if (nextIndex < ch.nodes.length) {
    return {
      state: { ...state, chapterNodeIndex: nextIndex },
      clearedChapter: null,
      message: `完成「${view.node.title}」。`,
    };
  }
  const cleared = ch.order;
  const unlockNames = ch.unlocksOnClear.map((u) => `${u.kind}:${u.id}`).join('、');
  const suffix = unlockNames ? ` 解锁：${unlockNames}` : '';
  return {
    state: {
      ...state,
      chapterCleared: cleared,
      chapterNodeIndex: 0,
    },
    clearedChapter: ch,
    message: `通关${ch.name}。${suffix}`.trim(),
  };
}

/** 推进当前 story 节点；battle 节点请开战并在胜利后 completeChapterBattle */
export function advanceStoryNode(state: PlayerState): AdvanceStoryResult {
  const view = getChapterView(state);
  if (view.finished || !view.node) {
    return { ok: false, message: '主线已全部通关。' };
  }
  if (view.node.kind !== 'story') {
    return { ok: false, message: '当前是战斗节点，请开战。' };
  }
  const done = finishNode(state);
  return { ok: true, ...done };
}

export type CompleteBattleResult =
  | { ok: true; state: PlayerState; clearedChapter: ChapterDef | null; message: string }
  | { ok: false; message: string };

/** 章节战斗胜利后调用（不发猎装掉落） */
export function completeChapterBattle(state: PlayerState): CompleteBattleResult {
  const view = getChapterView(state);
  if (view.finished || !view.node) {
    return { ok: false, message: '主线已全部通关。' };
  }
  if (view.node.kind !== 'battle') {
    return { ok: false, message: '当前不是战斗节点。' };
  }
  const done = finishNode(state);
  return { ok: true, ...done };
}

/** 当前章节战斗对应 ENCOUNTERS 下标；非战斗节点返回 null */
export function currentChapterEncounterIndex(state: PlayerState): number | null {
  const view = getChapterView(state);
  if (!view.node || view.node.kind !== 'battle' || !view.node.encounterId) return null;
  const idx = ENCOUNTERS.findIndex((e) => e.id === view.node!.encounterId);
  return idx >= 0 ? idx : null;
}

/** 猎装本遭遇池：只保留已解锁 encounter */
export function filterEncounterPool(state: PlayerState, pool: string[]): string[] {
  const unlocked = listUnlockedIds(state, 'encounter');
  const filtered = pool.filter((id) => unlocked.includes(id));
  return filtered.length > 0 ? filtered : pool;
}

/** 按已解锁遭遇池取 ENCOUNTERS 下标（刷本用） */
export function pickUnlockedEncounterIndex(
  state: PlayerState,
  dungeonId: DungeonId,
  cursor: number,
): number {
  const dungeon = getDungeon(dungeonId);
  const pool = filterEncounterPool(state, dungeon.encounterPool);
  if (pool.length === 0) return 0;
  const encId = pool[Math.abs(cursor) % pool.length]!;
  const idx = ENCOUNTERS.findIndex((e) => e.id === encId);
  return idx >= 0 ? idx : 0;
}

export function chapterProgressLabel(state: PlayerState): string {
  const view = getChapterView(state);
  if (view.finished) return `主线已通关（${listChapters().length} 章）`;
  const ch = view.playing!;
  const n = view.nodeIndex + 1;
  const total = ch.nodes.length;
  return `${ch.name} · 节点 ${n}/${total}`;
}
