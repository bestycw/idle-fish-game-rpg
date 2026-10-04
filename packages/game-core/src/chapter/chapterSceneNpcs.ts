import type { PlayerState } from '../shared/types.js';
import { narrativeWorldPreset } from '../narrative/onboarding.js';
import { npcFlavorDialogue } from '../narrative/npcFlavor.zh.js';
import { resolveNpcDisplay, SPINE_NPC_SLOTS } from '../narrative/worldSpine.js';
import { resolveWorldSkinNames } from '../narrative/worldSkinNamesResolve.js';
import type { SpineNpcSlot } from '../narrative/volumeBeats.js';
import { volumeBeatForChapter } from '../narrative/volumeBeats.js';
import { maxChapterOrder } from './defs.js';

export interface ChapterSceneNpc {
  slot: SpineNpcSlot;
  name: string;
  epithet: string | null;
  roleLabel: string;
  lines: string[];
}

function sceneNpcsForBeat(state: PlayerState, chapterOrder: number): ChapterSceneNpc[] {
  const beat = volumeBeatForChapter(chapterOrder);
  if (!beat) return [];

  const preset = narrativeWorldPreset(state);
  const names = resolveWorldSkinNames(state);
  const hero = state.narrative?.heroName?.trim() || '旅人';
  const roleBySlot = new Map(SPINE_NPC_SLOTS.map((n) => [n.slot, n.role]));

  return beat.npcSlots.map((slot) => {
    const epithetRaw = names?.npcEpithets?.[slot as SpineNpcSlot];
    return {
      slot: slot as SpineNpcSlot,
      name: resolveNpcDisplay(preset, slot as SpineNpcSlot, names?.npcs),
      epithet: epithetRaw?.trim() || null,
      roleLabel: roleBySlot.get(slot as SpineNpcSlot) ?? '剧情',
      lines: npcFlavorDialogue(preset, slot as SpineNpcSlot, hero),
    };
  });
}

/** 当前章在场人物（地图默认列表） */
export function listChapterSceneNpcs(state: PlayerState): ChapterSceneNpc[] {
  const cleared = Math.max(0, state.chapterCleared ?? 0);
  const maxOrder = maxChapterOrder();
  const chapterOrder = cleared >= maxOrder ? maxOrder : cleared + 1;
  return sceneNpcsForBeat(state, chapterOrder);
}

/** 指定地点/章节对应人物（地图点选） */
export function listSceneNpcsForChapterOrder(
  state: PlayerState,
  chapterOrder: number,
): ChapterSceneNpc[] {
  return sceneNpcsForBeat(state, chapterOrder);
}
