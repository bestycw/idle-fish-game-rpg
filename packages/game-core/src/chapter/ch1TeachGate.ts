/**
 * 第一章教学门：同阵「两小怪 → 阵末精锐」。
 * 卡点放在 **第一阵精锐**（waveInUnit===2）：战败发券 → 保蓝抽 → 再打可过。
 * 小怪波保持双人可过；不必凑满 5 人。
 */
import { isOwned } from '../character/growth.js';
import { getTemplate } from '../character/templates.js';
import { placeUnit } from '../formation/formation.js';
import { createRng } from '../shared/rng.js';
import type { GridSlot, PlayerState, Role } from '../shared/types.js';
import { mainlineStoryPressure } from './bands.js';
import { currentChapterBattleContext } from './battleWaves.js';
import { getChapterByOrder } from './defs.js';

/** 教学保蓝池（开局即可抽到的良品） */
export const CH1_TEACH_RARE_POOL = ['xushu', 'weiyan', 'zhurong', 'bailongma'] as const;

function playingChapterOrder(state: PlayerState): number {
  const cleared = Math.max(0, state.chapterCleared ?? 0);
  return getChapterByOrder(cleared + 1)?.order ?? cleared + 1;
}

export function hasOwnedRareCompanion(state: PlayerState): boolean {
  for (const [id, row] of Object.entries(state.roster ?? {})) {
    if (!row?.owned) continue;
    const t = getTemplate(id);
    if (t && !t.isHero && t.rarity === 'rare') return true;
  }
  return false;
}

/** 是否正处于第一章第一阵阵末精锐 */
export function isCh1FirstUnitElite(state: PlayerState): boolean {
  if (playingChapterOrder(state) !== 1) return false;
  const ctx = currentChapterBattleContext(state);
  if (!ctx) return false;
  return ctx.unitIndex === 0 && ctx.waveInUnit === 2;
}

/** 教学门是否仍锁着（未拥有蓝） */
export function ch1EliteGateActive(state: PlayerState): boolean {
  return isCh1FirstUnitElite(state) && !hasOwnedRareCompanion(state);
}

/**
 * 主线本场压力：第一章小怪压低；第一阵精锐在拿到蓝之前抬高。
 */
export function chapterBattlePressure(state: PlayerState): number {
  const order = playingChapterOrder(state);
  const cleared = state.chapterCleared ?? 0;
  const base = mainlineStoryPressure(cleared, order);
  const ctx = currentChapterBattleContext(state);
  if (!ctx || order !== 1) return base;

  // 阵内前两波小怪：教学可过
  if (ctx.waveInUnit < 2) return base * 0.68;

  const rareOnField = hasRareCompanionOnField(state);

  // 第一阵精锐：未出蓝前做硬墙
  if (ctx.unitIndex === 0 && ctx.waveInUnit === 2 && !hasOwnedRareCompanion(state)) {
    return base * 1.9;
  }

  // 蓝卡已上阵：明确可过（坦克开局紫也要能破门）
  if (ctx.unitIndex === 0 && ctx.waveInUnit === 2 && rareOnField) {
    return base * 0.62;
  }

  // 有蓝但没上阵：别当硬墙，战前会拦/提示上阵
  if (ctx.unitIndex === 0 && ctx.waveInUnit === 2 && hasOwnedRareCompanion(state)) {
    return base * 0.85;
  }

  return base * 0.9;
}

/** 阵上是否有良品（蓝）伙伴 */
export function hasRareCompanionOnField(state: PlayerState): boolean {
  for (const id of Object.keys(state.formation ?? {})) {
    const t = getTemplate(id);
    if (t && !t.isHero && t.rarity === 'rare') return true;
  }
  return false;
}

