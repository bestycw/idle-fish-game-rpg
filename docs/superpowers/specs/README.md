# 规格文档地图

> **唯一入口。** 改玩法改对应 `systems/*`，改进度改 `tracking.md`，调参记 `balance-changelog.md`。  
> **文档写什么：** 只落定调与指导开发的关键。流水账 UI、已落地实现史 → 见下方「归档」。

## 依赖层级（冲突时按此）

| 优先级 | 文档 | 用途 |
|--------|------|------|
| 1 | 本文 | 找入口，不乱翻 |
| 2 | [tracking.md](./tracking.md) | 下一刀 / 已决 / 进度（**进度只认它**） |
| 3 | `systems/<name>.md` | **玩法权威** |
| 4 | 下方「现行切片」 | 尚未并入系统册的工作设计 / 内容规范 |
| 5 | [balance-changelog.md](./balance-changelog.md) | 调参记录，不当需求源 |
| 6 | 「归档」与 `plans/` | 实现史；默认不信，有冲突以 2–3 为准 |

**写回约定：** 对话拍板 → 写入对应系统册（或现行切片）+ 必要时更新 tracking；不另造「第三真相」。

## 怎么用

1. [systems-overview.md](./systems-overview.md) — 骨架与信息架构。  
2. 做哪个系统 → `systems/<name>.md`。  
3. 产品定位 → [product.md](./product.md)。  
4. 下一刀 / 待决 → [tracking.md](./tracking.md)。  
5. 技术栈 → [tech.md](./tech.md)。  
6. 新卡技能/星章 → [skill-design-spec](./2026-08-02-skill-design-spec.md)。  
7. Agent 多轮自治 → [autonomous-polish-charter](./2026-08-01-autonomous-polish-charter.md)（**不自行 commit**）。

## 写规格 / 写实现时（扩展约定）

- **尽量不写死配置**：新 Buff、形状、焦点、效果、卡、遭遇 → 表或 `register*`，禁止战斗主循环按具体 id 无限 `if`。
- **钩子先留**：清单见 [combat §4.15.2](./systems/combat.md)。
- **系统完工：** 玩法闭环 + 扩展口（[tech §7.2.1](./tech.md)）。
- **宜冻结的别乱改：** 管道阶段顺序、双轴字段、event code、存档字段名。

---

## 核心系统（主循环）

| 系统 | 文件 | 备注 |
|------|------|------|
| 骨架总览 | [systems-overview.md](./systems-overview.md) | 主循环 + §3.7 扩展登记 |
| 战斗 | [systems/combat.md](./systems/combat.md) | **纯战斗**；刀一/刀二不含套装 |
| 布阵 | [systems/formation.md](./systems/formation.md) | 九宫、出战≤5 |
| 人物/卡池 | [systems/character.md](./systems/character.md) | 伙伴；role/job；**中土故事圈 200** |
| 装备 | [systems/equipment.md](./systems/equipment.md) | 槽位、词缀、强化、套装、T4；权威在此 |
| 抽卡 | [systems/gacha.md](./systems/gacha.md) | B1 已落地 |
| 副本/遭遇 | [systems/dungeon.md](./systems/dungeon.md) | 猎装 + 塔 + 星尘 + 镜渊 |
| 体力 | [systems/stamina.md](./systems/stamina.md) | B2 + 摸鱼补给 |
| 章节进度 | [systems/chapter-progress.md](./systems/chapter-progress.md) | B4 框架 |
| 经济/付费 | [systems/economy.md](./systems/economy.md) | |
| 故事皮/词表 | [systems/skin.md](./systems/skin.md) | |
| 存档/会话 | [systems/save.md](./systems/save.md) | **现网 v16**（中土卡池） |

## 扩展模块（登记 · 暂不做）

见骨架 **§3.7**。分册：quest / codex / achievement / shop / mail / inventory-items / tutorial / settings / ops-config / social；[pvp](./systems/pvp.md) **不做**。

---

## 现行切片（仍指导开发）

