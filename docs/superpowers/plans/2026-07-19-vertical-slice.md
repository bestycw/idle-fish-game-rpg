# 里程碑总览（跟规格走）

> 规格入口：`docs/superpowers/specs/README.md`  
> 进度权威：`docs/superpowers/specs/tracking.md`  
> 有冲突时先改对应系统分册，再改 plan / 代码。  
> 本文件只做**里程碑索引**；具体任务以 tracking §13–14 为准。

## 里程碑跟踪

| ID | 项 | 状态 | 对应 |
|----|----|------|------|
| M0 | 仓库迁至 `Desktop/Ycw/moyu-xiuxian` + React monorepo | done | 规格 §7 |
| M1 | 旧切片：前后排手动指令（已被九宫替代） | done / 废弃交互 | — |
| M2 | 九宫布阵 + 全自动出手/索敌 + 战报 | done | 规格 §4.1–4.3 |
| M3 | 主角手/自动（不点名） | done | 规格 §4.4 |
| C* | 战斗充实（技能 kind / 状态 / 三套路 / 战败提示） | done | combat |
| A* | 六副属性 + qi + 形状 + 钩子 + 刀二 | **done** | [attrs-and-qi.md](./2026-07-19-attrs-and-qi.md) |
| 双轴 | 力·灵攻防 | done | combat / equipment |
| B3 | 副本结构化（猎装 + 塔） | done | dungeon |
| B1 | 抽卡薄刀 | done | gacha |
| B2 | 体力 | done | stamina |
| B4 | 短章节门锁框架 | **done**（内容可改表） | chapter-progress |
| B5 | 成长雏形（含升星碎片 + followUp） | 雏形 done；内容可加深 | character / growth-draft |
| 套装 2/4 | 装备结算 | **后置**（等内容） | equipment |

## 当前主线

→ [tracking.md §13](../specs/tracking.md)：体验打磨 / 章节内容改表；套装 2/4 后置。

历史实现 plan（已完成，仅归档）：[attrs-and-qi.md](./2026-07-19-attrs-and-qi.md)。

## 明确后置 / 不做（本阶段）

- 套装 2/4 结算（等内容）
- 真支付、云存档、AI 剧情、公会 / PVP
- 点名攻击（产品排除）
