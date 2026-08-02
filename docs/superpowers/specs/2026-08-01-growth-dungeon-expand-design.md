# 成长深化 · 副本扩展 · 卡池 +10（工作设计）

> **地位：** 现行工作约定（部分目标已落地：★6 轨 / 镜渊 / 24 卡）。Agent 自治多轮；**不自行 commit**。  
> 未完成项以 [tracking](./tracking.md) 与 [character-foundation](./2026-08-02-character-foundation-design.md) 为准；卡池「11」等旧数字以下文历史段落为准，**现行 24**。  
> **原则：** 表驱动 / 注册表扩展；禁止战斗主循环乱 if；双核不变。

## 1. 升星（★1–★6）

| 项 | 约定 |
|----|------|
| 上限 | **6 星**（共用阶梯可作缺省；每卡尽量全覆盖） |
| 效果种类 | `stat_pct` / `rare_stat` / `rating` / `enable_follow_up` / `skill_mult` / `qi_cost` / `status_boost` |
| 个性 | `STAR_OVERRIDES`（或 `starTracks.ts`）每卡每星不同 label+效果，激发抽卡/重复升星 |
| 消费 | 仍优先碎片，否则星尘；`skillWithGrowth` 应用技能向效果 |

## 2. 破境

| 项 | 约定 |
|----|------|
| 全局 | 每境除 cap/+4% 外，挂 `BREAKTHROUGH_PERKS`（如精通/终伤/格挡跳点） |
| 个性 | 可选 `BREAKTHROUGH_OVERRIDES[templateId][tier]` |
| 展示 | preview / 成功 message 带被动名 |

## 3. 技能特色

（当时）先加深已有卡身份；新卡技能必须有一句可读身份，只走现有钩子。**现行：** 池 24；内容写法认 [skill-design-spec](./2026-08-02-skill-design-spec.md)。

## 4. 副本

| 项 | 约定 |
|----|------|
| 遭遇 | +若干套路（灵防墙 / 混乱仪式 / 守卫首领） |
| 新本 | `abyss_mirror`（battle·材料向：经验/微量修为）；章末解锁 |
| 塔 | 每 5 层里程碑额外星尘；曲线仍 instant |
| 猎装 | 遭遇池并入新套路（按解锁） |

## 5. 卡池 +10

公版形象；章锁分配；存档 **v10**（ensureRoster 补齐新卡）。

## 6. 扩展口

- 星：加 `StarNodeEffect` kind + `derive`/`skillWithGrowth` 分支；新卡只填 track 表  
- 破境：perk 表加行  
- 副本：`DUNGEONS` / `ENCOUNTERS` / `LOOT_TABLES` / `CHAPTERS` 加行  
- 角色：`templates` + `skills` + track + unlock  
