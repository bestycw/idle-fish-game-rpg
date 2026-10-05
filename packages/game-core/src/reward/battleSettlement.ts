import type { Equipment, PlayerState } from '../shared/types.js';
import type { ChapterFirstClearReward } from './chapterFirstClear.js';

export type BattleSettlementSource = 'chapter' | 'dungeon';

export interface BattleSettlement {
  source: BattleSettlementSource;
  equipment: Equipment | null;
  /** 猎装等：第 2 件起的追加装备 */
  bonusEquipment: Equipment[];
  gold: number;
  stardust: number;
  xiuwei: number;
  ticket: number;
  enhanceStones: number;
  /** 展示用文案（进度、首通、解锁等） */
  lines: string[];
  firstClearChapter?: { order: number; name: string };
}

export const EMPTY_SETTLEMENT: BattleSettlement = {
  source: 'chapter',
  equipment: null,
  bonusEquipment: [],
  gold: 0,
  stardust: 0,
  xiuwei: 0,
  ticket: 0,
  enhanceStones: 0,
  lines: [],
};

function currencyDelta(before: PlayerState, after: PlayerState) {
  return {
    gold: after.gold - before.gold,
    stardust: (after.currencies?.stardust ?? 0) - (before.currencies?.stardust ?? 0),
    xiuwei: (after.currencies?.xiuwei ?? 0) - (before.currencies?.xiuwei ?? 0),
    ticket: (after.currencies?.ticket ?? 0) - (before.currencies?.ticket ?? 0),
    enhanceStones: (after.enhanceStones ?? 0) - (before.enhanceStones ?? 0),
  };
}

export function buildBattleSettlement(opts: {
  source: BattleSettlementSource;
  before: PlayerState;
  after: PlayerState;
  equipment?: Equipment | null;
  bonusEquipment?: Equipment[];
  lines: string[];
  firstClearChapter?: { order: number; name: string };
}): BattleSettlement {
  const d = currencyDelta(opts.before, opts.after);
  return {
    source: opts.source,
    equipment: opts.equipment ?? null,
    bonusEquipment: opts.bonusEquipment ?? [],
    gold: d.gold,
    stardust: d.stardust,
    xiuwei: d.xiuwei,
    ticket: d.ticket,
    enhanceStones: d.enhanceStones,
    lines: opts.lines.filter(Boolean),
    firstClearChapter: opts.firstClearChapter,
  };
}

export function settlementHasLoot(s: BattleSettlement): boolean {
  return (
    s.equipment != null ||
    s.bonusEquipment.length > 0 ||
    s.gold > 0 ||
    s.stardust > 0 ||
    s.xiuwei > 0 ||
    s.ticket > 0 ||
    s.enhanceStones > 0
  );
}

export function formatFirstClearRewardLine(pack: ChapterFirstClearReward): string {
  const parts: string[] = [];
  if (pack.stardust > 0) parts.push(`星尘 +${pack.stardust}`);
  if (pack.gold > 0) parts.push(`灵石 +${pack.gold}`);
  if (pack.ticket) parts.push(`寻访帖 +${pack.ticket}`);
  if (pack.enhanceStones) parts.push(`淬灵石 +${pack.enhanceStones}`);
  return parts.join(' · ');
}
