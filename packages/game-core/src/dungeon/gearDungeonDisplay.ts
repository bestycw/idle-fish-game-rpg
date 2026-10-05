import { isContentUnlocked } from '../chapter/progress.js';
import { getT3Def } from '../equipment/catalog/t3.js';
import type { PlayerState, WorldPreset } from '../shared/types.js';
import { ENCOUNTERS } from './encounters.js';
import {
  GEAR_DUNGEON_LINES,
  dungeonIdOnLine,
  tiersOnLine,
} from './gearDungeonLines.js';
import type { GearDungeonDef, GearDungeonTier } from './gearDungeons.js';
import { getGearDungeon } from './gearDungeons.js';
import { buildGearLootPreview, type LootPreviewTile } from './gearLootPreview.js';
import { gearLootRarityMix, type GearLootRarityMixEntry } from './gearRarityByTier.js';
import {
  gearDungeonUnlockHint,
  tGearDungeonBlurb,
  tGearDungeonLineName,
  tGearDungeonLootLine,
  tGearDungeonName,
} from './gearDungeonLocale.js';

export type GearDungeonView = {
  id: string;
  tier: GearDungeonDef['tier'];
  unlocked: boolean;
  unlockHint: string;
  name: string;
  blurb: string;
  lootLine: string;
  encounterLabels: string[];
  featuredAffixNames: string[];
  pressure: number;
  staminaCost: number;
  lootPreview: LootPreviewTile[];
  lootRarityMix: GearLootRarityMixEntry[];
};

function encounterLabel(encounterId: string): string {
  return ENCOUNTERS.find((e) => e.id === encounterId)?.name ?? encounterId;
}

function featuredAffixNames(def: GearDungeonDef): string[] {
  const weights = def.t3IdWeights ?? [];
  if (weights.length === 0) return [];
  const top = [...weights].sort((a, b) => b.weight - a.weight).slice(0, 3);
  const names: string[] = [];
  for (const w of top) {
    const t3 = getT3Def(w.id);
    if (t3?.name) names.push(t3.name);
  }
  return names;
}

export type GearLineTierSlot = {
  tier: GearDungeonTier;
  dungeonId: string;
  unlocked: boolean;
  view: GearDungeonView;
};

export type GearDungeonLineView = {
  lineId: string;
  lineName: string;
  tiers: GearLineTierSlot[];
};

export function buildGearLineCatalog(state: PlayerState, preset: WorldPreset): GearDungeonLineView[] {
  return GEAR_DUNGEON_LINES.map((line) => {
    const tiers: GearLineTierSlot[] = tiersOnLine(line)
      .map((tier) => {
        const dungeonId = dungeonIdOnLine(line, tier)!;
        const def = getGearDungeon(dungeonId);
        if (!def) return null;
        const unlocked = isContentUnlocked(state, 'dungeon', dungeonId);
        return {
          tier,
          dungeonId,
          unlocked,
          view: buildGearDungeonView(def, preset, unlocked),
        };
      })
      .filter((x): x is GearLineTierSlot => x !== null);
    return {
      lineId: line.id,
      lineName: tGearDungeonLineName(line.id, preset),
      tiers,
    };
  });
}

export function buildGearDungeonView(
  def: GearDungeonDef,
  preset: WorldPreset,
  unlocked: boolean,
): GearDungeonView {
  const affixNames = featuredAffixNames(def);
  const lootLine = tGearDungeonLootLine(def.id, preset);
  const affixSuffix =
    affixNames.length > 0 ? `（${affixNames.join(' · ')}）` : '';
  return {
    id: def.id,
    tier: def.tier,
    unlocked,
    unlockHint: gearDungeonUnlockHint(def.id),
    name: tGearDungeonName(def.id, preset),
    blurb: tGearDungeonBlurb(def.id, preset),
    lootLine: affixSuffix ? `${lootLine}${affixSuffix}` : lootLine,
    encounterLabels: def.encounterPool.map(encounterLabel),
    featuredAffixNames: affixNames,
    pressure: def.pressure,
    staminaCost: def.staminaCost,
    lootPreview: buildGearLootPreview(def),
    lootRarityMix: gearLootRarityMix(def, preset),
  };
}
