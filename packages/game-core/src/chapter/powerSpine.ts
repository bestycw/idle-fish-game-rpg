/**
 * 战力脊柱 · 玩家 / 主线敌人 / 猎装 / 剧情生成 共用刻度
 *
 * ## 怎么理解三条线（不要混成一条）
 *
 * 1. **玩家里程碑** `PlayerMilestone`：「打到第 N 章时，典型队伍战力大概多少」
 *    - 来自养成假设（主线 + 适量猎装），不是全服统计。
 * 2. **敌人章档** `CHAPTER_BANDS`：「这一章的怪乘多少、Hub 建议战力多少」
 *    - 实战：`battlePressure(chapterCleared) × 遭遇底稿`。
 * 3. **猎装本** `gearDungeonCombatReadout`：「该实例面向哪档玩家；建议战力与开战压力」
 *    - 解锁门槛看 `unlockAtChapterCleared`；**开战按刚解锁的上一档**（`gearDungeonScaleChapterCleared`），不跟当前章抬怪。
 *    - 通关 ch1 才开的第一本，必须用第一章档，否则卡在第二章去刷装会刷不过。
 *
 * ## 调表顺序（策划）
 *
 * 1. 先定每章 `floor / recommended / crush`（敌人 + Hub）。
 * 2. 用 `PLAYER_MILESTONES` 对齐「章初 / 章末」玩家目标（默认可从章档推导，见 `milestoneForChapterOrder`）。
 * 3. 猎装 tier（普通/困难/地狱/秘境）用 `tierPowerFraction` 插在 recommended～crush 之间。
 * 4. 跑 `npm run power-spine-check` 看解锁本与里程碑是否错位。
 *
 * 战力读数与章档同乘 `COMBAT_POWER_SCALE`（见 equipment/power.ts），战斗内属性不受影响。
 *
 * ## 剧情 Skill
 *
 * 用 `storyCombatScaleBrief(chapterOrder)` 取 `narrativePressureTier`、战力区间与语气，勿在 Skin 里写具体数值伤害。
 */
import { ENCOUNTERS } from '../dungeon/encounters.js';
import { getGearDungeon, type GearDungeonTier } from '../dungeon/gearDungeons.js';
import { CHAPTERS, START_UNLOCKS, type ContentUnlock } from './defs.js';
import {
  CHAPTER_BANDS,
  battlePressure,
  getChapterBand,
  mainlineStoryPressure,
  type ChapterBand,
} from './bands.js';
import { encounterThreatSum } from './mainlineThreatBudget.js';

export interface PlayerMilestone {
  /** 1-based 章序 */
  chapterOrder: number;
  /** 刚进本章：偏低养成 */
  powerEnterLow: number;
  /** 刚进本章：设计目标 */
  powerEnterTarget: number;
  /** 清完本章：不刷猎装也宜达到的底线 */
  powerClearMin: number;
  /** 清完本章：主线 + 少量猎装 */
  powerClearTarget: number;
  /** 清完本章：碾压带 */
  powerClearStretch: number;
}

/** 章末目标（可手调）；默认由 `derivePlayerMilestones` 从 CHAPTER_BANDS 生成 */
export const PLAYER_MILESTONES: PlayerMilestone[] = derivePlayerMilestones();

function derivePlayerMilestones(): PlayerMilestone[] {
  return CHAPTER_BANDS.map((_, i) => milestoneForChapterOrder(i + 1));
}

export function milestoneForChapterOrder(chapterOrder: number): PlayerMilestone {
  const o = Math.max(1, Math.min(CHAPTER_BANDS.length, Math.round(chapterOrder)));
  const band = getChapterBand(o - 1);
  const prev = o > 1 ? getChapterBand(o - 2) : null;

  const powerEnterLow = prev
    ? Math.round(prev.recommendedPower * 0.92)
    : band.floorPower;
  const powerEnterTarget = Math.round((band.floorPower + band.recommendedPower) / 2);
  const powerClearMin = band.recommendedPower;
  const powerClearTarget = Math.round((band.recommendedPower + band.crushPower) / 2);
  const powerClearStretch = band.crushPower;

  return {
    chapterOrder: o,
    powerEnterLow,
    powerEnterTarget,
    powerClearMin,
    powerClearTarget,
    powerClearStretch,
  };
}

