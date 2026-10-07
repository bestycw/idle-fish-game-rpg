/**
 * 主线编制 · 1～9 格位，由遭遇表定人数；威胁总量靠章 pressure +（可选）headcount 缩放。
 */
import {
  MAINLINE_MAX_ENEMY_SLOTS,
  squadScaleForHeadcount,
} from '../chapter/mainlineThreatBudget.js';
import type { Role, UnitRank, UnitTemplate } from '../shared/types.js';
import type { EnemySpec, EncounterDef } from './encounters.js';

type Job = UnitTemplate['job'];

export interface SquadUnitTpl {
  slot: number;
  name: string;
  role: Role;
  job: Job;
  skillId: string;
  rank?: UnitRank;
  masteryRating?: number;
  startShield?: number;
  shieldPurgeFactor?: number;
  /** 透传到 EnemySpec */
  /** 相对基准的攻血缩放（小怪波略低于整题表） */
  scale?: number;
}

const BASE = { atk: 10, def: 11, res: 8, maxHp: 68, spd: 9 };

function specFromTpl(t: SquadUnitTpl): EnemySpec {
  const s = t.scale ?? 1;
  return {
    name: t.name,
    role: t.role,
    job: t.job,
    slot: t.slot as EnemySpec['slot'],
    atk: Math.round((BASE.atk + (t.role === 'st_burst' ? 2 : 0)) * s),
    def: Math.round((BASE.def + (t.role === 'tank' ? 3 : 0)) * s),
    res: Math.round(BASE.res * s),
    maxHp: Math.round((BASE.maxHp + (t.role === 'tank' ? 12 : 0)) * s),
    spd: Math.round(BASE.spd + (t.role === 'st_burst' ? 5 : 0)),
    skillId: t.skillId,
    rank: t.rank,
    masteryRating: t.masteryRating,
    startShield: t.startShield,
    shieldPurgeFactor: t.shieldPurgeFactor,
  };
}

export type MainlineSquadOpts = {
  /** 相对编排参考人数（默认取 units.length），用于 headcount 缩放 */
  baselineCount?: number;
  /** 若小于 units.length，保留精英与靠前列（不造填阵卒） */
  activeCount?: number;
};

export function mainlineSquadEncounter(
  id: string,
  name: string,
  prepHint: string,
  units: SquadUnitTpl[],
  opts?: MainlineSquadOpts,
): EncounterDef {
  const capped = units.slice(0, MAINLINE_MAX_ENEMY_SLOTS);
  const squad = opts?.activeCount != null ? trimSquad(capped, opts.activeCount) : capped;
  const baseline = opts?.baselineCount ?? capped.length;
  const scaleMul =
    opts?.activeCount != null
      ? squadScaleForHeadcount(squad.length, baseline)
      : 1;
  return {
    id,
    name,
    prepHint,
    maxTurns: 20,
    enemies: squad.map((u) => specFromTpl({ ...u, scale: (u.scale ?? 1) * scaleMul })),
  };
}

/** 裁员：精英优先，再按 slot 靠前 */
function trimSquad(units: SquadUnitTpl[], n: number): SquadUnitTpl[] {
  if (units.length <= n) return units;
  const frontOrder = (slot: number) => {
    const row = slot <= 3 ? 0 : slot <= 6 ? 1 : 2;
    return row * 10 + slot;
  };
  const sorted = [...units].sort((a, b) => {
    const ae = a.rank === 'elite' ? 0 : 1;
    const be = b.rank === 'elite' ? 0 : 1;
    if (ae !== be) return ae - be;
    return frontOrder(a.slot) - frontOrder(b.slot);
  });
  const kept = sorted.slice(0, n);
  const slots = new Set(kept.map((u) => u.slot));
  return units.filter((u) => slots.has(u.slot));
}
