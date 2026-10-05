# 猎装副本重构方向（难度分档 · 套装非核心）

> **状态：** P1 已落地（2026-10）· **副本线**（左列表）× **难度档**（右 Tab）· 引擎多实例 id · `setIdChance` 8% · 独立猎装页 · 旧 `gear_trial`/`abyss_mirror` 仅兼容  
> **权威挂靠：** 落地后并入 [dungeon.md](./dungeon.md) §猎装；经济分工改 [economy.md](./economy.md) §13  
> **构筑总图：** 双核仍是 **人（解法）× 装（风格词缀/T3）**；套装只是装上的**可选标签**，不是刷本目标。

---

## 1. 为什么要改认知

| 旧 B3 表述（待淡化） | 新方向 |
|----------------------|--------|
| 猎装 = 刷套装；`setIdChance` 55% | 猎装 = **副本推进**：小怪波 + Boss，**掉落分布随难度爬升** |
| 镜渊 = 另一套「高压 + 对症 T3」入口 | 并入 **困难 / 地狱 / 大秘境** 档，或作为同框架下的**高压副本实例**，不再与「猎装」并列两套心智 |
| 套装决定刷哪 | 套装 **低概率点缀**；核心是品级、装等、随机词/条件/T3 |

玩家目标句：**「开更高难度的本，掉更好的装」**，不是「先把破军 4 件套刷齐才能玩」。

---

## 2. 副本结构（对标网游「阶段开放」）

### 2.1 一层：副本实例 `GearDungeonDef`

每个可进的本是一条 **实例**（随章节/等级解锁），不是只有一个「猎装试炼」按钮：

```text
GearDungeonDef {
  id: string                    // 引擎 id，皮可换名
  tier: 'normal' | 'hard' | 'hell' | 'rift'
  unlockChapter: number         // chapterCleared >=
  unlockBreakthrough?: number // 可选破境门槛（大秘境）
  waves: { encounterId, label? }[]
  bossEncounterId: string
  lootProfileId: string         // → EquipmentRollProfile + 副产物 grant
  pressure: number              // × 章档 enemyMult
  staminaCost: number
  recommendedPower?: number     // Hub 展示，不硬锁
}
```

- **推进感：** 同一副本线可有多波（复用现有 `battleWaves` 思路），Boss 关掉落略好（可同 profile 或 `bossLootProfileId`）。  
- **解锁感：** 通章 / 破境 → Hub 地图或列表出现新副本、「困难」开关。

### 2.2 难度四档（普通 → 大秘境）

| 档位 | 定位 | 压力（示意） | 掉落倾向（相对全局 DROPTABLE） | 解锁节奏（卷一示意） |
|------|------|--------------|------------------------------|----------------------|
| **普通** | 熟悉机制、养级 | 1.0 | 装等跟章中位；白绿蓝为主，少量紫 | 早期章即开 |
| **困难** | 同副本高压版 | 1.1～1.2 | 紫率↑、历练↑ | 章 3～4 |
| **地狱** | 需解法+装跟得上 | 1.25～1.35 | 紫金权重↑、T3 权重略↑ | 章 5～6 |
| **大秘境** | 后期周回/挑战（后置） | 1.4+ | 装等顶 band、金与优质词；套装仍低 | 高章 + 破境 |

**大秘境**可先只做数据壳（`tier: rift` + 更高 profile），UI 后置。

### 2.3 镜渊怎么办

建议 **不再作为与猎装平级的第二种「本种」**：

- **方案 A（推荐）：** 现有镜渊遭遇池 → 映射为若干 **地狱档** 副本实例（如「铁壁灵阵·地狱」），掉落用 `loot_profile_hell_*`，T3 解法权重在 profile 里调，而非单独 `abyss_mirror` id。  
- **方案 B：** 保留 `abyss_mirror` 为 **困难模式开关**（同一副本 + `tier=hard` 覆盖），Hub 只显示一个副本名。

无论 A/B，**战斗与结算只认** `GearDungeonDef` + `lootProfileId`，避免 `dungeonId === 'abyss_mirror'` 硬编码。

---

## 3. 掉落定什么（难度上去变什么）

主线仍不管装备 RNG（见 economy）；**猎装副本**一次胜利典型包：

| 内容 | 是否随难度升 | 说明 |
|------|----------------|------|
| **装备 ×1** | 必掉（可 Boss 关加成） | `equipment_roll` / profile |
| **品级分布** | ✅ 主旋钮 | `GEAR_TIER_RARITY_WEIGHTS`：普通封顶良、困难封顶珍、地狱可绝；见 `gearRarityByTier.ts` |
| **装等** | ✅ | 同章内 normal 用 band 中下段，hell/rift 用 band 顶 |
| **词缀/T3 质量** | ✅ | profile 提高 T3 权重、条件出现率（equipment 生成器） |
| **历练 character_exp** | ✅ | 区间随 tier |
| **灵石 / 微量星尘** | 略升 | 副产，不抢装的核心 |
| **套装 setId** | ❌ 不作为核心 | **全局低调**：如 5%～12% 带 set 标签，权重均分；不引导「刷齐 4 件」 |
| **定向材料 mat_*** | 后置 | 生活系统接入后，地狱可多掉冶炼原料 |

**Boss 关：** 可与小怪同 profile，或 `bossLootProfileId` 略抬一档稀有度（常见手游做法）。

---

## 4. 与章节推进的关系

```text
Story Spine（章序、解锁）
    → 开放哪些 GearDungeonDef（列表变长）
    → 每档难度是否解锁（普通全开 / 困难章 3+ …）
    → itemLevelBand(chapterCleared) 决定装等天花板
    → lootProfileId(tier, chapterBand) 决定「掉得多好」
```

- **不是**「每个主线战斗节点一张装备表」。  
- **是**「章进度开新副本 + 开更高难度键」。

遭遇 id（`wall`、`boss_warden`…）仍是 **战斗零件**；副本表引用它们组成 waves/boss。

---

## 5. 数据模型演进（工程）

现网：

```text
DungeonDef (gear_trial | abyss_mirror) + lootTables.ts
```

目标：

```text
GearDungeonDef[]          // 多实例 + tier
LootProfile / DropTable   // 按 profileId 引用 itemId + equipment_roll
chapterUnlock → 过滤可见副本
grantDungeonReward(state, gearDungeonId)  // 或 runGearDungeonClear
```

**套装字段保留但下调：** `setIdChance` 从 0.55 调至设计目标（如 0.08）；文档与 economy 同步写「点缀」。

---

## 6. 实现顺序（建议）

1. **文档拍板**：economy §13、dungeon §V1 改为本方向；标记旧「猎装高套装」为 deprecated。  
2. **表驱动**：卷一 3～5 个 `GearDungeonDef`（普通）+ 1～2 困难，profile 分档。  
3. **Hub**：列表选本（替代单一「猎装试炼」）；体力仍按次扣。  
4. **迁移**：`abyss_mirror` 入口合并或映射地狱实例。  
5. **大秘境**：profile + 解锁条件，玩法规则后置。

---

## 7. 体验自检

- 通一章后是否有 **新本或新难度** 可点？  
- 困难是否 **掉得更好**（看装等/紫率），而不是只「怪更硬」？  
- 玩家是否会在意 **某条武器上的条件/T3**，而不是套装几件？  
- 套装凑齐是否 **锦上添花**，而非卡关条件？

---

*冲突时：构筑双核 > 旧 B3 套装营销文案；数值表以 balance-changelog 记录。*