export function milestoneForChapterCleared(chapterCleared: number): PlayerMilestone {
  return milestoneForChapterOrder(Math.max(1, (chapterCleared ?? 0) + 1));
}

// —— 解锁章索引（chapterCleared 达到即可用） ——

const unlockChapterCache = buildUnlockChapterIndex();

function unlockKey(kind: ContentUnlock['kind'], id: string): string {
  return `${kind}:${id}`;
}

function buildUnlockChapterIndex(): Map<string, number> {
  const m = new Map<string, number>();
  for (const u of START_UNLOCKS) {
    m.set(unlockKey(u.kind, u.id), 0);
  }
  for (const ch of CHAPTERS) {
    for (const u of ch.unlocksOnClear) {
      m.set(unlockKey(u.kind, u.id), ch.order);
    }
  }
  return m;
}

/** 内容解锁所需 `chapterCleared`（未解锁返回 undefined） */
export function unlockAtChapterCleared(
  kind: ContentUnlock['kind'],
  id: string,
): number | undefined {
  return unlockChapterCache.get(unlockKey(kind, id));
}

/**
 * 猎装实例的章档下标：刚达到解锁门槛时，用「刚打过的那一章」而不是正在卡的下一章。
 * `unlockAt === 0`（开局本）→ 0；通关第 N 章才开 → N-1。
 */
export function gearDungeonScaleChapterCleared(dungeonId: string): number {
  const unlockAt = unlockAtChapterCleared('dungeon', dungeonId) ?? 0;
  return Math.max(0, unlockAt - 1);
}

/** 普通猎装轻压（清章升两级后队伍更强，不必压到 0.7 以下） */
const GEAR_NORMAL_TIER_BATTLE_SOFTEN = 0.75;

/**
 * 猎装开战压力（单一入口：Web 战前、工具、文档须与此一致）。
 * 按解锁章档 × 本种 pressure；普通档再乘 `GEAR_NORMAL_TIER_BATTLE_SOFTEN`。
 */
export function gearDungeonBattlePressure(dungeonId: string): number {
  const def = getGearDungeon(dungeonId);
  const scale = gearDungeonScaleChapterCleared(dungeonId);
  const dungeonPressure = def?.pressure ?? 1;
  let p = battlePressure(scale, dungeonPressure);
  if (def?.tier === 'normal') p *= GEAR_NORMAL_TIER_BATTLE_SOFTEN;
  return p;
}

/** 0～1：在 recommended 与 crush 之间插值 */
export function tierPowerFraction(tier: GearDungeonTier): number {
  switch (tier) {
    case 'normal':
      return 0;
    case 'hard':
      return 0.42;
    case 'hell':
      return 0.82;
    case 'rift':
      return 1;
    default:
      return 0;
  }
}

function bandPowerBetween(band: ChapterBand, fraction: number): number {
  const f = Math.max(0, Math.min(1.05, fraction));
  return Math.round(
    band.recommendedPower + (band.crushPower - band.recommendedPower) * f,
  );
}

/**
 * 猎装 Hub / 战前：该实例建议队伍战力（按解锁档，不跟当前章漂移）。
 * - **普通**：对齐「刚打完解锁章」的 `powerEnterTarget`（第一本约 694，不是章档 798）。
 * - 困难+：插在章档 recommended～crush。
 */
export function gearDungeonPlayerTarget(
  dungeonId: string,
  _chapterCleared?: number,
): number {
  const def = getGearDungeon(dungeonId);
  const scale = gearDungeonScaleChapterCleared(dungeonId);
  if (!def) return getChapterBand(scale).recommendedPower;
  if (def.tier === 'normal') {
    const chapterOrder = Math.min(CHAPTER_BANDS.length, scale + 1);
    const enter = milestoneForChapterOrder(chapterOrder).powerEnterTarget;
    return Math.round(enter * def.pressure);
  }
  const band = getChapterBand(scale);
  const spine = bandPowerBetween(band, tierPowerFraction(def.tier));
  return Math.round(spine * def.pressure);
}

