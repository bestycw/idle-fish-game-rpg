/**
 * 破境被动表（扩展口）。
 * 全局每境一行；个性用 BREAKTHROUGH_OVERRIDES[templateId][tier]。
 */
import type { StarNodeEffect } from './starTypes.js';

export interface BreakthroughPerkDef {
  tier: number;
  label: string;
  effects: StarNodeEffect[];
}

/** 全局破境被动（tier 升到该档时解锁，累计生效） */
export const BREAKTHROUGH_PERKS: BreakthroughPerkDef[] = [
  {
    tier: 1,
    label: '筑基·通脉',
    effects: [{ kind: 'rating', stat: 'masteryRating', value: 8 }],
  },
  {
    tier: 2,
    label: '金丹·锋芒',
    effects: [{ kind: 'rating', stat: 'finalDmgRating', value: 6 }],
  },
  {
    tier: 3,
    label: '元婴·凝神',
    effects: [
      { kind: 'rating', stat: 'versRating', value: 8 },
      { kind: 'rare_stat', stat: 'block', value: 0.02 },
    ],
  },
  {
    tier: 4,
    label: '化神·破妄',
    effects: [
      { kind: 'rating', stat: 'critRating', value: 10 },
      { kind: 'skill_mult', delta: 0.08 },
    ],
  },
];

/** 角色个性破境（与全局叠加） */
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
    2: {
      tier: 2,
      label: '金丹·龙胆魄',
      effects: [{ kind: 'rating', stat: 'critDmgRating', value: 8 }],
    },
  },
  huatuo: {
    1: {
      tier: 1,
      label: '筑基·青囊诀',
      effects: [{ kind: 'skill_mult', delta: 0.1 }],
    },
  },
  heracles: {
    2: {
      tier: 2,
      label: '金丹·狮心',
      effects: [{ kind: 'rare_stat', stat: 'block', value: 0.04 }],
    },
  },
  zhuge: {
    2: {
      tier: 2,
      label: '金丹·星落',
      effects: [{ kind: 'status_boost', valueMult: 0.92 }],
    },
  },
  athena: {
    1: {
      tier: 1,
      label: '筑基·神盾',
      effects: [{ kind: 'skill_mult', delta: 0.08 }],
    },
  },
  // +10 批次个性破境挂在同表
  guanyu: {
    1: {
      tier: 1,
      label: '筑基·义贯',
      effects: [{ kind: 'rating', stat: 'finalDmgRating', value: 5 }],
    },
  },
  lvbu: {
    2: {
      tier: 2,
      label: '金丹·无双',
      effects: [{ kind: 'rating', stat: 'critRating', value: 8 }],
    },
  },
  nezha: {
    1: {
      tier: 1,
      label: '筑基·莲心',
      effects: [{ kind: 'rating', stat: 'hasteRating', value: 8 }],
    },
  },
  xishi: {
    1: {
      tier: 1,
      label: '筑基·沉鱼',
      effects: [{ kind: 'status_boost', duration: 1 }],
    },
  },
  sunbin: {
    2: {
      tier: 2,
      label: '金丹·兵势',
      effects: [{ kind: 'status_boost', valueMult: 0.92 }],
    },
  },
  beowulf: {
    1: {
      tier: 1,
      label: '筑基·熊力',
      effects: [{ kind: 'skill_mult', delta: 0.08 }],
    },
  },
};

export function listBreakthroughPerks(
  templateId: string,
  tier: number,
): BreakthroughPerkDef[] {
  const out: BreakthroughPerkDef[] = [];
  for (let t = 1; t <= tier; t += 1) {
    const global = BREAKTHROUGH_PERKS.find((p) => p.tier === t);
    const ov = BREAKTHROUGH_OVERRIDES[templateId]?.[t];
    if (global) out.push(global);
    if (ov) out.push(ov);
  }
  return out;
}

export function nextBreakthroughPerk(
  templateId: string,
  currentTier: number,
): BreakthroughPerkDef | undefined {
  const next = currentTier + 1;
  return (
    BREAKTHROUGH_OVERRIDES[templateId]?.[next] ??
    BREAKTHROUGH_PERKS.find((p) => p.tier === next)
  );
}
