/**
 * T4 形态石系统（独立道具，绑角色）。
 * 每角色最多绑 1 个。可替换（旧的返还）。
 */
import type { SkillModifier } from '../character/skillCompose.js';
import type { PlayerState } from '../shared/types.js';

export interface MorphStoneDef {
  id: string;
  name: string;
  description: string;
}

/** T4 形态石池（8 种） */
export const MORPH_STONE_DEFS: MorphStoneDef[] = [
  { id: 'morph_bleed_edge', name: '血刃', description: '技能附带1层流血' },
  { id: 'morph_frost_touch', name: '寒霜触', description: '技能附带迟缓1回合' },
  { id: 'morph_life_drain', name: '汲命', description: '技能伤害15%转回血' },
  { id: 'morph_shield_break', name: '破盾', description: '对有盾目标+40%伤害' },
  { id: 'morph_chain', name: '连锁', description: '击杀后追击相邻50%' },
  { id: 'morph_guard_up', name: '坚壁', description: '技能后1回合减伤20%' },
  { id: 'morph_echo_strike', name: '回音击', description: '技能25%再触发(40%伤害,3回合CD)' },
  { id: 'morph_cleanse_heal', name: '净化之愈', description: '治疗时清1个debuff' },
];

export const MORPH_DEFS: Record<string, MorphStoneDef> = Object.fromEntries(
  MORPH_STONE_DEFS.map((d) => [d.id, d]),
);

/** 给角色绑定形态石，旧的返还 morphStones 背包 */
export function bindMorphStone(
  state: PlayerState,
  templateId: string,
  morphId: string,
): { ok: boolean; state: PlayerState; message: string } {
  const stones = [...(state.morphStones ?? [])];
  const idx = stones.indexOf(morphId);
  if (idx < 0) return { ok: false, state, message: '背包中无此形态石' };

  const morphs = { ...(state.characterMorphs ?? {}) };
  const oldMorph = morphs[templateId];

  // Remove from backpack
  stones.splice(idx, 1);
  // Return old if any
  if (oldMorph) stones.push(oldMorph);
  morphs[templateId] = morphId;

  return {
    ok: true,
    state: { ...state, morphStones: stones, characterMorphs: morphs },
    message: `绑定成功：${MORPH_DEFS[morphId]?.name ?? morphId}`,
  };
}

/** Get skill modifiers from character's morph stone */
export function listEquipmentSkillModifiers(state: PlayerState, templateId?: string): SkillModifier[] {
  if (!templateId) return [];
  const morphId = state.characterMorphs?.[templateId];
  if (!morphId) return [];
  const def = MORPH_DEFS[morphId];
  if (!def) return [];

  // Convert morph to a skill modifier
  const mod: SkillModifier = {
    source: 'equipment',
    label: `形态·${def.name}`,
    morphId: def.id,
    multiplierDelta: 0.05,
  };

  // Add status patches based on morph type
  if (morphId === 'morph_bleed_edge') {
    mod.statusPatches = [{ statusId: 'bleed', duration: 2, layers: 1 }];
  } else if (morphId === 'morph_frost_touch') {
    mod.statusPatches = [{ statusId: 'slow', duration: 1 }];
  }

  return [mod];
}

/** @deprecated Legacy compat - returns empty */
export function pickActiveMorph(_state: PlayerState): undefined {
  return undefined;
}

/** @deprecated Legacy compat */
export function withMorph(item: any, _morphId?: string): any {
  return item;
}
