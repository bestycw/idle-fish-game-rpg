/**
 * 破境：职能肉身轨 + 深做卡个性替换（不叠加全员表）。
 * 升星改招式；破境只给评级 / 稀有属性。
 */
import { getTemplate } from './templates.js';
import {
  ROLE_BREAKTHROUGH_LADDERS,
  roleBreakthroughPerk,
  type BreakthroughPerkDef,
} from './roleBreakthroughTracks.js';

export type { BreakthroughPerkDef };
export { ROLE_BREAKTHROUGH_LADDERS, roleBreakthroughPerk };

/** 角色个性破境：替换该境的职能轨，不与职能轨叠两条 */
export const BREAKTHROUGH_OVERRIDES: Record<
  string,
  Partial<Record<number, BreakthroughPerkDef>>
> = {
  zhangfei: {
    1: {
      tier: 1,
      label: '筑基·虎侯骨',
      effects: [{ kind: 'rare_stat', stat: 'block', value: 0.03 }],
    },
  },
  zhaoyun: {
    4: {
      tier: 4,
      label: '金丹·龙胆魄',
      effects: [{ kind: 'rating', stat: 'critDmgRating', value: 8 }],
    },
  },
  huatuo: {
    1: {
      tier: 1,
      label: '筑基·青囊诀',
      effects: [{ kind: 'rating', stat: 'masteryRating', value: 10 }],
    },
  },
  heracles: {
    4: {
      tier: 4,
      label: '金丹·狮心',
      effects: [{ kind: 'rare_stat', stat: 'block', value: 0.04 }],
    },
  },
  zhuge: {
    4: {
      tier: 4,
      label: '金丹·星落',
      effects: [{ kind: 'rating', stat: 'masteryRating', value: 10 }],
    },
  },
  athena: {
    1: {
      tier: 1,
      label: '筑基·神盾',
      effects: [{ kind: 'rare_stat', stat: 'block', value: 0.04 }],
    },
  },
  wukong: {
    6: {
      tier: 6,
      label: '化神·金睛',
      effects: [{ kind: 'rating', stat: 'critRating', value: 10 }],
    },
  },
  guanyu: {
    1: {
      tier: 1,
      label: '筑基·义贯',
      effects: [{ kind: 'rating', stat: 'penRating', value: 8 }],
    },
  },
  lvbu: {
    4: {
      tier: 4,
      label: '金丹·无双',
      effects: [{ kind: 'rating', stat: 'critRating', value: 10 }],
    },
  },
  nezha: {
    1: {
      tier: 1,
      label: '筑基·莲心',
      effects: [{ kind: 'rating', stat: 'penRating', value: 8 }],
    },
  },
  xishi: {
    1: {
      tier: 1,
      label: '筑基·沉鱼',
      effects: [{ kind: 'rating', stat: 'fortuneRating', value: 10 }],
    },
  },
  robin: {
    1: {
      tier: 1,
      label: '筑基·绿林',
      effects: [{ kind: 'rating', stat: 'critRating', value: 8 }],
    },
  },
  change: {
    1: {
      tier: 1,
      label: '筑基·月华',
      effects: [{ kind: 'rating', stat: 'fortuneRating', value: 10 }],
    },
  },
  sunbin: {
    4: {
      tier: 4,
      label: '金丹·兵势',
      effects: [{ kind: 'rating', stat: 'masteryRating', value: 10 }],
    },
  },
  beowulf: {
    1: {
      tier: 1,
      label: '筑基·熊力',
      effects: [{ kind: 'rating', stat: 'tenacityRating', value: 10 }],
    },
  },
  dianwei: {
    5: {
      tier: 5,
      label: '元婴·恶来',
      effects: [{ kind: 'rare_stat', stat: 'resilience', value: 0.1 }],
    },
  },
  yangjian: {
    6: {
      tier: 6,
      label: '化神·天眼',
      effects: [{ kind: 'rating', stat: 'critRating', value: 8 }, { kind: 'rating', stat: 'penRating', value: 6 }],
    },
  },
  zhouyu: {
    4: {
      tier: 4,
      label: '金丹·火攻',
      effects: [{ kind: 'rating', stat: 'masteryRating', value: 10 }],
    },
  },
  xiangyu: {
    4: {
      tier: 4,
      label: '金丹·霸王',
      effects: [{ kind: 'rating', stat: 'critRating', value: 10 }],
    },
  },
  nuwa: {
    1: {
      tier: 1,
      label: '筑基·补天',
      effects: [{ kind: 'rating', stat: 'masteryRating', value: 10 }],
    },
  },
  hades: {
    4: {
      tier: 4,
      label: '金丹·冥冠',
      effects: [{ kind: 'rating', stat: 'fortuneRating', value: 10 }],
    },
  },
  zeus: {
    6: {
      tier: 6,
      label: '化神·雷座',
      effects: [{ kind: 'rating', stat: 'critRating', value: 10 }],
    },
  },
  odin: {
    4: {
      tier: 4,
      label: '金丹·卢恩',
      effects: [{ kind: 'rating', stat: 'fortuneRating', value: 10 }],
    },
  },
  yuefei: {
    4: {
      tier: 4,
      label: '金丹·精忠',
      effects: [{ kind: 'rating', stat: 'penRating', value: 8 }],
    },
  },
  jiangziya: {
    4: {
      tier: 4,
      label: '金丹·封神',
      effects: [{ kind: 'rating', stat: 'masteryRating', value: 10 }],
    },
  },
};

function resolvePerk(templateId: string, t: number): BreakthroughPerkDef | undefined {
  const ov = BREAKTHROUGH_OVERRIDES[templateId]?.[t];
  if (ov) return ov;
  const role = getTemplate(templateId)?.role ?? 'flex';
  return roleBreakthroughPerk(role, t);
}

export function listBreakthroughPerks(
  templateId: string,
  tier: number,
): BreakthroughPerkDef[] {
  const out: BreakthroughPerkDef[] = [];
  for (let t = 1; t <= tier; t += 1) {
    const perk = resolvePerk(templateId, t);
    if (perk) out.push(perk);
  }
  return out;
}

export function listNextBreakthroughPerks(
  templateId: string,
  currentTier: number,
): BreakthroughPerkDef[] {
  const perk = resolvePerk(templateId, currentTier + 1);
  return perk ? [perk] : [];
}

export function nextBreakthroughPerk(
  templateId: string,
  currentTier: number,
): BreakthroughPerkDef | undefined {
  return listNextBreakthroughPerks(templateId, currentTier)[0];
}
