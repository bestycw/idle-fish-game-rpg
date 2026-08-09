/**
 * T3 效果词缀：按槽位分池（武器/防具/饰品）。
 */
import type { EquipSlot, Rarity, Rng } from '../shared/types.js';

export interface EffectAffixDef {
  id: string;
  name: string;
  group: 'weapon' | 'armor' | 'accessory';
  description: string;
}

/** T3 效果池 */
export const EFFECT_AFFIX_POOL: EffectAffixDef[] = [
  // 武器组
  { id: 'fx_crit_bleed', name: '噬血锋', group: 'weapon', description: '暴击→挂1层流血(2回合)' },
  { id: 'fx_kill_qi', name: '杀意回元', group: 'weapon', description: '击杀→回能+20' },
  { id: 'fx_kill_heal', name: '嗜杀汲命', group: 'weapon', description: '击杀→回15%最大生命' },
  { id: 'fx_first_hit', name: '先发制人', group: 'weapon', description: '首击→伤害+30%' },
  { id: 'fx_low_execute', name: '断命', group: 'weapon', description: '目标HP<30%→伤害+20%' },
  { id: 'fx_splash', name: '震荡', group: 'weapon', description: '单体命中→15%溅射相邻30%伤害' },
  { id: 'fx_pen_shred', name: '透甲蚀骨', group: 'weapon', description: '穿透>30%→附带破甲1回合' },
  { id: 'fx_crit_qi', name: '会心蓄势', group: 'weapon', description: '暴击→回能+10' },
  { id: 'fx_combo_amp', name: '追击强化', group: 'weapon', description: '触发连击→连击伤害+50%' },
  { id: 'fx_mark_amp', name: '猎印增伤', group: 'weapon', description: '目标有猎印→+15%伤害' },
  // 防具组
  { id: 'fx_hit_shield', name: '临危结界', group: 'armor', description: '被击→20%获护盾(10%最大生命)' },
  { id: 'fx_low_regen', name: '绝境回春', group: 'armor', description: 'HP<25%+回合开始→回8%血' },
  { id: 'fx_block_qi', name: '铁壁蓄能', group: 'armor', description: '格挡→回能+10' },
  { id: 'fx_cc_cut', name: '不动心', group: 'armor', description: '被控→减少1回合(至少1)' },
  { id: 'fx_death_save', name: '逆天改命', group: 'armor', description: '致死→存活1血(每场1次)' },
  { id: 'fx_start_shield', name: '先手结界', group: 'armor', description: '开战→获15%最大生命护盾' },
  // 饰品组
  { id: 'fx_heal_cleanse', name: '净疗', group: 'accessory', description: '治疗→30%净化1个debuff' },
  { id: 'fx_buff_extend', name: '余韵', group: 'accessory', description: '施buff→25%延长1回合' },
  { id: 'fx_qi_start', name: '先天蓄能', group: 'accessory', description: '开战→能量+15' },
  { id: 'fx_purge_hit', name: '破灵一击', group: 'accessory', description: '目标有盾→驱散' },
];

const SLOT_GROUP: Record<EquipSlot, 'weapon' | 'armor' | 'accessory'> = {
  weapon: 'weapon',
  offhand: 'weapon',
  head: 'armor',
  chest: 'armor',
  hands: 'armor',
  feet: 'armor',
  back: 'armor',
  neck: 'accessory',
  ring: 'accessory',
  trinket: 'accessory',
};

export function getEffectPool(slot: EquipSlot): EffectAffixDef[] {
  const group = SLOT_GROUP[slot];
  return EFFECT_AFFIX_POOL.filter((e) => e.group === group);
}

/**
 * Roll T3 effect affixes for equipment.
 * Returns 0-2 effect affix ids.
 */
export function rollEffectAffixes(rng: Rng, rarity: Rarity, slot: EquipSlot): string[] {
  // common/uncommon: 0
  if (rarity === 'common' || rarity === 'uncommon') return [];

  const pool = getEffectPool(slot);
  if (pool.length === 0) return [];

  const results: string[] = [];

  if (rarity === 'rare') {
    // 20% chance for 1
    if (rng.next() < 0.2) {
      results.push(rng.pick(pool).id);
    }
  } else if (rarity === 'epic') {
    // guaranteed 1
    results.push(rng.pick(pool).id);
  } else if (rarity === 'legendary') {
    // 1 guaranteed + 50% for 2nd
    const first = rng.pick(pool);
    results.push(first.id);
    if (rng.next() < 0.5) {
      const remaining = pool.filter((e) => e.id !== first.id);
      if (remaining.length > 0) {
        results.push(rng.pick(remaining).id);
      }
    }
  }

  return results;
}

export function getEffectAffixDef(id: string): EffectAffixDef | undefined {
  return EFFECT_AFFIX_POOL.find((e) => e.id === id);
}
