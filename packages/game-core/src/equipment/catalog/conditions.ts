import type { ConditionId, EquipSlot } from '../../shared/types.js';

export interface ConditionDef {
  id: ConditionId;
  name: string;
  sentence: string;
  /** 允许出现的槽；空 = 任意 */
  slots: EquipSlot[];
  min: number;
  max: number;
  axis: 'outgoing' | 'incoming';
}

const ALL_ARMOR: EquipSlot[] = ['offhand', 'head', 'chest', 'hands', 'feet', 'legs'];
const ACCESSORY: EquipSlot[] = ['neck', 'ring1', 'ring2', 'trinket1', 'trinket2'];

const DEFS: ConditionDef[] = [
  {
    id: 'skill_power',
    name: '技能威力',
    sentence: '技能威力',
    slots: ['weapon', ...ACCESSORY],
    min: 0.08,
    max: 0.14,
    axis: 'outgoing',
  },
  {
    id: 'basic_attack',
    name: '普攻伤害',
    sentence: '普攻伤害',
    slots: ['weapon'],
    min: 0.06,
    max: 0.12,
    axis: 'outgoing',
  },
  {
    id: 'vs_front',
    name: '对前排',
    sentence: '对前排的伤害',
    slots: ['weapon'],
    min: 0.1,
    max: 0.16,
    axis: 'outgoing',
  },
  {
    id: 'vs_back',
    name: '对后排',
    sentence: '对后排的伤害',
    slots: ['weapon'],
    min: 0.1,
    max: 0.16,
    axis: 'outgoing',
  },
  {
    id: 'vs_healthy',
    name: '对健康',
    sentence: '对健康敌人的伤害',
    slots: ['weapon'],
    min: 0.1,
    max: 0.16,
    axis: 'outgoing',
  },
  {
    id: 'vs_wounded',
    name: '对受伤',
    sentence: '对受伤敌人的伤害',
    slots: ['weapon'],
    min: 0.12,
    max: 0.18,
    axis: 'outgoing',
  },
  {
    id: 'vs_status',
    name: '对异常',
    sentence: '对异常状态敌人的伤害',
    slots: ['weapon', ...ACCESSORY],
    min: 0.1,
    max: 0.16,
    axis: 'outgoing',
  },
  {
    id: 'while_shielded',
    name: '持盾时伤害',
    sentence: '持盾时的伤害',
    slots: ['weapon'],
    min: 0.08,
    max: 0.14,
    axis: 'outgoing',
  },
  {
    id: 'dmg_taken_reduce',
    name: '受伤害减少',
    sentence: '受到的伤害减少',
    slots: [...ALL_ARMOR, ...ACCESSORY],
    min: 0.04,
    max: 0.08,
    axis: 'incoming',
  },
  {
    id: 'dmg_taken_from_back',
    name: '受后排伤害减少',
    sentence: '受到的后排伤害减少',
    slots: ALL_ARMOR,
    min: 0.06,
    max: 0.12,
    axis: 'incoming',
  },
];

const registry = new Map<ConditionId, ConditionDef>();

export function registerCondition(def: ConditionDef): void {
  registry.set(def.id, def);
}

for (const def of DEFS) registerCondition(def);

export function getConditionDef(id: string): ConditionDef | undefined {
  return registry.get(id as ConditionId);
}

export function listConditionsForSlot(slot: EquipSlot): ConditionDef[] {
  return [...registry.values()].filter((d) => d.slots.includes(slot));
}

export const CONDITION_OUTGOING_CAP = 0.35;
export const CONDITION_TAKEN_CAP = 0.2;
export const CONDITION_EXTREME_MULT = 1.5;
