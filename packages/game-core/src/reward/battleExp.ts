import { getProgress, grantCharacterExpAndLevel } from '../character/growth.js';
import { DEFAULT_DEPLOYED_IDS, normalizeFormation } from '../formation/formation.js';
import { getTemplate } from '../character/templates.js';
import { expToNextLevel } from '../character/growth.js';
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

/**
 * 主线单场胜利：每位上阵成员获得的经验。
 * 随章序与波次略涨；整节总量对齐「清章可升数级」。
 */
export function mainlineExpPerDeployedMember(
  chapterOrder: number,
  waveIndexInNode: number,
): number {
  const o = Math.max(1, Math.min(10, Math.round(chapterOrder)));
  const w = Math.max(0, waveIndexInNode);
  const base = 5 + o * 2;
  const ramp = 1 + Math.min(12, w) * 0.06;
  return Math.max(4, Math.round(base * ramp));
}

function deployedIds(state: PlayerState): string[] {
  const normalized = normalizeFormation(state.formation);
  const ids = Object.keys(normalized);
  return ids.length > 0 ? ids : [...DEFAULT_DEPLOYED_IDS];
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

/** 估算清 N 章主线后每人累计经验（模拟用） */
export function estimateMainlineExpThroughChapter(chaptersCleared: number): number {
  let total = 0;
  for (let ch = 1; ch <= chaptersCleared; ch += 1) {
    const units = Math.min(9, 2 + ch);
    const fightsPerChapter = 2 * units * 3;
    for (let f = 0; f < fightsPerChapter; f += 1) {
      total += mainlineExpPerDeployedMember(ch, f % 9);
    }
  }
  return total;
}
