export { SLOT_NAMES, SLOT_SHORT_NAMES, SLOT_SUBSTAT_POOL, t3GroupOf, WHITE_BASE } from './slots.js';
export {
  DROPTABLE,
  RARITY_MULTIPLIER,
  RARITY_LABELS_EQUIP,
  droptableOf,
  itemLevelScale,
  wearTierForItemLevel,
  itemLevelFromProgress,
  itemLevelBandForChapter,
} from './rarity.js';
export {
  AFFIX_DEFS,
  OPEN_POOL_DEFS,
  SUBSTAT_IDS,
  getRandomAffixDef,
  substatDefs,
} from './randomAffixes.js';
export {
  RARE_AFFIX_DEFS,
  PERCENT_RARE_STATS,
  FLAT_RARE_STATS,
  getRareAffixDef,
  isPercentRare,
} from './rares.js';
export {
  registerCondition,
  getConditionDef,
  listConditionsForSlot,
  CONDITION_OUTGOING_CAP,
  CONDITION_TAKEN_CAP,
  CONDITION_EXTREME_MULT,
} from './conditions.js';
export type { ConditionDef } from './conditions.js';
export {
  registerT3,
  getT3Def,
  getEffectAffixDef,
  listT3ByGroup,
  listT3ForSlot,
  T3_DEFS,
} from './t3.js';
export type { T3Def, T3Scope, T3ActionScope } from './t3.js';
