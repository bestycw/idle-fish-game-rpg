/**
 * SAVE_VERSION 16：国外卡映射到中土，或折碎片。
 */
import { defaultProgress } from '../character/growth.js';
import { getTemplate, UNIT_TEMPLATES } from '../character/templates.js';
import type { CharacterProgress, PlayerState, Role } from '../shared/types.js';

/** 核心深做点名映射 */
export const ZHONGTU_ID_MAP: Record<string, string> = {
  heracles: 'xingtian',
  athena: 'nuwa',
  medusa: 'huapi',
  thor: 'leizhenzi',
  robin: 'nieyinniang',
  arthur: 'lishimin',
  beowulf: 'chiyou',
};

/** 扩展国外卡：按原职能填空 */
export const REMOVED_FOREIGN_ROLES: Record<string, Role> = {
  zeus: 'aoe_dps',
  poseidon: 'aoe_ctrl',
  hades: 'st_ctrl',
  apollo: 'st_burst',
  artemis: 'st_burst',
  ares: 'flex',
  hermes: 'flex',
  hephaestus: 'tank',
  aphrodite: 'aoe_ctrl',
  perseus: 'st_burst',
  odysseus: 'group_amp',
  achilles: 'st_burst',
  hector: 'tank',
  orpheus: 'aoe_heal',
  circe: 'st_ctrl',
  prometheus: 'group_amp',
  atlas: 'tank',
  hera: 'st_ctrl',
  dionysus: 'aoe_ctrl',
  odin: 'group_amp',
  loki: 'aoe_ctrl',
  freya: 'flex',
  tyr: 'tank',
  heimdall: 'st_ctrl',
  baldur: 'aoe_heal',
  skadi: 'st_burst',
  fenrir: 'st_burst',
  lancelot: 'st_burst',
  gawain: 'aoe_dps',
  merlin: 'group_amp',
  morgana: 'aoe_ctrl',
  guinevere: 'aoe_heal',
  mordred: 'st_burst',
};

export const REMOVED_FOREIGN_IDS = new Set([
  ...Object.keys(ZHONGTU_ID_MAP),
  ...Object.keys(REMOVED_FOREIGN_ROLES),
]);

function shardGain(row: CharacterProgress): number {
  return 1 + (row.star ?? 0);
}

function zhongtuLegendaries(role: Role): string[] {
  return UNIT_TEMPLATES.filter(
    (t) => !t.isHero && t.role === role && t.rarity === 'legendary' && !REMOVED_FOREIGN_IDS.has(t.id),
  ).map((t) => t.id);
}

function resolveTarget(oldId: string, roster: PlayerState['roster']): string | undefined {
  const named = ZHONGTU_ID_MAP[oldId];
  if (named && getTemplate(named)) return named;
  const role = REMOVED_FOREIGN_ROLES[oldId];
  if (!role) return undefined;
  const ids = zhongtuLegendaries(role);
  const unowned = ids.find((id) => !roster[id]?.owned);
  if (unowned) return unowned;
  return ids[0];
}

function mergeProgress(dest: CharacterProgress, src: CharacterProgress): CharacterProgress {
  return {
    ...dest,
    owned: true,
    level: Math.max(dest.level ?? 1, src.level ?? 1),
    exp: dest.owned ? dest.exp : src.exp,
    breakthroughTier: Math.max(dest.breakthroughTier ?? 0, src.breakthroughTier ?? 0),
    cultivationNodes: dest.owned ? dest.cultivationNodes : src.cultivationNodes,
    star: dest.owned ? dest.star : src.star,
    cardShards: (dest.cardShards ?? 0) + (dest.owned ? shardGain(src) : src.cardShards ?? 0),
    starBranch: dest.owned ? dest.starBranch : src.starBranch,
  };
}

export function migrateZhongtuV16(state: PlayerState): PlayerState {
  const roster = { ...(state.roster ?? {}) };
  let formation = { ...(state.formation ?? {}) };
  const characterEquip = { ...(state.characterEquip ?? {}) };

  for (const oldId of [...REMOVED_FOREIGN_IDS]) {
    const row = roster[oldId];
    if (!row?.owned) {
      delete roster[oldId];
      delete formation[oldId];
      delete characterEquip[oldId];
      continue;
    }
    const target = resolveTarget(oldId, roster);
    if (!target) {
      delete roster[oldId];
      delete formation[oldId];
      delete characterEquip[oldId];
      continue;
    }
    const dest = roster[target] ?? defaultProgress(target);
    const already = Boolean(dest.owned);
    roster[target] = mergeProgress(dest, row);
    if (formation[oldId] != null) {
      if (formation[target] == null) formation[target] = formation[oldId];
      delete formation[oldId];
    }
    if (characterEquip[oldId]) {
      if (!already && !characterEquip[target]) characterEquip[target] = characterEquip[oldId];
      delete characterEquip[oldId];
    }
    delete roster[oldId];
  }

  return { ...state, roster, formation, characterEquip };
}
