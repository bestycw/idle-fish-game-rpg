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
    damageSchool: g.damageSchool,
    atk: g.atk,
    def: g.def,
    res: g.res,
    maxHp: g.maxHp,
    hp: g.maxHp,
    spd: g.spd,
    critRating: g.critRating,
    critDmgRating: g.critDmgRating,
    penRating: g.penRating,
    masteryRating: g.masteryRating,
    tenacityRating: g.tenacityRating,
    fortuneRating: g.fortuneRating,
    dodge: g.dodge,
    lifesteal: g.lifesteal,
    critResist: g.critResist,
    block: g.block,
    counter: g.counter,
    resilience: g.resilience,
    nirvanaHpRatio: g.nirvanaHpRatio,
    echo: g.echo,
    thorns: g.thorns,
    steal: g.steal,
    qiSiphon: 0,
    qiRefund: 0,
    finalDmgBonus: g.finalDmgBonus,
    qi: template.maxQi,
    maxQi: template.maxQi,
    skill: skillWithGrowth(template, prog, composeCtx),
    shield: 0,
    statuses: [],
    rank: 'normal',
    ccDr: {},
    statusApplyCounts: {},
    skillCastCount: 0,
    focusPolicy: template.focusPolicy,
    focusStreak: 0,
    recentDamageTaken: 0,
    startQiBonus: g.startQiBonus,
    qiOnHit: g.qiOnHit,
    basicQiBonus: g.basicQiBonus,
    secondWind: g.secondWind,
    counterFollow: g.counterFollow,
    linkHeal: g.linkHeal,
  };
}
