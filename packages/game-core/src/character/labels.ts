import type { Job, Role } from '../shared/types.js';

/** 职能中性中文（故事皮可后换） */
export const ROLE_LABELS: Record<Role, string> = {
  flex: '全能',
  tank: '坦克',
  st_burst: '单体爆发',
  aoe_dps: '群体攻击',
  st_ctrl: '单体控制',
  aoe_ctrl: '群体控制',
  group_amp: '群体增幅',
  st_heal: '单体治疗',
  aoe_heal: '群体治疗',
};

/** 职业中性中文（故事皮可后换） */
export const JOB_LABELS: Record<Job, string> = {
  vanguard: '盾卫',
  assassin: '刺客',
  ranger: '射手',
  mage: '法师',
  warlock: '术士',
  support: '辅助',
  healer: '治疗',
  adept: '行者',
};

export function roleLabel(role: Role): string {
  return ROLE_LABELS[role] ?? role;
}

export function jobLabel(job: Job): string {
  return JOB_LABELS[job] ?? job;
}
