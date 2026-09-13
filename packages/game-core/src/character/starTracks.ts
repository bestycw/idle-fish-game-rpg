/**
 * 角色升星轨（数据轨 ★1–★6）。新卡：registerStarTrack 或往 STAR_OVERRIDES 加一行。
 * 缺省按职能走 ROLE_STAR_LADDERS（每星：底子 + 定位被动）。
 * 可玩上限按品级：凡★3 / 良★4 / 珍★5 / 绝★6（见 maxStarForRarity）。
 */
import type { Rarity } from '../shared/types.js';
import { isStatOnlyEffects, playablePassives } from './abilityAtoms.js';
import { DEEP_STAR_OVERRIDES } from './deepKits.js';
import { LORE_STAR_OVERRIDES } from './roster/loreTracks.js';
import { roleStarNode, ROLE_STAR_LADDERS } from './roleStarTracks.js';
import type { StarBranchDef, StarNodeDef } from './starTypes.js';
import { getTemplate } from './templates.js';

/** ★3 选定技能分支；★6 沿这条锁定 */
export const IDENTITY_PICK_STAR = 3;
export const IDENTITY_CLIMAX_STAR = 6;

export type IdentityTrack = {
  id: string;
  label: string;
  star3: StarBranchDef;
  star6?: StarBranchDef;
};

/** 分支短名：济世；旧卡从「七进七出·突阵」取末段 */
export function branchShortLabel(
  branch: Pick<StarBranchDef, 'label' | 'identityLabel'>,
): string {
  if (branch.identityLabel) return branch.identityLabel;
  const idx = branch.label.lastIndexOf('·');
  if (idx >= 0 && idx < branch.label.length - 1) {
    return branch.label.slice(idx + 1);
  }
  return branch.label;
}

/** ★3 / ★6 按序号配成两条技能分支（旧卡 id 可不相同） */
export function listIdentityTracks(templateId: string): IdentityTrack[] {
  const pick = getStarBranches(templateId, IDENTITY_PICK_STAR);
  const climax = getStarBranches(templateId, IDENTITY_CLIMAX_STAR);
  if (pick.length < 2) return [];
  return pick.map((star3, i) => ({
    id: star3.id,
    label: branchShortLabel(star3),
    star3,
    star6: climax[i],
  }));
}

export function identityChoice(
  templateId: string,
  starBranch?: Record<number, string>,
): string | undefined {
  const tracks = listIdentityTracks(templateId);
  if (!tracks.length) return starBranch?.[IDENTITY_PICK_STAR] ?? starBranch?.[IDENTITY_CLIMAX_STAR];
  const pick = starBranch?.[IDENTITY_PICK_STAR];
  if (pick && tracks.some((t) => t.id === pick)) return pick;
  const climaxId = starBranch?.[IDENTITY_CLIMAX_STAR];
  if (climaxId) {
    const hit = tracks.find((t) => t.star6?.id === climaxId || t.id === climaxId);
    if (hit) return hit.id;
  }
  return undefined;
}

export function climaxBranchId(
  templateId: string,
  identityId: string | undefined,
): string | undefined {
  if (!identityId) return undefined;
  const track = listIdentityTracks(templateId).find((t) => t.id === identityId);
  return track?.star6?.id ?? identityId;
}

/** 无职能时的回落（= 全能轨） */
export const SHARED_STAR_NODES: StarNodeDef[] = ROLE_STAR_LADDERS.flex;

/** 星章数据轨长度（绝品满星）；具体卡可玩上限见 maxStarForRarity */
export const MAX_STAR = Math.max(...SHARED_STAR_NODES.map((n) => n.star));

/** 品级 → 可升星上限（拍板：凡3 / 良4 / 珍5 / 绝6） */
export const MAX_STAR_BY_RARITY: Record<Rarity, number> = {
  common: 3,
  uncommon: 3,
  rare: 4,
  epic: 5,
  legendary: 6,
};

export function maxStarForRarity(rarity: Rarity): number {
  return MAX_STAR_BY_RARITY[rarity] ?? MAX_STAR;
}

/** 每卡完整个性轨：深做见 deepKits；未升格扩展卡回落职能轨 */
export const STAR_OVERRIDES: Record<string, Partial<Record<number, StarNodeDef>>> = {
  ...LORE_STAR_OVERRIDES,
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
  const role = getTemplate(templateId)?.role ?? 'flex';
  const shared = roleStarNode(role, star) ?? SHARED_STAR_NODES.find((n) => n.star === star);
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
    if (shared && !node.branches && isStatOnlyEffects(node.effects)) {
      const extras = playablePassives(shared.effects);
      const hasMain = node.effects.some((e) => e.kind === 'stat_pct');
      const mains = hasMain
        ? []
        : shared.effects.filter((e) => e.kind === 'stat_pct').map((e) => structuredClone(e));
      if (extras.length || mains.length) {
        node = { ...node, effects: [...mains, ...node.effects, ...extras] };
      }
    }
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

/** 仅 ★3 需要玩家选定分支；★6 跟跑 */
export function isBranchStar(templateId: string, star: number): boolean {
  if (star !== IDENTITY_PICK_STAR) return false;
  return getStarBranches(templateId, star).length >= 2;
}

/** 获取岔路星的可选分支（若无岔路返回空数组） */
export function getStarBranches(
  templateId: string,
  star: number,
): StarBranchDef[] {
  return STAR_OVERRIDES[templateId]?.[star]?.branches ?? [];
}

export function branchChoiceForStar(
  templateId: string,
  star: number,
  starBranch?: Record<number, string>,
): string | undefined {
  if (star === IDENTITY_CLIMAX_STAR && listIdentityTracks(templateId).length >= 2) {
    return climaxBranchId(templateId, identityChoice(templateId, starBranch));
  }
  return starBranch?.[star];
}

export function unlockedStarNodes(
  templateId: string,
  star: number,
  starBranch?: Record<number, string>,
): StarNodeDef[] {
  const nodes: StarNodeDef[] = [];
  for (let s = 1; s <= star; s += 1) {
    const n = resolveStarNode(templateId, s, branchChoiceForStar(templateId, s, starBranch));
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
