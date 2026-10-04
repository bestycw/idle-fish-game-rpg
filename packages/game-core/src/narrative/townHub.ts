/**
 * 城镇 Hub · 常驻职能 NPC（与章节 scene NPC 并行）
 */

import type { PlayerState } from '../shared/types.js';
import { maxChapterOrder } from '../chapter/defs.js';
import { narrativeWorldPreset } from './onboarding.js';
import { npcFlavorDialogue } from './npcFlavor.zh.js';
import { resolveNpcDisplay, resolveTownDisplay } from './worldSpine.js';
import { resolveWorldSkinNames } from './worldSkinNamesResolve.js';
import { townHubFlavorLines } from './townHubFlavor.zh.js';
import { VOLUME1_BEATS, type SpineNpcSlot, type SpineTownId } from './volumeBeats.js';
import { getVolumeMapView } from '../chapter/volumeMapView.js';

export type TownNpcKind = 'merchant' | 'inn' | 'quest' | 'story' | 'flavor';

export interface TownHubNpcDef {
  id: string;
  townId: SpineTownId;
  kind: TownNpcKind;
  roleLabel: string;
  spineSlot?: SpineNpcSlot;
  flavorId?: string;
  minChapterCleared: number;
  merchantShell?: {
    lockedUntilChapterCleared: number;
    lockedHint: string;
  };
}

export interface TownHubNpcView {
  id: string;
  kind: TownNpcKind;
  name: string;
  epithet: string | null;
  roleLabel: string;
  lines: string[];
  merchantShell?: {
    locked: boolean;
    lockedHint: string;
  };
}

export interface TownHubTownView {
  townId: SpineTownId;
  displayName: string;
  reachable: boolean;
  status: 'cleared' | 'current' | 'ahead';
  tagline: string;
  npcs: TownHubNpcView[];
}

const TOWN_TAGLINES: Record<SpineTownId, string> = {
  town_outer: '驿道、坊市与关隘——卷起点。',
  town_midland: '营地与商路交汇，整备之地。',
  town_marches: '边庭风紧，乱战原在前。',
  town_fortress: '内城集结，卷末门前。',
};

/** 卷一城镇常驻 NPC 注册（可扩表，不改 Spine id） */
export const TOWN_HUB_NPCS: TownHubNpcDef[] = [
  {
    id: 'outer_handler',
    townId: 'town_outer',
    kind: 'story',
    roleLabel: '接引',
    spineSlot: 'npc_handler',
    minChapterCleared: 0,
  },
  {
    id: 'outer_merchant',
    townId: 'town_outer',
    kind: 'merchant',
    roleLabel: '行商',
    spineSlot: 'npc_merchant',
    minChapterCleared: 0,
    merchantShell: {
      lockedUntilChapterCleared: 3,
      lockedHint: '货郎每逢四日方至营地；通完第 3 章后再来中陆商棚。',
    },
  },
  {
    id: 'outer_guard',
    townId: 'town_outer',
    kind: 'flavor',
    roleLabel: '驿卒',
    flavorId: 'outer_guard',
    minChapterCleared: 0,
  },
  {
    id: 'midland_merchant',
    townId: 'town_midland',
    kind: 'merchant',
    roleLabel: '商棚',
    spineSlot: 'npc_merchant',
    minChapterCleared: 3,
    merchantShell: {
      lockedUntilChapterCleared: 4,
      lockedHint: '商棚刚搭好货架，通完第 4 章后开放兑换。',
    },
  },
  {
    id: 'midland_elder',
    townId: 'town_midland',
    kind: 'quest',
    roleLabel: '悬赏',
    spineSlot: 'npc_elder',
    minChapterCleared: 3,
  },
  {
    id: 'midland_inn',
    townId: 'town_midland',
    kind: 'inn',
    roleLabel: '驿舍',
    flavorId: 'midland_inn',
    minChapterCleared: 3,
  },
  {
    id: 'marches_merchant',
    townId: 'town_marches',
    kind: 'merchant',
    roleLabel: '行商',
    spineSlot: 'npc_merchant',
    minChapterCleared: 4,
    merchantShell: { lockedUntilChapterCleared: 6, lockedHint: '边庭货源紧，半程歇脚后再来。' },
  },
  {
    id: 'marches_rival',
    townId: 'town_marches',
    kind: 'flavor',
    roleLabel: '同辈',
    spineSlot: 'npc_rival',
    minChapterCleared: 4,
  },
  {
    id: 'marches_scout',
    townId: 'town_marches',
    kind: 'flavor',
    roleLabel: '斥候',
    flavorId: 'marches_scout',
    minChapterCleared: 4,
  },
  {
    id: 'marches_quest',
    townId: 'town_marches',
    kind: 'quest',
    roleLabel: '悬赏榜',
    spineSlot: 'npc_handler',
    minChapterCleared: 5,
  },
  {
    id: 'fortress_merchant',
    townId: 'town_fortress',
    kind: 'merchant',
    roleLabel: '军需',
    spineSlot: 'npc_merchant',
    minChapterCleared: 7,
    merchantShell: { lockedUntilChapterCleared: 8, lockedHint: '军需处盘点中，进入内城剧情后开放。' },
  },
  {
    id: 'fortress_whisper',
    townId: 'town_fortress',
    kind: 'flavor',
    roleLabel: '暗线',
    flavorId: 'fortress_whisper',
    minChapterCleared: 7,
  },
  {
    id: 'fortress_quest',
    townId: 'town_fortress',
    kind: 'quest',
    roleLabel: '军令板',
    spineSlot: 'npc_elder',
    minChapterCleared: 8,
  },
];

