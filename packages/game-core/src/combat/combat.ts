import { getSkill } from '../character/skills.js';
import { ENCOUNTERS, type EnemySpec } from '../dungeon/encounters.js';
import { rowOf, rowRank } from '../formation/grid.js';
import { createRng } from '../shared/rng.js';
import type {
  ActionKind,
  ApplyStatusDef,
  BattleEvent,
  BattleSide,
  BattleState,
  DamageSchool,
  Rng,
  SkillDef,
  StepOptions,
  UnitRuntime,
} from '../shared/types.js';
import {
  canAct,
  isLiving,
  livingUnits,
  markDeadIfNeeded,
  positionAtkMod,
  positionDefMod,
} from './lifecycle.js';
import {
  burstCritDmgExtra,
  controlDurationMult,
  healMasteryMult,
  markPreyValueWithMastery,
  outputMasteryMult,
  pierceDefReduction,
  shieldMasteryMult,
  shredValueWithMastery,
  STATUS_LAND_BASE,
  statusLandChance,
  tankDamageTakenMult,
} from './mastery.js';

export { STATUS_LAND_BASE };
import { ratingToPct } from './ratings.js';
import {
  applyCcDrDuration,
  enforceStatusSoftCap,
  getStatusDef,
  rankGate,
  statusCcDrBucket,
  statusLabel,
  tickCcDrOnAct,
  unitHasStatusFlag,
} from './statusFx.js';
import { runSkillEffects } from './effectRegistry.js';
import { runStatusTicksOnAct } from './tickRegistry.js';
import {
  attackDamageBonus,
  ccDurationReduction,
  onBattleStart,
  onBlock,
  onCritHit,
  onHealApplied,
  onHitTarget,
  onKill,
  onLethalDamage,
  onStatusApplied,
  onTakeDamage,
  onTurnStart as fxTurnStart,
} from './effectAffixRuntime.js';
import {
  pickAllyHealFocus,
  pickEnemyFocus,
  resolveFocusPolicy,
  resolveTargets,
} from './targeting.js';
import {
  qiRefundOnKill,
  skillHealMult,
  skillOutgoingDamageMult,
  statusIncomingDamageMult,
} from './skillRules.js';

export type { StepOptions };

const BLOCK_REDUCTION = 0.3;
/** 开战能量：不够放技能，需普攻攒能 */
export const BATTLE_START_QI = 20;

function cloneUnit(u: UnitRuntime): UnitRuntime {
  return {
    ...u,
    skill: {
      ...u.skill,
      applyStatus: u.skill.applyStatus.map((s) => ({ ...s })),
      tags: [...u.skill.tags],
      effects: u.skill.effects?.map((e) => ({ ...e })),
      followUp: u.skill.followUp ? { ...u.skill.followUp } : undefined,
    },
    statuses: u.statuses.map((s) => ({ ...s })),
    ccDr: Object.fromEntries(
      Object.entries(u.ccDr ?? {}).map(([k, v]) => [k, v ? { ...v } : v]),
    ) as UnitRuntime['ccDr'],
    statusApplyCounts: { ...(u.statusApplyCounts ?? {}) },
    skillCastCount: u.skillCastCount ?? 0,
  };
}

function cloneSide(side: BattleSide): BattleSide {
  return { units: side.units.map(cloneUnit) };
}

function cloneBattle(state: BattleState): BattleState {
  return {
    ...state,
    player: cloneSide(state.player),
    enemy: cloneSide(state.enemy),
    events: [...state.events],
    log: [...state.log],
    actedUids: [...state.actedUids],
  };
}

function emit(state: BattleState, code: BattleEvent['code'], payload: Record<string, unknown>): void {
  const event: BattleEvent = { code, turn: state.turn, payload };
  state.events.push(event);
  const line = formatEvent(event);
  if (line) state.log.push(line);
}

function formatEvent(event: BattleEvent): string | null {
  const p = event.payload;
  switch (event.code) {
    case 'turn_start':
      return `${p.actor} 行动开始，能量 +${p.qiGain}（${p.qi}/${p.maxQi}）。`;
    case 'action':
      return `${p.actor} 使用${p.action}。`;
    case 'hit':
      return `${p.actor}→${p.target}，伤害 ${p.amount}${p.knockdown ? '，击倒' : ''}。`;
    case 'crit':
      return `${p.actor}→${p.target}【暴击】，伤害 ${p.amount}${p.knockdown ? '，击倒' : ''}。`;
    case 'heal':
      return `${p.actor} 为 ${p.target} 回复 ${p.amount} 点生命。`;
    case 'shield_gain':
      return `${p.actor} 获得 ${p.amount} 点护盾。`;
    case 'resist':
      return `${p.target} 抵抗了 ${p.status}。`;
    case 'status_apply':
      return `${p.target} 获得 ${p.status}（${p.duration} 动）。`;
    case 'status_block':
      return `${p.target} ${p.reason ?? '免疫'}，未能挂上 ${p.status}。`;
    case 'status_remove':
      return `${p.target} 的 ${p.status} 被${p.reason ?? '移除'}。`;
    case 'follow_up':
      return `${p.actor} 连击→${p.target}，伤害 ${p.amount}。`;
    case 'block':
      return `${p.target} 格挡，伤害降至 ${p.amount}。`;
    case 'dodge':
      return `${p.target} 闪避。`;
    case 'unit_down':
      return `${p.target} 倒下。`;
    case 'qi_gain':
      return `${p.actor} 能量 +${p.qiGain}（${p.qi}/${p.maxQi}）。`;
    default:
      return null;
  }
}

