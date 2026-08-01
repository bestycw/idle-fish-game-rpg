# 计划：刀一 — 属性 / 能量 / 形状 / 钩子

> **状态：已完成（归档）。** 当前主线见 [tracking.md](../specs/tracking.md)。  
> 规格入口：`docs/superpowers/specs/README.md`  
> 战斗权威：`docs/superpowers/specs/systems/combat.md`（§4.8–4.16）  
> 人物权威：`docs/superpowers/specs/systems/character.md`  
> 骨架：`docs/superpowers/specs/systems-overview.md`

## 目标

1. 主四维 + 六副属性评级→% + 幸运 + 稀有词条  
2. 全员 **qi（能量）**  
3. `targetPattern` 形状（至少 single / row_front / col_focus）  
4. `applyStatus` + 敌方 stun/slow + heal_block 与 havoc  
5. 16 槽模型 / 8 槽露出 / 共用衣柜；`setId` 仅掉落（**套装 2/4 → 装备系统，待副本推进后**）  
6. 生命周期钩子：`dead`、事件总线、`followUp?`/`revive` 类型预留  

**刀一不做：** 套装 2/4 效果、驱散、连击逻辑、复活逻辑、分柜、AI 皮。  
**战斗刀二（纯战斗）：** 驱散、玩家 havoc、状态补全、形状卡补全——**不含套装**。

## 任务跟踪

| ID | 任务 | 状态 |
|----|------|------|
| A1 | 类型：role/job、评级、qi、pattern、effects、events、dead | done |
| A2 | ratings / mastery / targeting | done |
| A3 | content：§4.10 六人 + 三遭遇 + 词缀 | done |
| A4 | units/equipment：derive、8/16 槽、共用装 | done |
| A5 | combat：伤害链 + qi + 形状 + 状态 + 钩子管道 | done |
| A6 | 存档 version 2 bump；web 中性面板 | done |
| A7 | 单测 + build | done |
| A8 |（战斗刀二）驱散、玩家 havoc、更多状态、形状补全 | done |
| A9 |（装备+副本）套装 2/4 与按本掉落 | **后置**：副本已可掉 `setId`；2/4 结算等内容后再开（≠ 本 plan 阻塞） |

## 验收（刀一）

- [x] 六副属性 + 伤害链顺序（含均衡/终伤/精通分 role）  
- [x] qi：开战 20 / +5 / 普攻+20 / 技能耗  
- [x] Demo 法师 `row_front`；刺客 pierce+bleed；坦克盾；治疗（刀二起术士改为 havoc）  
- [x] 敌人含 stun、slow；heal_block（盾墙）；刀二速攻含 sleep/berserk  
- [x] dead 不 splice；战报/事件可扩展  
- [x] 8 槽可穿；setId 可掉、不激活套装  
- [x] `pnpm test` + typecheck 绿  

## 验收（战斗刀二 · 纯战斗）

- [x] 驱散：`purge`（主角斩击）/ `cleanse`（治疗复苏）；战报 `status_remove`  
- [x] 玩家可施加 havoc：术士 `ctrl_a` → `skill_ctrl_havoc`  
- [x] 状态补全：sleep（受伤惊醒）/ berserk（只普攻、乱索敌、攻×1.3）；速攻遭遇含催眠/煽狂  
- [x] 形状：`col_focus` 技能 `skill_col_pierce` + 池卡 `col_a`  
- [x] 抗控/DR：stun/sleep/silence 满→半→免疫；elite/boss 分级；混乱每目标 ≤2  
- [x] **不做**套装 2/4、掉落表、更多装备槽  

## 风险

- 终伤+暴击过强 → 调 K/cap  
- qi 节奏 → 只改数字  
- UI 过载 → 卡片只露 2～3 个副属性%  

## 引用

- 伤害链顺序：**§4.12.2**  
- 生命周期管道：**§4.16.1 ③ 行动 Action**  
- 扩展钩子自检：**§4.15.1 F**