| 切片 | 文件 | 地位 |
|------|------|------|
| 定位修订 | [2026-08-07-positioning-revision-design.md](./2026-08-07-positioning-revision-design.md) | 摸鱼入口 × 深度本体 × AI 外皮；slogan 不写十分钟 |
| 玩法扩展储备 | [2026-08-07-gameplay-expansion-catalog.md](./2026-08-07-gameplay-expansion-catalog.md) | E1-E8 机制储备；题材无关；钩子预留；暂不开工 |
| 属性体系重设计 | [2026-08-08-attribute-system-redesign.md](./2026-08-08-attribute-system-redesign.md) | 一级5+二级6+稀有9（可扩展）；去均衡/急速/终伤；加穿透/坚韧/气运 |
| 卡池 100 | [2026-08-02-roster-100-design.md](./2026-08-02-roster-100-design.md) | **将被取代**；新权威 [中土故事圈](./2026-08-26-zhongtu-roster-circles-design.md) |
| 中土故事圈卡池 | [2026-08-26-zhongtu-roster-circles-design.md](./2026-08-26-zhongtu-roster-circles-design.md) | **刀一已落地**：200 人 / 16 圈 / 绝 81 / 珍 45 / 良 44；国外下架；v16。刀二：新绝品满星轨 |
| 绝品刀二第一批 | [2026-08-26-legendary-knife2-design.md](./2026-08-26-legendary-knife2-design.md) | 刘备/庞统/牛魔王/唐僧/铁扇：赵云标准招牌 + ★3/★6 岔路 |
| 传说招牌剧本圣经 | [2026-08-29-legendary-signature-kit-design.md](./2026-08-29-legendary-signature-kit-design.md) | **抬高绝品门槛**：★0完整剧本 + 软模式变招；示范刘备/赵云/吕布/周瑜 |
| 技能设计规范 | [2026-08-02-skill-design-spec.md](./2026-08-02-skill-design-spec.md) | **内容规范**：母题→招牌→六星章 |
| 系数带与命中 | [2026-08-03-skill-coeff-and-status-hit-design.md](./2026-08-03-skill-coeff-and-status-hit-design.md) | 职责系数带；Debuff 双层命中；技能页可读 |
| 效果触发率 | [2026-08-30-effect-proc-chance-design.md](./2026-08-30-effect-proc-chance-design.md) | `effects[]` 可配触发（≠命中）；示范刘备灌气 25%·56 |
| 深做功能钩子 | [2026-08-30-deep-kit-function-hooks-design.md](./2026-08-30-deep-kit-function-hooks-design.md) | 深做卡一人一条功能（变招/触发/咬合）；不扫全库 |
| 能力池总表 | [2026-08-02-ability-pool-catalog.md](./2026-08-02-ability-pool-catalog.md) | **活跃条均 N**；现网 `ABILITY_ATOMS` 可配；星章从池拼装 |
| 修为/境界盘 | [2026-08-02-xiuwei-cultivation-design.md](./2026-08-02-xiuwei-cultivation-design.md) | 小节点×10 + 破境；修为仅塔 |
| 人物系统地基 | [2026-08-02-character-foundation-design.md](./2026-08-02-character-foundation-design.md) | **F1–F5 已落地**：compose + Bundle + 血刃示范 |
| 构筑双核愿景 | [2026-07-21-build-dual-core-design.md](./2026-07-21-build-dual-core-design.md) | 愿景（非 combat 级冻结） |
| 自治完善约定 | [2026-08-01-autonomous-polish-charter.md](./2026-08-01-autonomous-polish-charter.md) | Agent loop；不自行 commit |
| 成长/副本加深 | [2026-08-01-growth-dungeon-expand-design.md](./2026-08-01-growth-dungeon-expand-design.md) | 自治轮次方向（部分已落地） |
| 数值变更记录 | [balance-changelog.md](./balance-changelog.md) | 调参必记 |
| 人物面板布局 | [2026-07-20-character-panel-wow-layout.md](./2026-07-20-character-panel-wow-layout.md) | 现网：四页签 + 装备上6/中属性/下6 |
| 战斗 UI | [2026-07-20-battle-ui-design.md](./2026-07-20-battle-ui-design.md) | 已拍板 |
| Web UI 地基 | [2026-07-21-web-ui-foundation.md](./2026-07-21-web-ui-foundation.md) | 迁移完成；格局仍认 |

## 归档（实现史 · 默认不信）

> 规则已并入 `systems/*` 或已被更新切片替代。留作决策追溯；**勿当当前需求源**。

| 切片 | 文件 | 说明 |
|------|------|------|
| 旧单体规格 | [2026-07-19-moyu-xiuxian-design.md](./2026-07-19-moyu-xiuxian-design.md) | 仅跳转入口 |
| 人物成长草案 | [2026-07-20-character-growth-draft.md](./2026-07-20-character-growth-draft.md) | 被 C1 + character 吸收 |
| 人物 C1 做透 | [2026-07-29-character-module-complete-design.md](./2026-07-29-character-module-complete-design.md) | 已落地；细则认 character |
| 公版卡池换代 | [2026-08-01-public-domain-roster-design.md](./2026-08-01-public-domain-roster-design.md) | 归档；现池认 [roster-100](./2026-08-02-roster-100-design.md) |
| 装备系统 08-08 | [2026-08-08-equipment-system-full-design.md](./2026-08-08-equipment-system-full-design.md) | 已并入 [equipment.md](./systems/equipment.md) |
| 装备词缀 08-16 | [2026-08-16-equipment-revision-design.md](./2026-08-16-equipment-revision-design.md) | 已并入 [equipment.md](./systems/equipment.md) |
| Plan：竖切里程碑 | [../plans/2026-07-19-vertical-slice.md](../plans/2026-07-19-vertical-slice.md) | 索引；进度认 tracking |
| Plan：刀一 attrs/qi | [../plans/2026-07-19-attrs-and-qi.md](../plans/2026-07-19-attrs-and-qi.md) | 已完成归档 |

**落地后并回：** `character-foundation` 实现完成后，compose 规则应写入 `character.md`（及必要 combat 节），本切片降为归档。

## Plan 目录

`docs/superpowers/plans/` 仅里程碑/历史实现计划；有冲突先改系统分册与 tracking。
