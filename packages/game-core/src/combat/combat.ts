import { getSkill } from '../character/skills.js';
import {
  applyEncounterRowDots,
  encounterOutgoingSchoolMult,
  encounterQiRegenMult,
  modifierLogLines,
  resolveEncounterModifiers,
  rollEncounterModifiers,
} from '../dungeon/encounterModifiers.js';
import {
  DEFAULT_BATTLE_MAX_TURNS,
  ENCOUNTERS,
  type EnemySpec,
} from '../dungeon/encounters.js';
import { rowOf, rowRank } from '../formation/grid.js';
import {
  applyFormationResonanceEffects,
  resonanceLogLines,
  resolveFormationResonances,
} from '../formation/resonance.js';
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
  tryStandFromLethal,
  type LethalSaveKind,
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
  ccDurationReduction,
  followUpAttackMult,
  grantShieldBreakQi,
  onBattleStart,
  onBlock,
  onCritHit,
  onDodge,
  onHealApplied,
  onHitTarget,
  onKill,
  onLethalDamage,
  onSkillCast,
  onStatusApplied,
  onStatusExpire,
  onTakeDamage,
  onTurnStart as fxTurnStart,
  tryAllyCover,
  tryFrontGuard,
} from './effectAffixRuntime.js';
import {
  conditionHealMult,
  conditionIncomingMult,
  conditionOutgoingMult,
} from './conditionRuntime.js';
import { resolveSoftModes } from './softModeRuntime.js';
import {
  pickAllyHealFocus,
  pickEnemyFocus,
  resolveFocusPolicy,
  resolveTargets,
} from './targeting.js';
import {
  atonementHealAmount,
  bumpFocusStreak,
  healFromTakenAmount,
  hpHealOnKill,
  pickLowestHpLiving,
  qiRefundOnKill,
  skillHealMult,
  skillOutgoingDamageMult,
  statusIncomingDamageMult,
} from './skillRules.js';
import {
  afterHealSkill,
  afterOffensiveSkill,
  applyBloodPactCost,
  applyLinkHealOverflow,
  applyQiOnHit,
  capIncomingHit,
  consumeNextSkillCrit,
  coverFrontIncoming,
  shareIncomingHpLoss,
  statusCritChanceBonus,
  tauntLockedFocus,
  tryPreventLethalStatus,
  tryReflectCc,
  trySecondWind,
} from './abilityRuntime.js';

export type { StepOptions };

const BLOCK_REDUCTION = 0.3;
/** 开战能量：不够放技能，需普攻攒能 */
export const BATTLE_START_QI = 20;

function unitBattleSide(state: BattleState, unit: UnitRuntime): 'player' | 'enemy' {
  return state.player.units.some((u) => u.uid === unit.uid) ? 'player' : 'enemy';
}

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
    effectAffixIds: u.effectAffixIds ? [...u.effectAffixIds] : undefined,
    conditionAffixes: u.conditionAffixes?.map((c) => ({ ...c })),
    qiSiphon: u.qiSiphon ?? 0,
    qiRefund: u.qiRefund ?? 0,
    t3State: u.t3State ? { ...u.t3State } : undefined,
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

function announceLethalSave(state: BattleState, unit: UnitRuntime, save: LethalSaveKind): void {
  if (save === 'nirvana') {
    emit(state, 'unit_revive', { target: unit.name, reason: '涅槃' });
    return;
  }
  state.log.push(`${unit.name}【不屈】绝处逢生，存活！`);
}

