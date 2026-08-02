/**
 * 装备形态特技 → SkillModifier（装核挂钩）。
 * V1：示范 1 条；每人同时仅 1 条攻击形态（共用衣柜）。
 */
import type { SkillModifier } from '../character/skillCompose.js';
import type { Equipment, EquipSlot, PlayerState } from '../shared/types.js';

export interface MorphDef {
  id: string;
  name: string;
  /** 越大越优先；套装预留 > 武器 > 饰品 */
  priority: number;
  slots: EquipSlot[];
  toModifier(): SkillModifier;
}

/** 示范：血刃 — 技能附带/加深流血 */
export const MORPH_BLEED_EDGE: MorphDef = {
  id: 'morph_bleed_edge',
  name: '血刃',
  priority: 50,
  slots: ['mainHand', 'offHand', 'neck', 'finger1', 'finger2', 'trinket1', 'trinket2'],
  toModifier() {
    return {
      source: 'equipment',
      label: `形态·${this.name}`,
      morphId: this.id,
      multiplierDelta: 0.05,
      statusPatches: [{ statusId: 'bleed', duration: 2, layers: 1 }],
    };
  },
};

export const MORPH_DEFS: Record<string, MorphDef> = {
  [MORPH_BLEED_EDGE.id]: MORPH_BLEED_EDGE,
};

const SLOT_PRIORITY: Partial<Record<EquipSlot, number>> = {
  mainHand: 30,
  offHand: 20,
  neck: 10,
  finger1: 8,
  finger2: 8,
  trinket1: 6,
  trinket2: 6,
};

function equippedItems(state: PlayerState): Equipment[] {
  const items: Equipment[] = [];
  for (const slot of Object.keys(state.equipped) as EquipSlot[]) {
    const id = state.equipped[slot];
    if (!id) continue;
    const item = state.inventory.find((e) => e.id === id);
    if (item) items.push(item);
  }
  return items;
}

/** 解析当前生效的 1 条形态（优先级：morph.priority + 槽位） */
export function pickActiveMorph(state: PlayerState): MorphDef | undefined {
  let best: { morph: MorphDef; score: number } | undefined;
  for (const item of equippedItems(state)) {
    if (!item.morphId) continue;
    const morph = MORPH_DEFS[item.morphId];
    if (!morph) continue;
    if (morph.slots.length && !morph.slots.includes(item.slot)) continue;
    const score = morph.priority + (SLOT_PRIORITY[item.slot] ?? 0);
    if (!best || score > best.score) best = { morph, score };
  }
  return best?.morph;
}

export function listEquipmentSkillModifiers(state: PlayerState): SkillModifier[] {
  const morph = pickActiveMorph(state);
  return morph ? [morph.toModifier()] : [];
}

/** 测试/调试：给装备挂示范形态 */
export function withMorph(item: Equipment, morphId: string = MORPH_BLEED_EDGE.id): Equipment {
  return { ...item, morphId };
}
