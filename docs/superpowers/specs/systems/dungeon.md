# 副本 / 遭遇系统

> 系统骨架 #5。  
> 配置：`packages/game-core/src/dungeon/`。  
> **实现状态（2026-07-29）：** 猎装 + 塔 + **星尘秘境**；摸鱼补给见 stamina；体力扣点见 stamina。  
> **套装掉落倾向、哪本开哪套** 与 [equipment.md](./equipment.md) 联动；不由战斗系统定义。  
> **剧情推进遇敌** 归 [chapter-progress.md](./chapter-progress.md)；可复用本目录遭遇表，但**不属**副本系统。

## 边界（已拍板 · 2026-07-22）

| 副本管 | 副本不管 |
|--------|----------|
| 本种入口、遭遇池、奖励表、薄进度（如塔层） | 战斗结算公式、装备穿戴/套装 2/4 效果、抽卡、剧情节点遇敌 |

**扩展模型：** 新本 = 新 `DungeonDef` + 遭遇池（可复用）+ 奖励表；能力可以是装备、修为或其他货币，不必新开子系统。

## V1 本种（B3 薄刀 · 已拍板）

| id | 显示名 | 能力 | 运行方式 | 遭遇 | 奖励 |
|----|--------|------|----------|------|------|
| `gear_trial` | 猎装试炼 | 刷装 / `setId` 倾向 | **进战斗** | 八题池（按解锁过滤） | 必掉装备；`setId` 权重高于全局；偏「量」 |
| `abyss_mirror` | 镜渊试炼 | 高压 + **解法 T3** | **进战斗** | 乱心/铁壁/Boss | 必掉装备；低 `setId`；紫/金 + 裂甲/破灵/净疗等 T3 加权 |
| `tower` | 修炼塔 | **修为唯一产口**（小节点/破境） | **本刀：点一下薄壳**（战斗后置） | — | 修为；层数 +1；里程碑星尘 |
| `stardust_realm` | 星尘秘境 | 刷星尘 | **instant 薄壳** | — | 星尘区间掉落 |

- **本系统不做：** 每日次数上限、套装 2/4 结算、章节地图（章节 → chapter-progress）。  
- **体力：** 已由 stamina B2 接入（猎装开战扣 10、塔扣 5、星尘秘境扣 8）；本分册不定义数值。  
- **摸鱼补给：** 每日一次体力+券（`tryClaimDaily`）；日戳在存档 `lastDailyClaimDay`。  
- 套装：只加深掉落 `setId`；2/4 结算见 [equipment.md](./equipment.md)。

## 数据钩子（勿写死在 Hub）

```
DungeonDef { id, name, kind, runMode, encounterPool[], lootTableId, blurb }
LootTable  { guaranteeEquipment, setIdChance, setIdWeights, gold/xiuwei/stardust/exp 区间 }
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
| 关系 | 副本决定可掉哪些 `setId`、权重 |
| 当前 | **B3 已落地**：猎装本提高 `setId` 掉落率；**不结算** 2/4 |
| 后置 | 装备侧套装 2/4（等内容）；章节可再锁掉落池 |

详见 [equipment.md §套装](./equipment.md)。