function actionWeight(unit: UnitRuntime): number {
  /** 先手只看身法；状态可乘 actionWeightMult（如迟缓） */
  let w = unit.spd;
  for (const s of unit.statuses) {
    if (s.remaining <= 0) continue;
    const mult = getStatusDef(s.statusId)?.actionWeightMult;
    if (mult != null) w *= mult;
  }
  return w;
}

export function initiativeOrder(units: UnitRuntime[]): UnitRuntime[] {
  return [...livingUnits(units)].sort((a, b) => {
    const wa = actionWeight(a);
    const wb = actionWeight(b);
    if (wb !== wa) return wb - wa;
    if (rowRank(a.slot) !== rowRank(b.slot)) return rowRank(a.slot) - rowRank(b.slot);
    return a.slot - b.slot;
  });
}

/** 普攻默认力；治疗/护盾默认灵；否则看技能配置 */
export function resolveDamageSchool(
  skill: SkillDef | null | undefined,
  kind: 'attack' | 'skill' | 'heal' | 'guard' = 'attack',
): DamageSchool {
  if (skill?.damageSchool) return skill.damageSchool;
  if (kind === 'heal' || kind === 'guard') return 'spirit';
  if (skill?.tags.includes('heal') || skill?.tags.includes('guard')) return 'spirit';
  return 'phys';
}

function attackPower(unit: UnitRuntime, _school: DamageSchool): number {
  return unit.atk;
}

function effectiveDef(
  target: UnitRuntime,
  school: DamageSchool,
  pierceReduction = 0,
): number {
  const base = school === 'spirit' ? target.res : target.def;
  let def = base * positionDefMod(target.slot);
  for (const s of target.statuses) {
    if (s.remaining <= 0 || s.value == null) continue;
    if (getStatusDef(s.statusId)?.incomingDefMultFromValue) def *= s.value;
  }
  def *= Math.max(0.1, 1 - pierceReduction);
  return def;
}

function rollCrit(actor: UnitRuntime, target: UnitRuntime, rng: Rng): boolean {
  const critRate = Math.min(0.6, ratingToPct(actor.critRating, 'critRating'));
  const p = Math.max(0, Math.min(0.95, critRate - target.critResist));
  return rng.next() < p;
}

function computeDamage(
  actor: UnitRuntime,
  target: UnitRuntime,
  multiplier: number,
  opts: {
    pierce?: boolean;
    aoe?: boolean;
    single?: boolean;
    school?: DamageSchool;
    skill?: SkillDef;
  },
  rng: Rng,
): { amount: number; crit: boolean; blocked: boolean; dodged: boolean } {
  const school = opts.school ?? 'phys';
  const penPct = ratingToPct(actor.penRating, 'penRating');
  const fortunePct = ratingToPct(actor.fortuneRating, 'fortuneRating');
  const critDmgExtra = ratingToPct(actor.critDmgRating, 'critDmgRating') + burstCritDmgExtra(actor);

  let raw = attackPower(actor, school) * multiplier * positionAtkMod(actor.slot);
  for (const s of actor.statuses) {
    if (s.remaining <= 0) continue;
    const mult = getStatusDef(s.statusId)?.outgoingDamageMult;
    if (mult != null) raw *= mult;
  }
  raw *= skillOutgoingDamageMult(actor, target, opts.skill);
  raw *= statusIncomingDamageMult(target);
  const crit = rollCrit(actor, target, rng);
  if (crit) raw *= 1.5 + critDmgExtra;

  const pierce = opts.pierce ? pierceDefReduction(actor) : penPct;
  const effDef = effectiveDef(target, school, pierce);
  // 防御权重：过低则破甲/厚甲无解法感（曾 0.35）；0.5 让盾墙关能卡「无破甲」
  let afterDef = Math.max(1, raw - effDef * 0.5);

  let middle = afterDef;
  middle *= tankDamageTakenMult(target);

  let final = Math.max(1, Math.floor(middle * (1 + actor.finalDmgBonus) * outputMasteryMult(actor, opts)));

  let blocked = false;
  if (target.block > 0 && rng.next() < target.block) {
    final = Math.max(1, Math.floor(final * (1 - BLOCK_REDUCTION)));
    blocked = true;
  }

  const effectiveDodge = Math.max(0, target.dodge - penPct * 0.3);
  if (effectiveDodge > 0 && rng.next() < effectiveDodge) {
    return { amount: 0, crit, blocked: false, dodged: true };
  }

  return { amount: final, crit, blocked, dodged: false };
}

