import type { SkillDef, UnitTemplate } from '../../shared/types.js';
import { buildStubTemplate } from './roleBaselines.js';
import { EXPAND_ROSTER } from './expandRoster.js';
import { composeKitSkill } from './kitCompose.js';
import { applyLegendaryExpandHook } from './legendaryExpandHooks.js';

export function buildExpandSkills(): Record<string, SkillDef> {
  const out: Record<string, SkillDef> = {};
  for (const e of EXPAND_ROSTER) {
    const skillId = `skill_${e.id}`;
    const legendarySolo = e.rarity === 'legendary';
    const composed = composeKitSkill({
      id: skillId,
      name: e.skillName,
      role: e.role,
      rarity: legendarySolo ? 'common' : e.rarity,
      motif: e.motif,
      kits: legendarySolo ? [e.kits[0]!] : e.kits,
    });
    out[skillId] = applyLegendaryExpandHook(e.id, composed, e.motif);
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