const FREE_SLOTS: GridSlot[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/** 教学蓝抽到后：有空位则自动上阵 */
export function autoDeployCompanion(state: PlayerState, templateId: string): PlayerState {
  if (!isOwned(state, templateId)) return state;
  if (state.formation?.[templateId] != null) return state;
  const t = getTemplate(templateId);
  if (!t) return state;
  const used = new Set(Object.values(state.formation ?? {}));
  const preferred = t.preferredSlot;
  const slot =
    (!used.has(preferred) ? preferred : null) ??
    FREE_SLOTS.find((s) => !used.has(s));
  if (slot == null) return state;
  return placeUnit(state, templateId, slot);
}

export type Ch1TeachDialogueBeat = {
  speaker: string;
  text: string;
};

/** 战败弹层：先嘲讽，再发券，把人推向召唤 */
export function ch1EliteDefeatDialogueBeats(): Ch1TeachDialogueBeat[] {
  return [
    {
      speaker: '系统',
      text: '……就这？两人硬凿精锐。你是把说明书当壁纸了，还是工位加班加出幻觉了？',
    },
    {
      speaker: '你',
      text: '……刚才那两波小怪明明挺顺。',
    },
    {
      speaker: '系统',
      text: '小怪是教学。精锐才是门槛——这就是「卡关」的味道，记住了。',
    },
    {
      speaker: '系统',
      text: '行吧，新人福利到账：抽卡券 ×1。去召唤补一位良品（蓝），上阵再回来破这一阵。',
    },
    {
      speaker: '系统',
      text: '两人开局够学流程，凑满五人是以后的事。别站着挨打——去抽。',
    },
  ];
}

export type Ch1EliteDefeatResult = {
  state: PlayerState;
  /** 本次战败刚发了教学券 */
  grantedTicket: boolean;
  /** 应弹出嘲讽→发券对话 */
  showDialogue: boolean;
  systemLine: string | null;
};

/** 第一阵精锐战败：首次发 1 张抽卡券，并挂起对话弹层 */
export function applyCh1EliteDefeatReward(state: PlayerState): Ch1EliteDefeatResult {
  if (!isCh1FirstUnitElite(state)) {
    return { state, grantedTicket: false, showDialogue: false, systemLine: null };
  }
  if (state.tutorialFlags?.ch1EliteTicketGranted) {
    return {
      state,
      grantedTicket: false,
      showDialogue: false,
      systemLine: hasOwnedRareCompanion(state)
        ? '蓝卡已在名册——布阵带上再打这一阵精锐。'
        : '券还在。去召唤抽良品（蓝），再回来破阵。',
    };
  }
  if (hasOwnedRareCompanion(state)) {
    return { state, grantedTicket: false, showDialogue: false, systemLine: null };
  }

  const tickets = (state.currencies?.ticket ?? 0) + 1;
  const next: PlayerState = {
    ...state,
    currencies: { ...state.currencies, ticket: tickets },
    tutorialFlags: {
      ...state.tutorialFlags,
      ch1EliteTicketGranted: true,
      ch1EliteDialoguePending: true,
    },
    pendingTutorialLine: undefined,
  };
  return {
    state: next,
    grantedTicket: true,
    showDialogue: true,
    systemLine: null,
  };
}

/** 对话弹层关闭后：标记已看过 */
export function markCh1EliteDialogueSeen(state: PlayerState): PlayerState {
  return {
    ...state,
    tutorialFlags: {
      ...state.tutorialFlags,
      ch1EliteDialoguePending: false,
      ch1EliteDialogueSeen: true,
    },
    pendingTutorialLine: undefined,
  };
}

function ownedRoles(state: PlayerState): Set<Role> {
  const roles = new Set<Role>();
  for (const [id, row] of Object.entries(state.roster ?? {})) {
    if (!row?.owned) continue;
    const t = getTemplate(id);
    if (t && !t.isHero) roles.add(t.role);
  }
  return roles;
}

/** 从教学池挑一张未拥有的蓝；优先补缺失职能 */
export function pickCh1TeachRareId(state: PlayerState): string {
  const missing = CH1_TEACH_RARE_POOL.filter((id) => !isOwned(state, id) && getTemplate(id));
  const pool = missing.length > 0 ? missing : [...CH1_TEACH_RARE_POOL];
  const roles = ownedRoles(state);
  const complement = pool.filter((id) => {
    const role = getTemplate(id)?.role;
    return role && !roles.has(role);
  });
  const use = complement.length > 0 ? complement : pool;
  const rng = createRng(state.seed + (state.currencies.ticket ?? 0) * 13 + 404);
  return use[rng.int(0, use.length - 1)]!;
}

/** 单抽是否应强制教学蓝 */
export function shouldForceCh1TeachRare(state: PlayerState): boolean {
  return Boolean(state.tutorialFlags?.ch1EliteTicketGranted) && !hasOwnedRareCompanion(state);
}

export function clearPendingTutorialLine(state: PlayerState): PlayerState {
  if (state.pendingTutorialLine == null) return state;
  return { ...state, pendingTutorialLine: undefined };
}
