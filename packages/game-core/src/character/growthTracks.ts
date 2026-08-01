import type { PlayerState } from '../shared/types.js';
import {
  breakthroughCost,
  expToNextLevel,
  getProgress,
  isOwned,
  LEVEL_CAP_BY_TIER,
  levelCapForTier,
  resolveStarNode,
  SHARED_STAR_NODES,
  starCost,
  tryBreakthrough,
  tryLevelUp,
  tryStarUp,
  type GrowthActionResult,
} from './growth.js';
import { breakthroughLabel, nextBreakthroughLabel } from './breakthroughDisplay.js';

/** 成长轴 id；awaken/bond 预留，本阶段不注册为 enabled */
export type GrowthTrackId = 'level' | 'breakthrough' | 'star' | 'awaken' | 'bond';

export interface GrowthTrackPreview {
  /** 消耗摘要，如「经验 12/42」 */
  costLine: string;
  /** 效果一句 */
  effectLine: string;
  /** 进度条用：当前值 / 需求值 */
  current: number;
  need: number;
  /** 是否建议高亮（材料够且可点） */
  ready: boolean;
}

export interface GrowthTrackDef {
  id: GrowthTrackId;
  label: string;
  order: number;
  enabled: boolean;
  canApply(state: PlayerState, templateId: string): boolean;
  preview(state: PlayerState, templateId: string): GrowthTrackPreview;
  apply(state: PlayerState, templateId: string): GrowthActionResult;
}

function levelTrack(): GrowthTrackDef {
  return {
    id: 'level',
    label: '升级',
    order: 10,
    enabled: true,
    canApply(state, templateId) {
      return tryLevelUp(state, templateId).ok;
    },
    preview(state, templateId) {
      const progress = getProgress(state, templateId);
      const cap = levelCapForTier(progress.breakthroughTier);
      const need = expToNextLevel(progress.level);
      const atCap = progress.level >= cap;
      return {
        costLine: atCap ? `已达上限 Lv${cap}` : `经验 ${progress.exp}/${need}`,
        effectLine: atCap
          ? `先破境至「${nextBreakthroughLabel(progress.breakthroughTier) ?? '下一境'}」`
          : `Lv ${progress.level} → ${progress.level + 1}`,
        current: progress.exp,
        need,
        ready: !atCap && progress.exp >= need,
      };
    },
    apply: tryLevelUp,
  };
}

function breakthroughTrack(): GrowthTrackDef {
  return {
    id: 'breakthrough',
    label: '破境',
    order: 20,
    enabled: true,
    canApply(state, templateId) {
      return tryBreakthrough(state, templateId).ok;
    },
    preview(state, templateId) {
      const progress = getProgress(state, templateId);
      const need = breakthroughCost(progress.breakthroughTier);
      const xiuwei = state.currencies?.xiuwei ?? 0;
      const maxTier = LEVEL_CAP_BY_TIER.length - 1;
      const atMax = progress.breakthroughTier >= maxTier;
      const nextName = nextBreakthroughLabel(progress.breakthroughTier);
      const needLevel = levelCapForTier(progress.breakthroughTier);
      const levelOk = progress.level >= needLevel;
      return {
        costLine: atMax
          ? '已达最高境界'
          : `修为 ${xiuwei}/${need}${levelOk ? '' : ` · 需 Lv${needLevel}`}`,
        effectLine: atMax
          ? breakthroughLabel(progress.breakthroughTier)
          : `${breakthroughLabel(progress.breakthroughTier)} → ${nextName ?? '下一境'}（上限 Lv${levelCapForTier(progress.breakthroughTier + 1)}）`,
        current: xiuwei,
        need,
        ready: !atMax && levelOk && xiuwei >= need,
      };
    },
    apply: tryBreakthrough,
  };
}

function starTrack(): GrowthTrackDef {
  return {
    id: 'star',
    label: '升星',
    order: 30,
    enabled: true,
    canApply(state, templateId) {
      return tryStarUp(state, templateId).ok;
    },
    preview(state, templateId) {
      const progress = getProgress(state, templateId);
      const maxStar = Math.max(...SHARED_STAR_NODES.map((n) => n.star));
      const atMax = progress.star >= maxStar;
      const shards = progress.cardShards ?? 0;
      const dustNeed = starCost(progress.star);
      const stardust = state.currencies?.stardust ?? 0;
      const next = resolveStarNode(templateId, progress.star + 1);
      const owned = isOwned(state, templateId);
      if (!owned) {
        return {
          costLine: '未获得',
          effectLine: '召唤解锁后可升星',
          current: 0,
          need: 1,
          ready: false,
        };
      }
      if (atMax) {
        return {
          costLine: '已满星',
          effectLine: `★${progress.star}`,
          current: 1,
          need: 1,
          ready: false,
        };
      }
      const useShard = shards >= 1;
      return {
        costLine: useShard
          ? `碎片 ${shards}/1`
          : `碎片 0 · 星尘 ${stardust}/${dustNeed}`,
        effectLine: next
          ? `★${progress.star} → ★${next.star}「${next.label}」`
          : `★${progress.star} → ★${progress.star + 1}`,
        current: useShard ? shards : stardust,
        need: useShard ? 1 : dustNeed,
        ready: useShard || stardust >= dustNeed,
      };
    },
    apply: tryStarUp,
  };
}

/** 预留轴：不做可玩内容，仅占位说明扩展方式 */
function reservedTrack(id: 'awaken' | 'bond', label: string, order: number): GrowthTrackDef {
  return {
    id,
    label,
    order,
    enabled: false,
    canApply: () => false,
    preview: () => ({
      costLine: '未开放',
      effectLine: '扩展口预留',
      current: 0,
      need: 1,
      ready: false,
    }),
    apply: () => ({ ok: false, message: `${label}尚未开放。` }),
  };
}

const GROWTH_TRACK_REGISTRY: GrowthTrackDef[] = [
  levelTrack(),
  breakthroughTrack(),
  starTrack(),
  reservedTrack('awaken', '觉醒', 40),
  reservedTrack('bond', '好感', 50),
];

export function listGrowthTracks(opts?: { includeDisabled?: boolean }): GrowthTrackDef[] {
  const tracks = [...GROWTH_TRACK_REGISTRY].sort((a, b) => a.order - b.order);
  if (opts?.includeDisabled) return tracks;
  return tracks.filter((t) => t.enabled);
}

export function getGrowthTrack(id: GrowthTrackId): GrowthTrackDef | undefined {
  return GROWTH_TRACK_REGISTRY.find((t) => t.id === id);
}

export function applyGrowthTrack(
  state: PlayerState,
  trackId: GrowthTrackId,
  templateId: string,
): GrowthActionResult {
  const track = getGrowthTrack(trackId);
  if (!track || !track.enabled) {
    return { ok: false, message: '该养成轴未开放。' };
  }
  return track.apply(state, templateId);
}
