# 玩法扩展储备（引擎机制 · 题材无关）

> **地位：** 储备设计，登记于 [systems-overview §3.7](./systems-overview.md) 扩展模块表；**暂不开工**。  
> **上位约束：** [build-dual-core-design](./2026-07-21-build-dual-core-design.md) §0 反四不像；[product §2.0](./product.md) 三层分工。  
> **设计自检：** 每条均须通过「是加深"怎么过关"的选法，还是只加肝法/花活？」  
> **题材无关原则：** 所有机制用引擎 id 命名；显示名走 `t(mechanicId)` 词表，随故事皮变。

---

## 0. 总览

| # | 机制 | 服务哪个核 | 实现难度 | 优先级 |
|---|------|-----------|---------|--------|
| E1 | 遭遇词缀 | 双核 | 低 | 🥇 一期 |
| E2 | 阵位共鸣 | 人·解法 | 低 | 🥇 一期 |
| E3 | 多节点路线副本（Rogue Run） | 双核 | 中高 | 🥈 二期 |
| E4 | 破境挑战（Solo Trial） | 人+装 | 中 | 🥈 二期 |
| E5 | 完美触发（临时超模） | 激励优质打法 | 低 | 🥉 三期 |
| E6 | 周回异变 | 双核 | 极低 | 随时可加 |
| E7 | 装备铭刻 | 装·风格 | 中 | 三期 |
| E8 | 宿敌记忆 | 叙事（外皮层） | 低 | 后置 |

---

## E1. 遭遇词缀（Encounter Modifier）

### 概念

每次进入副本战斗时，随机附加 1-2 条规则修饰符，改变本场最优解。

### 引擎设计

```typescript
// 引擎 id：encounterModifier
interface EncounterModifier {
  id: string;              // 'spirit_surge' | 'frontline_pressure' | ...
  nameKey: string;         // t() 词表键
  effects: ModifierEffect[];
}

type ModifierEffect =
  | { kind: 'damage_school_mult'; school: DamageSchool; mult: number }
  | { kind: 'row_dot'; row: Row; pctPerTurn: number }
  | { kind: 'qi_regen_mult'; mult: number }
  | { kind: 'on_kill_heal'; pctHp: number }
  | { kind: 'status_duration_mult'; mult: number }
  // ... 可注册扩展
```

### 词表示例

| id | 中性默认 | 仙侠皮 | 魔幻皮 | 科幻皮 |
|----|---------|--------|--------|--------|
| spirit_surge | 灵力潮汐 | 灵气暴涨 | 魔力风暴 | 能量过载 |
| frontline_pressure | 前线压迫 | 杀阵逼迫 | 死亡凝视 | 火力压制 |
| qi_overflow | 能量涌流 | 灵泉涌动 | 法力涌泉 | 核心超频 |

### 自检 ✅

灵系伤害+40%时，纯力系阵容需要换人或换装 → 逼搭配变化。

### 钩子预留

- `combat/createBattle` 已有 `opts` 参数 → 扩展 `modifiers?: EncounterModifier[]`
- 副本 `DungeonDef` 可挂 `modifierPool: string[]`
- 注册表：`registerEncounterModifier(def)`

---

## E2. 阵位共鸣（Formation Resonance）

### 概念

九宫格特定站法组合触发额外效果，让布阵有"主动追求的阵型"。

### 引擎设计

```typescript
// 引擎 id：formationResonance
interface ResonanceDef {
  id: string;              // 'iron_wall' | 'pincer' | 'rearguard' | ...
  nameKey: string;
  /** 判定条件（slots / roles / 职能组合） */
  condition: ResonanceCondition;
  /** 触发效果（全队/指定位 buff） */
  effects: ResonanceEffect[];
}

type ResonanceCondition =
  | { kind: 'row_full'; row: Row }
  | { kind: 'role_count'; role: Role; min: number }
  | { kind: 'diagonal_occupied' }
  | { kind: 'pair_adjacent'; roles: [Role, Role] }
  // ... 可注册
```

### 词表示例

| id | 中性默认 | 仙侠皮 | 武侠皮 | 科幻皮 |
|----|---------|--------|--------|--------|
| iron_wall | 铁壁共鸣 | 金刚阵 | 铜墙阵 | 装甲矩阵 |
| pincer | 夹击共鸣 | 天地合围 | 左右夹攻 | 交叉火力 |
| rearguard | 守望共鸣 | 后盾灵佑 | 背靠背 | 远程支援链 |

### 自检 ✅

追求"铁壁"需要把 3 个角色挤前排 → 牺牲后排输出位，是有代价的布阵选法。

### 钩子预留

- `formation/` 新增 `resonance.ts`：`registerResonance(def)` + `resolveResonances(formation, roster)`
- `combat/createBattle` 时调用，将共鸣效果注入为战斗开始时的 team buff
- 数据驱动：新共鸣 = 加一条注册，不改战斗主循环

