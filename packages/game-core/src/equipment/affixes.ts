import type { AffixDef } from '../shared/types.js';

export const AFFIX_DEFS: AffixDef[] = [
  { id: 'patk_s', name: '攻击', stat: 'physAtk', min: 2, max: 5 },
  { id: 'patk_m', name: '强攻', stat: 'physAtk', min: 4, max: 8 },
  { id: 'satk_s', name: '灵力', stat: 'spiritAtk', min: 2, max: 5 },
  { id: 'satk_m', name: '聚灵', stat: 'spiritAtk', min: 4, max: 8 },
  { id: 'pdef_s', name: '防御', stat: 'physDef', min: 2, max: 5 },
  { id: 'pdef_m', name: '坚防', stat: 'physDef', min: 4, max: 7 },
  { id: 'sdef_s', name: '灵防', stat: 'spiritDef', min: 2, max: 5 },
  { id: 'sdef_m', name: '御灵', stat: 'spiritDef', min: 4, max: 7 },
  { id: 'hp_s', name: '生命', stat: 'maxHp', min: 8, max: 16 },
  { id: 'hp_m', name: '厚血', stat: 'maxHp', min: 14, max: 28 },
  { id: 'spd_s', name: '速度', stat: 'spd', min: 1, max: 3 },
  { id: 'crit_s', name: '暴击', stat: 'critRating', min: 4, max: 8 },
  { id: 'crit_m', name: '会心', stat: 'critRating', min: 8, max: 14 },
  { id: 'cdmg_s', name: '暴伤', stat: 'critDmgRating', min: 6, max: 12 },
  { id: 'haste_s', name: '急速', stat: 'hasteRating', min: 4, max: 8 },
  { id: 'vers_s', name: '均衡', stat: 'versRating', min: 4, max: 8 },
  { id: 'mastery_s', name: '精通', stat: 'masteryRating', min: 4, max: 10 },
  { id: 'final_s', name: '终伤', stat: 'finalDmgRating', min: 3, max: 8 },
  { id: 'luck_s', name: '幸运', stat: 'fortune', min: 2, max: 6 },
  { id: 'dodge_s', name: '闪避', stat: 'dodge', min: 2, max: 5 },
  { id: 'dodge_m', name: '飘忽', stat: 'dodge', min: 4, max: 8 },
  { id: 'leech_s', name: '吸血', stat: 'lifesteal', min: 2, max: 5 },
  { id: 'leech_m', name: '噬血', stat: 'lifesteal', min: 4, max: 8 },
  { id: 'cresist_s', name: '抗暴', stat: 'critResist', min: 3, max: 7 },
  { id: 'cresist_m', name: '稳心', stat: 'critResist', min: 6, max: 12 },
  { id: 'block_s', name: '格挡', stat: 'block', min: 2, max: 6 },
  { id: 'block_m', name: '铁壁', stat: 'block', min: 5, max: 10 },
];

/**
 * 槽位词缀倾向（对齐 equipment.md）：权重越高越易滚到。
 * 未列出的词缀默认 weight=1。
 */
export const SLOT_AFFIX_BIAS: Partial<Record<string, Partial<Record<string, number>>>> = {
  mainHand: { patk_s: 3, patk_m: 3, satk_s: 2, satk_m: 2, crit_s: 3, crit_m: 2, cdmg_s: 3, final_s: 3 },
  offHand: { pdef_s: 3, pdef_m: 2, sdef_s: 2, vers_s: 3, block_s: 3, block_m: 2 },
  head: { hp_s: 3, hp_m: 2, mastery_s: 3, luck_s: 2 },
  shoulder: { vers_s: 3, pdef_s: 2, sdef_s: 2 },
  back: { vers_s: 3, dodge_s: 3, dodge_m: 2 },
  chest: { hp_s: 3, hp_m: 3, pdef_s: 3, pdef_m: 2, sdef_s: 2 },
  wrist: { crit_s: 3, crit_m: 2, haste_s: 3 },
  hands: { patk_s: 3, satk_s: 2, final_s: 3, crit_s: 2 },
  waist: { hp_s: 3, vers_s: 3, pdef_s: 2 },
  legs: { pdef_s: 3, pdef_m: 2, hp_s: 2, sdef_s: 2 },
  feet: { haste_s: 3, dodge_s: 3, spd_s: 2 },
  neck: { mastery_s: 3, final_s: 3, satk_s: 2 },
  finger1: { crit_s: 2, haste_s: 2, mastery_s: 2, luck_s: 2, leech_s: 2 },
  finger2: { crit_s: 2, haste_s: 2, mastery_s: 2, luck_s: 2, cresist_s: 2 },
  trinket1: { dodge_s: 2, dodge_m: 2, leech_s: 2, leech_m: 2, cresist_s: 2, block_s: 2, final_s: 2 },
  trinket2: { dodge_s: 2, leech_s: 2, cresist_m: 2, block_m: 2, mastery_s: 2, luck_s: 2 },
};

export const SLOT_NAMES: Record<string, string> = {
  mainHand: '主手',
  offHand: '副手',
  head: '头盔',
  shoulder: '护肩',
  back: '披风',
  chest: '胸甲',
  wrist: '护腕',
  hands: '手套',
  waist: '腰带',
  legs: '腿甲',
  feet: '靴子',
  neck: '项链',
  finger1: '戒指一',
  finger2: '戒指二',
  trinket1: '饰品一',
  trinket2: '饰品二',
};

/** 纸娃娃槽上短名 */
export const SLOT_SHORT_NAMES: Record<string, string> = {
  mainHand: '主',
  offHand: '副',
  head: '头',
  shoulder: '肩',
  back: '背',
  chest: '胸',
  wrist: '腕',
  hands: '手',
  waist: '腰',
  legs: '腿',
  feet: '鞋',
  neck: '链',
  finger1: '戒1',
  finger2: '戒2',
  trinket1: '饰1',
  trinket2: '饰2',
};
