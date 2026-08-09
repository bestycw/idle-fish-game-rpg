import type { AffixDef, EquipSlot, StatKey } from '../shared/types.js';

/**
 * 统一词缀大池（20 种）。权重层：high=10, mid=6, low=3, verylow=1。
 * 按设计文档 §4.2。
 */
export const AFFIX_DEFS: AffixDef[] = [
  // 主属性 - 高权重
  { id: 'atk', name: '攻击', stat: 'atk', min: 3, max: 12, weight: 10 },
  { id: 'def', name: '防御', stat: 'def', min: 3, max: 10, weight: 10 },
  { id: 'res', name: '抗性', stat: 'res', min: 3, max: 10, weight: 10 },
  { id: 'hp', name: '生命', stat: 'maxHp', min: 10, max: 40, weight: 10 },
  { id: 'spd', name: '速度', stat: 'spd', min: 1, max: 3, weight: 6 },
  // Rating - 中权重
  { id: 'critRating', name: '暴击', stat: 'critRating', min: 4, max: 14, weight: 6 },
  { id: 'critDmgRating', name: '暴伤', stat: 'critDmgRating', min: 4, max: 12, weight: 6 },
  { id: 'penRating', name: '穿透', stat: 'penRating', min: 4, max: 10, weight: 6 },
  { id: 'masteryRating', name: '精通', stat: 'masteryRating', min: 4, max: 10, weight: 6 },
  { id: 'tenacityRating', name: '坚韧', stat: 'tenacityRating', min: 4, max: 10, weight: 6 },
  // 稀有 - 低权重
  { id: 'dodge', name: '闪避', stat: 'dodge', min: 2, max: 6, weight: 3 },
  { id: 'block', name: '格挡', stat: 'block', min: 2, max: 6, weight: 3 },
  { id: 'lifesteal', name: '吸血', stat: 'lifesteal', min: 2, max: 5, weight: 3 },
  { id: 'critResist', name: '抗暴', stat: 'critResist', min: 2, max: 6, weight: 3 },
  { id: 'counter', name: '反击', stat: 'counter', min: 2, max: 5, weight: 3 },
  { id: 'echo', name: '回响', stat: 'echo', min: 2, max: 5, weight: 3 },
  { id: 'thorns', name: '反伤', stat: 'thorns', min: 2, max: 5, weight: 3 },
  // 稀有 - 极低权重
  { id: 'resilience', name: '韧性', stat: 'resilience', min: 2, max: 4, weight: 1 },
  { id: 'steal', name: '偷取', stat: 'steal', min: 2, max: 4, weight: 1 },
  { id: 'fortuneRating', name: '气运', stat: 'fortuneRating', min: 2, max: 6, weight: 1 },
];

/** 稀有属性 stat 列表（用于百分比输出） */
export const RARE_STATS: StatKey[] = [
  'dodge', 'block', 'lifesteal', 'critResist', 'counter',
  'echo', 'thorns', 'resilience', 'steal',
];

/**
 * 槽位偏好池：70% 权重给这些词缀 id。
 * trinket 为均匀（稀有词缀额外 +50% 权重）。
 */
export const SLOT_PREFERRED_POOL: Record<EquipSlot, string[]> = {
  weapon: ['atk', 'critRating', 'critDmgRating', 'penRating'],
  offhand: ['def', 'res', 'tenacityRating', 'masteryRating'],
  head: ['hp', 'masteryRating', 'tenacityRating'],
  chest: ['hp', 'def', 'res', 'tenacityRating'],
  hands: ['atk', 'critRating', 'critDmgRating', 'penRating'],
  feet: ['spd', 'hp', 'penRating', 'masteryRating'],
  back: ['res', 'hp', 'masteryRating', 'tenacityRating'],
  neck: ['atk', 'penRating', 'critDmgRating', 'masteryRating'],
  ring: ['atk', 'critRating', 'penRating', 'critDmgRating'],
  trinket: [], // 均匀
};

export const SLOT_NAMES: Record<EquipSlot, string> = {
  weapon: '武器',
  offhand: '副手',
  head: '头盔',
  chest: '胸甲',
  hands: '手套',
  feet: '靴子',
  back: '披风',
  neck: '项链',
  ring: '戒指',
  trinket: '饰品',
};

/** 纸娃娃槽上短名 */
export const SLOT_SHORT_NAMES: Record<EquipSlot, string> = {
  weapon: '武',
  offhand: '副',
  head: '头',
  chest: '胸',
  hands: '手',
  feet: '鞋',
  back: '背',
  neck: '链',
  ring: '戒',
  trinket: '饰',
};
