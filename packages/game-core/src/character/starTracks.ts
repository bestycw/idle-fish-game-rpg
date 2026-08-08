/**
 * 角色升星轨（数据轨 ★1–★6）。新卡：registerStarTrack 或往 STAR_OVERRIDES 加一行。
 * 缺省回落 SHARED_STAR_NODES。
 * 可玩上限按品级：凡★3 / 良★4 / 珍★5 / 绝★6（见 maxStarForRarity）。
 */
import type { Rarity } from '../shared/types.js';
import { DEEP_STAR_OVERRIDES } from './deepKits.js';
import type { StarBranchDef, StarNodeDef } from './starTypes.js';

/** 共用缺省阶梯（无个性轨时） */
export const SHARED_STAR_NODES: StarNodeDef[] = [
  { star: 1, label: '主属性强化', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
  { star: 2, label: '吸血微光', effects: [{ kind: 'rare_stat', stat: 'lifesteal', value: 0.03 }] },
  {
    star: 3,
    label: '连击契机',
    effects: [{ kind: 'enable_follow_up', chance: 0.25, multiplier: 0.55 }],
  },
  { star: 4, label: '主属性强化', effects: [{ kind: 'stat_pct', mainPct: 0.04 }] },
  {
    star: 5,
    label: '连击强化',
    effects: [{ kind: 'enable_follow_up', chance: 0.35, multiplier: 0.7 }],
  },
  {
    star: 6,
    label: '锋芒圆满',
    effects: [
      { kind: 'stat_pct', mainPct: 0.05 },
      { kind: 'skill_mult', delta: 0.1 },
    ],
  },
];

/** 星章数据轨长度（绝品满星）；具体卡可玩上限见 maxStarForRarity */
export const MAX_STAR = Math.max(...SHARED_STAR_NODES.map((n) => n.star));

/** 品级 → 可升星上限（拍板：凡3 / 良4 / 珍5 / 绝6） */
export const MAX_STAR_BY_RARITY: Record<Rarity, number> = {
  common: 3,
  rare: 4,
  epic: 5,
  legendary: 6,
};

export function maxStarForRarity(rarity: Rarity): number {
  return MAX_STAR_BY_RARITY[rarity] ?? MAX_STAR;
}

/** 每卡完整个性轨：深做见 deepKits；暂缓卡回落 SHARED */
export const STAR_OVERRIDES: Record<string, Partial<Record<number, StarNodeDef>>> = {
  ...DEEP_STAR_OVERRIDES,
};

/**
 * 解析某星节点：个性轨优先；stack 时与共用轨叠加。
 * 岔路节点：按 branchChoice 返回选中支的 effects，合并节点基础 effects。
 * 未选/无分支：返回节点本体。
 */
export function resolveStarNode(
  templateId: string,
  star: number,
  branchChoice?: string,
): StarNodeDef | undefined {
  const shared = SHARED_STAR_NODES.find((n) => n.star === star);
  const override = STAR_OVERRIDES[templateId]?.[star];
  let node: StarNodeDef | undefined;
  if (!override) {
    node = shared;
  } else if (override.stack && shared) {
    node = {
      star,
      label: override.label,
      stack: true,
      effects: [...shared.effects, ...override.effects],
      branches: override.branches,
    };
  } else {
    node = override;
  }
  if (!node) return undefined;
  if (!node.branches || !branchChoice) return node;
  const branch = node.branches.find((b) => b.id === branchChoice);
  if (!branch) return node;
  return {
    star,
    label: branch.label,
    effects: [...node.effects, ...branch.effects],
  };
}

/** 岔路星是否需要玩家选择 */
export function isBranchStar(templateId: string, star: number): boolean {
  return getStarBranches(templateId, star).length >= 2;
}

/** 获取岔路星的可选分支（若无岔路返回空数组） */
export function getStarBranches(
  templateId: string,
  star: number,
): StarBranchDef[] {
  return STAR_OVERRIDES[templateId]?.[star]?.branches ?? [];
}

export function unlockedStarNodes(
  templateId: string,
  star: number,
  starBranch?: Record<number, string>,
): StarNodeDef[] {
  const nodes: StarNodeDef[] = [];
  for (let s = 1; s <= star; s += 1) {
    const n = resolveStarNode(templateId, s, starBranch?.[s]);
    if (n) nodes.push(n);
  }
  return nodes;
}

/** 运行时注册（测试/模组）；正式内容仍写 STAR_OVERRIDES */
export function registerStarTrack(
  templateId: string,
  nodes: Partial<Record<number, StarNodeDef>>,
): void {
  STAR_OVERRIDES[templateId] = { ...STAR_OVERRIDES[templateId], ...nodes };
}
