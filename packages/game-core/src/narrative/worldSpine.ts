/**
 * 世界 Spine：城镇/地点/NPC 槽 · 全皮共用 id
 * Skin：按 worldPreset + bible 填 displayName，Skill 不得新增 id
 */

import type { WorldPreset, WorldSkinNames } from '../shared/types.js';
import { OFFICIAL_NAME_PICK } from './officialNamePools.zh.js';
import type { SpineLocationId, SpineNpcSlot, SpineTownId } from './volumeBeats.js';

export type { WorldSkinNames };

export interface SpineLocationDef {
  id: SpineLocationId;
  /** 中性引擎名（调试用） */
  spineLabel: string;
  /** 本卷第几章主场景 */
  chapterOrder: number;
}

export interface SpineNpcDef {
  slot: SpineNpcSlot;
  role: string;
  /** 是否卷内身份固定（换皮只换名，不换职能） */
  persistent: boolean;
}

export const SPINE_TOWN_IDS: SpineTownId[] = [
  'town_outer',
  'town_midland',
  'town_marches',
  'town_fortress',
];

/** 每 preset 的默认 display（= official 名池定稿 · 无 Skill 时用） */
export type PresetLocaleTable = Record<SpineLocationId | SpineNpcSlot, string>;

export const SPINE_LOCATIONS: SpineLocationDef[] = [
  { id: 'loc_gate', spineLabel: '关隘入口', chapterOrder: 1 },
  { id: 'loc_forest', spineLabel: '林道', chapterOrder: 2 },
  { id: 'loc_highland', spineLabel: '高台', chapterOrder: 3 },
  { id: 'loc_camp', spineLabel: '中途营地', chapterOrder: 4 },
  { id: 'loc_wastes', spineLabel: '乱战原', chapterOrder: 5 },
  { id: 'loc_rest', spineLabel: '半程歇点', chapterOrder: 6 },
  { id: 'loc_pass', spineLabel: '第二关隘', chapterOrder: 7 },
  { id: 'loc_inner', spineLabel: '内城/内层', chapterOrder: 8 },
  { id: 'loc_hall', spineLabel: '集结厅', chapterOrder: 9 },
  { id: 'loc_boss_gate', spineLabel: '卷末门', chapterOrder: 10 },
];

export const SPINE_NPC_SLOTS: SpineNpcDef[] = [
  { slot: 'npc_handler', role: '接引/向导', persistent: true },
  { slot: 'npc_rival', role: '同辈压力/对手戏', persistent: true },
  { slot: 'npc_elder', role: '发布阶段目标', persistent: true },
  { slot: 'npc_merchant', role: '交换与资源感', persistent: false },
  { slot: 'npc_turncoat', role: '暗线伏笔', persistent: false },
];

function localeTableFromPick(preset: WorldPreset): PresetLocaleTable {
  const pick = OFFICIAL_NAME_PICK[preset];
  return { ...pick.locations, ...pick.npcs };
}

const LOCALE_BY_PRESET: Record<WorldPreset, PresetLocaleTable> = {
  wuxia: localeTableFromPick('wuxia'),
  xianxia: localeTableFromPick('xianxia'),
  cyberpunk: localeTableFromPick('cyberpunk'),
};

export function defaultLocaleTable(preset: WorldPreset): PresetLocaleTable {
  return { ...LOCALE_BY_PRESET[preset] };
}

/** 官方包 / Phase A 顶栏 */
export function presetWorldSkinNames(preset: WorldPreset): WorldSkinNames {
  const pick = OFFICIAL_NAME_PICK[preset];
  return {
    towns: { ...pick.towns },
    locations: { ...pick.locations },
    npcs: { ...pick.npcs },
    npcEpithets: { ...pick.npcEpithets },
  };
}

export function resolveTownDisplay(
  preset: WorldPreset,
  townId: SpineTownId,
  overrides?: Partial<Record<SpineTownId, string>>,
): string {
  const pick = OFFICIAL_NAME_PICK[preset].towns[townId];
  return overrides?.[townId] ?? pick;
}

export function resolveLocationDisplay(
  preset: WorldPreset,
  locationId: SpineLocationId,
  skin?: Pick<WorldSkinNames, 'locations'>,
): string {
  return skin?.locations?.[locationId] ?? LOCALE_BY_PRESET[preset][locationId];
}

export function resolveNpcDisplay(
  preset: WorldPreset,
  slot: SpineNpcSlot,
  skin?: Pick<WorldSkinNames, 'npcs'>,
): string {
  return skin?.npcs?.[slot] ?? LOCALE_BY_PRESET[preset][slot];
}

export function resolveNpcEpithet(
  preset: WorldPreset,
  slot: SpineNpcSlot,
  skin?: Pick<WorldSkinNames, 'npcEpithets'>,
): string {
  return skin?.npcEpithets?.[slot] ?? OFFICIAL_NAME_PICK[preset].npcEpithets[slot];
}
