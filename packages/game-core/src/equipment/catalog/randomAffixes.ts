import type { AffixDef } from '../../shared/types.js';

const MAIN: AffixDef[] = [
  { id: 'atk', name: '攻击', stat: 'atk', min: 3, max: 12, weight: 10 },
  { id: 'def', name: '防御', stat: 'def', min: 3, max: 10, weight: 10 },
  { id: 'res', name: '抗性', stat: 'res', min: 3, max: 10, weight: 10 },
  { id: 'hp', name: '生命', stat: 'maxHp', min: 10, max: 40, weight: 10 },
  { id: 'spd', name: '速度', stat: 'spd', min: 1, max: 3, weight: 6 },
];

const SUB: AffixDef[] = [
  { id: 'critRating', name: '暴击', stat: 'critRating', min: 4, max: 14, weight: 6 },
  { id: 'critDmgRating', name: '暴伤', stat: 'critDmgRating', min: 4, max: 12, weight: 6 },
  { id: 'penRating', name: '穿透', stat: 'penRating', min: 4, max: 10, weight: 6 },
  { id: 'masteryRating', name: '精通', stat: 'masteryRating', min: 4, max: 10, weight: 6 },
  { id: 'tenacityRating', name: '坚韧', stat: 'tenacityRating', min: 4, max: 10, weight: 6 },
];

const byId = new Map<string, AffixDef>();
for (const d of [...MAIN, ...SUB]) byId.set(d.id, d);

export const SUBSTAT_IDS = SUB.map((d) => d.id);
export const OPEN_POOL_DEFS: AffixDef[] = [...MAIN, ...SUB];

export function getRandomAffixDef(id: string): AffixDef | undefined {
  return byId.get(id);
}

export function substatDefs(ids: string[]): AffixDef[] {
  return ids.map((id) => byId.get(id)).filter((d): d is AffixDef => Boolean(d));
}

export const AFFIX_DEFS: AffixDef[] = OPEN_POOL_DEFS;
