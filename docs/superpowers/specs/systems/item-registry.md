# 物品主表与掉落（参考设计）

> **状态：** 架构参考稿（2026-10-05）· **未全面落地代码**  
> **原则：** 引擎 **id 全世界通用**；**显示名随故事皮**；掉落只引用 id / 配方 id，不写死中文。  
> **关联：** [economy §13–14](./economy.md) · [equipment](./equipment.md) · [dungeon](./dungeon.md) · [skin](./skin.md) · [player-story-spine](../2026-09-29-player-story-spine-design.md)

---

## 1. 为什么要单独一层（对标常见网游）

| 手游/网游做法 | 本项目对应 |
|---------------|------------|
| **资源本**掉「材料 id + 数量」（原神摩拉/天赋书、崩铁信用点/行迹材料） | `currency` / `material`：**堆叠物**，掉落行 = `itemId × count` |
| **圣遗物/装备本**掉「随机词条实例」，但受 **套装 id、档位、主词条规则** 约束 | **装备实例**：掉落行 = `equipmentRollProfileId`，现场 `generateEquipment` |
| **固定奖励**（任务、首通、活动） | `grant('ticket', 1)` 或 `equipmentBlueprintId` |
| 表在 Excel/JSON，**热更权重**（后置 ops-config） | `DropTable` → `LootEntry[]`，MVP 先随包 |

玩家背包里「东西很多」≠ 策划表里要有几万行固定装备；**零件 id 多 + 随机拼实例** 是 ARPG 常态（暗黑、POE、魔灵猎装）。文字游戏壳子一样适用：**读条用皮，结算用 id**。

---

## 2. 与「多世界皮」的关系（Spine / Skin）

与主线叙事同一套分工（[story-spine](../2026-09-29-player-story-spine-design.md)）：

```text
┌──────────────────────────────────────────────────────────┐
│  Item Spine（引擎 · 全皮共用）                              │
│  itemId · kind · 堆叠规则 · 图标键 · 掉落/商店/任务只认这层   │
└────────────────────────────┬─────────────────────────────┘
                             │ t(itemId, skinPreset)
┌────────────────────────────▼─────────────────────────────┐
│  Item Skin（按 preset 查表 · 可官方表 + AI 润色后置）        │
│  灵石 / 星尘 / 淬灵石 / 寻访帖 … 的显示名、短描述、掉落飘字   │
└──────────────────────────────────────────────────────────┘
```

| 锁死（跨皮不变） | 随皮变 |
|------------------|--------|
| `itemId`：`gold`、`stardust`、`gem_atk`、`enhance_stone` | `displayName`：灵石 / 信用点 / 链上碎片 |
| `kind`、是否进背包、是否可交易（后置） | 一行 `flavor`：「关隘缴获的流通通货」 |
| 掉落表里的 `itemId`、权重、区间 | 战报/结算 UI 上的**名称**（走 `t()`） |
| 装备随机规则 `equip_roll_*` | 生成装备**实例名**仍可走「精良戒指」类皮（equipment 已有槽位名） |

**禁止：** 仙侠皮掉 `item_xianxia_stone`、赛博掉 `item_cyber_credit` 两套 id——那是把 Skin 写进 Spine，存档和掉落无法合并。

**查名 API（目标）：**

```ts
tItem(itemId: string, preset: SkinPreset): string;
// 回退链：player.overlay.itemLabels?.[id] → officialLocale[preset][id] → neutralLocale[id]
```

与 [skin.md](./skin.md)、product §2.3 一致：**UI 禁止写死「灵石」**，结算账本左侧应 `tItem('gold')`。

---

## 3. 物品宇宙总览（对标网游 · 本游戏取舍）

主流手游/网游背包里通常不止「钱 + 装备」，大致有：

