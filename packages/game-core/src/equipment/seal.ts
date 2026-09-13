import type { ConditionAffix, Equipment, PlayerState } from '../shared/types.js';
import { getConditionDef, listConditionsForSlot } from './catalog/conditions.js';
import { wearTierForItemLevel } from './catalog/rarity.js';
import { SLOT_NAMES } from './catalog/slots.js';
import { formatConditionLine } from './affixDisplay.js';
import { wearTierLabel } from './wear.js';

const SEAL_STONE_COST = 12;
const SEAL_GOLD_COST = 2000;

export { SEAL_STONE_COST, SEAL_GOLD_COST };

function unequipEverywhere(state: PlayerState, itemId: string): PlayerState {
  const characterEquip: PlayerState['characterEquip'] = {};
  for (const [tid, slots] of Object.entries(state.characterEquip ?? {})) {
    const next = { ...slots };
    for (const [slot, id] of Object.entries(next)) {
      if (id === itemId) delete next[slot as keyof typeof next];
    }
    characterEquip[tid] = next;
  }
  return { ...state, characterEquip };
}

export function sealCondition(
  state: PlayerState,
  itemId: string,
  conditionIndex: number,
): { ok: boolean; state: PlayerState; message: string } {
  const item = state.inventory.find((e) => e.id === itemId);
  if (!item) return { ok: false, state, message: '物品不存在' };
  const cond = item.conditions?.[conditionIndex];
  if (!cond) return { ok: false, state, message: '没有这条条件' };
  if ((state.enhanceStones ?? 0) < SEAL_STONE_COST) {
    return { ok: false, state, message: '强化石不足' };
  }
  if (state.gold < SEAL_GOLD_COST) return { ok: false, state, message: '金币不足' };

  const gemRefund = item.gemId
    ? (() => {
        const gems = [...(state.gems ?? [])];
        const existing = gems.find((g) => g.gemId === item.gemId);
        if (existing) existing.count += 1;
        else gems.push({ gemId: item.gemId!, count: 1 });
        return gems;
      })()
    : state.gems;

  let next = unequipEverywhere(state, itemId);
  next = {
    ...next,
    gold: next.gold - SEAL_GOLD_COST,
    enhanceStones: (next.enhanceStones ?? 0) - SEAL_STONE_COST,
    inventory: next.inventory.filter((e) => e.id !== itemId),
    gems: gemRefund,
    sealStamp: {
      condition: cond,
      sourceSlot: item.slot,
      wearTier: wearTierForItemLevel(item.itemLevel ?? 1),
      sourceRarity: item.rarity,
    },
  };
  return { ok: true, state: next, message: `已封存【${cond.name}】，源件销毁` };
}

function clampCondition(cond: ConditionAffix, targetRarity: Equipment['rarity']): ConditionAffix {
  if (!cond.extreme || targetRarity === 'legendary') return cond;
  const def = getConditionDef(cond.defId);
  if (!def) return { ...cond, extreme: undefined };
  return {
    ...cond,
    value: Math.min(cond.value, def.max),
    min: def.min,
    max: def.max,
    extreme: undefined,
  };
}

export function applySeal(
  state: PlayerState,
  itemId: string,
  conditionIndex: number,
): { ok: boolean; state: PlayerState; message: string } {
  const stamp = state.sealStamp;
  if (!stamp) return { ok: false, state, message: '没有封存印' };
  const item = state.inventory.find((e) => e.id === itemId);
  if (!item) return { ok: false, state, message: '物品不存在' };
  if (!item.conditions || item.conditions.length === 0) {
    return { ok: false, state, message: '目标没有条件槽' };
  }
  const target = item.conditions[conditionIndex];
  if (!target) return { ok: false, state, message: '指定条件行不存在' };

  const allowed = listConditionsForSlot(item.slot).some((d) => d.id === stamp.condition.defId);
  if (!allowed) return { ok: false, state, message: '槽位池不匹配' };

  const targetTier = wearTierForItemLevel(item.itemLevel ?? 1);
  if (targetTier !== stamp.wearTier) return { ok: false, state, message: '只能印同一破境档' };

  const printed = clampCondition(stamp.condition, item.rarity);
  const conditions = item.conditions.map((c, i) => (i === conditionIndex ? printed : c));
  return {
    ok: true,
    state: {
      ...state,
      sealStamp: undefined,
      inventory: state.inventory.map((e) => (e.id === itemId ? { ...e, conditions } : e)),
    },
    message: `已印上【${printed.name}】`,
  };
}

export function sealPrintBlockedReason(state: PlayerState, item: Equipment): string | undefined {
  const stamp = state.sealStamp;
  if (!stamp) return '没有封存印';
  if (!item.conditions || item.conditions.length === 0) return '目标没有条件槽';
  const allowed = listConditionsForSlot(item.slot).some((d) => d.id === stamp.condition.defId);
  if (!allowed) return '槽位池不匹配';
  if (wearTierForItemLevel(item.itemLevel ?? 1) !== stamp.wearTier) return '只能印同一破境档';
  return undefined;
}

export function describeSealStamp(stamp: NonNullable<PlayerState['sealStamp']>): string {
  const line = formatConditionLine(stamp.condition);
  const extreme = stamp.condition.extreme ? ' · 极' : '';
  return `${line.line}${extreme} · ${SLOT_NAMES[stamp.sourceSlot]} · ${wearTierLabel(stamp.wearTier)}档`;
}
