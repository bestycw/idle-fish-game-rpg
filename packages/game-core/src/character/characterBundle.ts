/**
 * 单卡清单校验：模板 + 技能 + ★1–MAX 可 resolve。
 */
import type { Job, Role } from '../shared/types.js';
import { getSkill, SKILLS } from './skills.js';
import { JOB_LABELS, ROLE_LABELS } from './labels.js';
import { MAX_STAR, resolveStarNode } from './starTracks.js';
import { getTemplate, UNIT_TEMPLATES } from './templates.js';

const ROLES = Object.keys(ROLE_LABELS) as Role[];
const JOBS = Object.keys(JOB_LABELS) as Job[];

export interface CharacterBundleReport {
  templateId: string;
  ok: boolean;
  errors: string[];
}

export function assertCharacterBundle(templateId: string): CharacterBundleReport {
  const errors: string[] = [];
  const template = getTemplate(templateId);
  if (!template) {
    return { templateId, ok: false, errors: [`missing template ${templateId}`] };
  }
  if (!ROLES.includes(template.role)) {
    errors.push(`invalid role ${template.role}`);
  }
  if (!JOBS.includes(template.job)) {
    errors.push(`invalid job ${template.job}`);
  }
  if (!template.skillId || !SKILLS[template.skillId]) {
    errors.push(`missing skill ${template.skillId}`);
  } else {
    try {
      getSkill(template.skillId);
    } catch {
      errors.push(`skill resolve failed ${template.skillId}`);
    }
  }
  for (let s = 1; s <= MAX_STAR; s += 1) {
    if (!resolveStarNode(templateId, s)) {
      errors.push(`missing star node ★${s}`);
    }
  }
  return { templateId, ok: errors.length === 0, errors };
}

export function assertAllCharacterBundles(): CharacterBundleReport[] {
  return UNIT_TEMPLATES.map((t) => assertCharacterBundle(t.id));
}

/** 测试用：全部通过则无抛错 */
export function assertAllCharacterBundlesOrThrow(): void {
  const bad = assertAllCharacterBundles().filter((r) => !r.ok);
  if (bad.length === 0) return;
  const msg = bad.map((r) => `${r.templateId}: ${r.errors.join('; ')}`).join('\n');
  throw new Error(`CharacterBundle failed:\n${msg}`);
}
