# 副本 / 遭遇系统

> 系统骨架 #5。  
> 配置：`packages/game-core/src/dungeon/`。  
> **实现状态（2026-07-29）：** 猎装 + 塔 + **星尘秘境**；摸鱼补给见 stamina；体力扣点见 stamina。  
> **剧情推进遇敌** 归 [chapter-progress.md](./chapter-progress.md)；可复用本目录遭遇表，但**不属**副本系统。  
> **猎装重构（难度分档、套装非核心）：** 见 [gear-dungeon-redesign.md](./gear-dungeon-redesign.md) · 现网仍为旧双入口。

## 边界（已拍板 · 2026-07-22）

| 副本管 | 副本不管 |
|--------|----------|
| 本种入口、遭遇池、奖励表、薄进度（如塔层） | 战斗结算公式、装备穿戴/套装 2/4 效果、抽卡、剧情节点遇敌 |

**扩展模型：** 新本 = 新 `DungeonDef` + 遭遇池（可复用）+ 奖励表；能力可以是装备、修为或其他货币，不必新开子系统。

## V1 本种（现网实现 · 待按 gear-dungeon-redesign 演进）

| id | 显示名 | 现网能力 | 目标方向（拍板意向） |
|----|--------|----------|----------------------|
| `gear_trial` | 猎装试炼 | 单入口刷装，高 `setIdChance` | → **多副本实例** + 普通/困难/地狱/大秘境分档；**套装仅点缀** |
| `abyss_mirror` | 镜渊试炼 | 第二入口，高压 + T3 权重 | → **并入高难度档**，不再与猎装并列两套心智 |
| `tower` | 修炼塔 | 修为 instant | 不变 |
| `stardust_realm` | 星尘秘境 | 星尘 instant | 不变 |

- **体力：** 猎装开战扣 10、镜渊 12、塔 5、秘境 8（[stamina](./stamina.md)）。  
- **套装：** 玩法上存在 2/4 效果（[equipment.md](./equipment.md)），但**刷本目标不是凑套**；掉落 `setIdChance` 应从「营销向高」下调（见 redesign 文档）。

### 目标形态摘要（未全面落地）

- 章进度解锁 **不同猎装副本**（波次小怪 + Boss）。  
- 同副本线开放 **普通 → 困难 → 地狱 → 大秘境**，敌人压力与 **lootProfile** 同步上浮。  
- 掉落核心：**装等、品级、词缀/T3**；历练与零钱随难度略增。

## 数据钩子（勿写死在 Hub）

```
// 现网
DungeonDef { id, name, kind, runMode, encounterPool[], lootTableId, blurb, pressure }

// 目标（猎装）
GearDungeonDef { id, tier, unlockChapter, waves[], bossEncounterId, lootProfileId, pressure, staminaCost }
LootProfile / DropTable → grant(itemId) + equipment_roll(profileId)
```

- `runMode: 'battle' | 'instant'`  
- 胜场：`grantDungeonReward(state, dungeonId)`；塔：`climbTower`（instant）  
- 新本种：加表，禁止战斗主循环按本 id 堆业务

## Demo 三套路（遭遇零件 · 猎装池）

| 套路 | 构成意图 |
|------|----------|
| 盾墙 `wall` | 双前排高防 → 破甲 / 磨 / 终伤 |
| 后排弓 `archers` | 脆后排高输出 → 穿透或切前排 |
| 速攻 `raiders` | 高 spd 穿透 → 控制 / 更快秒后排 |

## 软关卡压力（已落地）

> 总图：[build-dual-core-design](../2026-07-21-build-dual-core-design.md)。章档权威：[chapter-progress.md](./chapter-progress.md) / `chapter/bands.ts`。

- 敌人：`章档 enemyMult × 本种 pressure`（猎装 1 / 镜渊 1.3）。不按玩家战力刷怪，不硬锁进门。  
- Hub 展示建议战力，按钮不锁。  
- **塔**仍是 instant 修为产口，不进战斗、不跟敌方档。  
- 战败提示仍对准缺破甲 / 禁疗 / 抗压等解法。

## 与套装 / 装备推进

| 项 | 结论 |
|----|------|
| 构筑 | 刷装爽点 = **随机词缀 / 条件 / T3 / 装等**，套装是附加标签 |
| 掉落 | `setId` **低概率**即可；副本主要调 `rarityWeights`、装等、T3 池 |
| 战斗 | 套装 2/4 效果在装备系统读；**不**要求刷本凑齐才能推进 |

详见 [gear-dungeon-redesign.md](./gear-dungeon-redesign.md)、[equipment.md §套装](./equipment.md)。
