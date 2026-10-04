/**
 * Skin 校验 · 配合 volumeBeats / defs（不靠 prompt 自律）
 */

import { CHAPTERS } from '../chapter/defs.js';
import { ENCOUNTERS } from '../dungeon/encounters.js';
import type { NarrativeNodeSkinCopy, NarrativeOverlay, WorldPreset } from '../shared/types.js';
import { volumeBeatForChapterId } from './volumeBeats.js';
import type { WorldSkinNames } from '../shared/types.js';
import { resolveLocationDisplay, resolveNpcDisplay, resolveTownDisplay } from './worldSpine.js';
import type { SpineTownId } from './volumeBeats.js';
import type { SpineNpcSlot } from './volumeBeats.js';
import { VOLUME1_STORY_NODE_IDS } from './storyGenManifest.js';

export interface NodeSkinValidationIssue {
  nodeId: string;
  code: string;
  message: string;
}

const MAX_BLURB = 280;
const MAX_TITLE = 20;
const MAX_PLACE = 16;
const MAX_DIALOGUE_LINE = 120;
const MAX_DIALOGUE_LINES = 8;

function findNodeDef(nodeId: string) {
  for (const ch of CHAPTERS) {
    const node = ch.nodes.find((n) => n.id === nodeId);
    if (node) return { chapterId: ch.id, node };
  }
  return null;
}

function proseBlob(
  copy: NarrativeNodeSkinCopy,
  place: string,
): string {
  const parts = [copy.blurb ?? '', place, ...(copy.dialogue?.map((l) => l.text) ?? [])];
  for (const b of copy.dialogueBeats ?? []) {
    if (b.kind === 'line') parts.push(b.text);
    else {
      parts.push(b.prompt);
      for (const o of b.options) {
        parts.push(o.label, o.reply);
      }
    }
  }
  return parts.join(' ');
}

export function validateNodeSkinCopy(
  nodeId: string,
  copy: NarrativeNodeSkinCopy,
  preset: WorldPreset,
  skinNames?: WorldSkinNames,
): NodeSkinValidationIssue[] {
  const issues: NodeSkinValidationIssue[] = [];
  const found = findNodeDef(nodeId);
  if (!found) {
    issues.push({ nodeId, code: 'unknown_node', message: 'nodeId 不在 defs' });
    return issues;
  }

  const { chapterId, node } = found;
  const beat = volumeBeatForChapterId(chapterId);

  if (copy.title && copy.title.length > MAX_TITLE) {
    issues.push({ nodeId, code: 'title_long', message: `title > ${MAX_TITLE}` });
  }
  if (copy.place && copy.place.length > MAX_PLACE) {
    issues.push({ nodeId, code: 'place_long', message: `place > ${MAX_PLACE}` });
  }
  if (copy.blurb && copy.blurb.length > MAX_BLURB) {
    issues.push({ nodeId, code: 'blurb_long', message: `blurb > ${MAX_BLURB}` });
  }

  const place = copy.place ?? '';
  const blob = proseBlob(copy, place);

  if (copy.dialogueBeats) {
    if (copy.dialogueBeats.length > 12) {
      issues.push({ nodeId, code: 'dialogue_long', message: 'dialogueBeats > 12' });
    }
    for (let i = 0; i < copy.dialogueBeats.length; i++) {
      const b = copy.dialogueBeats[i]!;
      if (b.kind === 'line') {
        if (!b.speaker?.trim() || !b.text?.trim()) {
          issues.push({ nodeId, code: 'dialogue_empty', message: `beats[${i}] line 缺字段` });
        }
        if (b.text.length > MAX_DIALOGUE_LINE) {
          issues.push({
            nodeId,
            code: 'dialogue_line_long',
            message: `beats[${i}] > ${MAX_DIALOGUE_LINE} 字`,
          });
        }
      } else {
        if (!b.prompt?.trim() || b.options.length < 2 || b.options.length > 3) {
          issues.push({ nodeId, code: 'dialogue_empty', message: `beats[${i}] choice 须 2–3 项` });
        }
        for (const o of b.options) {
          if (o.label.length > MAX_DIALOGUE_LINE || o.reply.length > MAX_DIALOGUE_LINE) {
            issues.push({ nodeId, code: 'dialogue_line_long', message: `beats[${i}] choice 过长` });
          }
        }
      }
    }
  }

  if (copy.dialogue) {
    if (copy.dialogue.length > MAX_DIALOGUE_LINES) {
      issues.push({
        nodeId,
        code: 'dialogue_long',
        message: `dialogue 行数 > ${MAX_DIALOGUE_LINES}`,
      });
    }
    for (let i = 0; i < copy.dialogue.length; i++) {
      const line = copy.dialogue[i]!;
      if (!line.speaker?.trim() || !line.text?.trim()) {
        issues.push({ nodeId, code: 'dialogue_empty', message: `dialogue[${i}] 缺 speaker/text` });
      }
      if (line.text.length > MAX_DIALOGUE_LINE) {
        issues.push({
          nodeId,
          code: 'dialogue_line_long',
          message: `dialogue[${i}] > ${MAX_DIALOGUE_LINE} 字`,
        });
      }
    }
  }

  if (beat) {
    const townDisplay = resolveTownDisplay(
      preset,
      beat.primaryTown as SpineTownId,
      skinNames?.towns as Partial<Record<SpineTownId, string>> | undefined,
    );
    if (townDisplay && !blob.includes(townDisplay)) {
      issues.push({
        nodeId,
        code: 'missing_town',
        message: `须出现城镇「${townDisplay}」`,
      });
    }
    const locDisplay = resolveLocationDisplay(preset, beat.primaryLocation, skinNames);
    if (locDisplay && !blob.includes(locDisplay) && !place.includes(locDisplay)) {
      issues.push({
        nodeId,
        code: 'missing_location',
        message: `须出现地点「${locDisplay}」`,
      });
    }
    for (const slot of beat.npcSlots) {
      const npcName = resolveNpcDisplay(preset, slot as SpineNpcSlot, skinNames);
      if (npcName && !blob.includes(npcName)) {
        issues.push({
          nodeId,
          code: 'missing_npc',
          message: `须出现 NPC「${npcName}」(${slot})`,
        });
      }
    }
    if (beat.callbackFromChapter != null) {
      const prev = volumeBeatForChapterId(`ch${beat.callbackFromChapter}`);
      if (prev && !blob.includes(prev.beatTitle) && !blob.includes(prev.beatSummary.slice(0, 8))) {
        issues.push({
          nodeId,
          code: 'missing_callback',
          message: `须回调 ch${beat.callbackFromChapter}（${prev.beatTitle}）`,
        });
      }
    }
  }

  if (node.kind === 'battle' && node.encounterId) {
    if (!ENCOUNTERS.some((e) => e.id === node.encounterId)) {
      issues.push({ nodeId, code: 'bad_encounter', message: 'encounterId 未注册' });
    }
  }

  return issues;
}

