import { createRng } from '../shared/rng.js';
import type { PlayerState } from '../shared/types.js';
import { grantMainlineBattleExp, type PartyExpGainRow } from './battleExp.js';
import { grantExpPillDrop, rollExpPillDrop } from './expPills.js';

export type MainlineWaveReward = {
  state: PlayerState;
  gold: number;
  characterExpPerMember: number;
  partyExpRows: PartyExpGainRow[];
  /** 本场掉落的经验丹（可能为空） */
  expPillDrop: { itemId: string; count: number } | null;
};

/** 主线单场胜利：灵石 + 上阵经验（自动连升）+ 偶发经验丹 */
export function grantMainlineBattleWaveReward(
  state: PlayerState,
  opts: { chapterOrder: number; waveIndexInNode: number; salt: number },
): MainlineWaveReward {
  const rng = createRng(state.seed + opts.salt * 17 + (state.chapterNodeIndex ?? 0));
  const gold = rng.int(2, 6);
  const exp = grantMainlineBattleExp(state, opts.chapterOrder, opts.waveIndexInNode);
  const pill = rollExpPillDrop(rng, state.chapterCleared ?? 0);
  const withPill = grantExpPillDrop(exp.state, pill);
  return {
    state: { ...withPill, gold: state.gold + gold, seed: state.seed + 1 },
    gold,
    characterExpPerMember: exp.perMember,
    partyExpRows: exp.partyRows,
    expPillDrop: pill,
  };
}
