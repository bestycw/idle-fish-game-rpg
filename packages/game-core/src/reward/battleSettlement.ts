import type { Equipment, PlayerState } from '../shared/types.js';
import type { ChapterFirstClearReward } from './chapterFirstClear.js';
import type { PartyExpGainRow } from './battleExp.js';
import { EXP_PILL_IDS } from './expPills.js';

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
  /** 本场每位上阵成员获得的经验（猎装/主线） */
  characterExpPerMember: number;
  /** 上阵经验条 / LV UP 展示 */
  partyExpRows: PartyExpGainRow[];
  /** 本场掉落的经验丹等材料 */
  materialDrops: { itemId: string; amount: number }[];
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
  characterExpPerMember: 0,
  partyExpRows: [],
  materialDrops: [],
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

function materialDropsBetween(before: PlayerState, after: PlayerState): { itemId: string; amount: number }[] {
  const rows: { itemId: string; amount: number }[] = [];
  for (const id of EXP_PILL_IDS) {
    const d = (after.materials?.[id] ?? 0) - (before.materials?.[id] ?? 0);
    if (d > 0) rows.push({ itemId: id, amount: d });
  }
  return rows;
}

export function buildBattleSettlement(opts: {
  source: BattleSettlementSource;
  before: PlayerState;
  after: PlayerState;
  equipment?: Equipment | null;
  bonusEquipment?: Equipment[];
  characterExpPerMember?: number;
  partyExpRows?: PartyExpGainRow[];
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
    characterExpPerMember: opts.characterExpPerMember ?? 0,
    partyExpRows: opts.partyExpRows ?? [],
    materialDrops: materialDropsBetween(opts.before, opts.after),
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
    s.enhanceStones > 0 ||
    s.characterExpPerMember > 0 ||
    s.partyExpRows.length > 0 ||
    s.materialDrops.length > 0
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
