/**
 * 星尘 → 同名碎片（慢补；护抽卡付费核）。
 * 升星本身只吃碎片，见 tryStarUp。
 */
import type { PlayerState } from '../shared/types.js';
import { localDayKey } from '../dungeon/dailyClaim.js';
import {
  ensureRoster,
  getProgress,
  isOwned,
  type GrowthActionResult,
} from './growth.js';

/** 指定兑换：尘 → 1 同名碎片 */
export const STARDUST_PER_SHARD = 200;
/** 每日指定兑换次数上限 */
export const STARDUST_EXCHANGE_DAILY_LIMIT = 1;
/**
 * 星尘最多助到 ★4：当前星 ≥ 此值不可再兑该卡。
 * ★5 / ★6 必须靠抽卡同名碎片。
 */
export const STARDUST_ASSIST_STAR_CAP = 4;

export type StardustExchangePreview = {
  templateId: string;
  dustHave: number;
  dustNeed: number;
  exchangesToday: number;
  dailyLimit: number;
  star: number;
  assistCap: number;
  ready: boolean;
  blockedReason: string | null;
};

function exchangesToday(state: PlayerState, now: number): number {
  const day = localDayKey(now);
  if ((state.stardustExchangeDay ?? '') !== day) return 0;
  return Math.max(0, state.stardustExchangesToday ?? 0);
}

export function previewStardustExchange(
  state: PlayerState,
  templateId: string,
  now = Date.now(),
): StardustExchangePreview {
  const progress = getProgress(state, templateId);
  const dustHave = state.currencies?.stardust ?? 0;
  const today = exchangesToday(state, now);
  let blockedReason: string | null = null;
  if (!isOwned(state, templateId)) blockedReason = '尚未拥有该角色';
  else if (progress.star >= STARDUST_ASSIST_STAR_CAP) {
    blockedReason = `星尘最多助到 ★${STARDUST_ASSIST_STAR_CAP}，更高需抽卡碎片`;
  } else if (today >= STARDUST_EXCHANGE_DAILY_LIMIT) {
    blockedReason = '今日兑换次数已用完';
  } else if (dustHave < STARDUST_PER_SHARD) {
    blockedReason = `星尘不足（${dustHave}/${STARDUST_PER_SHARD}）`;
  }
  return {
    templateId,
    dustHave,
    dustNeed: STARDUST_PER_SHARD,
    exchangesToday: today,
    dailyLimit: STARDUST_EXCHANGE_DAILY_LIMIT,
    star: progress.star,
    assistCap: STARDUST_ASSIST_STAR_CAP,
    ready: blockedReason == null,
    blockedReason,
  };
}

/** 200 星尘 → +1 同名碎片（日限 1；仅 star < ★4） */
export function tryExchangeStardustForShard(
  state: PlayerState,
  templateId: string,
  now = Date.now(),
): GrowthActionResult {
  const s = ensureRoster(state);
  const preview = previewStardustExchange(s, templateId, now);
  if (!preview.ready) {
    return { ok: false, message: preview.blockedReason ?? '无法兑换' };
  }
  const day = localDayKey(now);
  const progress = { ...getProgress(s, templateId) };
  progress.cardShards = (progress.cardShards ?? 0) + 1;
  const dust = (s.currencies.stardust ?? 0) - STARDUST_PER_SHARD;
  const today =
    (s.stardustExchangeDay ?? '') === day ? (s.stardustExchangesToday ?? 0) + 1 : 1;
  return {
    ok: true,
    state: {
      ...s,
      currencies: { ...s.currencies, stardust: dust },
      roster: { ...s.roster, [templateId]: progress },
      stardustExchangeDay: day,
      stardustExchangesToday: today,
    },
    message: `消耗 ${STARDUST_PER_SHARD} 星尘，获得 1 枚同名碎片（今日 ${today}/${STARDUST_EXCHANGE_DAILY_LIMIT}）`,
  };
}
