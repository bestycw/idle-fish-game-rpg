import type { Job, Role, TargetPattern } from '../shared/types.js';

/** 技能索敌形状中文（内部 id 不进 UI） */
export const TARGET_PATTERN_LABELS: Record<string, string> = {
  single: '单体',
  all: '全体',
  row_front: '前排',
  row_mid: '中排',
  row_back: '后排',
  row_focus: '同排',
  col_focus: '贯列',
  col_left: '左列',
  col_mid: '中列',
  col_right: '右列',
  cross: '十字',
};

export function targetPatternLabel(pattern: TargetPattern): string {
  return TARGET_PATTERN_LABELS[pattern] ?? pattern;
}

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
