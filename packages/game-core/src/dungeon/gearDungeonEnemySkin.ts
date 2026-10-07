import type { CreateBattleOpts } from '../combat/combat.js';
import { ENCOUNTERS, type EncounterDef, type EnemySpec } from './encounters.js';
import {
  resolveEncounterTitle,
  resolveEnemyUnitName,
} from '../narrative/officialEnemyNames.zh.js';
import { narrativeWorldPreset } from '../narrative/onboarding.js';
import type { PlayerState, WorldPreset } from '../shared/types.js';
import { getLineForGearDungeonId } from './gearDungeonLines.js';

type GearEncounterSkin = {
  title: string;
  elitePool: string[];
  minionPool: string[];
};

/** 猎装线主题皮：按 lineId × encounterId 扩行；小怪/精英名用 battleSeed 抽池，首领走 DUNGEON_BOSS_NAME */
const LINE_ENCOUNTER_SKIN: Record<string, Partial<Record<string, GearEncounterSkin>>> = {
  line_wall: {
    boss_wall: {
      title: '青石关·瓮城尉试阵',
      elitePool: ['瓮城戍卒', '鸣锣盾伕', '关墙巡丁'],
      minionPool: ['青石关丁', '廊道伕役', '驿卒'],
    },
    boss_shield_stack: {
      title: '青石关·叠盾校场',
      elitePool: ['叠盾教习', '鸣金戍卒'],
      minionPool: ['关丁', '盾场伕'],
    },
  },
  line_archer: {
    boss_archers: {
      title: '落鸦矢道·伏射台',
      elitePool: ['弦手教习', '鸦羽弓伕'],
      minionPool: ['矢道伕役', '巡台关丁', '试射卒'],
    },
    boss_raiders: {
      title: '落鸦矢道·侧翼劫线',
      elitePool: ['劫道客', '弦上客'],
      minionPool: ['林道伕', '放哨卒'],
    },
  },
  line_raider: {
    boss_raiders: {
      title: '乱阵林蹊·劫道哨',
      elitePool: ['林哨客', '点穴客'],
      minionPool: ['林伕', '放风卒', '绊马丁'],
    },
    boss_oil: {
      title: '乱阵林蹊·油火坞',
      elitePool: ['油火伕', '丹炉卒'],
      minionPool: ['抬桶丁', '林道伕'],
    },
  },
  line_spirit: {
    boss_spirit_wall: {
      title: '灵障关口·铁壁坛',
      elitePool: ['灵坛戍卒', '障眼伕'],
      minionPool: ['关口丁', '引路卒'],
    },
    boss_shield_stack: {
      title: '灵障重阙·叠盾坛',
      elitePool: ['叠盾灵役', '坛场戍卒'],
      minionPool: ['灵障伕', '关口丁'],
    },
  },
  line_oil: {
    boss_oil: {
      title: '油火井·丹烟口',
      elitePool: ['井口药伕', '抬火卒'],
      minionPool: ['井丁', '运油伕'],
    },
    boss_raiders: {
      title: '油火锻炉·劫火线',
      elitePool: ['锻炉卒', '劫火客'],
      minionPool: ['井丁', '运桶伕'],
    },
  },
  line_shield: {
    boss_shield_stack: {
      title: '叠盾秘库·金固窟',
      elitePool: ['库丁头', '叠盾役'],
      minionPool: ['秘库伕', '运盾卒'],
    },
    boss_wall: {
      title: '叠盾堡垒·外瓮尉',
      elitePool: ['堡垒戍卒', '瓮城盾伕'],
      minionPool: ['堡丁', '运石卒'],
    },
  },
  line_chaos: {
    boss_chaos_rite: {
      title: '乱心祠·祭烟坛',
      elitePool: ['祠丁', '附和祭司'],
      minionPool: ['祭坛伕', '祠役卒'],
    },
    boss_warden: {
      title: '乱心祠·狱门前哨',
      elitePool: ['狱门侧卫', '祠营戍卒'],
      minionPool: ['祠丁', '巡夜卒'],
    },
  },
  line_warden: {
    boss_warden: {
      title: '镇守灵阙·狱门试锋',
      elitePool: ['灵阙侧卫', '传功戍卒'],
      minionPool: ['阙丁', '巡阙卒'],
    },
    boss_chaos_rite: {
      title: '镇守灵阙·祭纹余波',
      elitePool: ['祭纹祭司', '阙营卒'],
      minionPool: ['阙丁', '祠役伕'],
    },
    boss_shield_stack: {
      title: '镇守灵阙·叠盾外阵',
      elitePool: ['外阵叠盾役', '灵阙戍卒'],
      minionPool: ['阙丁', '运盾伕'],
    },
  },
};

