# 技术形态

## 7. 技术形态

### 7.1 结论

- **主形态：Web**（可后续 PWA）。
- 原因：目标用户是上班摸鱼 → 浏览器打开即玩；全栈交付最快；文字 UI 包体与实现成本低。
- **不上架优先级：** Steam / 小游戏不作 V1 必选项。微信小游戏可作为验证后的可选分发，非当前主路径。

### 7.2 架构原则

```
战斗结算 ← 九宫站位 / 速度出手 / 自动索敌 / 技能效果 ID
装备生成 ← 词缀表 / 品质 / 副本掉落表
抽卡     ← 池子 / 保底
进度     ← 章节解锁 / 体力
存档     ← 本地（先），账号云存档（后）
内容配置 ← JSON / 表格（剧情与数值外置）
皮肤     ← skinId；文案与显示名可替换
```

- **逻辑与 UI 分离；内容配置化。** Monorepo：`packages/game-core`（纯逻辑）+ `packages/web`（React 壳）。
- **按系统分目录**（与规格骨架对齐）：见 [systems-overview.md §代码目录](./systems-overview.md)。  
  - core：`combat/` `character/` `formation/` `equipment/` `dungeon/` `save/` `shared/`  
  - web：`features/hub|battle|result|inventory|shared`
- V1 付费可用测试货币 / 假充值跑通；真支付后置（Web 内购渠道另议：卡密、赞助等）。

#### 7.2.1 系统完工标准（已拍板 · 2026-07-29）

> **每个系统做透再换下一个：** 玩法闭环 + **可扩展架构口**，避免后期大规模掀桌。

| 要求 | 说明 |
|------|------|
| 玩法闭环 | 本系统职责内可演示、可测 |
| 扩展口 | 注册表 / 配置表 / `register*`；新内容优先加行，不改主循环 |
| 边界清晰 | `systems/<name>.md` 写清负责/不负责；后置项明示 |
| 禁止 | 先硬编码「就这几轴/几种货币」再指望以后拆 |

战斗侧已有范例：`registerStatus` / `registerTargetPattern` 等（combat §4.15）。  
人物本轮范例：[2026-07-29-character-module-complete-design](./2026-07-29-character-module-complete-design.md)（`GrowthTrack` / `StarNode`）。  
**新系统默认按同一标准验收。**

### 7.3 建议实现顺序（引擎优先）

> **进度以 [tracking.md](./tracking.md) 为准**，勿在此标「当前下一刀」。

1. ~~数据模型与配置加载~~ / ~~九宫布阵 + 自动战斗 + 战报~~ / ~~装备穿戴~~ / ~~主角手自动~~（已齐）  
2. 战斗手感验收 → 副本结构化 / 掉落倾向  
3. 装备套装 2/4  
4. 抽卡与角色上阵  
5. 章节进度与解锁  
6. 体力  
7. 官方占位皮肤文案  
8. （后）存档同步、真付费、AI 剧情  

UI 栈：见 [2026-07-21-web-ui-foundation.md](./2026-07-21-web-ui-foundation.md)。

---

## 8. V1 内容量规格（已认可方向）

> 见 [product.md §8](./product.md)；本文件不重复抄表。
