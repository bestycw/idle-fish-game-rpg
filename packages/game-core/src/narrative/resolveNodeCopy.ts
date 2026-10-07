/**
 * 运行时节点文案：defs → official 地点皮 → overlay → 状态注入
 */

import {
  chapterOrderFromNodeId,
  mainlineCapEncounterId,
} from '../chapter/mainlineBattleWaves.js';
import { CHAPTERS, getChapterByOrder, type ChapterNodeDef } from '../chapter/defs.js';
import { ENCOUNTERS } from '../dungeon/encounters.js';
import { isOwned } from '../character/growth.js';
import { UNIT_TEMPLATES } from '../character/templates.js';
import type { PlayerState } from '../shared/types.js';
import type { NarrativeNodeSkinCopy } from '../shared/types.js';
import { narrativeWorldPreset } from './onboarding.js';
import { resolveLocationDisplay, resolveNpcDisplay } from './worldSpine.js';
import { resolveWorldSkinNames } from './worldSkinNamesResolve.js';
import { getOfficialOverlay } from './officialPacksLoader.js';
import { volumeBeatForChapterId } from './volumeBeats.js';
import type { SpineNpcSlot } from './volumeBeats.js';

export interface ResolvedNodeCopy {
  nodeId: string;
  chapterId: string;
  title: string;
  place: string;
  blurb: string;
}

const MAX_BLURB = 280;
const MAX_TITLE = 20;
const MAX_PLACE = 16;

function findNode(nodeId: string): { chapterId: string; node: ChapterNodeDef } | null {
  for (const ch of CHAPTERS) {
    const node = ch.nodes.find((n) => n.id === nodeId);
    if (node) return { chapterId: ch.id, node };
  }
  return null;
}

function skinNamesFromState(state: PlayerState) {
  return resolveWorldSkinNames(state);
}

function officialPlaceForChapter(state: PlayerState, chapterId: string, fallback: string): string {
  const beat = volumeBeatForChapterId(chapterId);
  if (!beat) return fallback;
  const preset = narrativeWorldPreset(state);
  const names = skinNamesFromState(state);
  const display = resolveLocationDisplay(preset, beat.primaryLocation, names?.locations);
  return display.slice(0, MAX_PLACE) || fallback;
}

function injectRuntimeTokens(text: string, state: PlayerState): string {
  const hero = state.narrative?.heroName?.trim() || '旅人';
  const owned = UNIT_TEMPLATES.filter((t) => isOwned(state, t.id)).length;
  return text
    .replace(/\{\{heroName\}\}/g, hero)
    .replace(/\{\{ownedCount\}\}/g, String(owned));
}

/** official 层：地点用 Spine 表，blurb 保留 defs 并注入 beat 一句（无 overlay 时） */
function baselineCopy(state: PlayerState, chapterId: string, node: ChapterNodeDef): NarrativeNodeSkinCopy {
  const beat = volumeBeatForChapterId(chapterId);
  const preset = narrativeWorldPreset(state);
  const names = skinNamesFromState(state);
  const place = officialPlaceForChapter(state, chapterId, node.place);

  let blurb = node.blurb;
  if (beat) {
    const loc = resolveLocationDisplay(preset, beat.primaryLocation, names?.locations);
    const npcLabels = beat.npcSlots.map((s) =>
      resolveNpcDisplay(preset, s as SpineNpcSlot, names?.npcs),
    );
    let beatLine = `【${beat.beatTitle}】${loc}·${npcLabels.join('·')}：${beat.beatSummary}`;
    if (beat.callbackFromChapter != null) {
      const prev = volumeBeatForChapterId(`ch${beat.callbackFromChapter}`);
      if (prev) beatLine = `接续「${prev.beatTitle}」；${beatLine}`;
    }
    if (!blurb.includes(beat.beatTitle)) {
      blurb = `${beatLine} ${blurb}`.trim();
    }
  }
  blurb = injectRuntimeTokens(blurb, state);
  if (blurb.length > MAX_BLURB) blurb = blurb.slice(0, MAX_BLURB - 1) + '…';

  return {
    title: node.title.slice(0, MAX_TITLE),
    place,
    blurb,
  };
}

function mergeCopy(
  state: PlayerState,
  nodeId: string,
  useOfficialPack: boolean,
): ResolvedNodeCopy | null {
  const found = findNode(nodeId);
  if (!found) return null;
  const { chapterId, node } = found;
  const preset = narrativeWorldPreset(state);
  const official = useOfficialPack ? getOfficialOverlay(preset).nodes[nodeId] : undefined;
  const base = baselineCopy(state, chapterId, node);
  const skin = state.narrative?.overlay?.nodes[nodeId];
  const pack = official ?? base;

  const title = (skin?.title ?? pack.title ?? node.title).slice(0, MAX_TITLE);
  const place = (skin?.place ?? pack.place ?? node.place).slice(0, MAX_PLACE);
  let blurb = injectRuntimeTokens(skin?.blurb ?? pack.blurb ?? node.blurb, state);
  if (blurb.length > MAX_BLURB) blurb = blurb.slice(0, MAX_BLURB - 1) + '…';

  return { nodeId, chapterId, title, place, blurb };
}

export function resolveNodeCopyWithoutOfficial(
  state: PlayerState,
  nodeId: string,
): ResolvedNodeCopy | null {
  return mergeCopy(state, nodeId, false);
}

export function resolveNodeCopy(state: PlayerState, nodeId: string): ResolvedNodeCopy | null {
  return mergeCopy(state, nodeId, true);
}

/** 当前 Hub 节点 */
export function resolveCurrentNodeCopy(state: PlayerState): ResolvedNodeCopy | null {
  const cleared = state.chapterCleared ?? 0;
  const ch = getChapterByOrder(cleared + 1);
  if (!ch) return null;
  const idx = state.chapterNodeIndex ?? 0;
  const node = ch.nodes[idx];
  if (!node) return null;
  return resolveNodeCopy(state, node.id);
}

export function prepHintForNode(node: ChapterNodeDef): string | undefined {
  if (node.kind !== 'battle') return undefined;
  const capId =
    node.encounterId ??
    (node.battleCap
      ? undefined
      : node.battleWaves?.length
        ? node.battleWaves[node.battleWaves.length - 1]?.encounterId
        : undefined);
  if (!capId && node.battleCap) {
    const order = chapterOrderFromNodeId(node.id);
    const lastId = mainlineCapEncounterId(order, node.battleCap);
    return ENCOUNTERS.find((e) => e.id === lastId)?.prepHint;
  }
  if (!capId) return undefined;
  return ENCOUNTERS.find((e) => e.id === capId)?.prepHint;
}