export interface GearDungeonCombatReadout {
  dungeonId: string;
  tier: GearDungeonTier;
  unlockAtChapterCleared: number;
  /** 刚解锁时面向的章档 */
  unlockBand: ChapterBand;
  playerTargetAtUnlock: number;
  /** 当前章节进度下的建议战力 */
  playerTargetNow: number;
  battlePressureNow: number;
  /** 首领遭遇威胁粗算（当前章 × 本 pressure） */
  bossThreatNow: number | null;
}

export function gearDungeonCombatReadout(
  dungeonId: string,
  chapterCleared: number,
): GearDungeonCombatReadout | null {
  const def = getGearDungeon(dungeonId);
  if (!def) return null;
  const unlockAt = unlockAtChapterCleared('dungeon', dungeonId) ?? 0;
  const scaleAt = gearDungeonScaleChapterCleared(dungeonId);
  const unlockBand = getChapterBand(scaleAt);
  const playerTargetAtUnlock = gearDungeonPlayerTarget(dungeonId, scaleAt);
  const playerTargetNow = playerTargetAtUnlock;
  const battlePressureNow = gearDungeonBattlePressure(dungeonId);
  const bossId = def.encounterPool.find((id) => id.startsWith('boss_')) ?? def.encounterPool[0];
  const enc = bossId ? ENCOUNTERS.find((e) => e.id === bossId) : undefined;
  const bossThreatNow = enc
    ? encounterThreatSum(enc.enemies, battlePressureNow)
    : null;

  return {
    dungeonId: def.id,
    tier: def.tier,
    unlockAtChapterCleared: unlockAt,
    unlockBand,
    playerTargetAtUnlock,
    playerTargetNow,
    battlePressureNow,
    bossThreatNow,
  };
}

export interface StoryCombatScaleBrief {
  chapterOrder: number;
  milestone: PlayerMilestone;
  band: ChapterBand;
  /** 1（入门）～5（卷末压迫）供剧情 Skill 选语气 */
  narrativePressureTier: 1 | 2 | 3 | 4 | 5;
  /** 给大纲：本章战斗在卷内的定位 */
  combatScaleLabel: string;
  /** 敌人侧：建议用 mainlineStoryPressure 的范围提示，不写进玩家数值 */
  enemyMultAtChapter: number;
}

export function storyCombatScaleBrief(chapterOrder: number): StoryCombatScaleBrief {
  const o = Math.max(1, Math.min(10, Math.round(chapterOrder)));
  const milestone = milestoneForChapterOrder(o);
  const band = getChapterBand(o - 1);
  const narrativePressureTier = (Math.min(5, Math.max(1, Math.ceil(o / 2))) as 1 | 2 | 3 | 4 | 5);
  const combatScaleLabel =
    o <= 2
      ? '初阵试锋·以学机制为主'
      : o <= 5
        ? '中盘加压·需换装与改阵'
        : o <= 8
          ? '后盘硬仗·解法与养成并重'
          : '卷末决战·高威胁与多阵';
  return {
    chapterOrder: o,
    milestone,
    band,
    narrativePressureTier,
    combatScaleLabel,
    enemyMultAtChapter: band.enemyMult,
  };
}

/** 主线遭遇威胁读数（策划/工具） */
export function mainlineEncounterThreatReadout(
  encounterId: string,
  chapterCleared: number,
  chapterOrder: number,
): number | null {
  const enc = ENCOUNTERS.find((e) => e.id === encounterId);
  if (!enc) return null;
  const pressure = mainlineStoryPressure(chapterCleared, chapterOrder);
  return encounterThreatSum(enc.enemies, pressure);
}