function applyDamageToTarget(
  state: BattleState,
  actor: UnitRuntime,
  target: UnitRuntime,
  amount: number,
  crit: boolean,
  blocked: boolean,
  dodged: boolean,
  rng?: Rng,
): number {
  if (dodged) {
    emit(state, 'dodge', { actor: actor.name, target: target.name });
    return 0;
  }

  const shieldAbsorb = Math.min(target.shield, amount);
  const hpLoss = Math.max(0, amount - shieldAbsorb);
  const knockdown = target.hp - hpLoss <= 0;

  if (blocked) {
    emit(state, 'block', { actor: actor.name, target: target.name, amount });
    if (rng) onBlock(state, target, rng);
  } else if (crit) {
    emit(state, 'crit', {
      actor: actor.name,
      target: target.name,
      amount,
      knockdown,
    });
    if (rng) onCritHit(state, actor, target, rng);
  } else {
    emit(state, 'hit', {
      actor: actor.name,
      target: target.name,
      amount,
      knockdown,
    });
  }

  let remain = amount;
  if (target.shield > 0) {
    const absorb = Math.min(target.shield, remain);
    target.shield -= absorb;
    remain -= absorb;
  }
  if (remain > 0) {
    target.hp = Math.max(0, target.hp - remain);
  if (unitHasStatusFlag(target, 'wakeOnDamage')) {
    const woke = target.statuses.filter((s) => {
      if (s.remaining <= 0) return false;
      return Boolean(getStatusDef(s.statusId)?.wakeOnDamage);
    });
    for (const s of woke) {
      target.statuses = target.statuses.filter((x) => x.statusId !== s.statusId);
      emit(state, 'status_remove', {
        target: target.name,
        status: statusLabel(s.statusId),
        reason: '受伤惊醒',
      });
    }
  }
  }

  const dealt = amount;

  // ─── 致死判定：T3 death_save → resilience → 死亡 ───
  if (target.hp <= 0 && !target.dead) {
    if (rng && onLethalDamage(state, target, rng)) {
      // T3 saved
    } else if (target.resilience > 0 && rng && rng.next() < target.resilience && !target.effectAffixDeathSaveUsed) {
      target.hp = 1;
      target.effectAffixDeathSaveUsed = true;
      state.log.push(`${target.name}【不屈】绝处逢生，存活！`);
    } else {
      markDeadIfNeeded(target);
      emit(state, 'unit_down', { target: target.name });
      // T3 onKill
      if (rng) onKill(state, actor, target, rng);
    }
  }

  // ─── 吸血 ───
  if (dealt > 0 && actor.lifesteal > 0 && !dodged) {
    const heal = Math.floor(dealt * actor.lifesteal);
    if (heal > 0) {
      actor.hp = Math.min(actor.maxHp, actor.hp + heal);
    }
  }

  // ─── 反伤 (thorns) ───
  if (dealt > 0 && target.thorns > 0 && isLiving(target) && rng) {
    const thornsDmg = Math.max(1, Math.floor(dealt * target.thorns));
    actor.hp = Math.max(0, actor.hp - thornsDmg);
    state.log.push(`${target.name}【反伤】反弹 ${thornsDmg} 伤害给 ${actor.name}。`);
    if (actor.hp <= 0 && !actor.dead) {
      markDeadIfNeeded(actor);
      emit(state, 'unit_down', { target: actor.name });
    }
  }

  // ─── 反击 (counter) ───
  if (dealt > 0 && target.counter > 0 && isLiving(target) && isLiving(actor) && rng) {
    if (rng.next() < target.counter) {
      const counterDmg = Math.max(1, Math.floor(target.atk * 0.5));
      actor.hp = Math.max(0, actor.hp - counterDmg);
      state.log.push(`${target.name}【反击】反手攻击 ${actor.name}，伤害 ${counterDmg}。`);
      emit(state, 'hit', { actor: target.name, target: actor.name, amount: counterDmg, knockdown: actor.hp <= 0 });
      if (actor.hp <= 0 && !actor.dead) {
        markDeadIfNeeded(actor);
        emit(state, 'unit_down', { target: actor.name });
      }
    }
  }

  // ─── 偷取 (steal) ───
  if (dealt > 0 && actor.steal > 0 && isLiving(target) && rng) {
    if (rng.next() < actor.steal) {
      const buffs = target.statuses.filter((s) => s.remaining > 0 && getStatusDef(s.statusId)?.kind === 'buff');
      if (buffs.length > 0) {
        const stolen = rng.pick(buffs);
        target.statuses = target.statuses.filter((s) => s !== stolen);
        actor.statuses.push({ ...stolen });
        state.log.push(`${actor.name}【偷取】窃取了 ${target.name} 的 ${statusLabel(stolen.statusId)}！`);
      }
    }
  }

  // ─── T3 onTakeDamage + onHitTarget ───
  if (dealt > 0 && isLiving(target) && rng) {
    onTakeDamage(state, actor, target, dealt, rng);
    const foes = state.player.units.includes(target) ? state.player.units : state.enemy.units;
    onHitTarget(state, actor, target, dealt, foes, rng);
  }

  return dealt;
}

function rollStatusLand(
  actor: UnitRuntime,
  target: UnitRuntime,
  rng: Rng,
  statusId: string,
): boolean {
  return (
    rng.next() <
    statusLandChance(actor.role, actor.masteryRating, target.fortuneRating, statusId)
  );
}

