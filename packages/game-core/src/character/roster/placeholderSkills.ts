/**
 * 职能占位技能：扩展卡克隆改名，机制按 role 共用，避免同质化到深做卡招牌。
 */
import type { Role, SkillDef } from '../../shared/types.js';

export const ROLE_PLACEHOLDER_SKILLS: Record<Role, Omit<SkillDef, 'id' | 'name' | 'nameKey'>> = {
  tank: {
    targetPattern: 'single',
    tags: ['guard'],
    multiplier: 1.2,
    qiCost: 45,
    applyStatus: [{ statusId: 'shield', duration: 99, value: 1 }],
    damageSchool: 'phys',
    aiWeight: 0.45,
  },
  st_burst: {
    targetPattern: 'single',
    tags: ['damage'],
    multiplier: 1.75,
    qiCost: 52,
    applyStatus: [],
    damageSchool: 'phys',
    aiWeight: 0.6,
  },
  aoe_dps: {
    targetPattern: 'row_front',
    tags: ['aoe', 'damage'],
    multiplier: 1.0,
    qiCost: 55,
    applyStatus: [{ statusId: 'shred', duration: 2, value: 0.88 }],
    damageSchool: 'phys',
    aiWeight: 0.55,
  },
  st_ctrl: {
    targetPattern: 'single',
    tags: ['damage'],
    multiplier: 0.5,
    qiCost: 50,
    applyStatus: [{ statusId: 'stun', duration: 1 }],
    damageSchool: 'spirit',
    aiWeight: 0.5,
  },
  aoe_ctrl: {
    targetPattern: 'row_front',
    tags: ['aoe', 'damage'],
    multiplier: 0.55,
    qiCost: 52,
    applyStatus: [{ statusId: 'havoc', duration: 1 }],
    damageSchool: 'spirit',
    aiWeight: 0.5,
  },
  group_amp: {
    targetPattern: 'single',
    tags: ['damage'],
    multiplier: 0.45,
    qiCost: 48,
    applyStatus: [{ statusId: 'shred', duration: 2, value: 0.78 }],
    damageSchool: 'spirit',
    aiWeight: 0.5,
  },
  st_heal: {
    targetPattern: 'single',
    tags: ['heal'],
    multiplier: 1.25,
    qiCost: 45,
    applyStatus: [],
    damageSchool: 'spirit',
    aiWeight: 0.7,
  },
  aoe_heal: {
    targetPattern: 'all',
    tags: ['heal', 'aoe'],
    multiplier: 0.7,
    qiCost: 50,
    applyStatus: [],
    damageSchool: 'spirit',
    aiWeight: 0.65,
  },
  flex: {
    targetPattern: 'single',
    tags: ['damage'],
    multiplier: 1.55,
    qiCost: 50,
    applyStatus: [{ statusId: 'shred', duration: 2, value: 0.9 }],
    damageSchool: 'phys',
    aiWeight: 0.55,
  },
};

export function makePlaceholderSkill(id: string, name: string, role: Role): SkillDef {
  const base = ROLE_PLACEHOLDER_SKILLS[role];
  return {
    id,
    name,
    nameKey: `skill.${id}`,
    ...base,
    applyStatus: base.applyStatus.map((s) => ({ ...s })),
    tags: [...base.tags],
    effects: base.effects?.map((e) => ({ ...e })),
  };
}
