# 人物模块做透设计（C1 · 扩展口 + 体验）

> **地位：** 已拍板实现设计（2026-07-29）。  
> **范围：** 人物/卡池本阶段完工（含成长扩展口 + 伙伴体验）；不含正式图鉴、扩池 16+、觉醒/好感可玩内容。  
> **权威细则仍归：** [character.md](./systems/character.md)、[growth-draft](./2026-07-20-character-growth-draft.md)。  
> **全项目原则：** 每系统完工 = 玩法闭环 + 可扩展架构口（见 [tech.md §7.2](./tech.md)、[systems-overview](./systems-overview.md)）。

## 1. 目标

1. **架构：** 成长三轴改走注册表；升星节点支持 override / stack；显示名与公式分离。  
2. **体验：** 列表可筛可读；养成升星有 diff；技能展示成长后效果；布阵有推荐与缺口提示。  
3. **边界：** 后续加 awaken/bond / 新货币 / 新星节点 → **只注册或加表行**，不掀战斗主循环与面板主循环。

## 2. 全项目原则（本轮一并落盘）

| 项 | 约定 |
|----|------|
| 系统完工标准 | 玩法闭环 + **扩展口/注册表/配置表** + 明确边界 |
| 禁止 | 「先硬编码三轴/三货币，以后再拆」 |
| 新系统默认 | 与战斗 `register*` 同精神：钩子先留、内容后加 |
| 本轮人物 | **C1**：注册表现有三轴；觉醒/好感 **只预留 track id 或注释口**，不做可玩内容 |

## 3. Core 架构

### 3.1 `GrowthTrack` 注册表

建议落在 `packages/game-core/src/character/growthTracks.ts`（或等价拆分）。

每条 track 至少包含：

| 字段 | 说明 |
|------|------|
| `id` | `level` \| `breakthrough` \| `star`（预留口：`awaken` / `bond` 可不注册或 `enabled: false`） |
| `label` | 中性显示名（升级 / 破境 / 升星） |
| `order` | 面板渲染顺序 |
| `canApply(state, templateId)` | 是否可点 |
| `preview(state, templateId)` | 消耗摘要 + 效果一句（给 UI） |
| `apply(state, templateId)` | 返回 `{ ok, state, message }` |

**迁移：** 现有 `tryLevelUp` / `tryBreakthrough` / `tryStarUp` 改为调用对应 track 的 `apply`，或保留同名薄包装以免调用方大爆。

面板属性页：**按注册表 `enabled` 轨渲染按钮**，禁止写死三个 if 分支作为唯一入口。

### 3.2 `BreakthroughDisplay`

- `tier →` 中性名（炼气/筑基…）与 `LEVEL_CAP_BY_TIER` / `breakthroughCost` **分表**。  
- UI / `breakthroughLabel` 只读 Display 表。

### 3.3 `StarNode` 表

- 共用 `SHARED_STAR_NODES` + `STAR_OVERRIDES`（已有）。  
- 补 **`stack?: boolean`**：`true` 时该星 = 共用节点 effects **并上** override；默认仍 override 替换。  
- `resolveStarNode` / `unlockedStarNodes` 认 stack 规则。  
- **本轮特例加深（可控）：**  
  - `tank_a` ★3：护盾/格挡向（`rare_stat` block 或等价现有钩子）  
  - `heal_a` ★3：治疗向（`stat_pct` 或现有钩子；**不为升星新开战斗子系统**）  
  - `burst_a` ★3 保留「影袭连击」示范  

### 3.4 显示名词表

| 表 | 用途 |
|----|------|
| `ROLE_LABELS` | flex→全能 … 九职能中性中文 |
| `JOB_LABELS` | adept→行者、assassin→刺客 … |
| `RARITY_LABELS` | 已有（凡/良/珍/绝） |

故事皮后换词表不换 id（与 skin 约定一致）。

### 3.5 只读 helper（UI 不自算公式）

| API | 用途 |
|-----|------|
| `previewStarUp(state, id)` | 下一星消耗（碎片优先再星尘）、属性/节点 diff 摘要 |
| `skillDisplayFor(templateId, progress)` | 包装 `skillWithGrowth`，含 followUp 说明字段 |
| `formationHints(state)` | 缺职能一句 + 各卡 `preferredSlot` 推荐行（前/中/后） |

## 4. Web 体验

### 4.1 伙伴列表

- 筛选：全部 / 已有 / 未获得；职能；稀有度。  
- 排序：默认稀有度 → 等级 → 名称。  
- 未获得：可进 **只读预览**（技能 + 职能/职业中文；无养成消耗按钮；CTA「去召唤」）。  
- 稀有度框保留。

### 4.2 详情养成

- 升星区：碎片进度 + `previewStarUp` diff（属性一句 + 节点能力一句）。  
- 技能 Tab：展示成长后技能；已点亮 / 下一星 followUp 对比。  
- 三轴按钮：走 `GrowthTrack` 列表；破境展示本阶 cap / 下一境界名。

### 4.3 布阵

- 池内 / 空位：推荐位弱高亮或「荐·前/中/后」。  
- 顶区一句：`formationHints` 缺职能（有则显示，无则隐藏）。

## 5. 明确不做

- 正式图鉴页（仍灰锁，→ codex）  
- 卡池扩到 16–24 / 九职能全盖新卡（除本轮不强制加新 template；特例仅改星盘）  
- 觉醒/好感可玩数值与材料循环  
- 技能独立升级树、立绘资源、数值终局精调  
- GrowthTrack 大到「动态热插拔插件系统」—— **注册表 + 表驱动即可**

## 6. 实现切片（建议顺序）

1. Core：GrowthTrack + BreakthroughDisplay 拆分 + 薄包装迁移  
2. Core：StarNode `stack` + tank/heal 特例；helper + 单测  
3. Web：列表筛选/排序 + 未获得只读预览  
4. Web：详情升星 diff / 技能成长展示 / track 按钮  
5. Web：布阵 hints  
6. 文档：`character.md` / growth-draft 指针 / tracking 标「人物本阶段完成（含扩展口）」  

## 7. 验收

- `tsc`（game-core + web）通过  
- growth / gacha 既有测通过；新增 track resolve、stack、preview helper 测  
- 手测：筛选、未获得预览、升星 diff、技能 followUp 文案、布阵缺职能提示  

## 8. 修订记录

| 日期 | 内容 |
|------|------|
| 2026-07-29 | 拍板 C1：架构口 + 体验做透；全项目「每系统必带扩展口」；不做 C2 第四轴可玩 |
| 2026-07-29 | **已实现**落地；tracking / character 标本阶段完成 |
