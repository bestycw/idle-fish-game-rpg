import { equipItem } from '../equipment/equipment.js';
import { migrateSeenItemIds } from '../equipment/unseen.js';
import { canWearEquipment, wearBlockedReason } from '../equipment/wear.js';
import { defaultFormation, normalizeFormation } from '../formation/formation.js';
import {
  defaultNewNarrativeState,
  migratedMainlineNarrative,
} from '../narrative/onboarding.js';
import { normalizePlayerNarrative } from '../narrative/narrativePreferences.js';
import type { Equipment, EquipSlot, PlayerState, SaveAdapter } from '../shared/types.js';
import {
  defaultCurrencies,
  ensureRoster,
  migrateLegacyRealmTier,
} from '../character/growth.js';
import { UNIT_TEMPLATES } from '../character/templates.js';
import { SAMPLE_GEAR_PREFIX } from '../equipment/sample.js';
import {
  ensureStarterEquipmentKit,
  grantStarterEquipmentKit,
  playerNeedsStarterKit,
  rebalanceStarterKitInventory,
} from '../equipment/starterKit.js';
import { ensureStarterTrialRoster } from '../formation/starterTrial.js';
import { STAMINA_MAX, syncStamina } from '../stamina/stamina.js';
import { migrateZhongtuV16, REMOVED_FOREIGN_IDS } from './zhongtuMigrate.js';

type LegacySave = Omit<Partial<PlayerState>, 'version'> & { version?: number };

const SAVE_VERSION = 18 as const;

function normalizePlayerNarrativeOnLoad(
  narrative: PlayerState['narrative'],
): PlayerState['narrative'] {
  return normalizePlayerNarrative(narrative) ?? narrative;
}

/** 旧占位卡 + 已下架国外 id；迁移时从 roster/formation 剔除 */
const REMOVED_TEMPLATE_IDS = new Set([
  'tank_a',
  'burst_a',
  'aoe_a',
  'col_a',
  'heal_a',
  'ctrl_a',
  ...REMOVED_FOREIGN_IDS,
]);

function stripDevSampleGear(state: PlayerState): PlayerState {
  if (!state.inventory.some((e) => e.id.startsWith(SAMPLE_GEAR_PREFIX))) return state;
  return {
    ...state,
    inventory: state.inventory.filter((e) => !e.id.startsWith(SAMPLE_GEAR_PREFIX)),
  };
}

function withStaminaDefaults(state: PlayerState, now = Date.now()): PlayerState {
  const withChapter = {
    ...state,
    chapterCleared: state.chapterCleared ?? 0,
    chapterNodeIndex: state.chapterNodeIndex ?? 0,
    chapterBattleWaveIndex: state.chapterBattleWaveIndex ?? 0,
    lastDailyClaimDay: state.lastDailyClaimDay,
    version: SAVE_VERSION,
  };
  const base =
    withChapter.stamina == null || withChapter.staminaUpdatedAt == null
      ? { ...withChapter, stamina: STAMINA_MAX, staminaUpdatedAt: now }
      : withChapter;
  return syncStamina(base, now);
}

function pruneRoster(
  roster: PlayerState['roster'] | undefined,
): PlayerState['roster'] {
  const next: PlayerState['roster'] = {};
  const valid = new Set(UNIT_TEMPLATES.map((t) => t.id));
  for (const [id, row] of Object.entries(roster ?? {})) {
    if (!valid.has(id) || REMOVED_TEMPLATE_IDS.has(id)) continue;
    next[id] = row;
  }
  return next;
}

export function createInitialPlayer(seed = Date.now() % 1_000_000): PlayerState {
  const now = Date.now();
  const base: PlayerState = {
    version: SAVE_VERSION,
    gold: 0,
    inventory: [],
    equipped: {},
    formation: defaultFormation(),
    heroManual: false,
    wins: 0,
    seed,
    encounterIndex: 0,
    currencies: { ...defaultCurrencies(), xiuwei: 36, stardust: 20, ticket: 12 },
    roster: {},
    towerFloor: 1,
    gachaPity: 0,
    stamina: STAMINA_MAX,
    staminaUpdatedAt: now,
    chapterCleared: 0,
    chapterNodeIndex: 0,
    chapterBattleWaveIndex: 0,
    characterEquip: {},
    narrative: defaultNewNarrativeState(),
  };
  return ensureStarterTrialRoster(ensureRoster(base));
}

