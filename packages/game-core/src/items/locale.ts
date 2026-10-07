import type { WorldPreset } from '../shared/types.js';
import { getItemDef } from './registry.js';

export type ItemLocaleEntry = { name: string; desc?: string };

export type ItemLocaleTable = Record<string, ItemLocaleEntry>;

/** 中性默认（缺皮时回退） */
export const LOCALE_NEUTRAL: ItemLocaleTable = {
  gold: { name: '金币', desc: '通用流通货币' },
  stardust: { name: '星尘', desc: '慢速积累的兑换资源' },
  xiuwei: { name: '修为', desc: '破境与修行用' },
  ticket: { name: '寻访券', desc: '召唤消耗' },
  enhance_stone: { name: '强化石', desc: '装备强化与封存' },
  reroll_dust: { name: '洗练尘', desc: '重铸装备随机词' },
  character_exp: { name: '经验', desc: '伙伴升级' },
  exp_pill_1: { name: '初级经验丹', desc: '服用后获得少量经验' },
  exp_pill_2: { name: '中级经验丹', desc: '服用后获得中量经验' },
  exp_pill_3: { name: '高级经验丹', desc: '服用后获得大量经验' },
  exp_pill_4: { name: '特级经验丹', desc: '服用后获得巨量经验' },
  gem_atk: { name: '攻击宝石' },
  gem_def: { name: '防御宝石' },
  gem_res: { name: '灵抗宝石' },
  gem_hp: { name: '生命宝石' },
  gem_crit: { name: '暴击宝石' },
  gem_pen: { name: '穿透宝石' },
  gem_mastery: { name: '精通宝石' },
  gem_tenacity: { name: '坚韧宝石' },
  morph_bleed_edge: { name: '血刃形态石' },
  morph_frost_touch: { name: '寒霜形态石' },
  morph_life_drain: { name: '汲命形态石' },
  morph_shield_break: { name: '破盾形态石' },
  morph_chain: { name: '连锁形态石' },
  morph_guard_up: { name: '坚壁形态石' },
  morph_echo_strike: { name: '回音形态石' },
  morph_cleanse_heal: { name: '净化形态石' },
  cons_battle_rations: { name: '战粮' },
  cons_stamina_elixir: { name: '体力药' },
  mat_herb_mist: { name: '雾露草' },
  mat_ore_iron: { name: '铁矿石' },
};

export const LOCALE_XIANXIA: ItemLocaleTable = {
  gold: { name: '灵石', desc: '诸界流通的硬通货' },
  stardust: { name: '星尘', desc: '界隙沉淀的微尘' },
  xiuwei: { name: '修为', desc: '破境参悟所积' },
  ticket: { name: '寻访帖', desc: '叩问命格的凭引' },
  enhance_stone: { name: '淬灵石', desc: '温养器纹的粗坯' },
  reroll_dust: { name: '洗练砂', desc: '重淬器纹余屑' },
  character_exp: { name: '经验', desc: '伙伴历练' },
  /** 阅历系：与修为/破境丹区分 */
  exp_pill_1: { name: '阅历散', desc: '薄薄一层行路见闻，服之略长本事' },
  exp_pill_2: { name: '历练丹', desc: '集数场磨砺之识，服之精进' },
  exp_pill_3: { name: '精修丹', desc: '苦练凝成的体悟，服之长进显著' },
  exp_pill_4: { name: '百战丹', desc: '百战余韵入药，服之可破经验瓶颈' },
  gem_atk: { name: '力量灵珠' },
  gem_def: { name: '坚固灵珠' },
  gem_res: { name: '灵护灵珠' },
  gem_hp: { name: '生机灵珠' },
  gem_crit: { name: '锐利灵珠' },
  gem_pen: { name: '穿透灵珠' },
  gem_mastery: { name: '通明灵珠' },
  gem_tenacity: { name: '坚韧灵珠' },
  morph_bleed_edge: { name: '血刃形胚' },
  morph_frost_touch: { name: '寒霜形胚' },
  morph_life_drain: { name: '汲命形胚' },
  morph_shield_break: { name: '破盾形胚' },
  morph_chain: { name: '连锁形胚' },
  morph_guard_up: { name: '坚壁形胚' },
  morph_echo_strike: { name: '回音形胚' },
  morph_cleanse_heal: { name: '净愈形胚' },
  cons_battle_rations: { name: '行军干粮' },
  cons_stamina_elixir: { name: '回气丹' },
  mat_herb_mist: { name: '雾露灵草' },
  mat_ore_iron: { name: '玄铁矿' },
  mat_ore_spirit: { name: '灵矿砂' },
};

