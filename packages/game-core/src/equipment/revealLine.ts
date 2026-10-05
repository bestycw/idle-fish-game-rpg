import { RARITY_LABELS_EQUIP } from './catalog/rarity.js';
import { getT3Def } from './catalog/t3.js';
import { getSetDef } from './sets.js';
import type { Equipment } from '../shared/types.js';

/** 结算「鉴定」一行文案（纯展示，不改数值） */
export function equipmentRevealLine(item: Equipment): string {
  const grade = RARITY_LABELS_EQUIP[item.rarity];
  const parts = [`器纹渐明——${grade}·${item.name}`];
  if (item.effectAffixId) {
    const t3 = getT3Def(item.effectAffixId);
    if (t3?.name) parts.push(`铭刻「${t3.name}」`);
  }
  if (item.setId) {
    const set = getSetDef(item.setId);
    if (set?.name) parts.push(`偶得${set.name}纹`);
  }
  return `${parts.join('，')}。`;
}
