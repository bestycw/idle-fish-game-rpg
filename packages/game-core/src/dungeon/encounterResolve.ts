import type { EncounterDef, EnemySpec } from './encounters.js';

/**
 * 遭遇玩法真源（Spine）。显示皮见 `resolveEncounterDisplay.ts`。
 *
 * 变体/模组若将来要做，只扩展 `resolveEncounterEnemies` 并跑 encounterRecipes。
 */
export function resolveEncounterEnemies(encounter: EncounterDef): EnemySpec[] {
  return encounter.enemies.map((spec) => ({ ...spec }));
}
