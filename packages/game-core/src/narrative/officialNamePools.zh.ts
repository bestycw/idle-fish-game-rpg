/**
 * 官方名池 · 城镇 / 事发地点 / 剧情 NPC 人名
 * Skill 可整表采用 officialPick，或从 pool 另选（id 不变，只换 displayName）
 */

import type { WorldPreset } from '../shared/types.js';
import type { SpineLocationId, SpineNpcSlot, SpineTownId } from './volumeBeats.js';
import type { WorldSkinNames } from '../shared/types.js';

export interface PresetNamePool {
  /** 卷内 4 座城镇（非 loc_* 事发地） */
  towns: Record<SpineTownId, string>;
  /** 事发地点（关隘、林道、营盘等） */
  locations: Record<SpineLocationId, string>;
  /** 剧情 NPC · 人名（对话 speaker 用此） */
  npcs: Record<SpineNpcSlot, string>;
  /** 身份称谓（UI 副标题 / blurb 可带，校验不强制） */
  npcEpithets: Record<SpineNpcSlot, string>;
}

/** 可选城镇名 · 同 preset 内勿混用两套 official */
export const TOWN_NAME_POOL: Record<WorldPreset, readonly string[]> = {
  wuxia: ['江渡墟', '扶摇镇', '玄武城', '内堡关市', '霜桥渡', '雁回集'],
  xianxia: ['云栈渡', '灵墟坊', '天阙城', '劫域关', '青藜埠', '望劫台城'],
  cyberpunk: ['霓虹里', '栈桥区', '中枢环', '核心舱', '湿埠', '灰线城'],
};

export const NPC_NAME_POOL: Record<
  WorldPreset,
  Record<SpineNpcSlot, readonly string[]>
> = {
  wuxia: {
    npc_handler: ['顾行简', '陆远舟', '沈听澜', '程牧野'],
    npc_rival: ['沈照川', '萧惊鸿', '燕重楼', '季凌霄'],
    npc_elder: ['裴止渔', '谢观潮', '霍长平', '文载道'],
    npc_merchant: ['温折柳', '花满蹊', '柳三变', '杜拾遗'],
    npc_turncoat: ['陆不言', '无名客', '叶沉沙', '谢断鸿'],
  },
  xianxia: {
    npc_handler: ['谢鸣桡', '林渡川', '白栖梧', '楚行周'],
    npc_rival: ['韩承夜', '苏照寒', '秦试锋', '陆争流'],
    npc_elder: ['柳望虚', '顾玄微', '钟闻道', '魏守一'],
    npc_merchant: ['苏衔青', '药尘子', '云游子', '丹九如'],
    npc_turncoat: ['莫隐舟', '无名记名', '沈无咎', '夜归人'],
  },
  cyberpunk: {
    npc_handler: ['程岸', '林栖', '方舟', '杜信标'],
    npc_rival: ['魏骁', '韩刃', '陆竞', '苏燃'],
    npc_elder: ['唐律', '陈策', '赵衡', '许规'],
    npc_merchant: ['阮货', '老K', '灰栈', '零价'],
    npc_turncoat: ['匿频', '沈默码', '404', '深潜'],
  },
};

