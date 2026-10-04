# 任务 / 日常 / 周常系统

> 系统骨架 **§3.7 #12**。状态：**登记 · 暂不做**。

## 职责（预定）

- 轻量目标：引导布阵/破阵、每日打 2～3 场、周常刷本。
- 奖励：货币、材料、抽卡券（走经济）；**不锁通关**。

## 不负责

- 战斗公式、章节主线结构（章节系统管门锁）。

## 何时开工

战斗 / 抽卡 / 体力循环**已跑通**；仍属扩展登记。建议在 **B4 章节**落地后再拆 plan，避免并行铺满。

## 剧情皮（先行 · 引擎未接）

- Agent Skill：`.cursor/skills/story-gen-quest/SKILL.md`  
- 官方壳数据：`officialPacks/{preset}.quests.overlay.json`（卷一仙侠为主）  
- 校验：`cd packages/game-core && npm run story-gen-quest-quality`  
- 运行时 **暂不加载**；接引擎后迁 `questIdRegistry` → `quests.ts` 并挂 `resolveQuestCopy`。