function applyOneStatus(
  state: BattleState,
  actor: UnitRuntime,
  target: UnitRuntime,
  def: ApplyStatusDef,
  rng: Rng,
): void {
  const chance = def.chance ?? 1;
  if (rng.next() > chance) return;

  const statusMeta = getStatusDef(def.statusId);
  const label = statusLabel(def.statusId);
  const gate = rankGate(target.rank ?? 'normal', def.statusId);
  if (gate === 'immune') {
    emit(state, 'status_block', {
      actor: actor.name,
      target: target.name,
      status: label,
      reason: '抗控免疫',
    });
    return;
  }

  const maxApplies = statusMeta?.maxBattleApplies;
  if (maxApplies != null) {
    const landed = target.statusApplyCounts[def.statusId] ?? 0;
    if (landed >= maxApplies) {
      emit(state, 'status_block', {
        actor: actor.name,
        target: target.name,
        status: label,
        reason: '本场已达上限',
      });
      return;
    }
  }

  // Buff / 铺垫类必中；硬控与强扰乱走抵抗检定
  const isAllyBuff = statusMeta?.kind === 'buff';
  const guaranteed = isAllyBuff || !!statusMeta?.guaranteedLand;
  if (!guaranteed && !rollStatusLand(actor, target, rng, def.statusId)) {
    emit(state, 'resist', { actor: actor.name, target: target.name, status: label });
    return;
  }

  let duration = def.duration ?? 1;
  if (gate === 'halve') duration = Math.max(1, Math.floor(duration * 0.5));
  // 控制精通：硬控/有 DR 桶 / 强扰乱 加时长
  const needsCtrlDuration =
    statusMeta?.kind === 'cc' ||
    !!statusMeta?.ccDrBucket ||
    statusMeta?.forceRandomTarget === true;
  if (needsCtrlDuration) {
    duration = Math.max(1, Math.round(duration * controlDurationMult(actor)));
  }

  const ccBucket = statusCcDrBucket(def.statusId);
  if (ccBucket) {
    const adjusted = applyCcDrDuration(target, ccBucket, duration);
    if (adjusted == null) {
      emit(state, 'status_block', {
        actor: actor.name,
        target: target.name,
        status: label,
        reason: '控制衰减免疫',
      });
      return;
    }
    duration = adjusted;
  }

  if (statusMeta?.appliesAsShield) {
    const shieldAmt = Math.max(
      1,
      Math.floor(
        attackPower(actor, resolveDamageSchool(actor.skill, 'guard')) *
          (actor.skill.multiplier || 1) *
          shieldMasteryMult(actor),
      ),
    );
    target.shield += shieldAmt;
    emit(state, 'shield_gain', { actor: actor.name, target: target.name, amount: shieldAmt });
    return;
  }

  let value = def.value;
  if (statusMeta?.incomingDefMultFromValue && value != null) {
    value = shredValueWithMastery(actor, value);
  } else if (statusMeta?.incomingDamageTakenFromValue && value != null) {
    value = markPreyValueWithMastery(actor, value);
  }

  if (statusMeta?.stack === 'layers') {
    const existing = target.statuses.find((s) => s.statusId === def.statusId);
    const maxLayers = statusMeta.maxLayers ?? 99;
    const layers = Math.min(maxLayers, (existing?.layers ?? 0) + (def.layers ?? 1));
    target.statuses = target.statuses.filter((s) => s.statusId !== def.statusId);
    target.statuses.push({
      statusId: def.statusId,
      layers,
      remaining: duration,
      value: value ?? 0.03,
    });
  } else {
    target.statuses = target.statuses.filter((s) => s.statusId !== def.statusId);
    target.statuses.push({
      statusId: def.statusId,
      remaining: duration,
      value,
      layers: def.layers,
    });
  }

  if (maxApplies != null) {
    target.statusApplyCounts[def.statusId] = (target.statusApplyCounts[def.statusId] ?? 0) + 1;
  }

  enforceStatusSoftCap(target);

  emit(state, 'status_apply', {
    actor: actor.name,
    target: target.name,
    status: label,
    duration,
  });

  // T3 hook: onStatusApplied (handles fx_heal_on_cc, fx_debuff_reflect)
  onStatusApplied(state, actor, target, def.statusId, rng);
}

function applySkillEffects(
  state: BattleState,
  actor: UnitRuntime,
  targets: UnitRuntime[],
  skill: SkillDef,
  rng: Rng,
  allies?: UnitRuntime[],
): void {
  runSkillEffects(skill.effects, {
    state,
    actor,
    targets,
    allies: allies ?? [],
    rng,
    emit,
    grantQi: gainQi,
    attackPower,
    shieldMasteryMult,
  });
}

function applyStatuses(
  state: BattleState,
  actor: UnitRuntime,
  targets: UnitRuntime[],
  skill: SkillDef,
  rng: Rng,
): void {
  for (const target of targets) {
    for (const def of skill.applyStatus) {
      applyOneStatus(state, actor, target, def, rng);
    }
  }
}

