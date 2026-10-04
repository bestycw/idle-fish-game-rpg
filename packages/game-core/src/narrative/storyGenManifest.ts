/**
 * Story Gen · 卷一 Spine 清单（Skill 只读）
 */

import { CHAPTERS } from '../chapter/defs.js';
import { SPINE_LOCATIONS, SPINE_NPC_SLOTS } from './worldSpine.js';
import { VOLUME1_BEATS } from './volumeBeats.js';

export const VOLUME1_STORY_NODE_IDS = CHAPTERS.flatMap((ch) =>
  ch.nodes.filter((n) => n.kind === 'story').map((n) => n.id),
);

export const VOLUME1_BATTLE_NODE_IDS = CHAPTERS.flatMap((ch) =>
  ch.nodes.filter((n) => n.kind === 'battle').map((n) => n.id),
);

export const VOLUME1_ALL_NODE_IDS = CHAPTERS.flatMap((ch) => ch.nodes.map((n) => n.id));

export const SPINE_LOCATION_IDS = SPINE_LOCATIONS.map((l) => l.id);
export const SPINE_NPC_SLOT_IDS = SPINE_NPC_SLOTS.map((n) => n.slot);

export const VOLUME1_BEAT_TABLE = VOLUME1_BEATS.map((b) => ({
  chapterId: b.chapterId,
  chapterOrder: b.chapterOrder,
  beatTitle: b.beatTitle,
  primaryLocation: b.primaryLocation,
  npcSlots: b.npcSlots,
  anchorNodeId: b.anchorNodeId,
}));
