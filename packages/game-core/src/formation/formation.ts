import { createUnitFromTemplate } from '../character/factory.js';
import { isOwned } from '../character/growth.js';
import { UNIT_TEMPLATES, getTemplate } from '../character/templates.js';
import { applyBonusesToUnit, sumEquipmentBonuses } from '../equipment/equipment.js';
import { loadoutConditions, loadoutT3Ids } from '../equipment/loadout.js';
import { getChainBonus, getTeamChainBonus } from '../equipment/enhance.js';
import { listEquipmentSkillModifiers } from '../equipment/morphs.js';
import {
  DEFAULT_STARTER_GIFT_IDS,
  resolveStarterCompanionId,
  starterGiftIds,
  STARTER_EPIC_POOL,
} from '../character/starterRoster.js';
import { MAX_PARTY_SIZE, type GridSlot, type PlayerState, type UnitRuntime } from '../shared/types.js';

/** 审计/旧调用用样例阵（hero + 池首）；真开局看 `starterGiftIds` / `deployedOrStarterIds` */
export const DEFAULT_DEPLOYED_IDS = DEFAULT_STARTER_GIFT_IDS;

export function defaultFormation(
  companionId: string = STARTER_EPIC_POOL[0]!,
): Partial<Record<string, GridSlot>> {
  const formation: Partial<Record<string, GridSlot>> = {};
  for (const id of starterGiftIds(companionId)) {
    const t = UNIT_TEMPLATES.find((u) => u.id === id);
    if (t) formation[t.id] = t.preferredSlot;
  }
  return normalizeFormation(formation);
}

/** 当前上阵；空阵时回落到存档开局赠送 */
export function deployedOrStarterIds(state: PlayerState): string[] {
  const ids = Object.keys(normalizeFormation(state.formation));
  if (ids.length > 0) return ids;
  const companionId = resolveStarterCompanionId(state.seed, state.starterCompanionId);
  return [...starterGiftIds(companionId)];
}

export function normalizeFormation(
  formation: Partial<Record<string, GridSlot>>,
): Partial<Record<string, GridSlot>> {
  const draft = { ...formation };
  const heroTemplate = UNIT_TEMPLATES.find((t) => t.isHero);
  if (heroTemplate && draft[heroTemplate.id] == null) {
    draft[heroTemplate.id] = heroTemplate.preferredSlot;
  }

  const used = new Set<GridSlot>();
  const result: Partial<Record<string, GridSlot>> = {};
  // 主角优先保留，其余按模板表顺序；超出 MAX_PARTY_SIZE 的下阵
  const ordered = [
    ...UNIT_TEMPLATES.filter((t) => t.isHero && draft[t.id] != null),
    ...UNIT_TEMPLATES.filter((t) => !t.isHero && draft[t.id] != null),
  ];

  for (const t of ordered) {
    if (Object.keys(result).length >= MAX_PARTY_SIZE) break;
    let slot = draft[t.id]!;
    if (used.has(slot)) {
      const free = ([1, 2, 3, 4, 5, 6, 7, 8, 9] as GridSlot[]).find((s) => !used.has(s));
      if (!free) continue;
      slot = free;
    }
    used.add(slot);
    result[t.id] = slot;
  }
  return result;
}

export function buildPlayerParty(state: PlayerState): UnitRuntime[] {
  const formation = normalizeFormation(state.formation);
  const units: UnitRuntime[] = [];

  for (const t of UNIT_TEMPLATES) {
    const slot = formation[t.id];
    if (slot == null) continue;
    const progress = state.roster?.[t.id];
    const bonus = sumEquipmentBonuses(state, t.id);
    const morphMods = listEquipmentSkillModifiers(state, t.id);
    const composeCtx = morphMods.length > 0 ? { extraModifiers: morphMods } : undefined;
    const unit = createUnitFromTemplate(t, slot, progress, composeCtx);
    const finalUnit = applyBonusesToUnit(unit, bonus);
    const effectIds = loadoutT3Ids(state, t.id);
    const conditions = loadoutConditions(state, t.id);
    if (effectIds.length > 0) finalUnit.effectAffixIds = effectIds;
    if (conditions.length > 0) finalUnit.conditionAffixes = conditions;

    units.push(finalUnit);
  }

  // ─── Chain bonus integration ────────────────────────────────
  const teamChain = getTeamChainBonus(state);
  for (const unit of units) {
    const charChain = getChainBonus(state, unit.templateId);
    const totalBonus = 1 + (charChain.bonus + teamChain.bonus);
    if (totalBonus > 1) {
      unit.atk = Math.round(unit.atk * totalBonus);
      unit.def = Math.round(unit.def * totalBonus);
      unit.res = Math.round(unit.res * totalBonus);
      unit.maxHp = Math.round(unit.maxHp * totalBonus);
      unit.hp = unit.maxHp;
    }
  }

  return units;
}

export function placeUnit(
  state: PlayerState,
  templateId: string,
  slot: GridSlot,
): PlayerState {
  if (!isOwned(state, templateId)) return state;
  const formation = { ...state.formation };
  const alreadyOn = formation[templateId] != null;
  const occupant = Object.entries(formation).find(([, s]) => s === slot)?.[0];
  const prev = formation[templateId];

  // 新上阵且已满：不允许（除非点到有人的格=换人）
  if (!alreadyOn && !occupant && Object.keys(formation).length >= MAX_PARTY_SIZE) {
    return state;
  }

  if (occupant && occupant !== templateId) {
    const occ = getTemplate(occupant);
    if (occ?.isHero) return state;
    if (prev != null) formation[occupant] = prev;
    else delete formation[occupant];
  }
  formation[templateId] = slot;
  return { ...state, formation: normalizeFormation(formation) };
}

/** 下阵（主角不可下） */
export function benchUnit(state: PlayerState, templateId: string): PlayerState {
  const t = getTemplate(templateId);
  if (!t || t.isHero) return state;
  if (state.formation[templateId] == null) return state;
  const formation = { ...state.formation };
  delete formation[templateId];
  return { ...state, formation: normalizeFormation(formation) };
}