function tickStatusesOnAct(unit: UnitRuntime): void {
  unit.statuses = unit.statuses
    .map((s) => ({ ...s, remaining: s.remaining - 1 }))
    .filter((s) => s.remaining > 0);
}

function applyQiGain(unit: UnitRuntime, amount: number): number {
  const scaled = Math.max(0, amount);
  const before = unit.qi;
  unit.qi = Math.min(unit.maxQi, unit.qi + scaled);
  return unit.qi - before;
}

function turnStart(state: BattleState, unit: UnitRuntime): void {
  const room = Math.min(5, unit.maxQi - unit.qi);
  const gained = room > 0 ? applyQiGain(unit, room) : 0;
  emit(state, 'turn_start', {
    actor: unit.name,
    qiGain: gained,
    qi: unit.qi,
    maxQi: unit.maxQi,
  });

  runStatusTicksOnAct(state, unit, emit);
}

function gainQi(state: BattleState, unit: UnitRuntime, amount: number): void {
  const gained = applyQiGain(unit, amount);
  if (gained > 0) {
    emit(state, 'qi_gain', { actor: unit.name, qiGain: gained, qi: unit.qi, maxQi: unit.maxQi });
  }
}

function pickHavocTarget(allUnits: UnitRuntime[], rng: Rng): UnitRuntime | null {
  const living = livingUnits(allUnits);
  if (living.length === 0) return null;
  return rng.pick(living);
}

function resolveSkillTargets(
  actor: UnitRuntime,
  skill: SkillDef,
  allies: UnitRuntime[],
  foes: UnitRuntime[],
  allUnits: UnitRuntime[],
  rng: Rng,
): { targets: UnitRuntime[]; focus: UnitRuntime | null } {
  const pierce = skill.tags.includes('pierce');
  const isHeal = skill.tags.includes('heal');

  if (unitHasStatusFlag(actor, 'forceRandomTarget')) {
    const t = pickHavocTarget(allUnits, rng);
    return { targets: t ? [t] : [], focus: t };
  }

  if (isHeal) {
    const focus = pickAllyHealFocus(allies);
    const targets = resolveTargets(skill.targetPattern, allies, focus, rng);
    return { targets, focus };
  }

  const policy = resolveFocusPolicy(skill.focusPolicy, actor.focusPolicy);
  const focus = pickEnemyFocus(foes, actor, { pierce, policy, rng });
  const targets = resolveTargets(skill.targetPattern, foes, focus, rng);
  return { targets, focus };
}

function canUseSkill(unit: UnitRuntime): boolean {
  if (unitHasStatusFlag(unit, 'blocksSkill')) return false;
  if (unitHasStatusFlag(unit, 'forceBasicAttack')) return false;
  return unit.qi >= unit.skill.qiCost;
}

function chooseAiAction(
  unit: UnitRuntime,
  allies: UnitRuntime[],
  foes: UnitRuntime[],
  rng: Rng,
): ActionKind {
  if (unitHasStatusFlag(unit, 'forceBasicAttack')) return 'attack';

  const skill = unit.skill;
  const roll = rng.next();

  if (canUseSkill(unit)) {
    if (skill.tags.includes('heal')) {
      const hurt = livingUnits(allies).some((u) => u.hp / u.maxHp < 0.7);
      if (hurt && roll < skill.aiWeight) return 'skill';
    }
    if (skill.tags.includes('guard')) {
      const need =
        unit.hp / unit.maxHp < 0.55 ||
        livingUnits(allies).some((u) => rowOf(u.slot) === 'front' && u.hp / u.maxHp < 0.5);
      if (need && roll < skill.aiWeight) return 'skill';
    }
    if (skill.tags.includes('pierce')) {
      const backAlive = livingUnits(foes).some((u) => rowOf(u.slot) !== 'front');
      if (backAlive && roll < skill.aiWeight) return 'skill';
    }
    if (skill.tags.includes('aoe') && roll < skill.aiWeight) return 'skill';
    if (roll < skill.aiWeight) return 'skill';
  }

  return 'attack';
}

function labelAction(kind: ActionKind, skill?: SkillDef): string {
  if (kind === 'skill') return `技能·${skill?.name ?? ''}`;
  return '普攻';
}

function applyAttack(
  state: BattleState,
  actor: UnitRuntime,
  foes: UnitRuntime[],
  allUnits: UnitRuntime[],
  rng: Rng,
): void {
  let target: UnitRuntime | null;
  if (unitHasStatusFlag(actor, 'forceRandomTarget')) {
    target = pickHavocTarget(allUnits, rng);
  } else {
    const policy = resolveFocusPolicy(undefined, actor.focusPolicy);
    target = pickEnemyFocus(foes, actor, { pierce: false, policy, rng });
  }
  if (!target) return;

  const result = computeDamage(actor, target, 1, { single: true, school: 'phys' }, rng);
  applyDamageToTarget(state, actor, target, result.amount, result.crit, result.blocked, result.dodged, rng);
  gainQi(state, actor, 20);
}

