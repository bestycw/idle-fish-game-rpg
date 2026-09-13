/**
 * 境界天梯：唯一数据源。
 * 只许往后 append，已有下标是存档身份（改名可以，换位不行）。
 * 等级上限随行写；漏写则按上一档 +8，方便以后只加名字。
 */

export type RealmDef = {
  label: string;
  levelCap?: number;
};

const DEFAULT_FIRST_CAP = 20;
const DEFAULT_CAP_STEP = 8;

export const REALM_LADDER: readonly RealmDef[] = [
  { label: '炼气', levelCap: 20 },
  { label: '筑基', levelCap: 24 },
  { label: '开光', levelCap: 28 },
  { label: '辟谷', levelCap: 32 },
  { label: '金丹', levelCap: 36 },
  { label: '元婴', levelCap: 40 },
  { label: '化神', levelCap: 46 },
  { label: '炼虚', levelCap: 52 },
  { label: '合体', levelCap: 58 },
  { label: '大乘', levelCap: 64 },
  { label: '渡劫', levelCap: 70 },
  { label: '散仙', levelCap: 76 },
  { label: '地仙', levelCap: 84 },
  { label: '天仙', levelCap: 92 },
  { label: '金仙', levelCap: 100 },
  { label: '太乙', levelCap: 108 },
  { label: '大罗', levelCap: 116 },
];

function resolveLevelCaps(ladder: readonly RealmDef[]): number[] {
  const caps: number[] = [];
  for (let i = 0; i < ladder.length; i += 1) {
    const prev = caps[i - 1] ?? DEFAULT_FIRST_CAP;
    caps.push(ladder[i]!.levelCap ?? prev + DEFAULT_CAP_STEP);
  }
  return caps;
}

export const BREAKTHROUGH_LABELS = REALM_LADDER.map((r) => r.label);

export const LEVEL_CAP_BY_TIER = resolveLevelCaps(REALM_LADDER);

export function maxRealmTier(): number {
  return REALM_LADDER.length - 1;
}

export function isMaxRealm(tier: number): boolean {
  return tier >= maxRealmTier();
}

export function clampRealmTier(tier: number): number {
  if (tier < 0) return 0;
  return Math.min(tier, maxRealmTier());
}

/** 旧 5 境存档 → 现行下标（炼气/筑基/金丹/元婴/化神） */
export const LEGACY_REALM_TIER_MAP = [0, 1, 4, 5, 6] as const;

export function migrateLegacyRealmTier(tier: number): number {
  if (tier < 0) return 0;
  if (tier <= 4) return LEGACY_REALM_TIER_MAP[tier] ?? tier;
  return clampRealmTier(tier);
}

export function breakthroughLabel(tier: number): string {
  return BREAKTHROUGH_LABELS[clampRealmTier(tier)] ?? `境界${tier}`;
}

export function nextBreakthroughLabel(tier: number): string | null {
  if (isMaxRealm(tier)) return null;
  return breakthroughLabel(tier + 1);
}
