import type { WorldPreset } from '../shared/types.js';

export type GearDungeonLocaleEntry = {
  name: string;
  blurb: string;
  /** 右侧「掉落倾向」一句，可点名器纹/技能向 */
  lootLine: string;
};

type GearDungeonLocaleTable = Record<string, GearDungeonLocaleEntry>;

/** 引擎 id 稳定；显示随世界皮切换 */
const NEUTRAL: GearDungeonLocaleTable = {
  gear_break_wall: {
    name: '不动关·盾鸣廊',
    blurb: '盾阵碾过驿道，试你破甲与磨盾的节奏。主线同款盾墙，专掉「破盾」向器纹。',
    lootLine: '器纹倾向：破甲、破盾',
  },
  gear_arrow_lane: {
    name: '落矢廊道',
    blurb: '弓影压后排，逼你切后或护阵。掉穿透、标记类器纹，和招牌技连携。',
    lootLine: '器纹倾向：标记、断后',
  },
  gear_raider_trail: {
    name: '乱阵林蹊',
    blurb: '速攻穿插与油火搅局，练坦奶换位。掉控场与续航向装，补队伍短板。',
    lootLine: '器纹倾向：控场、续航',
  },
  gear_spirit_array: {
    name: '灵障重阙',
    blurb: '困难：灵防叠厚，力队易吃瘪。紫装率抬升，器纹偏深破甲与净盾。',
    lootLine: '困难 · 深破甲、净盾',
  },
  gear_chaos_shrine: {
    name: '乱心祠',
    blurb: '困难：祭纹扰乱阵脚。净化与自净器纹权重高，对症控场技能链。',
    lootLine: '困难 · 净化、自净',
  },
  gear_arrow_hard: {
    name: '紧弦段',
    blurb: '困难：箭道加压，标记与断后器纹权重升。',
    lootLine: '困难 · 标记、断后',
  },
  gear_raider_hard: {
    name: '急袭段',
    blurb: '困难：速攻油火加压，控场器纹权重升。',
    lootLine: '困难 · 控场、续航',
  },
  gear_chaos_hell: {
    name: '狱烟深处',
    blurb: '地狱：祭纹高压，净化与对症器纹集中。',
    lootLine: '地狱 · 净化、对症器纹',
  },
  gear_warden_trial: {
    name: '狱门',
    blurb: '地狱：守门首领高压，需完整解法。对症 T3 器纹集中，套装仅偶得。',
    lootLine: '地狱 · 对症器纹（破甲/净化/标记）',
  },
};

const LINE_NEUTRAL: Record<string, string> = {
  line_wall: '盾墙试炼',
  line_archer: '箭道试炼',
  line_raider: '乱阵林蹊',
  line_chaos: '乱心祠',
  line_warden: '镇守灵阙',
};

const LINE_XIANXIA: Record<string, string> = {
  line_wall: '青石关',
  line_archer: '落鸦矢道',
  line_raider: '乱阵林蹊',
  line_chaos: '乱心祠',
  line_warden: '镇守灵阙',
};

const LINE_WUXIA: Record<string, string> = {
  line_wall: '铁壁驿',
  line_archer: '穿云箭台',
  line_raider: '乱镖小道',
  line_chaos: '迷心祠',
  line_warden: '剑冢守门',
};

const LINE_CYBER: Record<string, string> = {
  line_wall: '硬壳回廊',
  line_archer: '轨道伏击线',
  line_raider: '闪击穿插带',
  line_chaos: '噪声祭坛',
  line_warden: '零日守门',
};

const LINE_PRESETS: Record<WorldPreset, Record<string, string>> = {
  xianxia: LINE_XIANXIA,
  wuxia: LINE_WUXIA,
  cyberpunk: LINE_CYBER,
};

const XIANXIA: GearDungeonLocaleTable = {
  gear_break_wall: {
    name: '青石关·盾鸣廊',
    blurb: '关隘盾阵轰鸣，试你破甲诀与磨盾招。与主线盾墙同脉，专淬破盾器纹。',
    lootLine: '器纹：破甲、破盾类（配破甲诀）',
  },
  gear_arrow_lane: {
    name: '落鸦矢道',
    blurb: '鸦影箭雨压后排，逼你切后或护阵。掉穿透、标记器纹，利于招牌技连斩。',
    lootLine: '器纹：标记、断后（配切后诀）',
  },
  gear_raider_trail: {
    name: '乱阵林蹊',
    blurb: '林道速攻与油火搅局，练坦奶换位。控场、续航器纹补队伍短板。',
    lootLine: '器纹：控场、续航',
  },
  gear_spirit_array: {
    name: '铁壁灵阵·重阙',
    blurb: '困难：灵障叠厚，力修易碰壁。紫装率升，器纹偏深破甲与净盾。',
    lootLine: '困难 · 深破甲、净盾器纹',
  },
  gear_chaos_shrine: {
    name: '乱心祠·祭烟',
    blurb: '困难：祭纹扰心。净化、自净器纹权重高，对症控场与净疗技能。',
    lootLine: '困难 · 净化、自净器纹',
  },
  gear_arrow_hard: {
    name: '紧弦段',
    blurb: '困难：箭雨更密，标记与断后器纹权重升。',
    lootLine: '困难 · 标记、断后器纹',
  },
  gear_raider_hard: {
    name: '急袭段',
    blurb: '困难：速攻油火加压，控场器纹权重升。',
    lootLine: '困难 · 控场、续航',
  },
  gear_chaos_hell: {
    name: '狱烟深处',
    blurb: '地狱：祭纹高压，净化与对症器纹集中。',
    lootLine: '地狱 · 净化、对症器纹',
  },
  gear_warden_trial: {
    name: '狱门',
    blurb: '地狱：灵阙守门，需完整解法链。对症 T3 器纹集中，套装仅偶得纹章。',
    lootLine: '地狱 · 对症器纹（破甲/净化/标记）',
  },
};