function applySkill(
  state: BattleState,
  actor: UnitRuntime,
  allies: UnitRuntime[],
  foes: UnitRuntime[],
  allUnits: UnitRuntime[],
  rng: Rng,
): void {
  const skill = actor.skill;
  if (!canUseSkill(actor)) {
    applyAttack(state, actor, foes, allUnits, rng);
    return;
  }

  actor.qi -= skill.qiCost;
  const castIndex = actor.skillCastCount ?? 0;

  if (
    skill.tags.includes('guard') &&
    skill.applyStatus.some((s) => getStatusDef(s.statusId)?.appliesAsShield)
  ) {
    const school = resolveDamageSchool(skill, 'guard');
    const shieldAmt = Math.max(
      1,
      Math.floor(attackPower(actor, school) * skill.multiplier * shieldMasteryMult(actor)),
    );
    actor.shield += shieldAmt;
    emit(state, 'shield_gain', { actor: actor.name, target: actor.name, amount: shieldAmt });
    actor.skillCastCount = castIndex + 1;
    applySkillEffects(state, actor, [actor], skill, rng, allies);
    return;
  }

  const { targets } = resolveSkillTargets(actor, skill, allies, foes, allUnits, rng);

  if (skill.tags.includes('heal')) {
    const school = resolveDamageSchool(skill, 'heal');
    for (const target of targets) {
      if (unitHasStatusFlag(target, 'healBlocked')) continue;
      const amount = Math.max(
        1,
        Math.floor(
          attackPower(actor, school) *
            skill.multiplier *
            healMasteryMult(actor, skill.tags.includes('aoe')) *
            skillHealMult(target, skill),
        ),
      );
      target.hp = Math.min(target.maxHp, target.hp + amount);
      emit(state, 'heal', { actor: actor.name, target: target.name, amount });
    }
    applySkillEffects(state, actor, targets, skill, rng, allies);
    actor.skillCastCount = castIndex + 1;
    return;
  }

  if (targets.length === 0) {
    applyAttack(state, actor, foes, allUnits, rng);
    return;
  }

  const pierce = skill.tags.includes('pierce');
  const aoe = skill.tags.includes('aoe') || skill.targetPattern !== 'single';
  const school = resolveDamageSchool(skill, 'skill');
  const livingBefore = new Set(targets.filter((t) => isLiving(t)).map((t) => t.uid));

  for (const target of targets) {
    const result = computeDamage(
      actor,
      target,
      skill.multiplier,
      { pierce, aoe, single: !aoe, school, skill },
      rng,
    );
    applyDamageToTarget(state, actor, target, result.amount, result.crit, result.blocked, result.dodged, rng);
  }

  // ─── echo（回响）：技能后概率再次触发（50%伤害）───
  if (actor.echo > 0 && rng.next() < actor.echo && targets.length > 0) {
    const echoTarget = targets.find((t) => isLiving(t));
    if (echoTarget) {
      const echoResult = computeDamage(actor, echoTarget, skill.multiplier * 0.5, { pierce, aoe: false, single: true, school, skill }, rng);
      state.log.push(`${actor.name}【回响】技能再次爆发！`);
      applyDamageToTarget(state, actor, echoTarget, echoResult.amount, echoResult.crit, echoResult.blocked, echoResult.dodged, rng);
    }
  }

  applyStatuses(state, actor, targets, skill, rng);
  applySkillEffects(state, actor, targets, skill, rng, allies);

  // 升星等点亮的连击钩子（配置 followUp）
  if (skill.followUp && targets.length > 0 && rng.next() < skill.followUp.chance) {
    const mult = skill.followUp.multiplier ?? 0.5;
    const focus = targets[0]!;
    if (isLiving(focus)) {
      const result = computeDamage(
        actor,
        focus,
        mult,
        { pierce, aoe: false, single: true, school, skill },
        rng,
      );
      applyDamageToTarget(state, actor, focus, result.amount, result.crit, result.blocked, result.dodged, rng);
      emit(state, 'follow_up', {
        actor: actor.name,
        target: focus.name,
        amount: result.amount,
      });
    }
  }

  const killCount = targets.filter((t) => livingBefore.has(t.uid) && t.dead).length;
  const refund = qiRefundOnKill(skill, killCount);
  if (refund > 0) {
    gainQi(state, actor, refund);
  }

  actor.skillCastCount = castIndex + 1;
}

function applyAction(
  state: BattleState,
  actor: UnitRuntime,
  kind: ActionKind,
  allies: UnitRuntime[],
  foes: UnitRuntime[],
  allUnits: UnitRuntime[],
  rng: Rng,
): void {
  if (!isLiving(actor)) return;

  let resolved = kind;
  if (unitHasStatusFlag(actor, 'forceBasicAttack')) resolved = 'attack';

  emit(state, 'action', { actor: actor.name, action: labelAction(resolved, actor.skill) });

  if (resolved === 'attack') {
    applyAttack(state, actor, foes, allUnits, rng);
    return;
  }

  applySkill(state, actor, allies, foes, allUnits, rng);
}

export function pickTarget(
  enemies: UnitRuntime[],
  actor: UnitRuntime,
  rng: Rng,
  pierce = false,
): UnitRuntime | null {
  const policy = resolveFocusPolicy(undefined, actor.focusPolicy);
  return pickEnemyFocus(enemies, actor, { pierce, policy, rng });
}

