/**
 * 主线 story 节点 · NPC 对话（非开放探索；推关前演出）
 */

import { CHAPTERS, type ChapterNodeDef } from '../chapter/defs.js';
import type {
  NarrativeDialogueBeat,
  NarrativeDialogueLine,
  PlayerState,
} from '../shared/types.js';
import { narrativeWorldPreset } from './onboarding.js';
import { getOfficialOverlay } from './officialPacksLoader.js';
import { resolveNodeCopy } from './resolveNodeCopy.js';
import { resolveNpcDisplay } from './worldSpine.js';
import { resolveWorldSkinNames } from './worldSkinNamesResolve.js';
import { volumeBeatForChapterId, type SpineNpcSlot } from './volumeBeats.js';

const MAX_LINES = 8;
const MAX_BEATS = 12;
const MAX_LINE_LEN = 120;
const MAX_CHOICE_OPTIONS = 3;

function findStoryNode(nodeId: string): { chapterId: string; node: ChapterNodeDef } | null {
  for (const ch of CHAPTERS) {
    const node = ch.nodes.find((n) => n.id === nodeId);
    if (node?.kind === 'story') return { chapterId: ch.id, node };
  }
  return null;
}

function skinNamesFromState(state: PlayerState) {
  return resolveWorldSkinNames(state);
}

function injectTokens(text: string, state: PlayerState): string {
  const hero = state.narrative?.heroName?.trim() || '旅人';
  return text.replace(/\{\{heroName\}\}/g, hero);
}

function clampLine(text: string): string {
  const t = text.trim();
  if (t.length <= MAX_LINE_LEN) return t;
  return t.slice(0, MAX_LINE_LEN - 1) + '…';
}

function npcLabelsForChapter(state: PlayerState, chapterId: string): string[] {
  const beat = volumeBeatForChapterId(chapterId);
  if (!beat) return ['向导'];
  const preset = narrativeWorldPreset(state);
  const names = skinNamesFromState(state);
  return beat.npcSlots.map((s) => resolveNpcDisplay(preset, s as SpineNpcSlot, names));
}

function speakerForSegment(segment: string, npcNames: string[], heroName: string): string {
  for (const n of npcNames) {
    if (segment.includes(n)) return n;
  }
  if (segment.includes(heroName) || segment.includes('你') || segment.includes('我')) {
    return heroName;
  }
  return npcNames[0] ?? '向导';
}

/** 从 blurb 拆对话：引号内独立成句，其余按句号分句 */
export function synthesizeDialogueFromBlurb(
  blurb: string,
  state: PlayerState,
  chapterId: string,
): NarrativeDialogueLine[] {
  const heroName = state.narrative?.heroName?.trim() || '旅人';
  const npcNames = npcLabelsForChapter(state, chapterId);
  const text = injectTokens(blurb, state);

  const quoted: string[] = [];
  const stripped = text.replace(/「([^」]+)」/g, (_, inner: string) => {
    quoted.push(inner.trim());
    return ' ';
  });

  const lines: NarrativeDialogueLine[] = [];
  const segments = stripped
    .split(/(?<=[。！？])/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const seg of segments) {
    lines.push({
      speaker: speakerForSegment(seg, npcNames, heroName),
      text: clampLine(seg),
    });
  }
  for (const q of quoted) {
    const npc = npcNames[0] ?? '向导';
    lines.push({ speaker: npc, text: clampLine(q) });
  }

  if (lines.length === 0 && text.trim()) {
    lines.push({ speaker: npcNames[0] ?? '向导', text: clampLine(text) });
  }

  return lines.slice(0, MAX_LINES);
}

