import { getProgress, grantCharacterExpAndLevel, expToNextLevel } from '../character/growth.js';
import { deployedOrStarterIds } from '../formation/formation.js';
import { getTemplate } from '../character/templates.js';
import { CHAPTERS } from '../chapter/defs.js';
import { battleWavesForNode } from '../chapter/battleWaves.js';
import type { PlayerState } from '../shared/types.js';

export { expToNextLevel as characterExpToNextLevel };

export type PartyExpGainRow = {
  templateId: string;
  name: string;
  expGained: number;
  levelBefore: number;
  levelAfter: number;
  expAfter: number;
  expToNext: number;
  leveledUp: boolean;
};

/** 从 fromLevel 连升 levels 级所需经验总和（不含溢出） */
export function expSumForLevelSpan(fromLevel: number, levels: number): number {
  const start = Math.max(1, Math.floor(fromLevel));
  const n = Math.max(0, Math.floor(levels));
  let total = 0;
  for (let i = 0; i < n; i += 1) {
    total += expToNextLevel(start + i);
  }
  return total;
}

/**
 * 清完该章时，上阵成员相对「进章等级」的目标净升级数。
 * 第一章教学：通关约升 **2** 级（1→3）。
 */
export function mainlineClearLevelGainTarget(chapterOrder: number): number {
  const o = Math.max(1, Math.min(10, Math.round(chapterOrder)));
  if (o === 1) return 2;
  if (o <= 4) return 2;
  return 1;
}

/** 估算进本章时的等级（按前几章目标升级累加） */
export function approxMainlineLevelEnteringChapter(chapterOrder: number): number {
  let lv = 1;
  for (let ch = 1; ch < chapterOrder; ch += 1) {
    lv += mainlineClearLevelGainTarget(ch);
  }
  return lv;
}

/** 该章主线战斗场次数（真实 wave 表） */
export function mainlineFightCountForChapter(chapterOrder: number): number {
  const ch = CHAPTERS.find((c) => c.order === chapterOrder);
  if (!ch) return 0;
  let n = 0;
  for (const node of ch.nodes) {
    if (node.kind !== 'battle') continue;
    n += battleWavesForNode(node, ch.order, ch).length;
  }
  return n;
}

/**
 * 主线单场胜利：每位上阵成员获得的经验。
 * 按「清章目标升级数 ÷ 本章场次数」分摊，再略按波次抬一点；**抬剧情经验、不动升级曲线**。
 */
export function mainlineExpPerDeployedMember(
  chapterOrder: number,
  waveIndexInNode: number,
): number {
  const o = Math.max(1, Math.min(10, Math.round(chapterOrder)));
  const fights = Math.max(1, mainlineFightCountForChapter(o));
  const startLv = approxMainlineLevelEnteringChapter(o);
  const need = expSumForLevelSpan(startLv, mainlineClearLevelGainTarget(o));
  // 略超量：偶发未打满 / 词缀战败重打不重复领，略余量到下章
  const pool = Math.round(need * 1.08);
  const avg = pool / fights;
  const w = Math.max(0, waveIndexInNode);
  const ramp = 1 + Math.min(2, w) * 0.08;
  // 波次 0/1/2 的 ramp 均值 ≈ 1.08
  return Math.max(8, Math.round((avg / 1.08) * ramp));
}

function deployedIds(state: PlayerState): string[] {
  return deployedOrStarterIds(state);
}

export function grantMainlineBattleExp(
  state: PlayerState,
  chapterOrder: number,
  waveIndexInNode: number,
): { state: PlayerState; perMember: number; partyRows: PartyExpGainRow[] } {
  const perMember = mainlineExpPerDeployedMember(chapterOrder, waveIndexInNode);
  const deployed = deployedIds(state);
  let next = state;
  const partyRows: PartyExpGainRow[] = [];
  for (const id of deployed) {
    const before = getProgress(next, id);
    const leveled = grantCharacterExpAndLevel(next, id, perMember);
    next = leveled.state;
    const after = getProgress(next, id);
    partyRows.push({
      templateId: id,
      name: getTemplate(id)?.name ?? id,
      expGained: perMember,
      levelBefore: before.level,
      levelAfter: after.level,
      expAfter: after.exp,
      expToNext: expToNextLevel(after.level),
      leveledUp: after.level > before.level,
    });
  }
  return { state: next, perMember, partyRows };
}

/** 猎装等：统一给上阵加经验并连升 */
export function grantDeployedBattleExp(
  state: PlayerState,
  perMember: number,
): { state: PlayerState; partyRows: PartyExpGainRow[] } {
  const deployed = deployedIds(state);
  let next = state;
  const partyRows: PartyExpGainRow[] = [];
  if (perMember <= 0) {
    for (const id of deployed) {
      const p = getProgress(next, id);
      partyRows.push({
        templateId: id,
        name: getTemplate(id)?.name ?? id,
        expGained: 0,
        levelBefore: p.level,
        levelAfter: p.level,
        expAfter: p.exp,
        expToNext: expToNextLevel(p.level),
        leveledUp: false,
      });
    }
    return { state: next, partyRows };
  }
  for (const id of deployed) {
    const before = getProgress(next, id);
    const leveled = grantCharacterExpAndLevel(next, id, perMember);
    next = leveled.state;
    const after = getProgress(next, id);
    partyRows.push({
      templateId: id,
      name: getTemplate(id)?.name ?? id,
      expGained: perMember,
      levelBefore: before.level,
      levelAfter: after.level,
      expAfter: after.exp,
      expToNext: expToNextLevel(after.level),
      leveledUp: after.level > before.level,
    });
  }
  return { state: next, partyRows };
}

/** 估算清 N 章主线后每人累计经验（模拟用 · 与真实场次数一致） */
export function estimateMainlineExpThroughChapter(chaptersCleared: number): number {
  let total = 0;
  for (let ch = 1; ch <= chaptersCleared; ch += 1) {
    const fights = mainlineFightCountForChapter(ch);
    for (let f = 0; f < fights; f += 1) {
      total += mainlineExpPerDeployedMember(ch, f % 3);
    }
  }
  return total;
}