export function buildDefeatHint(state: BattleState): string {
  const foes = state.enemy.units;
  const allies = state.player.units;
  const highDefFront =
    foes.filter((u) => rowOf(u.slot) === 'front' && u.def >= 14).length >= 2;
  const hadPierceDeath = allies.some((u) => u.dead && rowOf(u.slot) !== 'front');
  const lowHeal = !allies.some((u) => u.role === 'st_heal' && isLiving(u));
  const avgEnemySpd = foes.reduce((s, u) => s + u.spd, 0) / Math.max(1, foes.length);
  const avgAllySpd = allies.reduce((s, u) => s + u.spd, 0) / Math.max(1, allies.length);

  // 已知遭遇优先，避免「后排有人倒」盖过速攻/盾墙套路提示
  if (state.encounterId === 'wall') {
    return '战败提示：敌方前排很肉，试试群体攻击或终伤磨盾，术士沉默掐禁疗。';
  }
  if (state.encounterId === 'archers') {
    return '战败提示：后排被点爆了。可上刺客穿透反打，或加强前排尽快撕开口子。';
  }
  if (state.encounterId === 'raiders') {
    return '战败提示：敌方身法太快且有控制/混乱。给坦克开护盾，或调整站位优先秒脆皮。';
  }
  if (state.encounterId === 'spirit_wall') {
    return '战败提示：物防极高，力队吃瘪。上灵伤输出或深破甲（诸葛），别纯力普攻硬凿。';
  }
  if (state.encounterId === 'chaos_rite') {
    return '战败提示：敌方群乱心。优先斩祭师，上净化治疗或护盾稳住阵脚。';
  }
  if (state.encounterId === 'boss_warden') {
    return '战败提示：首领肉且会控。破甲/流血磨血，先清侧卫再集火首领。';
  }
  if (highDefFront) {
    return '战败提示：敌方前排很肉，试试群体攻击或终伤磨盾，术士沉默掐禁疗。';
  }
  if (hadPierceDeath) {
    return '战败提示：后排被点爆了。可上刺客穿透反打，或加强前排尽快撕开口子。';
  }
  if (avgEnemySpd > avgAllySpd + 2) {
    return '战败提示：敌方身法太快且有控制/混乱。给坦克开护盾，或调整站位优先秒脆皮。';
  }
  if (lowHeal) {
    return '战败提示：续航不足。把治疗放后排，注意禁疗遭遇。';
  }
  return '战败提示：调整九宫站位再试——前排抗、后排输出/治疗，穿透与群体按敌阵选用。';
}

function refreshStatus(state: BattleState): void {
  if (livingUnits(state.enemy.units).length === 0) {
    state.status = 'won';
    state.defeatHint = null;
    emit(state, 'battle_end', { result: 'won' });
    state.log.push('战斗胜利。');
  } else if (livingUnits(state.player.units).length === 0) {
    state.status = 'lost';
    state.defeatHint = buildDefeatHint(state);
    emit(state, 'battle_end', { result: 'lost' });
    state.log.push('队伍溃败。');
    state.log.push(state.defeatHint);
  }
}

function nextActor(state: BattleState): UnitRuntime | null {
  const all = [...state.player.units, ...state.enemy.units];
  const order = initiativeOrder(all).filter(
    (u) => canAct(u) && !state.actedUids.includes(u.uid),
  );
  return order[0] ?? null;
}

function scaleStat(n: number, pressure: number): number {
  return Math.max(1, Math.round(n * pressure));
}

function enemyFromSpec(spec: EnemySpec, index: number, pressure = 1): UnitRuntime {
  const maxHp = scaleStat(spec.maxHp, pressure);
  return {
    uid: `enemy_${spec.name}_${index}`,
    templateId: `enemy_${index}`,
    name: spec.name,
    role: spec.role,
    job: spec.job,
    slot: spec.slot,
    isHero: false,
    dead: false,
    damageSchool: spec.damageSchool ?? 'phys',
    atk: scaleStat(spec.atk, pressure),
    def: scaleStat(spec.def, pressure),
    res: scaleStat(spec.res, pressure),
    maxHp,
    hp: maxHp,
    spd: spec.spd,
    critRating: spec.critRating ?? 5,
    critDmgRating: spec.critDmgRating ?? 5,
    penRating: spec.penRating ?? 0,
    masteryRating: spec.masteryRating ?? 0,
    tenacityRating: spec.tenacityRating ?? 0,
    fortuneRating: spec.fortuneRating ?? 8,
    dodge: 0,
    lifesteal: 0,
    critResist: 0,
    block: 0,
    counter: 0,
    resilience: 0,
    echo: 0,
    thorns: 0,
    steal: 0,
    finalDmgBonus: 0,
    qi: BATTLE_START_QI,
    maxQi: 100,
    skill: getSkill(spec.skillId),
    shield: 0,
    statuses: [],
    rank: spec.rank ?? 'normal',
    ccDr: {},
    statusApplyCounts: {},
    skillCastCount: 0,
  };
}

export type CreateBattleOpts = {
  /** 敌人攻防血压力系数，默认 1（副本可传 DungeonDef.pressure） */
  pressure?: number;
};

