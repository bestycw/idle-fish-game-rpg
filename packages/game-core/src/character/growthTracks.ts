import type { PlayerState } from '../shared/types.js';
import {
  breakthroughCost,
  CULTIVATION_NODES_PER_TIER,
  cultivationNodeCost,
  expToNextLevel,
  getProgress,
  isOwned,
  LEVEL_CAP_BY_TIER,
  levelCapForTier,
  MAX_STAR,
  nextBreakthroughPerk,
  resolveStarNode,
  starShardCost,
  tryBreakthrough,
  tryCultivateNode,
  tryLevelUp,
  tryStarUp,
  type GrowthActionResult,
} from './growth.js';
import { STARDUST_ASSIST_STAR_CAP, STARDUST_PER_SHARD } from './stardustExchange.js';
import { breakthroughLabel, nextBreakthroughLabel } from './breakthroughDisplay.js';

/** 成长轴 id；awaken/bond 预留，本阶段不注册为 enabled */
export type GrowthTrackId =
  | 'level'
  | 'cultivate'
  | 'breakthrough'
  | 'star'
  | 'awaken'
  | 'bond';

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
          ? `等级已满；用修为点小节点/破境`
          : `Lv ${progress.level} → ${progress.level + 1}`,
        current: progress.exp,
        need,
        ready: !atCap && progress.exp >= need,
      };
    },
    apply: tryLevelUp,
  };
}

function cultivateTrack(): GrowthTrackDef {
  return {
    id: 'cultivate',
    label: '修炼',
    order: 15,
    enabled: true,
    canApply(state, templateId) {
      return tryCultivateNode(state, templateId).ok;
    },
    preview(state, templateId) {
      const progress = getProgress(state, templateId);
      const nodes = progress.cultivationNodes ?? 0;
      const xiuwei = state.currencies?.xiuwei ?? 0;
      const atMaxTier = progress.breakthroughTier >= LEVEL_CAP_BY_TIER.length - 1;
      if (atMaxTier) {
        return {
          costLine: '已达最高境界',
          effectLine: breakthroughLabel(progress.breakthroughTier),
          current: 1,
          need: 1,
          ready: false,
        };
      }
      if (nodes >= CULTIVATION_NODES_PER_TIER) {
        return {
          costLine: '小节点已满',
          effectLine: `请破境 → ${nextBreakthroughLabel(progress.breakthroughTier) ?? '下一境'}`,
          current: nodes,
          need: CULTIVATION_NODES_PER_TIER,
          ready: false,
        };
      }
      const need = cultivationNodeCost(progress.breakthroughTier, nodes);
      return {
        costLine: `修为 ${xiuwei}/${need}（仅塔）`,
        effectLine: `${breakthroughLabel(progress.breakthroughTier)} 小节点 ${nodes}/${CULTIVATION_NODES_PER_TIER} · 主属性微幅`,
        current: xiuwei,
        need,
        ready: xiuwei >= need,
      };
    },
    apply: tryCultivateNode,
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
      const nodes = progress.cultivationNodes ?? 0;
      const nodesOk = nodes >= CULTIVATION_NODES_PER_TIER;
      const perk = nextBreakthroughPerk(templateId, progress.breakthroughTier);
      return {
        costLine: atMax
          ? '已达最高境界'
          : `修为 ${xiuwei}/${need}${nodesOk ? '' : ` · 节点 ${nodes}/${CULTIVATION_NODES_PER_TIER}`}`,
        effectLine: atMax
          ? breakthroughLabel(progress.breakthroughTier)
          : `${breakthroughLabel(progress.breakthroughTier)} → ${nextName ?? '下一境'}` +
            `（上限 Lv${levelCapForTier(progress.breakthroughTier + 1)}）` +
            (perk ? ` · ${perk.label}` : ''),
        current: xiuwei,
        need,
        ready: !atMax && nodesOk && xiuwei >= need,
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
      const atMax = progress.star >= MAX_STAR;
      const shards = progress.cardShards ?? 0;
      const shardNeed = starShardCost(progress.star);
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
      const useShard = shards >= shardNeed;
      const dustHint =
        progress.star < STARDUST_ASSIST_STAR_CAP
          ? ` · 可兑碎片(${STARDUST_PER_SHARD}尘/日1)`
          : ' · ★5+需抽卡';
      return {
        costLine: `碎片 ${shards}/${shardNeed}${useShard ? '' : dustHint}`,
        effectLine: next
          ? `★${progress.star} → ★${next.star}「${next.label}」`
          : `★${progress.star} → ★${progress.star + 1}`,
        current: shards,
        need: shardNeed,
        ready: useShard,
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
  cultivateTrack(),
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
