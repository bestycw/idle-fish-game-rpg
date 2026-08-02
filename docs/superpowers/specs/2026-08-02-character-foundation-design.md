# 人物系统地基（做透 · 2026-08-02）

> **地位：** 现行（**F1–F5 已落地** · 2026-08-02）；F6 样板赵云已加深 ★6。  
> **范围：** 人物深度的**架构地基**；**不**先填满 24 卡身份文案。  
> **内容规范：** 新卡技能/星章怎么写 → [skill-design-spec](./2026-08-02-skill-design-spec.md)（母题→招牌主动→六星章）。  
> **双核不变：** 人·解法（新的开始气质）× 装·风格（再刷一把气质）。  
> **硬限制：** 不破 combat 技能结构冻结；不加第三条养成主轴；Agent 不自行 commit。  
> **代码：** `skillCompose.ts` / `characterBundle.ts` / `equipment/morphs.ts`。

---

## 0. 问题诊断（现状）

已有且可用：

- `UnitTemplate` + `SkillDef` + `CharacterProgress`
- GrowthTrack 三轴（升级 / 破境 / 升星）+ awaken/bond 占位
- 升星 effect 表 + 破境 perk 表 + UI 预览

真正薄、卡住「做有意思」的是：

| 薄点 | 后果 |
|------|------|
| **`skillWithGrowth` 只能改少数字段** | 升星难解锁新状态/新效果/换形态，只能加数值 |
| **身份数据散落三文件** | template / skill / starTrack 无单卡校验，难做透 |
| **装尚未挂进技能合成** | 「再刷一把」那层（装改招）没有管道口 |
| **一卡一主动是冻结** | 丰富不能靠「技能栏堆技能」，要靠**合成层**做深 |

结论：**先做「技能合成管道 + 单卡清单 + 扩展口」地基，再回头填身份。**

---

## 1. 地基目标（成功标准）

做完地基后，应满足：

1. **一条管道：** 任意来源的修正（升星 / 破境 / 未来装特技）都走同一 `composeSkill`，战斗仍只读最终 `SkillDef`。  
2. **一张清单：** 每卡有 `CharacterBundle`（模板+技能+星轨+破境），可校验「缺轨/缺技能」。  
3. **人核可质变：** 升星能在冻结字段内做出「可感知」变化（含解锁新 `applyStatus` / 强化 `effects`，见 §3）。  
4. **装核有挂钩：** 装备形态特技作为 compose 的一个 `SkillModifierSource`，互斥规则可配（先脚手架，特技池后填）。  
5. **样板 1～2 卡验证深度**，24 卡批量内容后置。

自检句：玩家多了一种**怎么过关**的选法，而不是多了一种肝法。

---

## 2. 分层（推荐地基形状）

```
Identity（身份 A）
  UnitTemplate + base SkillDef
        ↓
Progress（进度）
  CharacterProgress（level / tier / star / …）
        ↓
Modifiers（组合 C）  ← 升星 / 破境 / [装特技] / [觉醒预留]
        ↓
composeStats + composeSkill
        ↓
UnitRuntime（战斗只认这个）
```

| 层 | 模块（逻辑名） | 职责 |
|----|----------------|------|
| Identity | `templates` + `skills` + 未来 `bundle` | 角色「会什么」的底板 |
| Progress | `growth` / `ensureRoster` | 养成进度、存档补齐 |
| Effects | `starTypes` 泛化为 `GrowthEffect` | 可累加效果语义 |
| Compose | **新建 `skillCompose.ts`** | `composeSkill(base, mods[])` |
| Tracks | `growthTracks` / `starTracks` / `breakthroughPerks` | 表驱动数据 |
| Display | `growthHelpers` | UI 只读预览 / diff |
| Factory | `factory.ts` | 编排：derive → compose → runtime |

物理目录可渐进拆分；**先落地 compose + bundle 校验，不强制大搬家。**

---

## 3. 技能合成合同（核心）

### 3.1 冻结（战斗侧不变）

仍：一人 1 主动 + 普攻；`SkillDef` 字段集；qi 经济；无技能 CD；无通用防御行动。

### 3.2 合成允许改什么（相对现状加宽）

| 能力 | 现状 | 地基后 |
|------|------|--------|
| 倍率 / 耗能 | ✅ | ✅ |
| 强化已有 `applyStatus` | ✅ | ✅ |
| **追加** `applyStatus` 条目 | ❌ | ✅（升星质变用） |
| 写入 / 升级 `followUp` | ✅ | ✅ |
| 开关 / 追加 `effects`（purge/cleanse/…） | ❌ | ✅（走已有 `registerSkillEffect` kind） |
| 改 `targetPattern` / `tags` / `focusPolicy` | ❌ | **默认禁止**；若要开须单独修订 combat 规格 |