export function createBattle(
  playerUnits: UnitRuntime[],
  _seed: number,
  encounterIndex = 0,
  opts: CreateBattleOpts = {},
): BattleState {
  const pressure = opts.pressure ?? 1;
  const encounter = ENCOUNTERS[encounterIndex % ENCOUNTERS.length]!;
  const enemies = encounter.enemies.map((spec, i) => enemyFromSpec(spec, i, pressure));

  const state: BattleState = {
    turn: 1,
    player: {
      units: playerUnits.map((u) => ({
        ...cloneUnit(u),
        shield: 0,
        qi: BATTLE_START_QI,
        dead: false,
        hp: u.maxHp,
        statuses: [],
        ccDr: {},
        statusApplyCounts: {},
        skillCastCount: 0,
        rank: u.rank ?? 'normal',
      })),
    },
    enemy: { units: enemies },
    events: [],
    log: [],
    status: 'ongoing',
    actedUids: [],
    awaitingHeroAction: false,
    pendingHeroUid: null,
    encounterId: encounter.id,
    defeatHint: null,
  };
  state.log.push(`遭遇【${encounter.name}】，开战。`);
  return state;
}

export function stepBattle(state: BattleState, seed: number, options: StepOptions = {}): BattleState {
  if (state.status !== 'ongoing') return state;

  const heroManual = Boolean(options.heroManual);
  const next = cloneBattle(state);

  if (next.awaitingHeroAction && next.pendingHeroUid) {
    const pendingUid = next.pendingHeroUid;
    const hero = next.player.units.find((u) => u.uid === pendingUid);
    if (!hero || !canAct(hero)) {
      next.awaitingHeroAction = false;
      next.pendingHeroUid = null;
      if (pendingUid) next.actedUids.push(pendingUid);
      return next;
    }

    const rng = createRng(seed + next.turn * 1009 + next.actedUids.length * 17 + hero.slot);
    turnStart(next, hero);

    let kind = options.heroAction;
    if (!kind) {
      if (heroManual) return next;
      kind = chooseAiAction(hero, next.player.units, next.enemy.units, rng);
      next.log.push('（主角改回自动，继续出手）');
    } else {
      next.log.push(`（主角手动：${labelAction(kind, hero.skill)}）`);
    }

    tickStatusesOnAct(hero);
    tickCcDrOnAct(hero);
    const allUnits = [...next.player.units, ...next.enemy.units];
    applyAction(next, hero, kind, next.player.units, next.enemy.units, allUnits, rng);
    next.actedUids.push(hero.uid);
    next.awaitingHeroAction = false;
    next.pendingHeroUid = null;
    refreshStatus(next);
    return next;
  }

  const actorRef = nextActor(next);
  if (!actorRef) {
    next.turn += 1;
    next.actedUids = [];
    next.log.push(`—— 第 ${next.turn} 回合 ——`);
    return next;
  }

  const isPlayer = next.player.units.some((u) => u.uid === actorRef.uid);
  const liveActor = (isPlayer ? next.player : next.enemy).units.find((u) => u.uid === actorRef.uid)!;

  if (!canAct(liveActor)) {
    tickStatusesOnAct(liveActor);
    tickCcDrOnAct(liveActor);
    next.log.push(`${liveActor.name} 无法行动，跳过。`);
    next.actedUids.push(liveActor.uid);
    refreshStatus(next);
    return next;
  }

  if (heroManual && isPlayer && liveActor.isHero) {
    next.awaitingHeroAction = true;
    next.pendingHeroUid = liveActor.uid;
    next.log.push(`轮到 ${liveActor.name}，请选择行动。`);
    return next;
  }

  const rng = createRng(seed + next.turn * 1009 + next.actedUids.length * 17 + liveActor.slot);
  turnStart(next, liveActor);

  const allies = isPlayer ? next.player.units : next.enemy.units;
  const foes = isPlayer ? next.enemy.units : next.player.units;
  const allUnits = [...next.player.units, ...next.enemy.units];
  const kind = chooseAiAction(liveActor, allies, foes, rng);
  tickStatusesOnAct(liveActor);
  tickCcDrOnAct(liveActor);
  applyAction(next, liveActor, kind, allies, foes, allUnits, rng);
  next.actedUids.push(liveActor.uid);
  refreshStatus(next);
  return next;
}

export function stepAuto(state: BattleState, seed: number): BattleState {
  return stepBattle(state, seed, { heroManual: false });
}

export function runAutoBattle(state: BattleState, seed: number, maxSteps = 200): BattleState {
  let cur = state;
  let steps = 0;
  while (cur.status === 'ongoing' && steps < maxSteps) {
    if (cur.awaitingHeroAction) {
      cur = stepBattle(cur, seed, { heroManual: true, heroAction: 'attack' });
    } else {
      cur = stepBattle(cur, seed, { heroManual: false });
    }
    steps += 1;
  }
  if (cur.status === 'ongoing') {
    cur = {
      ...cur,
      status: 'lost',
      defeatHint: '战败提示：战局过久。',
      log: [...cur.log, '战局过久，强制收场。'],
    };
  }
  return cur;
}

export { livingUnits, canAct, isLiving };