const WUXIA: GearDungeonLocaleTable = {
  gear_break_wall: {
    name: '铁壁驿·锣鸣巷',
    blurb: '镖队盾墙当道，试你破甲掌与磨盾刀法。专掉破盾向兵纹。',
    lootLine: '兵纹：破甲、破盾',
  },
  gear_arrow_lane: {
    name: '穿云箭台',
    blurb: '弓手占高台点杀后排。穿透、标记兵纹，配穿云、点穴类招式。',
    lootLine: '兵纹：标记、断后',
  },
  gear_raider_trail: {
    name: '乱镖小道',
    blurb: '快刀客与火油搅局，练换位护阵。控场、续命兵纹。',
    lootLine: '兵纹：控场、续航',
  },
  gear_spirit_array: {
    name: '内劲障·三重阁',
    blurb: '困难：内劲护体叠厚。紫装率升，深破甲与震盾兵纹。',
    lootLine: '困难 · 深破甲、震盾',
  },
  gear_chaos_shrine: {
    name: '迷心祠',
    blurb: '困难：迷心祭烟乱阵。清心、自净兵纹权重高。',
    lootLine: '困难 · 清心、自净',
  },
  gear_warden_trial: {
    name: '剑冢守门·死关',
    blurb: '地狱：守门高手，需对症招式。对症兵纹集中。',
    lootLine: '地狱 · 对症兵纹',
  },
};

const CYBER: GearDungeonLocaleTable = {
  gear_break_wall: {
    name: '隔离层·硬壳回廊',
    blurb: '防火墙队列推进，试你破甲插件与磨盾脚本。掉破盾向模组。',
    lootLine: '模组：破甲、破盾协议',
  },
  gear_arrow_lane: {
    name: '轨道伏击线',
    blurb: '无人机压制后排，逼你切后或护阵。穿透、标记模组配连锁技能。',
    lootLine: '模组：标记、断后链路',
  },
  gear_raider_trail: {
    name: '闪击穿插带',
    blurb: '快攻单元与燃烧桶搅局。控场、续航模组补编队。',
    lootLine: '模组：控场、续航',
  },
  gear_spirit_array: {
    name: '叠阵防火墙',
    blurb: '困难：多层灵防协议。紫装率升，深破甲与净盾模组。',
    lootLine: '困难 · 深破甲、净盾',
  },
  gear_chaos_shrine: {
    name: '噪声祭坛',
    blurb: '困难：干扰波形乱阵。净化、自净模组权重高。',
    lootLine: '困难 · 净化、自净',
  },
  gear_warden_trial: {
    name: '零日守门试炼',
    blurb: '地狱：守门 AI 高压，需完整解法链。对症 T3 模组集中。',
    lootLine: '地狱 · 对症模组',
  },
};

const PRESET_TABLES: Record<WorldPreset, GearDungeonLocaleTable> = {
  xianxia: XIANXIA,
  wuxia: WUXIA,
  cyberpunk: CYBER,
};

export const GEAR_DUNGEON_UNLOCK_HINT: Record<string, string> = {
  gear_break_wall: '已开放',
  gear_arrow_lane: '已开放',
  gear_arrow_hard: '通关第二章',
  gear_raider_trail: '通关第一章',
  gear_raider_hard: '通关第二章',
  gear_spirit_array: '通关第二章',
  gear_chaos_shrine: '通关第二章',
  gear_chaos_hell: '通关第二章',
  gear_warden_trial: '通关第二章',
};

function entry(id: string, preset: WorldPreset): GearDungeonLocaleEntry {
  const table = PRESET_TABLES[preset] ?? XIANXIA;
  return table[id] ?? NEUTRAL[id] ?? { name: id, blurb: '', lootLine: '' };
}

export function tGearDungeonLineName(lineId: string, preset: WorldPreset = 'xianxia'): string {
  const table = LINE_PRESETS[preset] ?? LINE_XIANXIA;
  return table[lineId] ?? LINE_NEUTRAL[lineId] ?? lineId;
}

export function tGearDungeonName(id: string, preset: WorldPreset = 'xianxia'): string {
  return entry(id, preset).name || id;
}

export function tGearDungeonBlurb(id: string, preset: WorldPreset = 'xianxia'): string {
  return entry(id, preset).blurb;
}

export function tGearDungeonLootLine(id: string, preset: WorldPreset = 'xianxia'): string {
  return entry(id, preset).lootLine;
}

export function gearDungeonUnlockHint(id: string): string {
  return GEAR_DUNGEON_UNLOCK_HINT[id] ?? '推进主线解锁';
}