/** Migrate old shared `equipped` to per-character `characterEquip` */
function migrateEquipToPerCharacter(state: PlayerState): PlayerState {
  if (state.characterEquip && Object.keys(state.characterEquip).length > 0) return state;
  if (!state.equipped || Object.keys(state.equipped).length === 0) return state;

  // Slot remapping from old 16-slot to new 12-slot
  const slotRemap: Record<string, EquipSlot> = {
    mainHand: 'weapon',
    offHand: 'offhand',
    head: 'head',
    shoulder: 'chest',
    back: 'legs',
    chest: 'chest',
    wrist: 'hands',
    hands: 'hands',
    waist: 'legs',
    legs: 'legs',
    feet: 'feet',
    neck: 'neck',
    finger1: 'ring1',
    finger2: 'ring2',
    trinket1: 'trinket1',
    trinket2: 'trinket2',
  };

  // Give all old equipped items to first deployed character
  const deployed = Object.keys(state.formation);
  const firstChar = deployed[0] ?? 'hero';
  const charSlots: Partial<Record<EquipSlot, string>> = {};

  for (const [oldSlot, eqId] of Object.entries(state.equipped)) {
    if (!eqId) continue;
    const newSlot = slotRemap[oldSlot];
    if (!newSlot) continue;
    // Only take first item per new slot
    if (!charSlots[newSlot]) {
      charSlots[newSlot] = eqId;
    }
  }

  // Also remap inventory items to new slot types
  const inventory = state.inventory.map((item) => {
    const newSlot = slotRemap[item.slot as string];
    if (newSlot && newSlot !== item.slot) {
      return {
        ...item,
        slot: newSlot,
        baseStats: item.baseStats ?? {},
        socketCount: item.socketCount ?? 0,
        enhanceLevel: item.enhanceLevel ?? 0,
      };
    }
    return {
      ...item,
      baseStats: item.baseStats ?? {},
      socketCount: item.socketCount ?? 0,
      enhanceLevel: item.enhanceLevel ?? 0,
    };
  });

  return {
    ...state,
    inventory,
    characterEquip: { [firstChar]: charSlots },
    equipped: {},
  };
}

