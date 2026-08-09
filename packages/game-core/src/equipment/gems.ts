/**
 * 宝石定义（镶嵌用）。
 */
import type { StatKey } from '../shared/types.js';

export interface GemDef {
  id: string;
  name: string;
  stat: StatKey;
  value: number;
}

export const GEM_DEFS: GemDef[] = [
  { id: 'gem_atk', name: '力量石', stat: 'atk', value: 5 },
  { id: 'gem_def', name: '坚固石', stat: 'def', value: 4 },
  { id: 'gem_res', name: '灵护石', stat: 'res', value: 4 },
  { id: 'gem_hp', name: '生命石', stat: 'maxHp', value: 15 },
  { id: 'gem_crit', name: '锐利石', stat: 'critRating', value: 6 },
  { id: 'gem_pen', name: '穿透石', stat: 'penRating', value: 5 },
  { id: 'gem_mastery', name: '精通石', stat: 'masteryRating', value: 5 },
  { id: 'gem_tenacity', name: '坚韧石', stat: 'tenacityRating', value: 5 },
];

export function getGemDef(id: string): GemDef | undefined {
  return GEM_DEFS.find((g) => g.id === id);
}
