export type Row = 'front' | 'mid' | 'back';

export type Role =
  | 'flex'
  | 'tank'
  | 'st_burst'
  | 'aoe_dps'
  | 'st_ctrl'
  | 'aoe_ctrl'
  | 'group_amp'
  | 'st_heal'
  | 'aoe_heal';

export type Job =
  | 'vanguard'
  | 'assassin'
  | 'ranger'
  | 'mage'
  | 'warlock'
  | 'support'
  | 'healer'
  | 'adept';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

/** 伙伴稀有度中性显示名（故事皮可后换） */
export const RARITY_LABELS: Record<Rarity, string> = {
  common: '凡品',
  uncommon: '精良',
  rare: '良品',
  epic: '珍品',
  legendary: '绝品',
};

export type EquipSlot =
  | 'weapon'
  | 'offhand'
  | 'head'
  | 'chest'
  | 'hands'
  | 'feet'
  | 'legs'
  | 'neck'
  | 'ring1'
  | 'ring2'
  | 'trinket1'
  | 'trinket2';

/** 正常阵容出战上限（九宫最多 9 格，V1 上限 5） */
export const MAX_PARTY_SIZE = 5;

/** 12 装备槽位列表 */
export const EQUIP_SLOTS: EquipSlot[] = [
  'weapon', 'offhand', 'head', 'chest', 'hands',
  'feet', 'legs', 'neck', 'ring1', 'ring2', 'trinket1', 'trinket2',
];

/** 战中可选行动：普攻 + 招牌技能（无通用防御；承伤由坦克技能/站位负责） */
export type ActionKind = 'attack' | 'skill';

/** 力系 / 灵系（仙剑向双轴；显示名随皮） */
export type DamageSchool = 'phys' | 'spirit';

/**
 * 九宫目标形状 id（数据驱动，可扩展）。
 * 内置见 targeting 注册表；新形状用 `registerTargetPattern`，不必改战斗主循环。
 */
export type TargetPattern = string;

/**
 * 单体伤害焦点策略 id（数据驱动）。
 * 内置：`lane`（默认对位）| `lowest_hp` | `front_row` | `backline` | `random`
 * 可用 `registerFocusPolicy` 注册新 id，无需改战斗主循环。
 */
export type FocusPolicyId = string;

export type StatusId = string;

/** 敌方抗控分级；玩家单位固定 normal */
export type UnitRank = 'normal' | 'elite' | 'boss';

export interface CcDrEntry {
  /** 本窗口内已成功挂上次数 */
  applications: number;
  /** 目标再行动几次后窗口结束 */
  actsLeft: number;
}

/** 非状态类效果 kind（字符串可扩；内置见下） */
export type SkillEffectKind = string;

export interface SkillEffect {
  kind: SkillEffectKind;
  multiplier?: number;
  value?: number;
  /** 触发率 0～1；省略或 1 = 必发。自己掷骰，不吃精通/幸运。 */
  chance?: number;
}

export interface FollowUpDef {
  chance: number;
  multiplier?: number;
  targetPattern?: TargetPattern;
}

export interface ApplyStatusDef {
  statusId: StatusId;
  chance?: number;
  duration?: number;
  value?: number;
  layers?: number;
}

/** 软模式：同一 skillId 随战场条件变招（见 legendary-signature-kit） */
export type SoftModeWhen =
  | { kind: 'target_has_status'; statusId: StatusId }
  | { kind: 'target_under_cc' }
  | { kind: 'self_hp_below'; value: number }
  | { kind: 'target_hp_below'; value: number }
  | { kind: 'first_cast' }
  | { kind: 'target_has_shield' }
  | { kind: 'ally_downed' };

export interface SoftModeThen {
  multiplierDelta?: number;
  effectPatches?: SkillEffect[];
  statusPatches?: ApplyStatusDef[];
  followUp?: FollowUpDef;
  /** 等价追加 revive_ally 效果 */
  reviveAlly?: { hpRatio: number };
}

export interface SoftModeDef {
  when: SoftModeWhen;
  then: SoftModeThen;
  /** 玩家一句，如「猎印目标：斩杀加重」 */
  copy: string;
}

export interface SkillDef {
  id: string;
  name: string;
  nameKey?: string;
  blurb?: string;
  targetPattern: TargetPattern;
  tags: string[];
  multiplier: number;
  qiCost: number;
  applyStatus: ApplyStatusDef[];
  effects?: SkillEffect[];
  followUp?: FollowUpDef;
  /** 出手时按条件叠加的变招包；不改技能栏 */
  softModes?: SoftModeDef[];
  focusPolicy?: FocusPolicyId;
  damageSchool?: DamageSchool;
  aiWeight: number;
}