---

## E3. 多节点路线副本（Rogue Run）

### 概念

一种新副本模式：进入后面对多节点路线图（类似杀戮尖塔），每次路线不同，拿到的临时 buff/装不同，最终打 Boss。通关后临时效果消失，只保留永久奖励。

### 引擎设计

```typescript
// 引擎 id：rogueRun
interface RogueRunDef {
  id: string;
  nodes: RogueNodeDef[][];  // 层 × 每层可选节点
  finalBoss: string;        // encounterId
}

type RogueNodeKind = 'battle' | 'choice' | 'rest' | 'treasure' | 'event';

interface RogueNodeDef {
  kind: RogueNodeKind;
  // battle: encounterId; choice: 二选一 buff; rest: 回血; ...
}

// 运行时状态
interface RogueRunState {
  runId: string;
  currentLayer: number;
  tempBuffs: TempBuff[];
  tempEquip: Equipment[];   // 本次限定装
  hpCarryOver: Record<string, number>;  // 血量延续
}
```

### 词表示例

| id | 中性默认 | 仙侠皮 | 武侠皮 | 魔幻皮 |
|----|---------|--------|--------|--------|
| rogue_run | 探索行 | 秘境探索 | 江湖行走 | 地下城探险 |
| node_choice | 岔路抉择 | 机缘选 | 路口 | 分支通道 |
| node_rest | 休整 | 打坐恢复 | 客栈歇脚 | 篝火休息 |

### 自检 ✅

每次拿到的临时 buff 不同 → 最优打法不同 → 是选法不是肝法。10-20 分钟刚好跑完一次。

### 钩子预留

- `dungeon/` 新增 `rogueRun.ts`；`DungeonDef.runMode` 已有 `'battle' | 'instant'` → 扩展 `'rogue'`
- 临时 buff/装不写入 `PlayerState` 主体，存 `rogueRunState` 独立字段（跑完清除）
- 依赖 `encounterModifier`（E1）作为节点词缀源

---

## E4. 破境挑战（Solo Trial）

### 概念

角色破境时触发一场 solo 挑战战斗（只用该角色 + 其装备），根据职能定制难题。

### 引擎设计

```typescript
// 引擎 id：soloTrial
interface SoloTrialDef {
  role: Role;              // 按职能匹配
  encounterId: string;     // 定制敌阵
  objective: TrialObjective;
  reward: TrialReward;
}

type TrialObjective =
  | { kind: 'survive'; turns: number }          // 坦克：活 X 回合
  | { kind: 'kill_within'; turns: number }      // 输出：X 回合内击杀
  | { kind: 'keep_alive'; allyHpPct: number }   // 治疗：友方血量不低于 X%
  | { kind: 'apply_status'; statusId: string; count: number }  // 控制：挂 X 次控
```

### 词表示例

| id | 中性默认 | 仙侠皮 | 武侠皮 | 魔幻皮 |
|----|---------|--------|--------|--------|
| solo_trial | 突破试炼 | 渡劫 | 武道关 | 试炼之门 |
| survive_trial | 承压试炼 | 金刚劫 | 铁骨关 | 耐久测试 |
| kill_trial | 爆发试炼 | 雷劫 | 快刀关 | 歼灭测试 |

### 自检 ✅

逼玩家认真给**单个角色**配装 → 服务双核；失败可重试无惩罚。

### 钩子预留

- `growth/tryBreakthrough` 返回 `needTrial?: SoloTrialDef`（类似 `needBranch`）
- 挑战失败不扣修为，可反复尝试
- `combat/createBattle` 已支持任意 party 组 → solo = party.length === 1

---

## E5. 完美触发（Perfect Clear Buff）

### 概念

满足特定条件通关（零阵亡 / 全员满血 / X 回合内结束 / 触发 N 次连击）→ 下一场获得临时超模效果。

### 引擎设计

```typescript
// 引擎 id：perfectTrigger
interface PerfectCondition {
  id: string;              // 'flawless' | 'speed_kill' | 'combo_master'
  check: (result: BattleState) => boolean;
}

interface PerfectReward {
  conditionId: string;
  buff: TempBuff;          // 仅下一场生效
}
```

### 词表示例

| id | 中性默认 | 仙侠皮 | 武侠皮 |
|----|---------|--------|--------|
| flawless | 完美作战 | 心如止水 | 游刃有余 |
| speed_kill | 极速歼灭 | 雷霆一击 | 快意恩仇 |
| perfect_buff | 灵感涌现 | 顿悟 | 武意爆发 |

### 自检 ✅

鼓励追求"更优搭配"而非"随便过" → 激励优质打法。

### 钩子预留

