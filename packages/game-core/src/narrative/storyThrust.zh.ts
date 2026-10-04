/**
 * @deprecated 旧序章三选一文案；新档用 drive/voice（narrativeProfile.zh）
 */

import type { StoryThrust, WorldPreset } from '../shared/types.js';

export interface StoryThrustOption {
  id: StoryThrust;
  title: string;
  subtitle: string;
  arcPitch: string;
}

export const STORY_THRUST_OPTIONS: StoryThrustOption[] = [
  {
    id: 'thrust_sync',
    title: '先把那边的我拽出来',
    subtitle: '平行线同步优先 · 每两章反馈原世界',
    arcPitch: '你每推进一步，原世界工位上的那个就少抖一下。',
  },
  {
    id: 'thrust_break',
    title: '破阵、变强，再说',
    subtitle: '战斗与破阵优先 · 默认推荐',
    arcPitch: '盾墙、伏兵、箭雨——用胜负说话，再管别的。',
  },
  {
    id: 'thrust_roster',
    title: '先凑齐能打的兄弟',
    subtitle: '招募与名分优先 · 名册驱动叙事',
    arcPitch: '投影越多，裂隙越稳；你更像在带队伍，不是在 solo 熬。',
  },
];

export function storyThrustLabel(thrust: StoryThrust | undefined): string | null {
  if (!thrust) return null;
  return STORY_THRUST_OPTIONS.find((o) => o.id === thrust)?.title ?? null;
}

export function hubMainPlotHint(logline: string | null | undefined): string | null {
  if (!logline?.trim()) return null;
  return logline;
}
