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
  // ─── 武器组（15）───────────────────────────────────────────
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
  { id: 'fx_bleed_spread', name: '溅血', group: 'weapon', description: '击杀流血目标→流血扩散给相邻1人' },
  { id: 'fx_slow_hit', name: '凝滞之触', group: 'weapon', description: '攻击时15%概率附带迟缓1回合' },
  { id: 'fx_debuff_amp', name: '趁火打劫', group: 'weapon', description: '对有2个+debuff的目标+10%伤害' },
  { id: 'fx_last_stand', name: '背水一战', group: 'weapon', description: '自身HP<30%时伤害+15%' },
  { id: 'fx_consecutive', name: '连斩', group: 'weapon', description: '目标有猎印或2层+流血→+12%伤害' },
  // ─── 防具组（15）───────────────────────────────────────────
  { id: 'fx_hit_shield', name: '临危结界', group: 'armor', description: '被击→20%获护盾(10%最大生命)' },
  { id: 'fx_low_regen', name: '绝境回春', group: 'armor', description: 'HP<25%+回合开始→回8%血' },
  { id: 'fx_block_qi', name: '铁壁蓄能', group: 'armor', description: '格挡→回能+10' },
  { id: 'fx_cc_cut', name: '不动心', group: 'armor', description: '被控→减少1回合(至少1)' },
  { id: 'fx_death_save', name: '逆天改命', group: 'armor', description: '致死→存活1血(每场1次)' },
  { id: 'fx_start_shield', name: '先手结界', group: 'armor', description: '开战→获15%最大生命护盾' },
  { id: 'fx_heal_on_cc', name: '逆境重生', group: 'armor', description: '被控时回5%最大生命' },
  { id: 'fx_ally_cover', name: '同袍守护', group: 'armor', description: '相邻队友致命伤时20%帮分摊30%伤害（暂未实装）' },
  { id: 'fx_self_cleanse', name: '自净', group: 'armor', description: '每3回合自动净化自身1个debuff' },
  { id: 'fx_thorns_block', name: '以盾为矛', group: 'armor', description: '格挡时反弹15%伤害给攻击者（暂未实装）' },
  { id: 'fx_dodge_heal', name: '灵动回气', group: 'armor', description: '闪避后回3%最大生命（暂未实装）' },
  { id: 'fx_taunt_reflect', name: '嘲讽之壁', group: 'armor', description: '本回合被攻击3次后反伤10%（暂未实装）' },
  { id: 'fx_hp_def_scale', name: '厚积薄发', group: 'armor', description: 'HP>80%时DEF+10%（暂未实装）' },
  { id: 'fx_revive_boost', name: '浴火重生', group: 'armor', description: '从致死存活后额外回10%最大生命（暂未实装）' },
  { id: 'fx_damage_share', name: '金刚法身', group: 'armor', description: '单次受伤超过20%最大生命时溢出部分减半（暂未实装）' },
  // ─── 饰品组（15）───────────────────────────────────────────
  { id: 'fx_heal_cleanse', name: '净疗', group: 'accessory', description: '治疗→30%净化1个debuff' },
  { id: 'fx_buff_extend', name: '余韵', group: 'accessory', description: '施buff→25%延长1回合' },
  { id: 'fx_qi_start', name: '先天蓄能', group: 'accessory', description: '开战→能量+15' },
  { id: 'fx_purge_hit', name: '破灵一击', group: 'accessory', description: '目标有盾→驱散' },
  { id: 'fx_qi_share', name: '引气', group: 'accessory', description: '技能释放后30%给相邻队友+5能量（暂未实装）' },
  { id: 'fx_fortune_drop', name: '鸿运', group: 'accessory', description: '击杀时10%额外掉1颗强化石（暂未实装）' },
  { id: 'fx_debuff_reflect', name: '因果报应', group: 'accessory', description: '被施debuff时15%反弹给施加者' },
  { id: 'fx_heal_boost_low', name: '回春妙手', group: 'accessory', description: '治疗HP<50%队友时+15%' },
  { id: 'fx_start_qi_team', name: '全队聚气', group: 'accessory', description: '开战→全队回能+5' },
  { id: 'fx_set_bonus_amp', name: '套装共鸣', group: 'accessory', description: '每激活1个套装效果→全属性+1%（暂未实装）' },
  { id: 'fx_kill_debuff_spread', name: '灭口', group: 'accessory', description: '击杀时目标身上的debuff扩散给相邻' },
  { id: 'fx_shield_heal', name: '盾消回血', group: 'accessory', description: '护盾破碎时回复盾值30%的血（暂未实装）' },
  { id: 'fx_aoe_resist', name: '散功', group: 'accessory', description: '受AOE伤害时-15%（暂未实装）' },
  { id: 'fx_ally_atk_boost', name: '激将', group: 'accessory', description: '相邻队友击杀时自身+8%ATK持续2回合（暂未实装）' },
  { id: 'fx_combat_veteran', name: '久战弥坚', group: 'accessory', description: '第4回合后伤害+5%' },
];

const SLOT_GROUP: Record<EquipSlot, 'weapon' | 'armor' | 'accessory'> = {
  weapon: 'weapon',
  offhand: 'weapon',
  head: 'armor',
  chest: 'armor',
  hands: 'armor',
  feet: 'armor',
  legs: 'armor',
  neck: 'accessory',
  ring1: 'accessory',
  ring2: 'accessory',
  trinket1: 'accessory',
  trinket2: 'accessory',
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