> 加宽的是 **compose 表达力**，不是新开战斗子系统。

### 3.3 `SkillModifier`（示意）

```ts
type SkillModifierSource = 'star' | 'breakthrough' | 'equipment' | 'awaken';

interface SkillModifier {
  source: SkillModifierSource;
  label?: string;           // UI：「★3 七进七出」
  // 以下字段可选叠加
  multiplierDelta?: number;
  qiCostDelta?: number;
  followUp?: FollowUpDef;
  statusPatches?: ApplyStatusDef[];      // 强化或追加
  effectPatches?: SkillEffect[];         // 追加非状态效果
  // equipment 形态互斥用
  morphId?: string;
}
```

```ts
composeSkill(base: SkillDef, mods: SkillModifier[]): SkillDef
listSkillModifiers(templateId, progress, equipmentCtx?): SkillModifier[]
```

`skillWithGrowth` **降级为** `listSkillModifiers(...).filter(star|breakthrough)` + `composeSkill` 的薄封装，避免双逻辑。

### 3.4 装备形态特技挂钩（装核口子）

- 装备 III 档产出 `SkillModifier`（`source: 'equipment'`）。  
- **攻击形态类** `morphId`：每人同时生效 **1** 条（优先级：套装 > 武器 > 饰品，与 equipment.md 一致）。  
- V1 实现：先打通「1～2 条示范特技 → compose」，特技池后填。

---

## 4. CharacterBundle（单卡清单）

```ts
interface CharacterBundle {
  templateId: string;
  // 引用校验，不必复制整表
  requireSkillId: string;
  starTrackComplete: boolean; // ★1..MAX 有节点
  breakthroughOverrideTiers?: number[];
}
```

或运行时：

```ts
assertCharacterBundle(templateId): void
// 检查：template 存在、skill 存在、★1..MAX 可 resolve、role/job 合法
```

- 内容 CI / 单测：对 `UNIT_TEMPLATES` 全量跑 assert。  
- **不要求**每卡都有个性破境；升星轨建议完整（可用 SHARED 回落，但 assert 要显式）。

---

## 5. Progress 扩展（预留，不立即玩）

`CharacterProgress` 可增 optional：

```ts
awakenTier?: number;  // GrowthTrack awaken
bondLevel?: number;   // GrowthTrack bond
```

- 存档 **v11**（bump 时再动）。  
- track 仍可 `enabled: false`，直到有消耗与节点表。  
- **不做**技能独立升级树（C1 已否决）。

---

## 6. 与双核的对应

| 核 | 地基落点 |
|----|----------|
| 人·解法 | Identity + 升星/破境 modifiers（质变）+ 布阵 |
| 装·风格 | equipment → SkillModifier（形态）+ 词缀数值（现有） |
| 正交 | 只换装能过一部分；只换人/升星能过一部分；高难两边都要 |

---

## 7. 实现顺序（地基里程碑）

| 里程碑 | 交付 | 验收 |
|--------|------|------|
| **F1** | `skillCompose.ts` + 迁移 `skillWithGrowth` | ✅ |
| **F2** | 加宽 modifier：`statusPatches` / `effectPatches` | ✅ |
| **F3** | `assertCharacterBundle` + 全卡校验测试 | ✅ |
| **F4** | 装备 → `SkillModifier` 挂钩（1 条示范特技「血刃」） | ✅ |
| **F5** | UI：`skillDiff` 全字段预览（不止连击） | ✅ |
| **F6** | 样板赵云 ★6 解锁 shred | ✅ 浅样板；批量身份后置 |

**明确后置：** 24 卡批量身份文案、觉醒/好感可玩、完整特技池、弱羁绊。

---

## 8. 非目标（防四不像）

- 宠物 / 完整符文库 / 强羁绊墙  
- 多主动技能栏、技能 CD 树  
- 第三条与双核无关的养成主轴  
- 改战斗主循环堆 if  

---

## 9. 拍板清单

请确认或改口：

1. **同意**以 `composeSkill` + `CharacterBundle` 为地基（先架构后内容）？  
2. **同意**升星可追加 `applyStatus` / `effects`，但默认不改 `targetPattern`/`tags`？  
3. **同意**装形态特技走同一 compose，F4 只做示范 1 条？  
4. 样板卡优先用哪张验深度？（建议：赵云 或 悟空，已有特例基础）

拍板后按 §7 F1→F5 开工；仍不自行 commit。

---

## 10. 相关文档

| 文档 | 用途 |
|------|------|
| [skill-design-spec](./2026-08-02-skill-design-spec.md) | 内容：母题卡填表、动词表、星章节奏、同质化禁令 |
| [build-dual-core](./2026-07-21-build-dual-core-design.md) | 双核愿景 |
| [character](./systems/character.md) | 人物系统权威 |
