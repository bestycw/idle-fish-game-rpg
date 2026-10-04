/**
 * 叙事向量 · 定参（非情节包）
 */

import type {
  NarrativePreferences,
  NarrativeVector,
  StoryMotifId,
  WorldPreset,
  WorldTextureId,
} from '../shared/types.js';
import { DEFAULT_NARRATIVE_CONTROL, defaultNovelFrameId } from './novelFrames.zh.js';

export type { NarrativeVector, StoryMotifId, WorldTextureId };

export const WORLD_TEXTURE_OPTIONS: Record<
  WorldPreset,
  { id: WorldTextureId; title: string; hint: string }[]
> = {
  wuxia: [
    { id: 'tex_wuxia_jianghu', title: '江湖市井', hint: '酒旗、趟子、路数' },
    { id: 'tex_wuxia_sect', title: '宗门规矩', hint: '门规、名分、剑谱' },
    { id: 'tex_wuxia_court', title: '朝局暗线', hint: '借势、落子、局外手' },
  ],
  xianxia: [
    { id: 'tex_xianxia_mortal', title: '人间镇守', hint: '烟火、妖祸、小镇' },
    { id: 'tex_xianxia_sect', title: '宗门灵脉', hint: '席位、斗法、长老' },
    { id: 'tex_xianxia_tribulation', title: '劫域试心', hint: '劫火、问心、破境' },
  ],
  cyberpunk: [
    { id: 'tex_cyber_street', title: '下层跑刀', hint: '合约、换码、倒计时' },
    { id: 'tex_cyber_corp', title: '战队公司', hint: '挂靠、赞助、条款' },
    { id: 'tex_cyber_deadnet', title: '殁网残栈', hint: '协议、教典、栈' },
  ],
};

export const STORY_MOTIF_OPTIONS: { id: StoryMotifId; title: string }[] = [
  { id: 'motif_escort', title: '护送/还债' },
  { id: 'motif_vindicate', title: '洗冤/名分' },
  { id: 'motif_rise', title: '崛起/破阵' },
  { id: 'motif_mystery', title: '探谜/真相' },
];

const DEFAULT_TEXTURE: Record<WorldPreset, WorldTextureId> = {
  wuxia: 'tex_wuxia_jianghu',
  xianxia: 'tex_xianxia_mortal',
  cyberpunk: 'tex_cyber_street',
};

export const DEFAULT_STORY_MOTIFS: StoryMotifId[] = ['motif_rise'];

export function defaultNarrativeVector(preset: WorldPreset): NarrativeVector {
  return {
    worldTexture: DEFAULT_TEXTURE[preset],
    storyMotifs: [...DEFAULT_STORY_MOTIFS],
  };
}

export function defaultNarrativePreferences(preset: WorldPreset): NarrativePreferences {
  return {
    vector: defaultNarrativeVector(preset),
    novelFrameId: defaultNovelFrameId(preset),
    control: { ...DEFAULT_NARRATIVE_CONTROL },
    tone: 'witty',
    pace: 'slow_burn',
  };
}

export function normalizeStoryMotifs(raw: unknown): StoryMotifId[] {
  if (!Array.isArray(raw)) return [...DEFAULT_STORY_MOTIFS];
  const allowed = new Set(STORY_MOTIF_OPTIONS.map((m) => m.id));
  const out = raw.filter((m): m is StoryMotifId => typeof m === 'string' && allowed.has(m as StoryMotifId));
  if (out.length === 0) return [...DEFAULT_STORY_MOTIFS];
  return out.slice(0, 2);
}

export function textureForPreset(preset: WorldPreset, id: WorldTextureId): boolean {
  return WORLD_TEXTURE_OPTIONS[preset].some((o) => o.id === id);
}