/** 卷一官方默认 · 一套「有骨有肉」的定稿组合 */
export const OFFICIAL_NAME_PICK: Record<WorldPreset, PresetNamePool> = {
  wuxia: {
    towns: {
      town_outer: '江渡墟',
      town_midland: '扶摇镇',
      town_marches: '玄武城',
      town_fortress: '内堡关市',
    },
    locations: {
      loc_gate: '西郊青石关',
      loc_forest: '乱阵林',
      loc_highland: '远矢岭',
      loc_camp: '关外营盘',
      loc_wastes: '风砂原',
      loc_rest: '半山亭',
      loc_pass: '玄武隘',
      loc_inner: '内堡回廊',
      loc_hall: '聚义厅',
      loc_boss_gate: '镇守门',
    },
    npcs: {
      npc_handler: '顾行简',
      npc_rival: '沈照川',
      npc_elder: '裴止渔',
      npc_merchant: '温折柳',
      npc_turncoat: '陆不言',
    },
    npcEpithets: {
      npc_handler: '驿丞',
      npc_rival: '同门师兄',
      npc_elder: '执事长老',
      npc_merchant: '行脚货郎',
      npc_turncoat: '斗笠客',
    },
  },
  xianxia: {
    towns: {
      town_outer: '云栈渡',
      town_midland: '灵墟坊',
      town_marches: '天阙城',
      town_fortress: '劫域关',
    },
    locations: {
      loc_gate: '界域关隘',
      loc_forest: '迷瘴林',
      loc_highland: '试剑台',
      loc_camp: '灵石营',
      loc_wastes: '劫灰原',
      loc_rest: '望劫亭',
      loc_pass: '二重天阙',
      loc_inner: '内府秘径',
      loc_hall: '传功殿',
      loc_boss_gate: '劫域门',
    },
    npcs: {
      npc_handler: '谢鸣桡',
      npc_rival: '韩承夜',
      npc_elder: '柳望虚',
      npc_merchant: '苏衔青',
      npc_turncoat: '莫隐舟',
    },
    npcEpithets: {
      npc_handler: '引路执事',
      npc_rival: '同门真传',
      npc_elder: '传功长老',
      npc_merchant: '游方丹师',
      npc_turncoat: '蒙面弟子',
    },
  },
  cyberpunk: {
    towns: {
      town_outer: '霓虹里',
      town_midland: '栈桥区',
      town_marches: '中枢环',
      town_fortress: '核心舱',
    },
    locations: {
      loc_gate: '下层关口',
      loc_forest: '数据巷',
      loc_highland: '高架平台',
      loc_camp: '临时据点',
      loc_wastes: '垃圾场战区',
      loc_rest: '休息舱廊',
      loc_pass: '二级安检门',
      loc_inner: '内网回廊',
      loc_hall: '战队简报室',
      loc_boss_gate: '核心隔离门',
    },
    npcs: {
      npc_handler: '程岸',
      npc_rival: '魏骁',
      npc_elder: '唐律',
      npc_merchant: '阮货',
      npc_turncoat: '匿频',
    },
    npcEpithets: {
      npc_handler: '接线员',
      npc_rival: '同队王牌',
      npc_elder: '战术督导',
      npc_merchant: '黑市中间人',
      npc_turncoat: '匿名频道',
    },
  },
};

/** 旧 official 称谓 → 新人名（批量替换 overlay 用） */
export const LEGACY_NPC_LABELS: Record<WorldPreset, Record<SpineNpcSlot, string>> = {
  wuxia: {
    npc_handler: '关隘驿丞',
    npc_rival: '同门师兄',
    npc_elder: '执事长老',
    npc_merchant: '行脚货郎',
    npc_turncoat: '戴斗笠的熟客',
  },
  xianxia: {
    npc_handler: '引路执事',
    npc_rival: '同门真传',
    npc_elder: '传功长老',
    npc_merchant: '游方丹师',
    npc_turncoat: '蒙面记名弟子',
  },
  cyberpunk: {
    npc_handler: '接线员',
    npc_rival: '同队王牌',
    npc_elder: '战术督导',
    npc_merchant: '黑市中间人',
    npc_turncoat: '匿名频道用户',
  },
};

export function officialWorldSkinNames(preset: WorldPreset): WorldSkinNames {
  const pick = OFFICIAL_NAME_PICK[preset];
  return {
    towns: { ...pick.towns },
    locations: { ...pick.locations },
    npcs: { ...pick.npcs },
    npcEpithets: { ...pick.npcEpithets },
  };
}

export function presetNamePool(preset: WorldPreset): PresetNamePool {
  return OFFICIAL_NAME_PICK[preset];
}