function overlaySkinNames(overlay: NarrativeOverlay): WorldSkinNames | undefined {
  return overlay.worldSkinNames;
}

export function validateNarrativeOverlay(
  overlay: NarrativeOverlay,
  preset: WorldPreset,
  options?: { requireStoryDialogue?: boolean },
): NodeSkinValidationIssue[] {
  const skinNames = overlaySkinNames(overlay);
  const issues: NodeSkinValidationIssue[] = [];
  for (const nodeId of Object.keys(overlay.nodes)) {
    issues.push(...validateNodeSkinCopy(nodeId, overlay.nodes[nodeId]!, preset, skinNames));
  }
  if (options?.requireStoryDialogue) {
    for (const nodeId of VOLUME1_STORY_NODE_IDS) {
      const copy = overlay.nodes[nodeId];
      if (!copy?.dialogueBeats?.length && !copy?.dialogue?.length) {
        issues.push({
          nodeId,
          code: 'missing_dialogue',
          message: 'story 节点须有 dialogueBeats[] 或 dialogue[]',
        });
      }
    }
  }
  for (const ch of CHAPTERS) {
    for (const n of ch.nodes) {
      if (!overlay.nodes[n.id]) {
        issues.push({ nodeId: n.id, code: 'missing_node', message: 'overlay 缺节点' });
      }
    }
  }
  return issues;
}

export function overlayPassesValidation(
  overlay: NarrativeOverlay,
  preset: WorldPreset,
  options?: { requireStoryDialogue?: boolean },
): boolean {
  return validateNarrativeOverlay(overlay, preset, options).length === 0;
}

/** Skill 完整度摘要（卷一） */
export function storyGenQualityReport(
  overlay: NarrativeOverlay,
  preset: WorldPreset,
): { errors: NodeSkinValidationIssue[]; storyDialogueMissing: string[] } {
  const errors = validateNarrativeOverlay(overlay, preset);
  const storyDialogueMissing = VOLUME1_STORY_NODE_IDS.filter((id) => {
    const copy = overlay.nodes[id];
    const d = copy?.dialogue;
    const b = copy?.dialogueBeats;
    return (!d || d.length === 0) && (!b || b.length === 0);
  });
  return { errors, storyDialogueMissing };
}

/** 序章批量：只校验已生成章序内的节点 */
export function validateOverlayChapterRange(
  overlay: NarrativeOverlay,
  preset: WorldPreset,
  maxChapterOrder: number,
): NodeSkinValidationIssue[] {
  const issues: NodeSkinValidationIssue[] = [];
  for (const ch of CHAPTERS) {
    if (ch.order > maxChapterOrder) break;
    for (const n of ch.nodes) {
      const copy = overlay.nodes[n.id];
      if (!copy) {
        issues.push({ nodeId: n.id, code: 'missing_node', message: '批量 overlay 缺节点' });
        continue;
      }
      issues.push(...validateNodeSkinCopy(n.id, copy, preset, overlaySkinNames(overlay)));
    }
  }
  return issues;
}