/** 九宫格：1–3 前排，4–6 中排，7–9 后排（左→右） */
export type GridSlot = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type StatKey =
  | 'atk'
  | 'def'
  | 'res'
  | 'maxHp'
  | 'spd'
  | 'critRating'
  | 'critDmgRating'
  | 'penRating'
  | 'masteryRating'
  | 'tenacityRating'
  | 'fortuneRating'
  | 'dodge'
  | 'lifesteal'
  | 'critResist'
  | 'block'
  | 'counter'
  | 'resilience'
  | 'echo'
  | 'thorns'
  | 'steal'
  | 'qiSiphon'
  | 'qiRefund';

export interface AffixDef {
  id: string;
  name: string;
  stat: StatKey;
  min: number;
  max: number;
  /** 权重层：high=10, mid=6, low=3, verylow=1 */
  weight: number;
}

export interface AffixInstance {
  defId: string;
  name: string;
  stat: StatKey;
  value: number;
}

export type ConditionId =
  | 'skill_power'
  | 'basic_attack'
  | 'vs_front'
  | 'vs_back'
  | 'vs_healthy'
  | 'vs_wounded'
  | 'vs_status'
  | 'while_shielded'
  | 'dmg_taken_reduce'
  | 'dmg_taken_from_back';

export interface ConditionAffix {
  defId: ConditionId;
  name: string;
  /** 0.08 = 8% */
  value: number;
  min: number;
  max: number;
  extreme?: boolean;
}

export interface Equipment {
  id: string;
  name: string;
  slot: EquipSlot;
  rarity: Rarity;
  /** 装等：只抬底子 */
  itemLevel: number;
  /** 基础属性（固定，按槽位+品级+装等） */
  baseStats: Partial<Record<'atk' | 'def' | 'res' | 'maxHp' | 'spd', number>>;
  /** 随机词缀 */
  affixes: AffixInstance[];
  /** 条件词 0–2 */
  conditions?: ConditionAffix[];
  /** 稀有词缀（纯概率） */
  rareAffixes?: AffixInstance[];
  /** T3，最多 1 */
  effectAffixId?: string;
  setId?: string;
  socketCount: 0 | 1;
  gemId?: string;
  enhanceLevel: number;
  /** 锁定可洗的随机行下标；未选则第一次洗时选定 */
  rerollAffixIndex?: number;
  /** 锁定可洗的条件行下标 */
  rerollConditionIndex?: number;
}

export interface StatusInstance {
  statusId: StatusId;
  value?: number;
  layers?: number;
  remaining: number;
  /** 嘲讽/义护：施加者 uid */
  sourceUid?: string;
}

export interface UnitTemplate {
  id: string;
  name: string;
  role: Role;
  job: Job;
  rarity: Rarity;
  preferredSlot: GridSlot;
  isHero?: boolean;
  damageSchool: DamageSchool;
  baseAtk: number;
  baseDef: number;
  baseRes: number;
  baseMaxHp: number;
  baseSpd: number;
  critRating: number;
  critDmgRating: number;
  penRating: number;
  masteryRating: number;
  tenacityRating: number;
  fortuneRating: number;
  maxQi: number;
  dodge?: number;
  lifesteal?: number;
  critResist?: number;
  block?: number;
  skillId: string;
  focusPolicy?: FocusPolicyId;
}

export interface UnitRuntime {
  uid: string;
  templateId: string;
  name: string;
  role: Role;
  job: Job;
  slot: GridSlot;
  isHero: boolean;
  dead: boolean;
  damageSchool: DamageSchool;
  atk: number;
  def: number;
  res: number;
  maxHp: number;
  hp: number;
  spd: number;
  critRating: number;
  critDmgRating: number;
  penRating: number;
  masteryRating: number;
  tenacityRating: number;
  fortuneRating: number;
  dodge: number;
  lifesteal: number;
  critResist: number;
  block: number;
  counter: number;
  resilience: number;
  /** 涅槃：致死后按该比例起身，本场 1 次；未点星则为 undefined */
  nirvanaHpRatio?: number;
  echo: number;
  thorns: number;
  steal: number;
  finalDmgBonus: number;
  qi: number;
  maxQi: number;
  skill: SkillDef;
  shield: number;
  /** 驱散只削该比例的盾（叠盾题）；缺省 1=整层驱散 */
  shieldPurgeFactor?: number;
  statuses: StatusInstance[];
  rank: UnitRank;
  ccDr: Partial<Record<string, CcDrEntry>>;
  statusApplyCounts: Record<string, number>;
  skillCastCount?: number;
  focusPolicy?: FocusPolicyId;
  /** T3 效果词缀 ID 列表（来自装备） */
  effectAffixIds?: string[];
  /** 进战条件词（乘区） */
  conditionAffixes?: ConditionAffix[];
  /** 锁息：行动削气，全身帽 6 */
  qiSiphon: number;
  /** 回元：大招后回气，全身帽 6 */
  qiRefund: number;
  /** T3 / 词缀本场状态（死亡保命、收势、每回合一次等） */
  t3State?: Record<string, number | boolean | string>;
  lastSkillTargetUid?: string;
  /** 连续技能打同一目标的层数（一鼓作气） */
  focusStreak?: number;
  /** 近期承伤，供以伤回血 */
  recentDamageTaken?: number;
  startQiBonus?: number;
  qiOnHit?: number;
  basicQiBonus?: number;
  secondWind?: boolean;
  counterFollow?: boolean;
  linkHeal?: boolean;
}

