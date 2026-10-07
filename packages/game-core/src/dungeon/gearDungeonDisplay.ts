import { gearDungeonCombatReadout } from '../chapter/powerSpine.js';
import { isContentUnlocked } from '../chapter/progress.js';
import type { PlayerState, WorldPreset } from '../shared/types.js';
import { isBossEncounterId } from './encounters.js';
import { gearDungeonEncounterChipLabel } from './gearDungeonEnemySkin.js';
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
  tGearDungeonName,
} from './gearDungeonLocale.js';

export type GearDungeonView = {
  id: string;
  tier: GearDungeonDef['tier'];
  unlocked: boolean;
  unlockHint: string;
  name: string;
  blurb: string;
  encounters: { id: string; label: string; isBoss: boolean }[];
  pressure: number;
  staminaCost: number;
  /** 当前存档进度下建议队伍战力（战力脊柱） */
  playerTargetPower: number;
  lootPreview: LootPreviewTile[];
  lootRarityMix: GearLootRarityMixEntry[];
};

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
          view: buildGearDungeonView(def, preset, unlocked, state.chapterCleared ?? 0),
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
  chapterCleared = 0,
): GearDungeonView {
  const spine = gearDungeonCombatReadout(def.id, chapterCleared);
  return {
    id: def.id,
    tier: def.tier,
    unlocked,
    unlockHint: gearDungeonUnlockHint(def.id),
    name: tGearDungeonName(def.id, preset),
    blurb: tGearDungeonBlurb(def.id, preset),
    encounters: def.encounterPool.map((id) => ({
      id,
      label: gearDungeonEncounterChipLabel(def.id, id, preset),
      isBoss: isBossEncounterId(id),
    })),
    pressure: def.pressure,
    staminaCost: def.staminaCost,
    playerTargetPower: spine?.playerTargetNow ?? 0,
    lootPreview: buildGearLootPreview(def),
    lootRarityMix: gearLootRarityMix(def, preset),
  };
}