function normalizeBeats(beats: NarrativeDialogueBeat[], state: PlayerState): NarrativeDialogueBeat[] {
  return beats.slice(0, MAX_BEATS).map((b) => {
    if (b.kind === 'line') {
      return {
        kind: 'line',
        speaker: injectTokens(b.speaker, state),
        text: clampLine(injectTokens(b.text, state)),
      };
    }
    return {
      kind: 'choice',
      speaker: b.speaker ? injectTokens(b.speaker, state) : undefined,
      prompt: clampLine(injectTokens(b.prompt, state)),
      options: b.options.slice(0, MAX_CHOICE_OPTIONS).map((o) => ({
        label: clampLine(injectTokens(o.label, state)),
        reply: clampLine(injectTokens(o.reply, state)),
      })),
    };
  });
}

function overlayBeatsForNode(
  state: PlayerState,
  nodeId: string,
): NarrativeDialogueBeat[] | undefined {
  const preset = narrativeWorldPreset(state);
  const skin = state.narrative?.overlay?.nodes[nodeId];
  if (skin?.dialogueBeats?.length) return skin.dialogueBeats;
  const official = getOfficialOverlay(preset).nodes[nodeId]?.dialogueBeats;
  if (official?.length) return official;
  return undefined;
}

function overlayDialogueForNode(
  state: PlayerState,
  nodeId: string,
): NarrativeDialogueLine[] | undefined {
  const preset = narrativeWorldPreset(state);
  const playerSkin = state.narrative?.overlay?.nodes[nodeId]?.dialogue;
  if (playerSkin?.length) return playerSkin;
  const official = getOfficialOverlay(preset).nodes[nodeId]?.dialogue;
  if (official?.length) return official;
  return undefined;
}

export function resolveMainlineDialogueBeats(
  state: PlayerState,
  nodeId: string,
): NarrativeDialogueBeat[] | null {
  const found = findStoryNode(nodeId);
  if (!found) return null;

  const scripted = overlayBeatsForNode(state, nodeId);
  if (scripted?.length) return normalizeBeats(scripted, state);

  const lines = overlayDialogueForNode(state, nodeId);
  if (lines?.length) {
    return normalizeBeats(
      lines.map((line) => ({
        kind: 'line' as const,
        speaker: line.speaker,
        text: line.text,
      })),
      state,
    );
  }

  const copy = resolveNodeCopy(state, nodeId);
  if (!copy?.blurb) return null;
  const synthesized = synthesizeDialogueFromBlurb(copy.blurb, state, found.chapterId);
  if (synthesized.length === 0) return null;
  return normalizeBeats(
    synthesized.map((line) => ({ kind: 'line' as const, speaker: line.speaker, text: line.text })),
    state,
  );
}

export function resolveMainlineDialogue(
  state: PlayerState,
  nodeId: string,
): NarrativeDialogueLine[] | null {
  const beats = resolveMainlineDialogueBeats(state, nodeId);
  if (!beats) return null;
  const lines: NarrativeDialogueLine[] = [];
  for (const b of beats) {
    if (b.kind === 'line') lines.push({ speaker: b.speaker, text: b.text });
  }
  return lines.length > 0 ? lines : null;
}

export function resolveCurrentMainlineDialogueBeats(
  state: PlayerState,
): NarrativeDialogueBeat[] | null {
  const cleared = state.chapterCleared ?? 0;
  const ch = CHAPTERS.find((c) => c.order === cleared + 1);
  if (!ch) return null;
  const idx = state.chapterNodeIndex ?? 0;
  const node = ch.nodes[idx];
  if (!node || node.kind !== 'story') return null;
  return resolveMainlineDialogueBeats(state, node.id);
}

export function resolveCurrentMainlineDialogue(state: PlayerState): NarrativeDialogueLine[] | null {
  const cleared = state.chapterCleared ?? 0;
  const ch = CHAPTERS.find((c) => c.order === cleared + 1);
  if (!ch) return null;
  const idx = state.chapterNodeIndex ?? 0;
  const node = ch.nodes[idx];
  if (!node || node.kind !== 'story') return null;
  return resolveMainlineDialogue(state, node.id);
}