export interface BattleSide {
  units: UnitRuntime[];
}

export type BattleEventCode =
  | 'turn_start'
  | 'action'
  | 'hit'
  | 'crit'
  | 'resist'
  | 'status_apply'
  | 'status_block'
  | 'status_remove'
  | 'unit_down'
  | 'unit_revive'
  | 'block'
  | 'dodge'
  | 'heal'
  | 'shield_gain'
  | 'qi_gain'
  | 'follow_up'
  | 'effect_miss'
  | 'battle_end';

export interface BattleEvent {
  code: BattleEventCode;
  turn: number;
  payload: Record<string, unknown>;
}

export interface BattleState {
  turn: number;
  player: BattleSide;
  enemy: BattleSide;
  events: BattleEvent[];
  log: string[];
  status: 'ongoing' | 'won' | 'lost';
  actedUids: string[];
  awaitingHeroAction: boolean;
  pendingHeroUid: string | null;
  encounterId: string;
  defeatHint: string | null;
}

export interface CharacterProgress {
  templateId: string;
  level: number;
  exp: number;
  breakthroughTier: number;
  cultivationNodes?: number;
  star: number;
  owned: boolean;
  cardShards: number;
  starBranch?: Record<number, string>;
}

/** 账号级货币 */
export interface PlayerCurrencies {
  xiuwei: number;
  stardust: number;
  ticket: number;
  [currencyId: string]: number;
}

export interface PlayerState {
  version: number;
  gold: number;
  inventory: Equipment[];
  /** 旧共享衣柜字段。读档后恒空；穿戴只认 characterEquip。 */
  equipped: Partial<Record<EquipSlot, string>>;
  formation: Partial<Record<string, GridSlot>>;
  heroManual: boolean;
  wins: number;
  seed: number;
  encounterIndex: number;
  currencies: PlayerCurrencies;
  roster: Record<string, CharacterProgress>;
  towerFloor: number;
  gachaPity: number;
  stamina: number;
  staminaUpdatedAt: number;
  chapterCleared: number;
  chapterNodeIndex: number;
  lastDailyClaimDay?: string;
  stardustExchangeDay?: string;
  stardustExchangesToday?: number;
  starBranchRespecDay?: string;
  starBranchRespecToday?: number;
  /** 每角色独立装备：{ templateId: { slotId: equipmentId } } */
  characterEquip?: Record<string, Partial<Record<EquipSlot, string>>>;
  /** T4 形态石绑角色：{ templateId: morphId } */
  characterMorphs?: Record<string, string>;
  /** T4 形态石背包 */
  morphStones?: string[];
  /** 强化石数量 */
  enhanceStones?: number;
  /** 宝石背包 */
  gems?: { gemId: string; count: number }[];
  /** 今日已挖矿次数 */
  mineCountToday?: number;
  /** 挖矿计数日 */
  mineDay?: string;
  /** VIP 额外挖矿上限 */
  mineExtraLimit?: number;
  /** 洗练尘 */
  rerollDust?: number;
  /** 点开检视过的装备 id；不在此列的格子打「新」 */
  seenItemIds?: string[];
  /** 封存印（一条条件） */
  sealStamp?: {
    condition: ConditionAffix;
    sourceSlot: EquipSlot;
    wearTier: number;
    sourceRarity: Rarity;
  };
}

export interface SaveAdapter {
  load(): PlayerState | null;
  save(state: PlayerState): void;
  clear(): void;
}

export interface Rng {
  next(): number;
  int(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
}

export interface StepOptions {
  heroManual?: boolean;
  heroAction?: ActionKind;
}
