import type {
  CharacterProgress,
  GridSlot,
  UnitRuntime,
  UnitTemplate,
} from '../shared/types.js';
import { defaultProgress, deriveGrowthStats, skillWithGrowth } from './growth.js';
import type { SkillComposeContext } from './skillCompose.js';

let uidSeq = 0;

export function createUnitFromTemplate(
  template: UnitTemplate,
  slot: GridSlot,
  progress?: CharacterProgress,
  composeCtx?: SkillComposeContext,
): UnitRuntime {
  uidSeq += 1;
  const prog = progress ?? defaultProgress(template.id);
  const g = deriveGrowthStats(template, prog);
  return {
    uid: `${template.id}_${uidSeq}`,
    templateId: template.id,
    name: template.name,
    role: template.role,
    job: template.job,
    slot,
    isHero: Boolean(template.isHero),
    dead: false,
    physAtk: g.physAtk,
    spiritAtk: g.spiritAtk,
    physDef: g.physDef,
    spiritDef: g.spiritDef,
    maxHp: g.maxHp,
    hp: g.maxHp,
    spd: g.spd,
    critRating: g.critRating,
    critDmgRating: g.critDmgRating,
    hasteRating: g.hasteRating,
    versRating: g.versRating,
    masteryRating: g.masteryRating,
    finalDmgRating: g.finalDmgRating,
    fortune: g.fortune,
    dodge: g.dodge,
    lifesteal: g.lifesteal,
    critResist: g.critResist,
    block: g.block,
    qi: template.maxQi,
    maxQi: template.maxQi,
    skill: skillWithGrowth(template, prog, composeCtx),
    shield: 0,
    statuses: [],
    rank: 'normal',
    ccDr: {},
    statusApplyCounts: {},
    focusPolicy: template.focusPolicy,
  };
}