| 大类（行业习惯） | 典型例子 | 本项目 |
|------------------|----------|--------|
| **流通货币** | 摩拉、信用点 | `gold`、`stardust`、`xiuwei`、`ticket`（[economy §12](./economy.md)） |
| **体力/次数** | 树脂、体力药 | `stamina`（**非 ItemDef**，节奏字段；体力药后置为 `consumable`） |
| **角色养成材料** | 经验书、突破石、天赋材料 | `character_exp`（直灌）、`xiuwei`；**破境试炼材料**后置登记 |
| **装备养成材料** | 强化矿、附魔石、洗练砂 | `enhance_stone`、`gem_*`、`reroll_dust`；封存/洗练耗 `gold` |
| **装备本体** | 圣遗物/装备实例 | `Equipment` 实例 + `equipment_roll` / `blueprint` |
| **技能/形态特殊件** | 武器突破素材 | `morph_*`（T4 形态石，[equipment §12](./equipment.md)） |
| **消耗品** | 血瓶、战斗料理、复活 | **未开放**；id 先在表登记，`enabled: false` |
| **生活/制造** | 草药、矿石、图纸、成品药 | **未开放**；见 §6，只预留 `mat_*` / `recipe_*` |
| **任务/剧情** | 信物、钥匙、不可丢弃 | `quest_token_*`，无战力，`tags: quest` |
| **收集/外观** | 头像框、称号 | 平行线 **flavor 称号**无数值；外观后置 `cosmetic_*` |
| **抽卡副产物** | 碎片、万能券 | `cardShards`（按角色 id，走 gacha 而非通用背包） |

**设计原则：** 未开放的生活/炼药/锻造 **也要在 Item Registry 占 id 位**，避免日后「另起一套草药 id」和掉落表对不上。功能关闭 = `ItemDef.enabled === false` + Hub 无入口，**不是**没有定义。

与 [inventory-items.md](./inventory-items.md)（背包壳）、[shop.md](./shop.md)（消耗货币买东西）关系：**本文件是 id 与分类权威**；背包 UI 开工时只消费 Registry。

---

## 4. 类型系统：`ItemKind` + `ItemCategory`

### 4.1 `ItemKind`（存储与 grant 行为）

| kind | 说明 | 典型 storage |
|------|------|----------------|
| `currency` | 顶层货币栏，可不进格子 | `gold` / `currencies.*` |
| `material` | 可堆叠杂物、矿、草药、半成品 | `materials[id]`（目标统一袋） |
| `gem` | 镶嵌石（可单独 kind 或 tag=gem） | `gems[]` |
| `ticket` | 抽卡券、入场券 | `currencies.ticket` 或 `materials` |
| `consumable` | 战斗/探索一次性消耗 | `materials` + `use()` 钩子 |
| `quest` | 任务信物，不可卖 | `questItems` 或 `materials` + `trade_ban` |
| `cosmetic` | 外观（后置） | `cosmetics` |
| `character_shard` | 伙伴碎片（也可不纳入通用表，走 roster） | `roster[].cardShards` |

**非 ItemKind、但掉落表会出现：**

| 指令类型 | 说明 |
|----------|------|
| `equipment_roll` | `profileId` → `generateEquipment` |
| `equipment_blueprint` | 固定模板装 |
| `grant_character_exp` | 按上阵角色分配（特殊 grant） |

### 4.2 `ItemCategory`（UI 筛选 / 图鉴 Tab · 与 kind 正交）

`tags` 或单独字段，可多选：

`currency` · `equip_upgrade` · `equip_craft` · `character_growth` · `gacha` · `consumable` · `lifestyle` · `quest` · `dungeon_key` · `cosmetic`

例：`enhance_stone` → kind `material`，category `equip_upgrade`；`herb_mist_common` → kind `material`，category `lifestyle`（未开放）。

### 4.3 `ItemDef` 主表（Spine）

建议路径：`packages/game-core/src/items/registry.ts`（**待建**）。

```ts
export interface ItemDef {
  id: string;
  kind: ItemKind;
  categories: ItemCategory[];
  stackable: boolean;
  maxStack?: number;
  /** 未开放玩法：仍定义 id，避免分叉 */
  enabled: boolean;
  /** 过渡期存档映射；新物优先 materials 袋 */
  storage?: string;
  tags?: ('trade_ban' | 'show_in_codex' | 'discard_ban')[];
  /** 可选：使用/合成指向 recipeId */
  useRecipeId?: string;
}
```

**装备词缀零件**（`fx_*`、条件 def、稀有 def）**不是** ItemDef——它们是生成规则；玩家拿到的是 `Equipment` 实例或 `morph_*` 形态石。

---

## 5. 全量物品目录（登记表 · 卷一范围）