function chapterCleared(state: PlayerState): number {
  return Math.max(0, state.chapterCleared ?? 0);
}

function resolveNpcLines(
  state: PlayerState,
  def: TownHubNpcDef,
  preset: ReturnType<typeof narrativeWorldPreset>,
  hero: string,
): string[] {
  if (def.flavorId) {
    return townHubFlavorLines(preset, def.flavorId, hero);
  }
  if (def.spineSlot) {
    return npcFlavorDialogue(preset, def.spineSlot, hero);
  }
  return ['……'];
}

function resolveNpcName(
  state: PlayerState,
  def: TownHubNpcDef,
  preset: ReturnType<typeof narrativeWorldPreset>,
): { name: string; epithet: string | null } {
  const names = resolveWorldSkinNames(state);
  if (def.spineSlot) {
    const epithet = names?.npcEpithets?.[def.spineSlot]?.trim();
    return {
      name: resolveNpcDisplay(preset, def.spineSlot, names?.npcs),
      epithet: epithet || def.roleLabel,
    };
  }
  return { name: def.roleLabel, epithet: null };
}

export function listTownHubNpcs(state: PlayerState, townId: SpineTownId): TownHubNpcView[] {
  const map = getVolumeMapView(state);
  const town = map.towns.find((t) => t.townId === townId);
  if (!town?.reachable) return [];

  const cleared = chapterCleared(state);
  const preset = narrativeWorldPreset(state);
  const hero = state.narrative?.heroName?.trim() || '旅人';

  return TOWN_HUB_NPCS.filter((d) => d.townId === townId && cleared >= d.minChapterCleared).map(
    (def) => {
      const { name, epithet } = resolveNpcName(state, def, preset);
      let merchantShell: TownHubNpcView['merchantShell'];
      if (def.merchantShell) {
        const locked = cleared < def.merchantShell.lockedUntilChapterCleared;
        merchantShell = {
          locked,
          lockedHint: def.merchantShell.lockedHint,
        };
      }
      return {
        id: def.id,
        kind: def.kind,
        name,
        epithet,
        roleLabel: def.roleLabel,
        lines: resolveNpcLines(state, def, preset, hero),
        merchantShell,
      };
    },
  );
}

export function getTownHubTownView(state: PlayerState, townId: SpineTownId): TownHubTownView | null {
  const map = getVolumeMapView(state);
  const town = map.towns.find((t) => t.townId === townId);
  if (!town) return null;
  const preset = narrativeWorldPreset(state);
  const names = resolveWorldSkinNames(state);
  return {
    townId,
    displayName: resolveTownDisplay(preset, townId, names?.towns),
    reachable: town.reachable,
    status: town.status,
    tagline: TOWN_TAGLINES[townId],
    npcs: listTownHubNpcs(state, townId),
  };
}

export function listReachableTownHubs(state: PlayerState): TownHubTownView[] {
  const map = getVolumeMapView(state);
  return map.towns
    .filter((t) => t.reachable)
    .map((t) => getTownHubTownView(state, t.townId)!)
    .filter(Boolean);
}

export function townHubNpcById(
  state: PlayerState,
  townId: SpineTownId,
  npcId: string,
): TownHubNpcView | null {
  return listTownHubNpcs(state, townId).find((n) => n.id === npcId) ?? null;
}

/** 城镇开放所需最低章（卷一 beat 表） */
export function minChapterForTown(townId: SpineTownId): number {
  const orders = VOLUME1_BEATS.filter((b) => b.primaryTown === townId).map((b) => b.chapterOrder);
  return orders.length ? Math.min(...orders) : 1;
}

export function maxChapterOrderForTown(): number {
  return maxChapterOrder();
}
