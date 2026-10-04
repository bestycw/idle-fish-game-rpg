/**
 * 卷级大纲 · Agent 真源（outline Skill 产出）
 * 运行时可选读：worldSkinNames 与 overlay 对齐
 */

import type { WorldPreset, WorldSkinNames } from '../shared/types.js';
import type { SpineLocationId, SpineNpcSlot, SpineTownId, VolumeId } from './volumeBeats.js';
import xianxiaVol1Outline from './officialPacks/xianxia.volume1.outline.json' with { type: 'json' };

export interface VolumeOutlineNodeBrief {
  kind: 'story' | 'battle';
  /** detail Skill 写正文前的 1–2 句意图 */
  brief: string;
  encounterId?: string;
}

export interface VolumeOutlineChapter {
  chapterId: string;
  beatTitle: string;
  primaryTownId: SpineTownId;
  primaryLocationId: SpineLocationId;
  npcSlotIds: SpineNpcSlot[];
  callbackBeatTitle: string | null;
  hookForNext: string;
  dramaticGoal: string;
  emotion: string;
  mustMention: string[];
  nodes: Record<string, VolumeOutlineNodeBrief>;
}

export interface VolumeOutline {
  schemaVersion: number;
  preset: WorldPreset;
  volumeId: VolumeId;
  worldSkinNames: WorldSkinNames;
  logline: string;
  toneNotes: string;
  recurringMotifs?: string[];
  npcRelationships?: { slot: SpineNpcSlot; stance: string }[];
  chapters: VolumeOutlineChapter[];
}

const XIANXIA_VOL1 = xianxiaVol1Outline as unknown as VolumeOutline;

export function getOfficialVolumeOutline(
  preset: WorldPreset,
  volumeId: VolumeId = 'vol1',
): VolumeOutline | undefined {
  if (preset === 'xianxia' && volumeId === 'vol1') return XIANXIA_VOL1;
  return undefined;
}
