import type { BattleSettlement } from '../reward/battleSettlement.js';
import { SETTLEMENT_FIELD_TO_ITEM_ID } from './registry.js';

export type SettlementGrantRow = { itemId: string; amount: number };

/** 将战斗结算数值行转为 itemId（供 UI tItem 显示） */
export function settlementGrantRows(settlement: BattleSettlement): SettlementGrantRow[] {
  const rows: SettlementGrantRow[] = [];
  if (settlement.gold > 0) {
    rows.push({ itemId: SETTLEMENT_FIELD_TO_ITEM_ID.gold, amount: settlement.gold });
  }
  if (settlement.stardust > 0) {
    rows.push({ itemId: SETTLEMENT_FIELD_TO_ITEM_ID.stardust, amount: settlement.stardust });
  }
  if (settlement.xiuwei > 0) {
    rows.push({ itemId: SETTLEMENT_FIELD_TO_ITEM_ID.xiuwei, amount: settlement.xiuwei });
  }
  if (settlement.ticket > 0) {
    rows.push({ itemId: SETTLEMENT_FIELD_TO_ITEM_ID.ticket, amount: settlement.ticket });
  }
  if (settlement.enhanceStones > 0) {
    rows.push({
      itemId: SETTLEMENT_FIELD_TO_ITEM_ID.enhanceStones,
      amount: settlement.enhanceStones,
    });
  }
  if (settlement.characterExpPerMember > 0) {
    rows.push({
      itemId: SETTLEMENT_FIELD_TO_ITEM_ID.characterExp,
      amount: settlement.characterExpPerMember,
    });
  }
  for (const m of settlement.materialDrops ?? []) {
    if (m.amount > 0) rows.push({ itemId: m.itemId, amount: m.amount });
  }
  return rows;
}