/** 武侠皮：练手精进，不跟修为混 */
export const LOCALE_WUXIA: ItemLocaleTable = {
  ...LOCALE_XIANXIA,
  gold: { name: '银两', desc: '江湖流通的硬通货' },
  xiuwei: { name: '内力', desc: '破境参悟所积' },
  ticket: { name: '英雄帖', desc: '寻访豪杰的凭引' },
  character_exp: { name: '经验', desc: '伙伴练手' },
  exp_pill_1: { name: '入门练手丹', desc: '初入江湖的薄功' },
  exp_pill_2: { name: '小成丹', desc: '小有所成的体悟' },
  exp_pill_3: { name: '大成丹', desc: '大成前的精进' },
  exp_pill_4: { name: '宗师感悟丹', desc: '近乎宗师的一缕感悟' },
};

export const LOCALE_CYBERPUNK: ItemLocaleTable = {
  gold: { name: '信用点', desc: '合约结算用的流通单位' },
  stardust: { name: '链屑', desc: '分布式账本掉落的碎片' },
  xiuwei: { name: '算力余温', desc: '神经训练积累的峰值' },
  ticket: { name: '招募码', desc: '人事池单次检索权' },
  enhance_stone: { name: '热插拔晶粒', desc: '外骨骼模组校准耗材' },
  reroll_dust: { name: '纳米沉屑', desc: '重编译模组用的粉尘' },
  character_exp: { name: '经验', desc: '伙伴同步进度' },
  exp_pill_1: { name: '基础神经贴片', desc: '低带宽技能缓存注入' },
  exp_pill_2: { name: '进阶同步芯片', desc: '中等同步增益' },
  exp_pill_3: { name: '深度灌注模块', desc: '高密度经验写入' },
  exp_pill_4: { name: '超频意识胶囊', desc: '短时超频训练峰值' },
  gem_atk: { name: '出力晶体' },
  gem_def: { name: '装甲晶体' },
  gem_res: { name: '滤波晶体' },
  gem_hp: { name: '续航晶体' },
  gem_crit: { name: '暴击晶体' },
  gem_pen: { name: '穿甲晶体' },
  gem_mastery: { name: '同步晶体' },
  gem_tenacity: { name: '稳态晶体' },
  morph_bleed_edge: { name: '血刃插件' },
  morph_frost_touch: { name: '冷凝插件' },
  cons_battle_rations: { name: '压缩口粮' },
  cons_stamina_elixir: { name: '兴奋剂胶囊' },
  mat_herb_mist: { name: '冷却凝胶原料' },
  mat_ore_iron: { name: '工业铁矿' },
};

const PRESET_TABLES: Record<WorldPreset, ItemLocaleTable> = {
  xianxia: LOCALE_XIANXIA,
  wuxia: LOCALE_WUXIA,
  cyberpunk: LOCALE_CYBERPUNK,
};

export function tItem(
  itemId: string,
  preset: WorldPreset = 'xianxia',
  overrides?: Record<string, string>,
): string {
  if (overrides?.[itemId]) return overrides[itemId];
  const presetTable = PRESET_TABLES[preset] ?? LOCALE_XIANXIA;
  const entry = presetTable[itemId] ?? LOCALE_NEUTRAL[itemId];
  if (entry?.name) return entry.name;
  const def = getItemDef(itemId);
  if (!def) return itemId;
  return itemId.replace(/_/g, ' ');
}

export function tItemDesc(
  itemId: string,
  preset: WorldPreset = 'xianxia',
): string | undefined {
  const presetTable = PRESET_TABLES[preset] ?? LOCALE_XIANXIA;
  return presetTable[itemId]?.desc ?? LOCALE_NEUTRAL[itemId]?.desc;
}
