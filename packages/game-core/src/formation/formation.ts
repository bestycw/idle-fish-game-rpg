import { createUnitFromTemplate } from '../character/factory.js';
import { isOwned } from '../character/growth.js';
import { UNIT_TEMPLATES, getTemplate } from '../character/templates.js';
import { applyBonusesToUnit, sumEquipmentBonuses } from '../equipment/equipment.js';
import { getChainBonus, getTeamChainBonus } from '../equipment/enhance.js';
import { listEquipmentSkillModifiers } from '../equipment/morphs.js';
import { MAX_PARTY_SIZE, type GridSlot, type PlayerState, type UnitRuntime } from '../shared/types.js';

/** 默认上阵 5：主角 / 张飞 / 赵云 / 孙悟空 / 华佗 */
export const DEFAULT_DEPLOYED_IDS = [
  'hero',
  'zhangfei',
  'zhaoyun',
  'wukong',
  'huatuo',
] as const;

export function defaultFormation(): Partial<Record<string, GridSlot>> {
  const formation: Partial<Record<string, GridSlot>> = {};
  for (const id of DEFAULT_DEPLOYED_IDS) {
    const t = UNIT_TEMPLATES.find((u) => u.id === id);
    if (t) formation[t.id] = t.preferredSlot;
  }
  return normalizeFormation(formation);
}

export function normalizeFormation(
  formation: Partial<Record<string, GridSlot>>,
): Partial<Record<string, GridSlot>> {
  const used = new Set<GridSlot>();
  const result: Partial<Record<string, GridSlot>> = {};
  // 主角优先保留，其余按模板表顺序；超出 MAX_PARTY_SIZE 的下阵
  const ordered = [
    ...UNIT_TEMPLATES.filter((t) => t.isHero && formation[t.id] != null),
    ...UNIT_TEMPLATES.filter((t) => !t.isHero && formation[t.id] != null),
  ];

  for (const t of ordered) {
    if (Object.keys(result).length >= MAX_PARTY_SIZE) break;
    let slot = formation[t.id]!;
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

    // Collect T3 effect affix ids from per-character equipment
    const charEquip = state.characterEquip?.[t.id] ?? {};
    const effectIds: string[] = [];
    for (const itemId of Object.values(charEquip)) {
      if (!itemId) continue;
      const item = state.inventory.find((e) => e.id === itemId);
      if (item?.effectAffixId) effectIds.push(item.effectAffixId);
      if (item?.effectAffixId2) effectIds.push(item.effectAffixId2);
    }
    if (effectIds.length > 0) finalUnit.effectAffixIds = effectIds;

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
