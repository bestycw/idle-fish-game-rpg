import type { AffixDef, StatKey } from '../../shared/types.js';

const DEFS: AffixDef[] = [
  { id: 'block', name: '格挡', stat: 'block', min: 2, max: 6, weight: 3 },
  { id: 'dodge', name: '闪避', stat: 'dodge', min: 2, max: 6, weight: 3 },
  { id: 'lifesteal', name: '吸血', stat: 'lifesteal', min: 2, max: 5, weight: 3 },
  { id: 'echo', name: '回响', stat: 'echo', min: 2, max: 5, weight: 3 },
  { id: 'qiSiphon', name: '锁息', stat: 'qiSiphon', min: 1, max: 2, weight: 3 },
  { id: 'critResist', name: '抗暴', stat: 'critResist', min: 2, max: 6, weight: 2 },
  { id: 'counter', name: '反击', stat: 'counter', min: 2, max: 5, weight: 2 },
  { id: 'qiRefund', name: '回元', stat: 'qiRefund', min: 1, max: 2, weight: 2 },
  { id: 'fortuneRating', name: '气运', stat: 'fortuneRating', min: 2, max: 6, weight: 1 },
];

const byId = new Map(DEFS.map((d) => [d.id, d]));

export const RARE_AFFIX_DEFS: AffixDef[] = DEFS;

export const PERCENT_RARE_STATS: StatKey[] = [
  'dodge',
  'block',
  'lifesteal',
  'critResist',
  'counter',
  'echo',
];

export const FLAT_RARE_STATS: StatKey[] = ['qiSiphon', 'qiRefund', 'fortuneRating'];

export function getRareAffixDef(id: string): AffixDef | undefined {
  return byId.get(id);
}

export function isPercentRare(stat: StatKey): boolean {
  return PERCENT_RARE_STATS.includes(stat);
}