状态：**live** = 已有产出或消耗；**planned** = 设计内、未接 UI；**disabled** = 故意关闭。

### 5.1 货币与票券

| itemId | kind | 状态 | 主产 | 主耗 | 仙侠皮名（示例） |
|--------|------|------|------|------|------------------|
| `gold` | currency | live | 主线/副本/分解 | 洗练、封存、商店 | 灵石 |
| `stardust` | currency | live | 秘境、塔、首通 | 兑碎片 | 星尘 |
| `xiuwei` | currency | live | 塔 | 破境 | 修为 |
| `ticket` | ticket | live | 补给、首通、任务 | 召唤 | 寻访帖 |
| `stamina` | — | live | 自然恢复、补给 | 副本 | 时辰（非背包物） |

### 5.2 装备垂直（养成链）

| itemId | kind | 状态 | 主产 | 主耗 |
|--------|------|------|------|------|
| `enhance_stone` | material | live | 挖矿、分解、首通 | 强化、封存 |
| `reroll_dust` | material | live | 分解紫+ | 洗练（装备） |
| `gem_atk` … `gem_tenacity` | gem | live | 挖矿、分解 ep+ | 镶嵌 |
| `morph_*` | material | live/planned | 分解金、极稀有 | T4 形态（[morphs.ts](../../../packages/game-core/src/equipment/morphs.ts)） |
| `seal_imprint` | material | planned | 活动/分解 | 条件封存凭证（现网直接用 stone+gold） |

**装备实例** `Equipment`：猎装/镜渊 `equipment_roll`；不占 ItemDef 行。

### 5.3 角色养成（非装备）

| itemId | kind | 状态 | 说明 |
|--------|------|------|------|
| `character_exp` | — | live | grant 直灌上阵，显示为「经验」 |
| `card_shard_{templateId}` | shard | live | 抽卡重复；**可不进通用 Registry**，但掉落需引用 templateId |
| `breakthrough_token` | material | planned | 破境试炼（E4）通关证 |
| `role_emblem_{jobId}` | material | planned | 职能纹章（growth-draft），换皮名 |

### 5.4 消耗品（战斗/探索 · 未开放）

| itemId | kind | 状态 | 设计用途 |
|--------|------|------|----------|
| `cons_battle_rations` | consumable | disabled | 下一场全队小幅回血/盾（不占战斗内道具格过多） |
| `cons_stamina_elixir` | consumable | disabled | 体力 +N（日上限） |
| `cons_encounter_charm` | consumable | disabled | 指定遭遇词缀（E6 异变向） |

开放时：`useItem(id)` → 注册表钩子，**不**在战斗主循环写死 id。

### 5.5 生活 / 炼药 / 锻造（未开放 · **必须在设计内**）

采用 **「材料 id + 配方 recipe id」**，对标原神「采药→合成」、魔兽「矿石→锭→装备」的**前半段**；本游戏**成品装备仍主要来自刷本 roll**，生活系统做 **缓冲、定向、副业**，不替代猎装核。

| 层级 | id 约定 | 状态 | 说明 |
|------|---------|------|------|
| 采集原料 | `mat_herb_*`、`mat_ore_*`、`mat_beast_*` | planned | 挖矿可部分复用为 `mat_ore_iron`；新地图解锁新 mat |
| 加工半成品 | `mat_refined_*` | planned | 锻造锭、炼药液基 |
| 炼药成品 | `cons_potion_*` | disabled | 战斗外 buff 或战前一次性 |
| 锻造图纸 | `recipe_schematic_*` | planned | 解锁 `craft_forge` 配方，非装备实例 |
| 锻造定向 | `craft_kit_set_pojun` | planned | 提高某 set 权重的一次性道具（可选） |

**配方表（后置）** `RecipeDef`：

```ts
{ id: 'recipe_potion_atk_small', station: 'alchemy', inputs: { mat_herb_fire: 2, gold: 50 }, outputs: { cons_potion_atk_small: 1 } }
{ id: 'recipe_ingot_spirit', station: 'forge', inputs: { mat_ore_spirit: 3 }, outputs: { mat_refined_spirit_ingot: 1 } }
```

`station: 'alchemy' | 'forge' | 'mine' | 'disassemble'` —— **站点未开放时配方仅登记**，掉落可先掉 `mat_*` 进背包「灰化展示」。

