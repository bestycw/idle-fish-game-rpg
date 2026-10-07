import type { CreateBattleOpts } from '../combat/combat.js';
import {
  resolveEncounterTitle,
  resolveEnemyUnitName,
} from '../narrative/officialEnemyNames.zh.js';
import { narrativeWorldPreset } from '../narrative/onboarding.js';
import type { PlayerState } from '../shared/types.js';
import { ENCOUNTERS } from './encounters.js';
import { gearDungeonBattleDisplayOpts } from './gearDungeonEnemySkin.js';
import { isGearDungeonId } from './gearDungeons.js';

export type BattleDisplayContext = {
  dungeonId?: string;
  battleSeed?: number;
};

function overlayTitle(state: PlayerState, encounterId: string): string | undefined {
  return state.narrative?.overlay?.battleDisplay?.encounterTitles?.[encounterId];
}

function overlayEnemyName(state: PlayerState, encounterId: string, enemyIndex: number): string | undefined {
  return state.narrative?.overlay?.battleDisplay?.enemyUnitNames?.[encounterId]?.[enemyIndex];
}

/** preset 表 + 可选 `overlay.battleDisplay`（主线/日常） */
export function resolveEncounterTitleForBattle(
  state: PlayerState,
  encounterId: string,
  fallback: string,
): string {
  const fromOverlay = overlayTitle(state, encounterId);
  if (fromOverlay) return fromOverlay;
  return resolveEncounterTitle(narrativeWorldPreset(state), encounterId, fallback);
}

export function resolveEnemyUnitNameForBattle(
  state: PlayerState,
  encounterId: string,
  enemyIndex: number,
  fallback: string,
): string {
  const fromOverlay = overlayEnemyName(state, encounterId, enemyIndex);
  if (fromOverlay) return fromOverlay;
  return resolveEnemyUnitName(narrativeWorldPreset(state), encounterId, enemyIndex, fallback);
}

/** 猎装线皮结果上再叠 overlay（若有） */
function applyOverlayToGearDisplay(
  state: PlayerState,
  encounterId: string,
  gear: Pick<CreateBattleOpts, 'encounterDisplayName' | 'enemyDisplayNames'>,
  fallbackTitle: string,
): Pick<CreateBattleOpts, 'encounterDisplayName' | 'enemyDisplayNames'> {
  return {
    encounterDisplayName: overlayTitle(state, encounterId) ?? gear.encounterDisplayName ?? fallbackTitle,
    enemyDisplayNames: gear.enemyDisplayNames?.map((name, i) => overlayEnemyName(state, encounterId, i) ?? name),
  };
}

/**
 * 开战前显示皮 → `createBattle` opts（不改玩法）。
 * 猎装：`gearDungeonEnemySkin` → overlay；主线：`officialEnemyNames` → overlay。
 */
export function createBattleDisplayOpts(
  state: PlayerState,
  encounterIndex: number,
  context?: BattleDisplayContext,
): Pick<CreateBattleOpts, 'encounterDisplayName' | 'enemyDisplayNames'> {
  const encounter = ENCOUNTERS[encounterIndex % ENCOUNTERS.length]!;
  const dungeonId = context?.dungeonId;
  if (dungeonId && isGearDungeonId(dungeonId)) {
    const gear = gearDungeonBattleDisplayOpts(
      state,
      encounter,
      dungeonId,
      context?.battleSeed ?? state.seed ?? 0,
    );
    return applyOverlayToGearDisplay(state, encounter.id, gear, encounter.name);
  }
  return {
    encounterDisplayName: resolveEncounterTitleForBattle(state, encounter.id, encounter.name),
    enemyDisplayNames: encounter.enemies.map((spec, i) =>
      resolveEnemyUnitNameForBattle(state, encounter.id, i, spec.name),
    ),
  };
}