const DUNGEON_BOSS_NAME: Partial<Record<string, Partial<Record<string, string>>>> = {
  gear_break_wall: { boss_wall: '不动关尉·石鸣' },
  gear_wall_hard: {
    boss_wall: '重关都尉·铁盘踞',
    boss_shield_stack: '叠盾监军·霍甲',
  },
  gear_wall_hell: {
    boss_wall: '狱门盾尉·石敢当',
    boss_warden: '不动关狱将·厍长渊',
  },
  gear_arrow_lane: { boss_archers: '落鸦校尉·顾弦' },
  gear_arrow_hard: {
    boss_archers: '紧弦都尉·韩鸦',
    boss_raiders: '侧翼劫首·燕无影',
  },
  gear_raider_trail: {
    boss_raiders: '林蹊劫首·段风行',
    boss_oil: '油火坞主·焦百草',
  },
  gear_raider_hard: {
    boss_raiders: '急袭魁首·厉断山',
    boss_oil: '锻炉火主·赤燎',
  },
  gear_spirit_gate: { boss_spirit_wall: '灵障尉·铁障' },
  gear_spirit_array: {
    boss_spirit_wall: '重阙灵将·岳镇',
    boss_shield_stack: '灵阵叠盾·金固',
  },
  gear_oil_well: { boss_oil: '油火井监·温丹' },
  gear_oil_furnace: {
    boss_oil: '锻炉监军·毕灼',
    boss_raiders: '劫火客·乌啼',
  },
  gear_shield_vault: { boss_shield_stack: '秘库叠盾·裘固' },
  gear_shield_bastion: {
    boss_shield_stack: '堡垒盾将·铁幕',
    boss_wall: '外瓮尉·石垒',
  },
  gear_chaos_shrine: { boss_chaos_rite: '乱心祭尊·闻人愁' },
  gear_chaos_hell: {
    boss_chaos_rite: '狱烟祭尊·乱心',
    boss_warden: '祠狱守门·厍长渊',
  },
  gear_warden_trial: { boss_warden: '镇守门将·厍长渊' },
  gear_warden_rift: {
    boss_warden: '镜渊守门·厍长渊',
    boss_chaos_rite: '终局祭尊·闻人愁',
    boss_shield_stack: '终局叠盾·金固',
  },
};

const DUNGEON_ENCOUNTER_TITLE: Partial<Record<string, Partial<Record<string, string>>>> = {
  gear_break_wall: { boss_wall: '不动关·瓮城尉试阵' },
  gear_warden_rift: {
    boss_warden: '镜渊终局·狱门',
    boss_chaos_rite: '镜渊终局·祭烟',
    boss_shield_stack: '镜渊终局·叠盾外阵',
  },
};

function pickFromPool(pool: string[], seed: number, salt: number): string {
  if (pool.length === 0) return '';
  const i = Math.abs((seed * 31 + salt * 17) % pool.length);
  return pool[i]!;
}

function nameForEnemy(
  spec: EnemySpec,
  index: number,
  skin: GearEncounterSkin | undefined,
  dungeonId: string,
  encounterId: string,
  seed: number,
  preset: WorldPreset,
  fallback: string,
): string {
  if (spec.rank === 'boss') {
    const boss = DUNGEON_BOSS_NAME[dungeonId]?.[encounterId];
    if (boss) return boss;
  }
  if (skin) {
    if (spec.rank === 'elite') {
      const elite = pickFromPool(skin.elitePool, seed, index);
      if (elite) return elite;
    } else if (spec.rank !== 'boss') {
      const minion = pickFromPool(skin.minionPool, seed, index);
      if (minion) return minion;
    }
  }
  return resolveEnemyUnitName(preset, encounterId, index, fallback);
}

/** 战前/日志遭遇标题（猎装本统一皮） */
export function resolveGearEncounterBattleTitle(
  dungeonId: string,
  encounterId: string,
  preset: WorldPreset,
  fallback: string,
): string {
  const line = getLineForGearDungeonId(dungeonId);
  const lineSkin = line ? LINE_ENCOUNTER_SKIN[line.id]?.[encounterId] : undefined;
  return (
    DUNGEON_ENCOUNTER_TITLE[dungeonId]?.[encounterId] ??
    lineSkin?.title ??
    resolveEncounterTitle(preset, encounterId, fallback)
  );
}

/** 猎装详情「首领轮换」芯片：与进战首领名一致 */
export function gearDungeonEncounterChipLabel(
  dungeonId: string,
  encounterId: string,
  preset: WorldPreset,
): string {
  const boss = DUNGEON_BOSS_NAME[dungeonId]?.[encounterId];
  if (boss) return boss;
  const def = ENCOUNTERS.find((e) => e.id === encounterId);
  return resolveGearEncounterBattleTitle(
    dungeonId,
    encounterId,
    preset,
    def?.name ?? encounterId,
  );
}

export function gearDungeonBattleDisplayOpts(
  state: PlayerState,
  encounter: EncounterDef,
  dungeonId: string,
  battleSeed: number,
): Pick<CreateBattleOpts, 'encounterDisplayName' | 'enemyDisplayNames'> {
  const preset = narrativeWorldPreset(state);
  const line = getLineForGearDungeonId(dungeonId);
  const lineSkin = line ? LINE_ENCOUNTER_SKIN[line.id]?.[encounter.id] : undefined;

  const title = resolveGearEncounterBattleTitle(
    dungeonId,
    encounter.id,
    preset,
    encounter.name,
  );

  return {
    encounterDisplayName: title,
    enemyDisplayNames: encounter.enemies.map((spec, i) =>
      nameForEnemy(spec, i, lineSkin, dungeonId, encounter.id, battleSeed, preset, spec.name),
    ),
  };
}