### 5.6 任务 / 剧情 / 钥匙

| itemId | kind | 状态 | 说明 |
|--------|------|------|------|
| `quest_token_*` | quest | planned | 主线/悬赏持有；无战力 |
| `key_dungeon_*` | material | planned | 周本钥匙（若做次数门） |

### 5.7 副本与活动（引用 DropTable，不重复造 id）

| 来源 | 掉什么 |
|------|--------|
| 猎装 `gear_trial` | `equipment_roll` + `gold` + `character_exp` + 微量 `stardust` |
| 镜渊 `abyss_mirror` | 同上 + T3 权重 |
| 塔 `tower` | `xiuwei`、里程碑 `stardust` |
| 秘境 | `stardust` |
| 挖矿 | `enhance_stone`、`gem_*` |
| 主线 | 进度 + 首通包 + 每场 `gold`；**不掉装** |

---

## 6. 生活技能与合成（架构占位）

```text
         mat_ore ──forge──► mat_ingot ──(可选)──► craft_kit / 商店
         mat_herb ──alchemy──► cons_potion ──► 战前 buff
              ▲                    │
              └──── 掉落 / 挖矿 / 任务 grant(itemId)
```

| 系统 | 职责 | 与 Item Registry |
|------|------|------------------|
| **挖矿** | 已 live | 产出应逐步改为 `grant('enhance_stone')` / `grant('gem_atk')` |
| **炼药** | disabled | `RecipeDef.station=alchemy`；UI 后置 |
| **锻造** | disabled | 半成品 + 可选定向 kit；**不**与 `generateEquipment` 抢主循环 |
| **分解** | live | 产出映射到已有 itemId（见 disassemble） |
| **洗练/封存/重铸 T3** | live | 消耗 `gold`、`enhance_stone`、`reroll_dust` |

**多世界皮：** `mat_herb_mist` 的 name 在赛博可以是「冷却凝胶」，id 不变；配方 `recipe_*` 只认 id。

---

## 7. 背包与存档（目标形态）

现网字段较散（`gold`、`enhanceStones`、`gems[]`、`inventory[]`）。目标：

```ts
PlayerState {
  gold: number;
  currencies: { stardust, xiuwei, ticket, ... };
  materials: Record<string, number>;  // 统一堆叠袋：enhance_stone, reroll_dust, mat_*, cons_*
  gems: { gemId, count }[];           // 可迁入 materials，保留或兼容一层
  inventory: Equipment[];           // 仅穿戴件实例
  questItems?: Record<string, number>;
}
```

迁移策略：**Registry 声明 storage 映射**；旧字段只读兼容 → 双写 → 单写。

---

## 8. 显示名：官方皮表（Skin）

每 preset 一张 **locale 表**（JSON 或 TS），只含「名 + 可选短描述」：

```json
// officialLocales/xianxia.items.json（示例）
{
  "gold": { "name": "灵石", "desc": "诸界流通的硬通货" },
  "stardust": { "name": "星尘", "desc": "界隙沉淀的微尘" },
  "enhance_stone": { "name": "淬灵石", "desc": "温养器纹的粗坯" },
  "ticket": { "name": "寻访帖", "desc": "叩问命格的凭引" }
}
```

```json
// officialLocales/cyberpunk.items.json（示例）
{
  "gold": { "name": "信用点", "desc": "合约结算用的流通单位" },
  "stardust": { "name": "链屑", "desc": "分布式账本掉落的碎片" },
  "enhance_stone": { "name": "热插拔晶粒", "desc": "外骨骼模组校准耗材" },
  "ticket": { "name": "招募码", "desc": "人事池单次检索权" }
}
```

AI 生成皮时：**只允许改 locale 文案**，`validate` 不得新增 itemId（与 narrative-skin 校验同思路）。

---

## 9. 掉落表（参考手游权重表）

### 9.1 结构

```ts
export type LootEntry =
  | { type: 'grant'; itemId: string; count: number | [number, number]; weight: number }
  | { type: 'roll'; profileId: string; weight: number }
  | { type: 'blueprint'; blueprintId: string; weight: number }; // 后置

export interface DropTable {
  id: string;              // drop_gear_trial_ch2
  entries: LootEntry[];
  /** 一次结算最多 roll 几条（通常装备 1 + 若干 grant） */
  rolls?: number;
}
```

