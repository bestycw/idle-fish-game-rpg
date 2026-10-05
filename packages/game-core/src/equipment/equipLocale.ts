import type { EquipSlot, Rarity, WorldPreset } from '../shared/types.js';
import { RARITY_LABELS_EQUIP } from './catalog/rarity.js';
import { SLOT_NAMES } from './catalog/slots.js';
import { getSetDef } from './sets.js';

type SlotTable = Record<EquipSlot, string>;
type RarityTable = Record<Rarity, string>;

const SLOT_NEUTRAL = SLOT_NAMES;

const SLOT_XIANXIA: SlotTable = {
  weapon: '法器',
  offhand: '灵盾',
  head: '冠',
  chest: '袍',
  hands: '护腕',
  feet: '履',
  legs: '裙',
  neck: '璎珞',
  ring1: '灵戒',
  ring2: '灵戒',
  trinket1: '佩',
  trinket2: '佩',
};

const SLOT_WUXIA: SlotTable = {
  weapon: '兵刃',
  offhand: '护符',
  head: '冠',
  chest: '衣',
  hands: '护腕',
  feet: '靴',
  legs: '裤',
  neck: '坠',
  ring1: '指环',
  ring2: '指环',
  trinket1: '饰物',
  trinket2: '饰物',
};

const SLOT_CYBER: SlotTable = {
  weapon: '主模块',
  offhand: '副模块',
  head: '神经罩',
  chest: '装甲',
  hands: '手套',
  feet: '推进',
  legs: '腿甲',
  neck: '接口',
  ring1: '芯片',
  ring2: '芯片',
  trinket1: '插件',
  trinket2: '插件',
};

const RARITY_NEUTRAL = RARITY_LABELS_EQUIP;

const RARITY_XIANXIA: RarityTable = {
  common: '凡品',
  uncommon: '精良',
  rare: '良品',
  epic: '珍品',
  legendary: '绝品',
};

const RARITY_WUXIA: RarityTable = { ...RARITY_XIANXIA };

const RARITY_CYBER: RarityTable = {
  common: '民用',
  uncommon: '改装',
  rare: '军用',
  epic: '精英',
  legendary: '原型',
};

const SET_SKIN: Record<WorldPreset, Record<string, string>> = {
  xianxia: {
    set_pojun: '破军',
    set_tiebi: '铁壁',
    set_jishi: '济世',
  },
  wuxia: {
    set_pojun: '破军',
    set_tiebi: '铁壁',
    set_jishi: '济世',
  },
  cyberpunk: {
    set_pojun: '突击协议',
    set_tiebi: '堡垒协议',
    set_jishi: '续行协议',
  },
};

const SLOT_BY_PRESET: Record<WorldPreset, SlotTable> = {
  xianxia: SLOT_XIANXIA,
  wuxia: SLOT_WUXIA,
  cyberpunk: SLOT_CYBER,
};

const RARITY_BY_PRESET: Record<WorldPreset, RarityTable> = {
  xianxia: RARITY_XIANXIA,
  wuxia: RARITY_WUXIA,
  cyberpunk: RARITY_CYBER,
};

export function tEquipSlot(slot: EquipSlot, preset: WorldPreset = 'xianxia'): string {
  const table = SLOT_BY_PRESET[preset] ?? SLOT_XIANXIA;
  return table[slot] ?? SLOT_NEUTRAL[slot] ?? slot;
}

export function tRarityEquip(rarity: Rarity, preset: WorldPreset = 'xianxia'): string {
  const table = RARITY_BY_PRESET[preset] ?? RARITY_XIANXIA;
  return table[rarity] ?? RARITY_NEUTRAL[rarity] ?? rarity;
}

export function tSetName(setId: string, preset: WorldPreset = 'xianxia'): string {
  const skin = SET_SKIN[preset]?.[setId];
  if (skin) return skin;
  return getSetDef(setId)?.name ?? setId;
}
