import { GEM_DEFS } from '../equipment/gems.js';
import { MORPH_STONE_DEFS } from '../equipment/morphs.js';
import type { WorldPreset } from '../shared/types.js';

export type ItemKind =
  | 'currency'
  | 'material'
  | 'gem'
  | 'ticket'
  | 'consumable'
  | 'quest'
  | 'cosmetic';

export type ItemCategory =
  | 'currency'
  | 'equip_upgrade'
  | 'equip_craft'
  | 'character_growth'
  | 'gacha'
  | 'consumable'
  | 'lifestyle'
  | 'quest'
  | 'dungeon_key'
  | 'cosmetic';

export type ItemStorage =
  | { type: 'gold' }
  | { type: 'currency'; key: string }
  | { type: 'enhance_stones' }
  | { type: 'reroll_dust' }
  | { type: 'gem'; gemId: string }
  | { type: 'morph_stone' }
  | { type: 'character_exp' }
  | { type: 'materials' };

export interface ItemDef {
  id: string;
  kind: ItemKind;
  categories: ItemCategory[];
  stackable: boolean;
  enabled: boolean;
  storage: ItemStorage;
  tags?: ('trade_ban' | 'show_in_codex' | 'discard_ban')[];
}

function def(
  id: string,
  kind: ItemKind,
  categories: ItemCategory[],
  storage: ItemStorage,
  enabled: boolean,
  tags?: ItemDef['tags'],
): ItemDef {
  return { id, kind, categories, stackable: true, enabled, storage, tags };
}

const LIVE_CURRENCY: ItemDef[] = [
  def('gold', 'currency', ['currency'], { type: 'gold' }, true),
  def('stardust', 'currency', ['currency', 'gacha'], { type: 'currency', key: 'stardust' }, true),
  def('xiuwei', 'currency', ['currency', 'character_growth'], { type: 'currency', key: 'xiuwei' }, true),
  def('ticket', 'ticket', ['currency', 'gacha'], { type: 'currency', key: 'ticket' }, true),
];

const LIVE_MATERIALS: ItemDef[] = [
  def('enhance_stone', 'material', ['equip_upgrade'], { type: 'enhance_stones' }, true),
  def('reroll_dust', 'material', ['equip_upgrade'], { type: 'reroll_dust' }, true),
];

const LIVE_GEMS: ItemDef[] = GEM_DEFS.map((g) =>
  def(g.id, 'gem', ['equip_upgrade'], { type: 'gem', gemId: g.id }, true),
);

const LIVE_MORPH: ItemDef[] = MORPH_STONE_DEFS.map((m) =>
  def(m.id, 'material', ['equip_upgrade', 'character_growth'], { type: 'morph_stone' }, true, [
    'show_in_codex',
  ]),
);

const LIVE_OTHER: ItemDef[] = [
  def('character_exp', 'material', ['character_growth'], { type: 'character_exp' }, true),
];

/** 未开放玩法：id 占位，enabled false */
const PLANNED_CONSUMABLES: ItemDef[] = [
  def('cons_battle_rations', 'consumable', ['consumable'], { type: 'materials' }, false),
  def('cons_stamina_elixir', 'consumable', ['consumable'], { type: 'materials' }, false),
  def('cons_encounter_charm', 'consumable', ['consumable'], { type: 'materials' }, false),
  def('cons_potion_atk_small', 'consumable', ['consumable', 'lifestyle'], { type: 'materials' }, false),
];

const PLANNED_LIFESTYLE: ItemDef[] = [
  def('mat_herb_mist', 'material', ['lifestyle'], { type: 'materials' }, false),
  def('mat_herb_fire', 'material', ['lifestyle'], { type: 'materials' }, false),
  def('mat_ore_iron', 'material', ['lifestyle', 'equip_craft'], { type: 'materials' }, false),
  def('mat_ore_spirit', 'material', ['lifestyle', 'equip_craft'], { type: 'materials' }, false),
  def('mat_refined_spirit_ingot', 'material', ['lifestyle', 'equip_craft'], { type: 'materials' }, false),
  def('craft_kit_set_pojun', 'material', ['equip_craft'], { type: 'materials' }, false),
];

const PLANNED_QUEST: ItemDef[] = [
  def('breakthrough_token', 'material', ['character_growth'], { type: 'materials' }, false),
  def('quest_token_placeholder', 'quest', ['quest'], { type: 'materials' }, false, [
    'trade_ban',
    'discard_ban',
  ]),
];

export const ITEM_REGISTRY: Record<string, ItemDef> = Object.fromEntries(
  [
    ...LIVE_CURRENCY,
    ...LIVE_MATERIALS,
    ...LIVE_GEMS,
    ...LIVE_MORPH,
    ...LIVE_OTHER,
    ...PLANNED_CONSUMABLES,
    ...PLANNED_LIFESTYLE,
    ...PLANNED_QUEST,
  ].map((d) => [d.id, d]),
);

export function getItemDef(itemId: string): ItemDef | undefined {
  return ITEM_REGISTRY[itemId];
}

export function listItemDefs(opts?: { enabledOnly?: boolean }): ItemDef[] {
  const all = Object.values(ITEM_REGISTRY);
  if (opts?.enabledOnly) return all.filter((d) => d.enabled);
  return all;
}

/** BattleSettlement 字段 → 主表 itemId */
export const SETTLEMENT_FIELD_TO_ITEM_ID: Record<string, string> = {
  gold: 'gold',
  stardust: 'stardust',
  xiuwei: 'xiuwei',
  ticket: 'ticket',
  enhanceStones: 'enhance_stone',
};

export function resolveWorldPreset(state?: {
  narrative?: { worldPreset?: WorldPreset };
} | null): WorldPreset {
  return state?.narrative?.worldPreset ?? 'xianxia';
}
