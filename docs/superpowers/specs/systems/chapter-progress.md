# 章节进度系统

> 系统骨架 #6。  
> 配置权威：内容/解锁 `packages/game-core/src/chapter/defs.ts`；强度档 `packages/game-core/src/chapter/bands.ts`。  
> **实现状态：** B4 框架 + **卷一 10 章**强度档 + Hub **关卡条**（Skin 地名；非自由地图）。主线 story 节点对话演出见 narrative-skin §Hub。

## 边界

| 本章管 | 不管 |
|--------|------|
| 章骨架、节点（story/battle）、通关解锁内容池 | 战斗伤害公式、猎装掉落主循环、抽卡概率 |
| `isContentUnlocked` 供各系统查询 | 硬战力锁关、卖通关权 |
| 章档：敌人倍率 + 底线/建议/碾压战力（展示） | 按玩家当前战力刷怪；塔 instant 不跟档 |
| Hub 关卡条（当前章场地：已过 / 此地 / 未到） | 真地图、可走动格子、Rogue 多路线 |

**剧情推进遇敌**属本章；刷本入口属 [dungeon.md](./dungeon.md)，但遭遇池可被本章 `encounter` 解锁过滤。

## 框架怎么用（后续改内容）

只改内容表 `chapter/defs.ts`；改强度数字只改 `chapter/bands.ts`：

| 表/常量 | 作用 |
|---------|------|
| `START_UNLOCKS` | 开局即有的 `dungeon` / `gacha_unit` / `encounter` |
| `CHAPTERS` | 章顺序、节点（`title` / `place` / story|battle）、通关后 `unlocksOnClear` |
| （规划）`battleWaves` | **引擎默认**：同一 battle 节点内多波遭遇（小兵→小 Boss→Boss）；**不由 Story Gen Skill 生成** |
| `CHAPTER_BANDS` | 正在打的章的敌人倍率与建议战力（`chapter/bands.ts`） |

解锁 kind：

- `dungeon` — 副本入口（如 `gear_trial` / `tower` / `stardust_realm`）  
- `gacha_unit` — 可进抽卡池的模板 id  
- `encounter` — 猎装遭遇池里会出现的遭遇 id  

API（`chapter/progress.ts` / `chapter/bands.ts`）：

```
collectUnlocks / isContentUnlocked / listUnlockedIds
getChapterView / getChapterRoute / advanceStoryNode / completeChapterBattle
pickUnlockedEncounterIndex  // 刷本用已解锁遭遇
getChapterBand / battlePressure  // 章档 × 本种压力
```

Hub 主线是**关卡条**不是地图：读当前章 `nodes`，标已过 / 此地 / 未到。按钮「进入 · 场地」。未到站点不进去。故事皮只换 `place` 与过场文案。

开战：`createBattle(..., { pressure: battlePressure(chapterCleared, dungeonPressure) })`。  
`chapterCleared === 0` 打第一章。塔不进战斗、不乘章档。

### 战斗节点 · 多波（引擎 · 默认表）

- **目标：** 一个 Hub **battle 小节**内连打多波（前期如 2 小兵 + Boss；后期加重），**全部胜利**才 `completeChapterBattle` 进下一 stop。  
- **真源：** `chapter/defs.ts` + `dungeon/encounters.ts`（或 `battleWaves[]`），策划/程序维护；**官方默认即可**，玩家定参与 Skill **不改波次表**。  
- **Skin：** battle 节点 `blurb` 可写「第几波感」作 flavor，但**不得**在 overlay 里捏造 encounter id 或波数（与表不一致时以表为准）。

存档：`chapterCleared` + `chapterNodeIndex`（存档总版本见 [save.md](./save.md)，现网 **v15**；中土卡池迁完 **v16**）。

## 强度档（已落地）

每章三道线，数字可再调表，**不锁按钮**：

| | 含义 |
|--|------|
| 底线 `floorPower` | 低于此站位也很难过 |
| 建议 `recommendedPower` | Hub 展示；猎装同档，镜渊再乘本种 1.3 |
| 碾压 `crushPower` | 通常能碾；错队仍可能卡机制 |

循环：章节卡住 → 塔养肉身 / 猎装养装 / 升星养招 → 再推章。解法窗口在底线～碾压之间，不是万能。敌人只跟**正在打的章**走，不读 `partyPower` 缩放。

## V1 骨架（已写入 defs）

- 主线 **10 章**（卷一）；节点为 story / battle 混排。  
- 示例门锁：开局有猎装/塔/**星尘秘境**/开局圈（蜀汉·取经凡良 + 关羽/典韦/后羿）；其后按圈解锁，见 [中土故事圈 §6](../2026-08-26-zhongtu-roster-circles-design.md)。迁完前代码仍走旧 `expandIdsByUnlock`。  
- 文案可整包替换；**结构与解锁表必须真实。**

### 5.5 剧情与进度（产品约束）

- 锁**内容池**，不硬锁通关资格；不卖通关权。  
- 故事皮不锁题材；V1 中性占位即可。

---

## 9. 路线图：AI 有限剧情（V2 想法，已记录）

### 9.1 目标假设

基于用户自己的世界观/走向生成剧情皮，有望提升**部分用户**的粘度与分享欲；  
但**留存主引擎仍是玩法循环**。个性化是加成项，不能替代刷装/布阵/抽卡的爽感。

### 9.2 模式（非完全自由）

- 用户输入期望世界观（可很短）或选择「默认线 / 交给 AI」。
- Skill/AI 按**固定章节骨架与有限选项枚举**生成各章文案与情节包装。
- 游玩中用户可在节点选择走向（2–3 个选项），不跳脱框架。
- 不想管剧情的用户：完全默认线或一键 AI 代选。

### 9.3 约束（防跳脱）

| 锁死（框架） | 可生成（皮肤） |
|--------------|----------------|
| 章结构、战斗场次、解锁、掉落 | 世界名、势力、称呼、题材气质 |
| 选项槽枚举与 flag | 章回对话、过场 |
| **职能 role / 技能效果 ID / 站位** | 卡面显示名、来历短文、装备显示名 |
| 数值与规则 | 在允许枝上的情节叙述（**题材不限仙侠**） |

### 9.4 建议排期

| 阶段 | 内容 |
|------|------|
| V1 | 内容配置化 + `skinId` 预留；仅官方/占位默认线 ← **框架已落地** |
| V1.5 | 开局定调 + **默认仙侠 pack** + `NarrativeOverlay` 读表（见 [2026-09-29-player-story-spine-design](../2026-09-29-player-story-spine-design.md)） |
| V1.5+ | **章后平行原世界简报**（现代工位线 · 三档 · 绑战力/名册；Spine 不变）→ [parallel-sync-realworld-line](../2026-09-29-parallel-sync-realworld-line.md) |
| V2 | 章内有限走向 + AI 生成 overlay；注意成本缓存与审核 |