/** T3 逆天改命 → 涅槃（必发一次）→ 不屈（概率 1 血）。未救则倒下。 */
function resolveLethal(
  state: BattleState,
  unit: UnitRuntime,
  rng: Rng | undefined,
  killer?: UnitRuntime,
): boolean {
  if (rng && onLethalDamage(state, unit, rng)) return true;
  if (tryPreventLethalStatus(unit)) {
    state.log.push(`${unit.name}【金身】免死，余 1 血。`);
    return true;
  }
  const save = tryStandFromLethal(unit, rng);
  if (save) {
    announceLethalSave(state, unit, save);
    return true;
  }
  markDeadIfNeeded(unit);
  emit(state, 'unit_down', { target: unit.name });
  if (rng && killer) onKill(state, killer, unit, rng);
  return false;
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
    case 'effect_miss':
      return `${p.actor} ${p.effect ?? '效果'}未触发。`;
    case 'block':
      return `${p.target} 格挡，伤害降至 ${p.amount}。`;
    case 'dodge':
      return `${p.target} 闪避。`;
    case 'unit_down':
      return `${p.target} 倒下。`;
    case 'unit_revive':
      return `${p.actor ? `${p.actor}【${p.reason ?? '招魂'}】唤回 ${p.target}` : `${p.target}【${p.reason ?? '涅槃'}】浴火重生`}。`;
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

function rollCrit(actor: UnitRuntime, target: UnitRuntime, rng: Rng, skillHit = false): boolean {
  if (skillHit && consumeNextSkillCrit(actor)) return true;
  const critRate = Math.min(0.6, ratingToPct(actor.critRating, 'critRating') + statusCritChanceBonus(actor));
  const p = Math.max(0, Math.min(0.95, critRate - target.critResist));
  return rng.next() < p;
}

function computeDamage(
  state: BattleState,
  actor: UnitRuntime,
  target: UnitRuntime,
  multiplier: number,
  opts: {
    pierce?: boolean;
    aoe?: boolean;
    single?: boolean;
    school?: DamageSchool;
    skill?: SkillDef;
    hitKind?: 'attack' | 'skill';
    foes?: UnitRuntime[];
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
  raw *= skillOutgoingDamageMult(actor, target, opts.skill, { foes: opts.foes });
  raw *= statusIncomingDamageMult(target);
  const hitKind = opts.hitKind ?? (opts.skill ? 'skill' : 'attack');
  raw *= conditionOutgoingMult(actor, target, hitKind);
  raw *= encounterOutgoingSchoolMult(state, school);
  if (hitKind === 'attack') raw *= followUpAttackMult(actor);
  const crit = rollCrit(actor, target, rng, hitKind === 'skill');
  if (crit) raw *= 1.5 + critDmgExtra;

  const pierce = opts.pierce ? pierceDefReduction(actor) : penPct;
  const effDef = effectiveDef(target, school, pierce);
  // 防御权重：过低则破甲/厚甲无解法感（曾 0.35）；0.5 让盾墙关能卡「无破甲」
  let afterDef = Math.max(1, raw - effDef * 0.5);

  let middle = afterDef;
  middle *= tankDamageTakenMult(target);
  middle *= conditionIncomingMult(target, actor);

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
  skillHit = false,
): number {
  if (dodged) {
    emit(state, 'dodge', { actor: actor.name, target: target.name });
    if (rng) onDodge(state, target, rng);
    return 0;
  }

  let incoming = tryFrontGuard(state, target, amount);
  incoming = coverFrontIncoming(state, target, incoming);
  incoming = capIncomingHit(target, incoming);
  const shieldBefore = target.shield;
  const shieldAbsorb = Math.min(target.shield, incoming);
  let hpLoss = Math.max(0, incoming - shieldAbsorb);
  if (rng && hpLoss >= target.hp) {
    hpLoss = tryAllyCover(state, target, hpLoss, rng);
  }
  hpLoss = shareIncomingHpLoss(state, target, hpLoss, emit);
  const knockdown = target.hp - hpLoss <= 0;
  incoming = shieldAbsorb + hpLoss;

  if (blocked) {
    emit(state, 'block', { actor: actor.name, target: target.name, amount: incoming });
    if (rng) onBlock(state, target, rng);
  } else if (crit) {
    emit(state, 'crit', {
      actor: actor.name,
      target: target.name,
      amount: incoming,
      knockdown,
    });
    if (rng) onCritHit(state, actor, target, rng);
  } else {
    emit(state, 'hit', {
      actor: actor.name,
      target: target.name,
      amount: incoming,
      knockdown,
    });
  }

  let remain = incoming;
  if (target.shield > 0) {
    const absorb = Math.min(target.shield, remain);
    target.shield -= absorb;
    remain -= absorb;
  }
  if (shieldBefore > 0 && target.shield <= 0 && rng) {
    grantShieldBreakQi(state, actor);
  }
  if (remain > 0) {
    const stag = target.statuses.find(
      (s) => s.remaining > 0 && getStatusDef(s.statusId)?.deferIncomingRatio,
    );
    if (stag) {
      const ratio = getStatusDef(stag.statusId)!.deferIncomingRatio!;
      const defer = Math.floor(remain * ratio);
      if (defer > 0) {
        remain -= defer;
        stag.value = (stag.value ?? 0) + defer;
      }
    }
    target.hp = Math.max(0, target.hp - remain);
    if (remain > 0) {
      target.recentDamageTaken = (target.recentDamageTaken ?? 0) + remain;
    }
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

  const dealt = incoming;

  if (dealt > 0 && isLiving(target)) {
    const earth = target.statuses.find(
      (s) => s.remaining > 0 && getStatusDef(s.statusId)?.healOnTakenHit,
    );
    if (earth && !unitHasStatusFlag(target, 'healBlocked')) {
      const heal = Math.max(1, Math.floor(target.maxHp * (earth.value ?? 0.05)));
      const before = target.hp;
      target.hp = Math.min(target.maxHp, target.hp + heal);
      const got = target.hp - before;
      if (got > 0) {
        emit(state, 'heal', { actor: target.name, target: target.name, amount: got });
      }
      const layers = (earth.layers ?? 1) - 1;
      if (layers <= 0) {
        target.statuses = target.statuses.filter((s) => s !== earth);
        emit(state, 'status_remove', {
          target: target.name,
          status: statusLabel(earth.statusId),
          reason: '层数耗尽',
        });
      } else {
        earth.layers = layers;
      }
    }
  }

  if (target.hp <= 0 && !target.dead) {
    resolveLethal(state, target, rng, actor);
  }
  if (isLiving(target)) trySecondWind(state, target, emit);

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
      resolveLethal(state, actor, rng, target);
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
        resolveLethal(state, actor, rng, target);
      }
      if (target.counterFollow && isLiving(actor)) {
        const extra = Math.max(1, Math.floor(target.atk * 0.35));
        actor.hp = Math.max(0, actor.hp - extra);
        emit(state, 'follow_up', { actor: target.name, target: actor.name, amount: extra });
        if (actor.hp <= 0 && !actor.dead) {
          resolveLethal(state, actor, rng, target);
        }
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

  // ─── T3 onTakeDamage + onHitTarget；锁息 ───
  if (dealt > 0 && rng) {
    if (isLiving(target)) {
      onTakeDamage(state, actor, target, dealt, rng);
      applyQiOnHit(target, (u, amt) => gainQi(state, u, amt, unitBattleSide(state, u)));
    }
    const foes = state.player.units.includes(target) ? state.player.units : state.enemy.units;
    onHitTarget(state, actor, target, dealt, foes, rng, skillHit);
    if (actor.qiSiphon > 0 && isLiving(target)) {
      const key = `siphon:${state.turn}`;
      target.t3State = target.t3State ?? {};
      if (!target.t3State[key]) {
        const drain = Math.min(actor.qiSiphon, target.qi);
        if (drain > 0) {
          target.qi -= drain;
          target.t3State[key] = true;
        }
      }
    }
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
    duration = ccDurationReduction(target, duration);
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
      sourceUid: actor.uid,
    });
  } else {
    target.statuses = target.statuses.filter((s) => s.statusId !== def.statusId);
    target.statuses.push({
      statusId: def.statusId,
      remaining: duration,
      value,
      layers: def.layers,
      sourceUid: actor.uid,
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

  tryReflectCc(state, actor, target, def.statusId, duration, emit);

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
    grantQi: (s, u, amt) => gainQi(s, u, amt, unitBattleSide(s, u)),
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

function tickStatusesOnAct(state: BattleState, unit: UnitRuntime, rng: Rng): void {
  const expired: string[] = [];
  unit.statuses = unit.statuses
    .map((s) => ({ ...s, remaining: s.remaining - 1 }))
    .filter((s) => {
      if (s.remaining > 0) return true;
      expired.push(s.statusId);
      return false;
    });
  for (const id of expired) onStatusExpire(state, unit, id, rng);
}

function applyQiGain(state: BattleState, unit: UnitRuntime, amount: number, side: 'player' | 'enemy'): number {
  if (unitHasStatusFlag(unit, 'blocksQiGain')) return 0;
  const scaled = Math.max(0, amount * encounterQiRegenMult(state, side));
  const before = unit.qi;
  unit.qi = Math.min(unit.maxQi, unit.qi + scaled);
  return unit.qi - before;
}

function turnStart(state: BattleState, unit: UnitRuntime, side: 'player' | 'enemy', rng: Rng): void {
  const dot = applyEncounterRowDots(state, unit, side);
  if (dot > 0) {
    state.log.push(`${unit.name} 受词缀压迫 ${dot} 点。`);
    markDeadIfNeeded(unit);
  }
  const room = Math.min(5, unit.maxQi - unit.qi);
  const gained = room > 0 ? applyQiGain(state, unit, room, side) : 0;
  emit(state, 'turn_start', {
    actor: unit.name,
    qiGain: gained,
    qi: unit.qi,
    maxQi: unit.maxQi,
  });

  runStatusTicksOnAct(state, unit, emit);
  if (unit.recentDamageTaken) {
    unit.recentDamageTaken = Math.floor(unit.recentDamageTaken * 0.5);
  }
  fxTurnStart(state, unit, rng);
}

function gainQi(state: BattleState, unit: UnitRuntime, amount: number, side: 'player' | 'enemy'): void {
  const gained = applyQiGain(state, unit, amount, side);
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
  const tauntFocus = tauntLockedFocus(actor, foes);
  const focus = tauntFocus ?? pickEnemyFocus(foes, actor, { pierce, policy, rng });
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
  if (unitHasStatusFlag(unit, 'blocksBasic') && canUseSkill(unit)) return 'skill';

  const skill = unit.skill;
  const roll = rng.next();

  if (canUseSkill(unit)) {
    if (skill.tags.includes('heal')) {
      const hurt = livingUnits(allies).some((u) => u.hp / u.maxHp < 0.7);
      const canRevive =
        Boolean(skill.effects?.some((e) => e.kind === 'revive_ally')) &&
        allies.some((u) => u.dead || u.hp <= 0);
      if ((hurt || canRevive) && roll < skill.aiWeight) return 'skill';
    }
    if (skill.tags.includes('guard')) {
      const keepStacking = skill.tags.includes('sustain');
      const need =
        keepStacking ||
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
  if (unitHasStatusFlag(actor, 'blocksBasic')) return;

  let target: UnitRuntime | null;
  if (unitHasStatusFlag(actor, 'forceRandomTarget')) {
    target = pickHavocTarget(allUnits, rng);
  } else {
    const policy = resolveFocusPolicy(undefined, actor.focusPolicy);
    target = tauntLockedFocus(actor, foes) ?? pickEnemyFocus(foes, actor, { pierce: false, policy, rng });
  }
  if (!target) return;

  const result = computeDamage(state, actor, target, 1, { single: true, school: 'phys', hitKind: 'attack', foes }, rng);
  applyDamageToTarget(state, actor, target, result.amount, result.crit, result.blocked, result.dodged, rng, false);
  gainQi(state, actor, 20 + (actor.basicQiBonus ?? 0), unitBattleSide(state, actor));
}

function applySkill(
  state: BattleState,
  actor: UnitRuntime,
  allies: UnitRuntime[],
  foes: UnitRuntime[],
  allUnits: UnitRuntime[],
  rng: Rng,
): void {
  const baseSkill = actor.skill;
  if (!canUseSkill(actor)) {
    applyAttack(state, actor, foes, allUnits, rng);
    return;
  }

  actor.qi -= baseSkill.qiCost;
  const castIndex = actor.skillCastCount ?? 0;

  if (
    baseSkill.tags.includes('guard') &&
    baseSkill.applyStatus.some((s) => getStatusDef(s.statusId)?.appliesAsShield)
  ) {
    const skill = resolveSoftModes(baseSkill, {
      actor,
      allies,
      foes,
      targets: [actor],
    });
    const school = resolveDamageSchool(skill, 'guard');
    const shieldAmt = Math.max(
      1,
      Math.floor(
        attackPower(actor, school) *
          skill.multiplier *
          shieldMasteryMult(actor) *
          skillOutgoingDamageMult(actor, actor, skill),
      ),
    );
    actor.shield += shieldAmt;
    emit(state, 'shield_gain', { actor: actor.name, target: actor.name, amount: shieldAmt });
    actor.skillCastCount = castIndex + 1;
    applySkillEffects(state, actor, [actor], skill, rng, allies);
    const fromTaken = healFromTakenAmount(actor, skill);
    if (fromTaken > 0 && !unitHasStatusFlag(actor, 'healBlocked')) {
      actor.hp = Math.min(actor.maxHp, actor.hp + fromTaken);
      actor.recentDamageTaken = 0;
      emit(state, 'heal', { actor: actor.name, target: actor.name, amount: fromTaken });
    }
    onSkillCast(state, actor, rng, allies);
    if (actor.qiRefund > 0) gainQi(state, actor, actor.qiRefund, unitBattleSide(state, actor));
    return;
  }

  const actorSide = unitBattleSide(state, actor);
  const { targets } = resolveSkillTargets(actor, baseSkill, allies, foes, allUnits, rng);
  const skill = resolveSoftModes(baseSkill, { actor, allies, foes, targets });

  if (skill.tags.includes('heal')) {
    const school = resolveDamageSchool(skill, 'heal');
    let healedAmount = 0;
    for (const target of targets) {
      if (!isLiving(target)) continue;
      if (unitHasStatusFlag(target, 'healBlocked')) continue;
      const amount = Math.max(
        1,
        Math.floor(
          attackPower(actor, school) *
            skill.multiplier *
            healMasteryMult(actor, skill.tags.includes('aoe')) *
            skillHealMult(target, skill, actor) *
            conditionHealMult(actor),
        ),
      );
      const room = target.maxHp - target.hp;
      const applied = Math.min(room, amount);
      if (applied > 0) target.hp += applied;
      applyLinkHealOverflow(actor, target, amount - applied);
      if (applied > 0) emit(state, 'heal', { actor: actor.name, target: target.name, amount: applied });
      healedAmount += applied;
      onHealApplied(state, actor, target, rng);
    }
    applySkillEffects(state, actor, targets, skill, rng, allies);
    afterHealSkill(state, actor, skill, allies, healedAmount, emit);
    actor.skillCastCount = castIndex + 1;
    onSkillCast(state, actor, rng, allies);
    if (actor.qiRefund > 0) gainQi(state, actor, actor.qiRefund, actorSide);
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

  applyBloodPactCost(state, actor, skill, emit);

  let totalDealt = 0;
  for (const target of targets) {
    const result = computeDamage(
      state,
      actor,
      target,
      skill.multiplier,
      { pierce, aoe, single: !aoe, school, skill, hitKind: 'skill', foes },
      rng,
    );
    totalDealt += applyDamageToTarget(state, actor, target, result.amount, result.crit, result.blocked, result.dodged, rng, true);
  }

  // ─── echo（回响）：技能后概率再次触发（50%伤害）───
  if (actor.echo > 0 && rng.next() < actor.echo && targets.length > 0) {
    const echoTarget = targets.find((t) => isLiving(t));
    if (echoTarget) {
      const echoResult = computeDamage(
        state,
        actor,
        echoTarget,
        skill.multiplier * 0.5,
        { pierce, aoe: false, single: true, school, skill, hitKind: 'skill', foes },
        rng,
      );
      state.log.push(`${actor.name}【回响】技能再次爆发！`);
      applyDamageToTarget(state, actor, echoTarget, echoResult.amount, echoResult.crit, echoResult.blocked, echoResult.dodged, rng, true);
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
        state,
        actor,
        focus,
        mult,
        { pierce, aoe: false, single: true, school, skill, hitKind: 'skill', foes },
        rng,
      );
      applyDamageToTarget(state, actor, focus, result.amount, result.crit, result.blocked, result.dodged, rng, true);
      emit(state, 'follow_up', {
        actor: actor.name,
        target: focus.name,
        amount: result.amount,
      });
    }
  }

  const killCount = targets.filter((t) => livingBefore.has(t.uid) && t.dead).length;
  const refund = qiRefundOnKill(skill, killCount, actor);
  if (refund > 0) {
    gainQi(state, actor, refund, actorSide);
  }
  const killHeal = hpHealOnKill(actor, skill, killCount);
  if (killHeal > 0 && !unitHasStatusFlag(actor, 'healBlocked')) {
    actor.hp = Math.min(actor.maxHp, actor.hp + killHeal);
    emit(state, 'heal', { actor: actor.name, target: actor.name, amount: killHeal });
  }

  bumpFocusStreak(actor, targets[0]);
  const atone = atonementHealAmount(skill, totalDealt, actor);
  if (atone > 0) {
    const lowest = pickLowestHpLiving(allies);
    if (lowest && !unitHasStatusFlag(lowest, 'healBlocked')) {
      const before = lowest.hp;
      lowest.hp = Math.min(lowest.maxHp, lowest.hp + atone);
      const got = lowest.hp - before;
      if (got > 0) emit(state, 'heal', { actor: actor.name, target: lowest.name, amount: got });
    }
  }
  const fromTaken = healFromTakenAmount(actor, skill);
  if (fromTaken > 0 && !unitHasStatusFlag(actor, 'healBlocked')) {
    actor.hp = Math.min(actor.maxHp, actor.hp + fromTaken);
    actor.recentDamageTaken = 0;
    emit(state, 'heal', { actor: actor.name, target: actor.name, amount: fromTaken });
  }

  afterOffensiveSkill({
    state,
    actor,
    skill,
    targets,
    foes,
    rng,
    totalDealt,
    killCount,
    emit,
    hitTarget: (t, multiplier) => {
      const result = computeDamage(
        state,
        actor,
        t,
        multiplier,
        { pierce, aoe: false, single: true, school, skill, hitKind: 'skill', foes },
        rng,
      );
      return applyDamageToTarget(state, actor, t, result.amount, result.crit, result.blocked, result.dodged, rng, true);
    },
  });

  actor.skillCastCount = castIndex + 1;
  onSkillCast(state, actor, rng, allies);
  if (actor.qiRefund > 0) gainQi(state, actor, actor.qiRefund, actorSide);
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
    return '战败提示：后排被点爆了。穿透反打或撕前排；猎装刷量、镜渊补对症 T3。';
  }
  if (state.encounterId === 'raiders') {
    return '战败提示：敌方身法太快且有控制/混乱。给坦克开护盾，或调整站位优先秒脆皮。';
  }
  if (state.encounterId === 'spirit_wall') {
    return '战败提示：物防极高，力队吃瘪。上灵伤或破甲/裂甲 T3，解法装→镜渊试炼；别纯力硬凿。';
  }
  if (state.encounterId === 'chaos_rite') {
    return '战败提示：敌方群乱心。优先斩祭师，上净化治疗或护盾稳住阵脚。';
  }
  if (state.encounterId === 'boss_warden') {
    return '战败提示：首领肉且会控。破甲/流血磨血，先清侧卫再集火首领。';
  }
  if (state.encounterId === 'oil_cask') {
    return '战败提示：后排在抬血。禁疗/斩杀或穿透点医士；净疗/禁疗 T3→镜渊试炼。';
  }
  if (state.encounterId === 'shield_stack') {
    return '战败提示：敌方反复叠盾。带对盾增伤/破盾 T3，解法装→镜渊试炼，别和盾墙对磨。';
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
    qiSiphon: 0,
    qiRefund: 0,
    finalDmgBonus: 0,
    qi: BATTLE_START_QI,
    maxQi: 100,
    skill: getSkill(spec.skillId),
    shield: spec.startShield ? scaleStat(spec.startShield, pressure) : 0,
    shieldPurgeFactor: spec.shieldPurgeFactor,
    statuses: [],
    rank: spec.rank ?? 'normal',
    ccDr: {},
    statusApplyCounts: {},
    skillCastCount: 0,
    focusStreak: 0,
    recentDamageTaken: 0,
  };
}

export type CreateBattleOpts = {
  /** 敌人攻防血压力系数，默认 1。开战侧传 章档 × 本种压力。 */
  pressure?: number;
  /** E1：本场遭遇词缀 id（0–1 条常见） */
  encounterModifierIds?: string[];
  /** 未传 ids 时用 seed 掷词缀（约 65% 无、35% 有 1 条） */
  rollEncounterModifiers?: boolean;
  /** 世界观换皮：战前/日志遭遇标题 */
  encounterDisplayName?: string;
  /** 世界观换皮：按敌人下标覆盖显示名 */
  enemyDisplayNames?: string[];
};

export function createBattle(
  playerUnits: UnitRuntime[],
  _seed: number,
  encounterIndex = 0,
  opts: CreateBattleOpts = {},
): BattleState {
  const pressure = opts.pressure ?? 1;
  const encounter = ENCOUNTERS[encounterIndex % ENCOUNTERS.length]!;
  const enemies = encounter.enemies.map((spec, i) => {
    const unit = enemyFromSpec(spec, i, pressure);
    const skin = opts.enemyDisplayNames?.[i];
    if (skin) unit.name = skin;
    return unit;
  });
  const encounterLabel = opts.encounterDisplayName ?? encounter.name;

  const state: BattleState = {
    turn: 1,
    player: {
      units: playerUnits.map((u) => ({
        ...cloneUnit(u),
        shield: 0,
        qi: Math.min(u.maxQi, BATTLE_START_QI + (u.startQiBonus ?? 0)),
        dead: false,
        hp: u.maxHp,
        statuses: [],
        ccDr: {},
        statusApplyCounts: {},
        skillCastCount: 0,
        rank: u.rank ?? 'normal',
        focusStreak: 0,
        lastSkillTargetUid: undefined,
        recentDamageTaken: 0,
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
    maxTurns: encounter.maxTurns ?? DEFAULT_BATTLE_MAX_TURNS,
    defeatHint: null,
    encounterModifierIds:
      opts.encounterModifierIds ??
      (opts.rollEncounterModifiers ? rollEncounterModifiers(_seed) : []),
  };
  state.log.push(`遭遇【${encounterLabel}】，开战。`);
  for (const line of modifierLogLines(resolveEncounterModifiers(state.encounterModifierIds ?? []))) {
    state.log.push(line);
  }
  const resonances = resolveFormationResonances(state.player.units);
  state.formationResonanceIds = resonances.map((r) => r.id);
  for (const line of resonanceLogLines(resonances)) state.log.push(line);
  applyFormationResonanceEffects(state.player.units, resonances);
  const startRng = createRng(_seed);
  for (const u of [...state.player.units, ...state.enemy.units]) {
    onBattleStart(state, u, startRng);
  }
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
    turnStart(next, hero, 'player', rng);

    let kind = options.heroAction;
    if (!kind) {
      if (heroManual) return next;
      kind = chooseAiAction(hero, next.player.units, next.enemy.units, rng);
      next.log.push('（主角改回自动，继续出手）');
    } else {
      next.log.push(`（主角手动：${labelAction(kind, hero.skill)}）`);
    }

    tickStatusesOnAct(next, hero, rng);
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
    if (next.turn >= next.maxTurns) {
      next.status = 'lost';
      next.defeatHint =
        '战败提示：超过回合上限，输出不足或敌方过肉。换破甲/穿透阵容或提战力再试。';
      emit(next, 'battle_end', { result: 'lost', reason: 'timeout' });
      next.log.push(`—— 第 ${next.maxTurns} 回合已尽，战局超时。——`);
      next.log.push(next.defeatHint);
      return next;
    }
    next.turn += 1;
    next.actedUids = [];
    next.log.push(`—— 第 ${next.turn} 回合 ——`);
    return next;
  }

  const isPlayer = next.player.units.some((u) => u.uid === actorRef.uid);
  const liveActor = (isPlayer ? next.player : next.enemy).units.find((u) => u.uid === actorRef.uid)!;

  if (!canAct(liveActor)) {
    tickStatusesOnAct(next, liveActor, createRng(next.turn * 13 + liveActor.slot));
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
  turnStart(next, liveActor, isPlayer ? 'player' : 'enemy', rng);

  const allies = isPlayer ? next.player.units : next.enemy.units;
  const foes = isPlayer ? next.enemy.units : next.player.units;
  const allUnits = [...next.player.units, ...next.enemy.units];
  const kind = chooseAiAction(liveActor, allies, foes, rng);
  tickStatusesOnAct(next, liveActor, rng);
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
      defeatHint: '战败提示：步数上限，战局异常拖长。',
      log: [...cur.log, '战局过久，强制收场。'],
    };
  }
  return cur;
}

export { livingUnits, canAct, isLiving };
