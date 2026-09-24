import type { EquipSlot } from '../../shared/types.js';
import { t3GroupOf, type T3Group } from './slots.js';

export type T3Scope = 'combat' | 'out_of_combat';

export type T3ActionScope =
  | 'battle_party'
  | 'mine'
  | 'tower'
  | 'stardust'
  | 'disassemble';

export interface T3Def {
  id: string;
  name: string;
  group: T3Group;
  description: string;
  scope: T3Scope;
  actionScope?: T3ActionScope;
}

/**
 * 新 T3：registerT3 进生成池；战斗效果再 registerT3Hooks。
 * 场外效果用 actionScope，结算处查 deployedHasT3 / characterHasT3。
 */
const DEFS: T3Def[] = [
  { id: 'fx_crit_bleed', name: '噬血锋', group: 'weapon', scope: 'combat', description: '暴击→流血 1 层 2 回合' },
  { id: 'fx_slow_hit', name: '凝滞', group: 'weapon', scope: 'combat', description: '攻击 15%→迟缓 1 回合' },
  { id: 'fx_splash', name: '震荡', group: 'weapon', scope: 'combat', description: '单体命中 15%→溅射相邻（该下 25%）' },
  { id: 'fx_bleed_spread', name: '溅血', group: 'weapon', scope: 'combat', description: '击杀流血目标→相邻继承 1 层' },
  { id: 'fx_skill_mark', name: '点印', group: 'weapon', scope: 'combat', description: '技能命中 20%→猎印 1 回合' },
  { id: 'fx_skill_shred', name: '裂甲', group: 'weapon', scope: 'combat', description: '技能命中 35%→破甲 1 回合' },
  { id: 'fx_purge_hit', name: '破灵', group: 'weapon', scope: 'combat', description: '命中有盾则驱散，每回合最多 1 次' },
  { id: 'fx_soul_rip', name: '夺魂', group: 'weapon', scope: 'combat', description: '击杀 +6 气' },
  { id: 'fx_shield_qi', name: '破盾息', group: 'weapon', scope: 'combat', description: '打破/驱散护盾时 +4 气' },
  { id: 'fx_follow_up', name: '收势', group: 'weapon', scope: 'combat', description: '本场第一次技能后，下一记普攻倍率 +0.3' },

  { id: 'fx_start_shield', name: '先手结界', group: 'armor', scope: 'combat', description: '开战盾 8% 最大生命' },
  { id: 'fx_hit_shield', name: '临危结界', group: 'armor', scope: 'combat', description: '被击 15% 获盾 6% 生命' },
  { id: 'fx_cc_cut', name: '不动心', group: 'armor', scope: 'combat', description: '被控时长 −1，至少 1' },
  { id: 'fx_death_save', name: '逆天改命', group: 'armor', scope: 'combat', description: '致死留 1 血，每场 1 次' },
  { id: 'fx_self_cleanse', name: '自净', group: 'armor', scope: 'combat', description: '每 3 回合清 1 负面' },
  { id: 'fx_block_qi', name: '铁壁微息', group: 'armor', scope: 'combat', description: '格挡 +5 气' },
  { id: 'fx_dodge_heal', name: '闪身回元', group: 'armor', scope: 'combat', description: '闪避回 2% 生命' },
  { id: 'fx_ally_cover', name: '同袍', group: 'armor', scope: 'combat', description: '相邻致死 20% 分摊 25%' },
  { id: 'fx_cc_end_heal', name: '起身', group: 'armor', scope: 'combat', description: '控制结束回 4% 血' },
  { id: 'fx_front_guard', name: '护阵', group: 'armor', scope: 'combat', description: '自己在前排时，后排相邻单次受伤分走 10%' },

  { id: 'fx_heal_cleanse', name: '净疗', group: 'accessory', scope: 'combat', description: '治疗 25% 净化 1 个负面' },
  { id: 'fx_buff_extend', name: '余韵', group: 'accessory', scope: 'combat', description: '增益 25% 延长 1 回合' },
  { id: 'fx_qi_share', name: '引气', group: 'accessory', scope: 'combat', description: '技能后 25% 邻 +4 气' },
  { id: 'fx_debuff_reflect', name: '因果', group: 'accessory', scope: 'combat', description: '被上负面 15% 弹回' },

  { id: 'fx_lucky_stone', name: '鸿运', group: 'accessory', scope: 'out_of_combat', actionScope: 'battle_party', description: '本场胜利 +1 强化石' },
  { id: 'fx_gold_find', name: '点金', group: 'accessory', scope: 'out_of_combat', actionScope: 'battle_party', description: '本场金币 +12%' },
  { id: 'fx_dust_find', name: '拾尘', group: 'accessory', scope: 'out_of_combat', actionScope: 'battle_party', description: '结束 8% +1 洗练尘' },
  { id: 'fx_mine_gem', name: '探脉', group: 'accessory', scope: 'out_of_combat', actionScope: 'mine', description: '本次采矿宝石率相对 +25%' },
  { id: 'fx_tower_xp', name: '登塔', group: 'accessory', scope: 'out_of_combat', actionScope: 'tower', description: '本次爬塔修为 +10%' },
  { id: 'fx_star_dust', name: '观星', group: 'accessory', scope: 'out_of_combat', actionScope: 'stardust', description: '本次秘境星尘 +10%' },
  { id: 'fx_disassemble', name: '拆骨', group: 'accessory', scope: 'out_of_combat', actionScope: 'disassemble', description: '点分解的当前角色额外 +1 石' },
];

const registry = new Map<string, T3Def>();

export function registerT3(def: T3Def): void {
  registry.set(def.id, def);
}

for (const def of DEFS) registerT3(def);

export function getT3Def(id: string): T3Def | undefined {
  return registry.get(id);
}

export function listT3ByGroup(group: T3Group): T3Def[] {
  return [...registry.values()].filter((d) => d.group === group);
}

export function listT3ForSlot(slot: EquipSlot): T3Def[] {
  return listT3ByGroup(t3GroupOf(slot));
}

/** 兼容旧名 */
export function getEffectAffixDef(id: string): T3Def | undefined {
  return getT3Def(id);
}

export const T3_DEFS: T3Def[] = DEFS;
