# 规格文档地图

> **唯一入口。** 规则按系统拆分；改玩法改对应文件，改进度改 `tracking.md`。  
> **文档写什么：** 只落**定调与指导开发**的关键——产品身份、系统边界、已拍板规则、当前实现状态、下一刀。不写流水账 UI 细节；旧草案过时以系统分册 + tracking 为准。

## 怎么用

1. 先看 [systems-overview.md](./systems-overview.md) 知道骨架与**信息架构定调**。  
2. 做哪个系统就打开 `systems/<name>.md`。  
3. 产品定位 / 体验 / 内容量 → [product.md](./product.md)。  
4. 当前下一刀 / 待决 / 决策摘要 → [tracking.md](./tracking.md)。  
5. 技术栈 → [tech.md](./tech.md)。  
6. 对话里达成一致的方案，**必须写入对应系统文档**后才算确定。

## 写规格 / 写实现时（扩展约定）

- **尽量不写死配置**：新 Buff、形状、焦点、效果、卡、遭遇 → 表或 `register*`，禁止战斗主循环按具体 id 无限 `if`。
- **钩子先留**：生命周期 / `effects` / 事件总线 / status·shape·focus 注册表；清单见 [combat §4.15.2](./systems/combat.md)。
- **系统完工标准：** 玩法闭环 + 扩展口；做透一个再换下一个（[tech §7.2.1](./tech.md)）。人物范例：[character-module-complete-design](./2026-07-29-character-module-complete-design.md)。
- **宜冻结的别乱改**：管道阶段顺序、双轴字段、event code 名、存档字段名。
- 进度只认 [tracking.md](./tracking.md)。

## 核心系统（主循环）

| 系统 | 文件 | 备注 |
|------|------|------|
| 骨架总览 | [systems-overview.md](./systems-overview.md) | 主循环 + 核心系统 + **§3.7 扩展登记** |
| 战斗 | [systems/combat.md](./systems/combat.md) | **纯战斗**；刀一/刀二不含套装 |
| 布阵 | [systems/formation.md](./systems/formation.md) | 九宫、出战≤5 |
| 人物/卡池 | [systems/character.md](./systems/character.md) | 产品语**伙伴**；role/job/卡表；升级=成长子模块 |
| 装备 | [systems/equipment.md](./systems/equipment.md) | 槽位、词缀；**套装子模块**（绑副本推进） |
| 抽卡 | [systems/gacha.md](./systems/gacha.md) | **B1 已落地**；新人 + 重复卡升星 |
| 副本/遭遇 | [systems/dungeon.md](./systems/dungeon.md) | 猎装 + 塔 + **星尘秘境**；摸鱼补给见 stamina |
| 体力 | [systems/stamina.md](./systems/stamina.md) | **B2** + 每日补给 |
| 章节进度 | [systems/chapter-progress.md](./systems/chapter-progress.md) | **B4 框架**；改表 `chapter/defs.ts` |
| 经济/付费 | [systems/economy.md](./systems/economy.md) | |
| 故事皮/词表 | [systems/skin.md](./systems/skin.md) | |
| 存档/会话 | [systems/save.md](./systems/save.md) | **v9** |
| Web 格局 | [2026-07-21-web-ui-foundation.md](./2026-07-21-web-ui-foundation.md) | 底栏/冒险战斗向/伙伴全池 |

## 扩展模块（登记 · 暂不做）

见骨架 **§3.7**。分册：

| 系统 | 文件 | 状态 |
|------|------|------|
| 任务/日常 | [systems/quest.md](./systems/quest.md) | 登记 |
| 图鉴/收集 | [systems/codex.md](./systems/codex.md) | 登记 |
| 成就/通行证 | [systems/achievement.md](./systems/achievement.md) | 登记 |
| 商店 | [systems/shop.md](./systems/shop.md) | 登记 |
| 邮件 | [systems/mail.md](./systems/mail.md) | 登记 |
| 道具背包 | [systems/inventory-items.md](./systems/inventory-items.md) | 登记 |
| 新手引导 | [systems/tutorial.md](./systems/tutorial.md) | 登记 |
| 设置 | [systems/settings.md](./systems/settings.md) | 登记 |
| 公告/热更 | [systems/ops-config.md](./systems/ops-config.md) | 登记 |
| 社交 | [systems/social.md](./systems/social.md) | 好友/排行极后置；公会不做 |
| PVP | [systems/pvp.md](./systems/pvp.md) | **不做** |

## 日期切片（已拍板 / 工作草案）

| 切片 | 文件 | 地位 |
|------|------|------|
| 人物成长三轴 | [2026-07-20-character-growth-draft.md](./2026-07-20-character-growth-draft.md) | 工作草案（非冻结） |
| 人物模块做透 C1 | [2026-07-29-character-module-complete-design.md](./2026-07-29-character-module-complete-design.md) | **已落地**；GrowthTrack + 体验 |
| 公版卡池换代 | [2026-08-01-public-domain-roster-design.md](./2026-08-01-public-domain-roster-design.md) | **已落地**；去旧占位 +10 |
| 人物面板布局 | [2026-07-20-character-panel-wow-layout.md](./2026-07-20-character-panel-wow-layout.md) | 已拍板 UI 骨架 |
| 战斗 UI | [2026-07-20-battle-ui-design.md](./2026-07-20-battle-ui-design.md) | 已拍板 |
| Web UI 地基 | [2026-07-21-web-ui-foundation.md](./2026-07-21-web-ui-foundation.md) | Tailwind + shadcn；迁移已完成 |
| 构筑双核愿景 | [2026-07-21-build-dual-core-design.md](./2026-07-21-build-dual-core-design.md) | 人解法 × 装风格；抽卡=人/星/技能；非实现冻结 |

## 历史单体文件

旧版单体 [`2026-07-19-moyu-xiuxian-design.md`](./2026-07-19-moyu-xiuxian-design.md) 仅作入口跳转；**新改动写分册**。

## Plan 目录

实现计划在 `docs/superpowers/plans/`，须引用本目录系统文档。
