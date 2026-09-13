import { isContentUnlocked } from '../chapter/progress.js';
import { ensureRoster, getProgress, isOwned } from '../character/growth.js';
import { getTemplate, UNIT_TEMPLATES } from '../character/templates.js';
import { createRng } from '../shared/rng.js';
import { RARITY_LABELS, type PlayerState, type Rarity, type Role } from '../shared/types.js';

/** 单抽消耗抽卡券 */
export const GACHA_TICKET_COST = 1;

/** 连续未出新卡达到该次数则软保底（若仍有未拥有） */
export const GACHA_SOFT_PITY = 8;

export type GachaPullKind = 'new' | 'duplicate';

export interface GachaPullItem {
  templateId: string;
  name: string;
  rarity: Rarity;
  kind: GachaPullKind;
  /** 重复时增加的碎片数 */
  shardsGained: number;
}

export type GachaPullResult =
  | { ok: true; state: PlayerState; items: GachaPullItem[]; message: string }
  | { ok: false; message: string };

/** 常驻池：非主角且已解锁（章节表 START_UNLOCKS / unlocksOnClear） */
export function gachaPoolIds(state?: PlayerState): string[] {
  const all = UNIT_TEMPLATES.filter((t) => !t.isHero).map((t) => t.id);
  if (!state) return all;
  return all.filter((id) => isContentUnlocked(state, 'gacha_unit', id));
}

function ownedRoles(state: PlayerState): Set<Role> {
  const roles = new Set<Role>();
  for (const t of UNIT_TEMPLATES) {
    if (isOwned(state, t.id)) roles.add(t.role);
  }
  return roles;
}

function unownedIds(state: PlayerState): string[] {
  return gachaPoolIds(state).filter((id) => !isOwned(state, id));
}

const RARITY_WEIGHT: Record<Rarity, number> = {
  common: 8,
  uncommon: 8,
  rare: 5,
  epic: 3,
  legendary: 1,
};

/** 品级权 × 未拥有更高 × 缺职能 */
export function weightForPull(state: PlayerState, templateId: string): number {
  const t = getTemplate(templateId);
  if (!t || t.isHero) return 0;
  const owned = isOwned(state, templateId);
  let w = (owned ? 10 : 14) * (RARITY_WEIGHT[t.rarity] ?? 5);
  const roles = ownedRoles(state);
  if (!owned && !roles.has(t.role)) w += 16 * (RARITY_WEIGHT[t.rarity] ?? 5);
  return w;
}

function pickWeighted(state: PlayerState, ids: string[], rng: { next(): number; int(a: number, b: number): number }): string {
  const weights = ids.map((id) => weightForPull(state, id));
  const total = weights.reduce((s, w) => s + w, 0);
  let roll = rng.int(1, Math.max(1, total));
  for (let i = 0; i < ids.length; i += 1) {
    roll -= weights[i]!;
    if (roll <= 0) return ids[i]!;
  }
  return ids[ids.length - 1]!;
}

function applyOnePull(state: PlayerState, templateId: string): { state: PlayerState; item: GachaPullItem } {
  const t = getTemplate(templateId)!;
  const progress = { ...getProgress(state, templateId) };
  if (!progress.owned) {
    progress.owned = true;
    progress.cardShards = progress.cardShards ?? 0;
    return {
      state: {
        ...state,
        roster: { ...state.roster, [templateId]: progress },
      },
      item: { templateId, name: t.name, rarity: t.rarity, kind: 'new', shardsGained: 0 },
    };
  }
  progress.cardShards = (progress.cardShards ?? 0) + 1;
  return {
    state: {
      ...state,
      roster: { ...state.roster, [templateId]: progress },
    },
    item: { templateId, name: t.name, rarity: t.rarity, kind: 'duplicate', shardsGained: 1 },
  };
}

/**
 * 常驻池抽卡。优先出新卡补职能；重复卡变碎片（升星优先消耗）。
 */
export function pullGacha(state: PlayerState, times = 1): GachaPullResult {
  let s = ensureRoster(state);
  const n = Math.max(1, Math.min(10, Math.floor(times)));
  const cost = GACHA_TICKET_COST * n;
  const tickets = s.currencies.ticket ?? 0;
  if (tickets < cost) {
    return { ok: false, message: `抽卡券不足（${tickets}/${cost}）。` };
  }

  const rng = createRng(s.seed + s.gachaPity * 17 + (s.currencies.ticket ?? 0) * 3 + n * 91);
  s = {
    ...s,
    currencies: { ...s.currencies, ticket: tickets - cost },
    seed: s.seed + 1,
  };

  const items: GachaPullItem[] = [];
  let pity = s.gachaPity;

  for (let i = 0; i < n; i += 1) {
    const missing = unownedIds(s);
    let pickId: string;
    if (missing.length > 0 && pity + 1 >= GACHA_SOFT_PITY) {
      pickId = pickWeighted(s, missing, rng);
    } else {
      pickId = pickWeighted(s, gachaPoolIds(s), rng);
    }
    const applied = applyOnePull(s, pickId);
    s = applied.state;
    items.push(applied.item);
    if (applied.item.kind === 'new') pity = 0;
    else pity += 1;
  }

  s = { ...s, gachaPity: pity };
  const summary = items
    .map((it) => {
      const tag = RARITY_LABELS[it.rarity];
      return it.kind === 'new' ? `新·${tag}${it.name}` : `重复·${tag}${it.name}+碎片`;
    })
    .join('、');
  return { ok: true, state: s, items, message: summary };
}