- 战斗结算后 `BattleState` 已有 `events` 可回溯 → 加 `checkPerfectConditions(battle): string[]`
- 临时 buff 存 `PlayerState.nextBattleBuffs?: TempBuff[]`（用完即删）

---

## E6. 周回异变（Weekly Mutator）

### 概念

每周全局生效 1-2 条规则变体，逼老玩家重新搭配。

### 引擎设计

```typescript
// 引擎 id：weeklyMutator
// 复用 EncounterModifier 类型，应用层级为全局而非单次
interface WeeklyMutatorState {
  weekId: string;          // 'W2026-32'
  modifiers: EncounterModifier[];
}
```

### 自检 ✅

零内容产能、纯规则变化 → 逼换搭配。

### 钩子预留

- 复用 E1 `EncounterModifier` 数据结构
- `createBattle` 时合并 `weeklyModifiers + encounterModifiers`
- 种子由 week number 确定（本地计算，无需后端）

---

## E7. 装备铭刻（Gear Inscription）

### 概念

装备可铭刻一段"条件触发效果"，来源为特定 Boss 掉落或成就奖励。

### 引擎设计

```typescript
// 引擎 id：inscription
interface InscriptionDef {
  id: string;
  nameKey: string;
  condition: InscriptionCondition;   // 'wearer_is_tank' | 'on_block' | 'hp_below_30' | ...
  effect: InscriptionEffect;         // 'reflect_5pct' | 'grant_shield_10pct' | ...
}

// 扩展 Equipment
interface Equipment {
  // ... 现有字段
  inscriptionId?: string;           // 至多一条
}
```

### 词表示例

| id | 中性默认 | 仙侠皮 | 武侠皮 |
|----|---------|--------|--------|
| inscription | 铭刻 | 器灵记忆 | 兵刃留痕 |
| reflect_inscription | 反伤铭 | 金刚反噬 | 以彼之道 |

### 自检 ✅

铭刻改变"这把武器给谁用最合适" → 加深装·风格选择。

### 钩子预留

- `Equipment` 已有 `morphId`（形态特技）→ `inscriptionId` 为另一个独立扩展口
- `combat/lifecycle` hooks 已预留 `onBlock` / `onHit` 等时机

---

## E8. 宿敌记忆（Nemesis Memory）

### 概念

被某 Boss 击败 → 该 Boss 下次遇到时获得增强 + 新机制；反复击败某类敌人 → 获得微弱克制加成。

### 引擎设计

```typescript
// 引擎 id：nemesis
interface NemesisRecord {
  encounterId: string;
  defeats: number;         // 被它击败次数 → 它变强
  victories: number;       // 击败它次数 → 你获得克制
}
```

### 词表示例

| id | 中性默认 | 仙侠皮 | 武侠皮 | 魔幻皮 |
|----|---------|--------|--------|--------|
| nemesis | 宿敌 | 因果纠缠 | 恩仇录 | 宿命敌手 |
| affinity | 克制印记 | 破道心得 | 看穿招式 | 弱点记录 |

### 自检 ⚠️

偏叙事/外皮层体验，不直接改变"怎么过关"的核心选法。可做但不优先。

### 钩子预留

- `PlayerState` 扩展 `nemesis?: Record<string, NemesisRecord>`
- `createBattle` 时查 nemesis → 给敌方 buff（增强）或给我方微 buff（克制）

---

## 实现批次建议

| 批次 | 内容 | 前置条件 |
|------|------|----------|
| 一期 | E1 遭遇词缀 + E2 阵位共鸣 + E6 周回异变 | 无（纯数据驱动） |
| 二期 | E3 Rogue Run + E4 破境挑战 | E1（词缀作为 Rogue 节点源） |
| 三期 | E5 完美触发 + E7 装备铭刻 | 战斗 events 回溯完善 |
| 后置 | E8 宿敌记忆 | 叙事/AI 层启动后 |

---

## 与现有系统的集成点

| 现有系统 | 集成 |
|---------|------|
| `combat/createBattle` opts | → E1/E2/E4/E6 效果注入 |
| `dungeon/DungeonDef.runMode` | → E3 新增 `'rogue'` |
| `growth/tryBreakthrough` | → E4 返回 `needTrial` |
| `Equipment` | → E7 新增 `inscriptionId` |
| `PlayerState` | → E3 `rogueRunState` / E5 `nextBattleBuffs` / E8 `nemesis` |
| `combat/lifecycle` hooks | → E5/E7 时机触发 |
| 注册表模式 | 全部 → `register*` 新增内容不改主循环 |

---

## 明确不做（防膨胀）

- 不新增独立养成货币（复用星尘/修为/经验）
- 不做需要后端的实时对战
- 不做需要大量美术资产的系统
- 宿敌系统不做硬门锁（只做趣味/叙事）
- 不把任何扩展机制升级为"第三条通关必需主轴"
