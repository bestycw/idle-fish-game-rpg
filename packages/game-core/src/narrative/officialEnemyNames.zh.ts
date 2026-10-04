/**
 * 遭遇/敌人显示名 · 按 worldPreset 换皮（Spine encounterId 与槽位不变）
 * Skill 可扩写本表或后续 overlay.enemyNames；**不写 battleWaves**。
 */

import type { WorldPreset } from '../shared/types.js';

/** encounterId → 遭遇标题（战前/UI） */
export type EncounterTitleMap = Partial<Record<string, string>>;

/** encounterId → 敌人下标 → 显示名 */
export type EnemyUnitNameMap = Partial<Record<string, Partial<Record<number, string>>>>;

export interface PresetEnemySkin {
  encounterTitles: EncounterTitleMap;
  unitNames: EnemyUnitNameMap;
}

const XIANXIA: PresetEnemySkin = {
  encounterTitles: {
    gate_skirmish: '界域关·前锋',
    wall: '界域盾墙阵',
    archers: '试剑台箭雨',
    raiders: '劫灰速攻队',
    boss_warden: '劫域守门战',
    spirit_wall: '灵障盾阵',
    chaos_rite: '乱心祭坛',
    shield_stack: '叠盾演武',
    oil_cask: '丹炉油阵',
  },
  unitNames: {
    gate_skirmish: {
      0: '记名关丁',
      1: '记名盾役',
    },
    wall: {
      0: '玄铁盾手',
      1: '重甲关卒',
    },
    archers: {
      0: '挡箭剑侍',
      1: '试剑弓手',
      2: '试剑弓手·副',
    },
    raiders: {
      0: '点穴客',
      1: '影刃客',
      2: '追魂客',
    },
    boss_warden: {
      0: '劫域守门将·厍长渊',
      1: '传功侧卫',
      2: '禁疗医师',
    },
  },
};

const WUXIA: PresetEnemySkin = {
  encounterTitles: {
    gate_skirmish: '青石关·趟子前锋',
    wall: '青石盾墙阵',
    boss_warden: '镇守门首领战',
  },
  unitNames: {
    gate_skirmish: { 0: '关隘趟子甲', 1: '关隘趟子乙' },
    wall: { 0: '铁壁镖师', 1: '厚甲趟子' },
    boss_warden: { 0: '镇狱镖头·霍断山', 1: '侧翼刀客', 2: '随行医师' },
  },
};

const CYBER: PresetEnemySkin = {
  encounterTitles: {
    gate_skirmish: '下层关口·清道夫',
    wall: '盾墙协议组',
    boss_warden: '核心隔离首领战',
  },
  unitNames: {
    gate_skirmish: { 0: '清道夫·A', 1: '清道夫·B' },
    wall: { 0: '协议盾卫', 1: '协议盾卫·重' },
    boss_warden: { 0: '隔离门监·零号判官', 1: '侧翼无人机', 2: '维修工蜂' },
  },
};

const BY_PRESET: Record<WorldPreset, PresetEnemySkin> = {
  xianxia: XIANXIA,
  wuxia: WUXIA,
  cyberpunk: CYBER,
};

export function presetEnemySkin(preset: WorldPreset): PresetEnemySkin {
  return BY_PRESET[preset];
}

export function resolveEncounterTitle(
  preset: WorldPreset,
  encounterId: string,
  fallback: string,
): string {
  return BY_PRESET[preset].encounterTitles[encounterId] ?? fallback;
}

export function resolveEnemyUnitName(
  preset: WorldPreset,
  encounterId: string,
  enemyIndex: number,
  fallback: string,
): string {
  return BY_PRESET[preset].unitNames[encounterId]?.[enemyIndex] ?? fallback;
}