export function loadOrCreatePlayer(adapter: SaveAdapter): PlayerState {
  const loaded = adapter.load() as LegacySave | null;
  const loadedVersion = typeof loaded?.version === 'number' ? loaded.version : null;
  if (
    loaded &&
    loadedVersion != null &&
    loadedVersion >= 2 &&
    loadedVersion <= SAVE_VERSION
  ) {
    const now = Date.now();
    const fromPreV9 = loadedVersion < 9;
    const rawFormation = loaded.formation ?? {};
    const formation = fromPreV9
      ? defaultFormation()
      : !rawFormation || Object.keys(rawFormation).length === 0
        ? defaultFormation()
        : normalizeFormation(rawFormation);

    const migrated: PlayerState = {
      version: SAVE_VERSION,
      gold: loaded.gold ?? 0,
      inventory: loaded.inventory ?? [],
      equipped: loaded.equipped ?? {},
      formation,
      heroManual: Boolean(loaded.heroManual),
      wins: loaded.wins ?? 0,
      seed: loaded.seed ?? Date.now() % 1_000_000,
      encounterIndex: loaded.encounterIndex ?? 0,
      currencies: {
        ...defaultCurrencies(),
        ...(loaded.currencies ?? {}),
      },
      roster: loaded.roster ?? {},
      towerFloor: Math.max(1, loaded.towerFloor ?? 1),
      gachaPity: Math.max(0, loaded.gachaPity ?? 0),
      stamina: loaded.stamina ?? STAMINA_MAX,
      staminaUpdatedAt: loaded.staminaUpdatedAt ?? now,
      chapterCleared: Math.max(0, loaded.chapterCleared ?? 0),
      chapterNodeIndex: Math.max(0, loaded.chapterNodeIndex ?? 0),
      chapterBattleWaveIndex: Math.max(0, loaded.chapterBattleWaveIndex ?? 0),
      lastDailyClaimDay:
        typeof loaded.lastDailyClaimDay === 'string' ? loaded.lastDailyClaimDay : undefined,
      characterEquip: (loaded as any).characterEquip ?? {},
      characterMorphs: (loaded as any).characterMorphs,
      morphStones: (loaded as any).morphStones,
      enhanceStones: (loaded as any).enhanceStones,
      gems: (loaded as any).gems,
      mineCountToday: (loaded as any).mineCountToday,
      mineDay: (loaded as any).mineDay,
      mineExtraLimit: (loaded as any).mineExtraLimit,
      seenItemIds: migrateSeenItemIds(loaded as any),
      narrative: normalizePlayerNarrativeOnLoad((loaded as PlayerState).narrative),
    };
    if (loadedVersion === 2) {
      migrated.currencies.xiuwei = Math.max(migrated.currencies.xiuwei ?? 0, 80);
      migrated.currencies.stardust = Math.max(migrated.currencies.stardust ?? 0, 40);
    }
    if ((migrated.currencies.ticket ?? 0) < 1 && (loadedVersion ?? 0) < 5) {
      migrated.currencies.ticket = Math.max(migrated.currencies.ticket ?? 0, 12);
    }
    // v10→v11: attribute system migration (affix stat keys)
    if ((loadedVersion ?? 0) < 11) {
      const statRemap: Record<string, string> = {
        physAtk: 'atk',
        spiritAtk: 'atk',
        physDef: 'def',
        spiritDef: 'res',
        hasteRating: 'penRating',
        versRating: 'tenacityRating',
        finalDmgRating: 'penRating',
        fortune: 'fortuneRating',
      };
      for (const item of migrated.inventory) {
        for (const affix of item.affixes) {
          const mapped = statRemap[affix.stat];
          if (mapped) affix.stat = mapped as any;
        }
      }
    }
    // v11→v12: migrate shared equipped to per-character
    if ((loadedVersion ?? 0) < 12) {
      const migrated2 = migrateEquipToPerCharacter(migrated);
      Object.assign(migrated, migrated2);
    }
    if ((loadedVersion ?? 0) < 13) {
      migrated.inventory = [];
      migrated.characterEquip = {};
      migrated.equipped = {};
      migrated.sealStamp = undefined;
    }
    if ((loadedVersion ?? 0) < 14) {
      for (const [id, row] of Object.entries(migrated.roster)) {
        migrated.roster[id] = {
          ...row,
          breakthroughTier: migrateLegacyRealmTier(row.breakthroughTier ?? 0),
        };
      }
    }
    if ((loadedVersion ?? 0) < 16) {
      Object.assign(migrated, migrateZhongtuV16(migrated));
    }
    if ((loadedVersion ?? 0) < 17) {
      migrated.narrative = migrated.narrative ?? migratedMainlineNarrative();
    }
    migrated.roster = pruneRoster(migrated.roster);
    // 迁移后若阵容被剔空，回默认（主角 + 开局紫）
    if (Object.keys(normalizeFormation(migrated.formation)).length === 0) {
      migrated.formation = defaultFormation(migrated.starterCompanionId);
    }
    migrated.equipped = {};
    let ready = withStaminaDefaults(ensureRoster(migrated), now);
    if (playerNeedsStarterKit(ready)) {
      ready = grantStarterEquipmentKit(ready);
    } else {
      ready = ensureStarterEquipmentKit(ready);
    }
    ready = rebalanceStarterKitInventory(ready);
    return stripDevSampleGear(ready);
  }
  const fresh = stripDevSampleGear(
    rebalanceStarterKitInventory(
      grantStarterEquipmentKit(ensureStarterTrialRoster(createInitialPlayer())),
    ),
  );
  adapter.save(fresh);
  return fresh;
}

export function persistPlayer(adapter: SaveAdapter, state: PlayerState): void {
  adapter.save(withStaminaDefaults(ensureRoster(state)));
}

export function firstWearableDeployed(state: PlayerState, item: Equipment): string | undefined {
  return Object.keys(normalizeFormation(state.formation)).find((id) =>
    canWearEquipment(item, state.roster?.[id]?.breakthroughTier ?? 0),
  );
}

export type WearLootResult = {
  state: PlayerState;
  ok: boolean;
  message?: string;
};

export function wearLoot(state: PlayerState, itemId: string): WearLootResult {
  const item = state.inventory.find((e) => e.id === itemId);
  if (!item) {
    return { ok: false, state, message: '背包里找不到这件装备。' };
  }
  const wearer = firstWearableDeployed(state, item);
  if (!wearer) {
    return { ok: false, state, message: `阵中无人可穿戴（装等 ${item.itemLevel}）。` };
  }
  const tier = state.roster?.[wearer]?.breakthroughTier ?? 0;
  const blocked = wearBlockedReason(item, tier);
  if (blocked) {
    return { ok: false, state, message: blocked };
  }
  const next = equipItem(state, itemId, wearer);
  if (next.characterEquip?.[wearer]?.[item.slot] !== itemId) {
    return { ok: false, state, message: '该装备已被其他角色穿戴。' };
  }
  return { ok: true, state: next };
}
