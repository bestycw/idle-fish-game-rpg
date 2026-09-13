/**
 * 角色身上真正生效的装备。
 * 场外 T3（鸿运/探脉/拆骨…）和进战词缀都从这里读，不要再扫 characterEquip。
 */
import type { ConditionAffix, Equipment, PlayerState } from '../shared/types.js';
import { equippedItems } from './bonuses.js';

export function wornItemIds(state: PlayerState): Set<string> {
  const ids = new Set<string>();
  for (const slots of Object.values(state.characterEquip ?? {})) {
    for (const id of Object.values(slots ?? {})) {
      if (id) ids.add(id);
    }
  }
  return ids;
}

export function isItemWorn(state: PlayerState, itemId: string): boolean {
  return wornItemIds(state).has(itemId);
}

export function characterLoadout(state: PlayerState, templateId: string): Equipment[] {
  return equippedItems(state, templateId);
}

export function loadoutT3Ids(state: PlayerState, templateId: string): string[] {
  return characterLoadout(state, templateId)
    .map((item) => item.effectAffixId)
    .filter((id): id is string => Boolean(id));
}

export function loadoutConditions(state: PlayerState, templateId: string): ConditionAffix[] {
  return characterLoadout(state, templateId).flatMap((item) => item.conditions ?? []);
}

export function characterHasT3(state: PlayerState, templateId: string, id: string): boolean {
  return loadoutT3Ids(state, templateId).includes(id);
}

export function deployedT3Ids(state: PlayerState): Set<string> {
  const ids = new Set<string>();
  for (const templateId of Object.keys(state.formation ?? {})) {
    for (const id of loadoutT3Ids(state, templateId)) ids.add(id);
  }
  return ids;
}

export function deployedHasT3(state: PlayerState, id: string): boolean {
  return deployedT3Ids(state).has(id);
}
