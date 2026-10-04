import type { CreateBattleOpts } from '../combat/combat.js';
import {
  resolveEncounterTitle,
  resolveEnemyUnitName,
} from '../narrative/officialEnemyNames.zh.js';
import { narrativeWorldPreset } from '../narrative/onboarding.js';
import type { PlayerState, WorldPreset } from '../shared/types.js';
import { ENCOUNTERS } from './encounters.js';

export function worldPresetForBattle(state: PlayerState): WorldPreset {
  return narrativeWorldPreset(state);
}

export function displayTitleForEncounter(
  state: PlayerState,
  encounterId: string,
  defaultTitle: string,
): string {
  return resolveEncounterTitle(worldPresetForBattle(state), encounterId, defaultTitle);
}

export function displayNameForEnemy(
  state: PlayerState,
  encounterId: string,
  enemyIndex: number,
  defaultName: string,
): string {
  return resolveEnemyUnitName(
    worldPresetForBattle(state),
    encounterId,
    enemyIndex,
    defaultName,
  );
}

/** 开战前：按 preset 生成 createBattle 显示名参数 */
export function createBattleDisplayOpts(
  state: PlayerState,
  encounterIndex: number,
): Pick<CreateBattleOpts, 'encounterDisplayName' | 'enemyDisplayNames'> {
  const encounter = ENCOUNTERS[encounterIndex % ENCOUNTERS.length]!;
  return {
    encounterDisplayName: displayTitleForEncounter(state, encounter.id, encounter.name),
    enemyDisplayNames: encounter.enemies.map((spec, i) =>
      displayNameForEnemy(state, encounter.id, i, spec.name),
    ),
  };
}
