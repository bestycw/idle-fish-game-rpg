import type { GearDungeonTier } from './gearDungeons.js';

/** 猎装「副本线」：左侧列表一项；右侧切换难度档，对应不同引擎实例 id */
export interface GearDungeonLineDef {
  id: string;
  order: number;
  tiers: Partial<Record<GearDungeonTier, string>>;
}

export const GEAR_DUNGEON_LINES: GearDungeonLineDef[] = [
  {
    id: 'line_wall',
    order: 1,
    tiers: { normal: 'gear_break_wall', hard: 'gear_spirit_array' },
  },
  {
    id: 'line_archer',
    order: 2,
    tiers: { normal: 'gear_arrow_lane', hard: 'gear_arrow_hard' },
  },
  {
    id: 'line_raider',
    order: 3,
    tiers: { normal: 'gear_raider_trail', hard: 'gear_raider_hard' },
  },
  {
    id: 'line_chaos',
    order: 4,
    tiers: { hard: 'gear_chaos_shrine', hell: 'gear_chaos_hell' },
  },
  {
    id: 'line_warden',
    order: 5,
    tiers: { hell: 'gear_warden_trial' },
  },
];

const lineById = new Map(GEAR_DUNGEON_LINES.map((l) => [l.id, l]));

const dungeonToLine = new Map<string, GearDungeonLineDef>();
for (const line of GEAR_DUNGEON_LINES) {
  for (const dungeonId of Object.values(line.tiers)) {
    if (dungeonId) dungeonToLine.set(dungeonId, line);
  }
}

export const GEAR_TIER_TAB_ORDER: GearDungeonTier[] = ['normal', 'hard', 'hell', 'rift'];

export function getGearDungeonLine(lineId: string): GearDungeonLineDef | undefined {
  return lineById.get(lineId);
}

export function getLineForGearDungeonId(dungeonId: string): GearDungeonLineDef | undefined {
  return dungeonToLine.get(dungeonId);
}

export function dungeonIdOnLine(line: GearDungeonLineDef, tier: GearDungeonTier): string | undefined {
  return line.tiers[tier];
}

export function tiersOnLine(line: GearDungeonLineDef): GearDungeonTier[] {
  return GEAR_TIER_TAB_ORDER.filter((t) => Boolean(line.tiers[t]));
}
