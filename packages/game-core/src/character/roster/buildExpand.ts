import type { SkillDef, UnitTemplate } from '../../shared/types.js';
import { buildStubTemplate } from './roleBaselines.js';
import { makePlaceholderSkill } from './placeholderSkills.js';
import { EXPAND_ROSTER } from './expandRoster.js';

export function buildExpandSkills(): Record<string, SkillDef> {
  const out: Record<string, SkillDef> = {};
  for (const e of EXPAND_ROSTER) {
    const skillId = `skill_${e.id}`;
    out[skillId] = makePlaceholderSkill(skillId, e.skillName, e.role);
  }
  return out;
}

export function buildExpandTemplates(): UnitTemplate[] {
  return EXPAND_ROSTER.map((e) =>
    buildStubTemplate({
      id: e.id,
      name: e.name,
      role: e.role,
      rarity: e.rarity,
      skillId: `skill_${e.id}`,
    }),
  );
}

export const EXPAND_SKILLS = buildExpandSkills();
export const EXPAND_TEMPLATES = buildExpandTemplates();