**一次猎装胜利（参考原神副本）：**

1. 必跑 `roll: equip_roll_gear_trial` → 1 件装备实例  
2. 并行抽 0~N 条 `grant`（灵石、星尘、经验）  

权重在同一 `DropTable` 或拆成 `subTableId`（后置）。

### 9.2 装备配方 `EquipmentRollProfile`（不是 itemId）

```ts
export interface EquipmentRollProfile {
  id: string;   // equip_roll_gear_trial_ch2
  itemLevel: { fromChapter: true } | { min: number; max: number };
  rarityWeights?: Partial<Record<Rarity, number>>;
  setIdChance?: number;
  setIdWeights?: { id: string; weight: number }[];
  t3IdWeights?: { id: string; weight: number }[];
}
```

章推进时：**换 profileId 或换 DropTable**，而不是改 `generateEquipment` 源码。  
现网 `loot_gear_trial` / `loot_abyss_mirror` → 迁为 `DropTable` + `EquipmentRollProfile` 各一条。

### 9.3 与章节解锁

| 解锁（Spine） | 掉落侧 |
|---------------|--------|
| `unlocksOnClear: dungeon abyss_mirror` | 玩家可进镜渊；掉落表 `drop_abyss_mirror` 可用 |
| `unlocksOnClear: encounter wall` | 猎装遭遇池 +（可选）`set_pojun` 权重上调 |
| `chapterCleared` 进档 | `itemLevel` 带、`equip_roll_*_chN` 切换 |

---

## 10. 发放管线（统一入口）

目标形态（与 [economy §14](./economy.md) `BattleSettlement` 一致）：

```text
resolveDropTable(tableId, playerState)
  → GrantPlan[]（itemId+数量 + 可选 equipment 实例）
  → applyGrants(state, plan)
  → buildBattleSettlement(before, after, equipment, lines)
```

规则：

- 所有 `gold += n` 逐步改为 `grant('gold', n)`  
- UI 只读 `BattleSettlement` + `tItem` 显示左侧名称  
- **战斗内**不算套装；套装在装备系统读 `setId`

---

## 11. 实施分期（控制体量）

| 阶段 | 内容 | 验收 |
|------|------|------|
| **P0** | Registry：**§5 live 全登记** + `tItem` + 两皮 locale；`materials` 袋设计定稿 | 能列出「游戏里有啥」，未开放项 `enabled:false` |
| **P1** | `DropTable` / `grant()` 重构猎装/镜渊/挖矿产出 | 行为与现网一致 |
| **P2** | 章档 `equip_roll_*` + 任务/商店引用 itemId | 推进感 |
| **P3** | `RecipeDef` 壳 + 首批 `mat_*` 掉落（可不接炼药 UI） | 生活系统接得上 |
| **P4** | 炼药/锻造 UI、`consumable` 战前使用 | 扩展模块开工 |
| **后置** | 保底、ops 热更、外观 | ops-config |

**不要 P0 做完的事：** 全装备手工表、每皮独立 itemId、掉落写中文。

---

## 12. 与现有代码映射

| 现网 | 迁后 |
|------|------|
| `lootTables.ts` `gold: [5,15]` | `DropTable` entries `grant gold` |
| `grantDungeonReward` | `resolveDropTable` + `rollEquipment(profileId)` |
| `generateEquipment` | 不变，只吃 profile |
| `chapterFirstClear.ts` | `grants: [{ itemId:'stardust', count:6 }, …]` |
| `grantMainlineBattleScrap` | `grant('gold', 1..5)` |
| `RARITY_LABELS` / 装备名生成 | 装备实例名仍可在 equipment 内皮化；**材料名**走 `tItem` |

---

## 13. 自检（加新物品前）

1. 是否已有 **引擎 id**？是否 **所有皮共用**？  
2. 显示名是否只出现在 **locale**，不在掉落表/代码常量？  
3. 若是装备快感，是否走 **profile/blueprint**，而非堆 `ItemDef` 行？  
4. 是否走 **grant 单入口**，便于结算与存档对账？

---

*冲突时：本章与 economy §13 分工一致；装备随机细则以 equipment 为准；叙事皮以 skin / story-spine 为准。*
