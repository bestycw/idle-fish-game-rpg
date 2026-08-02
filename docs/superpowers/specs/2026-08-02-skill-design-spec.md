# 技能设计规范（Skill Spec）

> **地位：** 人物·解法核的内容规范（2026-08-02 拍板方向）。  
> **配合：** [character-foundation](./2026-08-02-character-foundation-design.md)（compose 管道）；[ability-pool-catalog](./2026-08-02-ability-pool-catalog.md)（**能力原子库 ≥100**）；[character](./systems/character.md)；[combat §4.9](./systems/combat.md)。  
> **目标：** 新人设可按本文填表落地；遮住名字仍能猜出是谁；禁止「全员单体+流血」同质化。

---

## 0. 口径（冻结偏好）

| 项 | 约定 |
|----|------|
| 主动技能栏 | **每人 1 个招牌主动**（战斗冻结：1 主动 + 普攻；无通用防御） |
| 叙事深度 | **6 个星章**（★1–★6），绑定历史/典故弧光 |
| 可选后置 | 高星/破境「大质变」仍挂同一 `skillId`，由 compose 变出，不新开技能栏 |
| 装核 | 形态特技改写法，**不占**人物技能位（见 foundation / equipment） |
| 丰富来自 | 母题清晰 + 星章质变 + 解法不同；**不是**状态种类堆爆 |

---

## 1. 一条设计链（必走）

```
历史母题 motif（一句话）
    → 解法职责（对九宫/遭遇：穿后排？控？磨盾？续航？）
    → 战斗动词（斩/穿/扫/慑/守/济/乱/破… 主选 1 个）
    → 招牌主动 SkillDef（名字·形状·轴·主状态）
    → ★1–★6 星章（标题像典故 + 机制一句 + 是否质变）
    →（实现）星章 → SkillModifier → composeSkill
```

**自检（过不了就重做）：**

1. 遮住卡名，只看技能名+星章标题，能否猜出是谁？  
2. 换成另一张同职能卡，星章文案是否明显不对味？  
3. ★3 与 ★6 是否至少有一处「玩法变了」（不只是 +攻%）？

---

## 2. 字段：母题卡（Character Skill Sheet）

新角色 / 大改技能时，先填本表，再写 `templates` / `skills` / `starTracks`。

### 2.1 身份区

| 字段 | 说明 | 例 |
|------|------|-----|
| `templateId` | 稳定 id | `zhaoyun` |
| `displayName` | 显示名（可随皮） | 赵云 |
| `loreSource` | 公版来源 | 三国 |
| `motif` | **历史母题一句**（禁止「很强」「输出」） | 单骑救主、七进七出 |
| `role` | 破阵职能 | `st_burst` |
| `job` | 手感职业 | `assassin` |
| `solutionDuty` | 解法职责一句 | 穿透点杀后排脆皮 |
| `forbiddenClone` | 点名勿撞车的卡 | 勿做成后羿式纯点残 |

### 2.2 招牌主动（Skill）

| 字段 | 说明 | 约束 |
|------|------|------|
| `skillId` | 稳定 id | `skill_<id>_…` |
| `skillName` | 显示名 | 贴母题，忌万能「强击」 |
| `verb` | 主战斗动词 | 见 §3，**主选 1 个** |
| `targetPattern` | 形状 | 服务职责，不炫技乱开 |
| `damageSchool` | phys / spirit | 与母题气质一致 |
| `tags` | damage/pierce/heal/guard/aoe… | 与 verb 一致 |
| `primaryStatus` | 主挂状态（可空） | 一人一招牌，忌全员 bleed |
| `effects` | purge/cleanse 等 | 仅当母题需要 |
| `focusPolicy` | 可选 | 如点残才 `lowest_hp` |
| `baseMult` / `qiCost` | 底板数值 | 先定身份再调数 |
| `oneLiner` | 给玩家的一句说明 | 「穿后排并流血」 |

### 2.3 星章（★1–★6）

每星一行：

| 字段 | 说明 |
|------|------|
| `star` | 1–6 |
| `chapterTitle` | 星章名（典故短词） |
| `loreBeat` | 叙事半句（可选，内部用） |
| `mechanic` | 机制一句（给策划/程序） |
| `abilityIds` | 本星挂的能力池 id（1～2 条）；见 [ability-pool-catalog](./2026-08-02-ability-pool-catalog.md) |
| `modifierKind` | 对应 compose：`stat` / `rating` / `follow_up` / `skill_mult` / `qi` / `status_boost` / `status_unlock` / `effect_unlock`… |
| `isIdentityBeat` | ★3/★6 建议至少一处为 true（质变）；质变优先选目录里标 ★ 的能力 |

**星章节奏建议（可调，作默认）：**

| 星 | 角色 |
|----|------|
| ★1 | 立身：小幅主属性或贴母题的轻强化 |
| ★2 | 手感：副属性或耗能/命中感 |
| ★3 | **身份质变**（连击/新状态/关键特效） |
| ★4 | 加深招牌（状态层数/时长/破甲更深） |
| ★5 | 节奏或二次强化（连击加强 / 省能） |
| ★6 | **高潮质变**（终伤/招牌倍率/独特组合） |

---

## 3. 战斗动词表（主选 1，辅选至多 1）

设计时先选动词，再选状态——**禁止先抄状态再硬圆故事。**

| 动词 | 含义 | 典型 pattern / tags | 典型状态/效果 | 适合母题方向 |
|------|------|---------------------|---------------|--------------|
| 斩 | 正面重击 | single, damage | bleed / 高倍 | 武将义斩 |
| 穿 | 透前排打后 | single+pierce | bleed / shred | 枪骑、神射 |
| 扫 | 清排 | row_front, aoe | shred / stun | 群殴、雷锤 |
| 慑 | 硬控 | single | stun / sleep | 咆哮、石化、沉鱼 |
| 乱 | 破阵心智 | row/aoe | havoc / berserk | 妖惑、乱心 |
| 破 | 破防增伤队友 | single 低伤 | shred / slow | 军师、减灶 |
| 守 | 承伤续航 | guard | shield | 盾将、誓约 |
| 济 | 治疗净化 | heal ± cleanse | — | 医、神恩、月华 |
| 驱 | 削敌增益 | damage+purge | purge | 主角破妄 |
| 猎 | 点残 | pierce+lowest_hp | bleed | 后羿、罗宾 |

辅动词仅作星章点缀（如斩+轻守），**底板主动只能有一个主动词。**

---

## 4. 同质化禁令

| 禁止 | 原因 |
|------|------|
| 新爆发默认「穿透+流血+lowest_hp」 | 后羿/罗宾/杨戬位已挤 |
| 新坦克默认「盾」无叙事差 | 须用星章/破境拉开（恶来 vs 誓约 vs 狮皮） |
| 星章标题用「主属性强化」「连击契机」当个性轨终态 | 共用轨可作回落；**个性轨必须典故名** |
| 为堆丰富新增状态主表 id | 优先复用 combat §4.13；新效果优先装特技或 register 扩展口 |
| 一人多主动栏当 V1 默认 | 破冻结须另开修订 |

---

## 5. 与实现的映射

| 设计产物 | 代码落点 |
|----------|----------|
| 母题 / 职责 | 文档表 +（可选）`identitySummary` 文案 |
| 招牌主动 | `skills.ts` → `SkillDef`；`templates.skillId` |
| 星章 | `starTracks.ts` → `STAR_OVERRIDES`；标题=`label` |
| 机制 | foundation：`SkillModifier` → `composeSkill` |
| 校验 | `assertCharacterBundle`：技能存在 + ★1–6 可 resolve |

内容 PR 检查清单：

- [ ] 已填 §2 母题卡  
- [ ] 主动词唯一，未踩 §4 禁令  
- [ ] ★3、★6 至少一处 `isIdentityBeat`  
- [ ] `skillId` / 星轨 / 章节解锁（若进池）已挂  

---

## 6. 填表示例（赵云 · 规范示范）

```
templateId: zhaoyun
motif: 单骑救主、七进七出
solutionDuty: 穿透点杀后排脆皮
verb: 穿
skill: 龙胆 · pierce · bleed · phys
forbiddenClone: 勿做成纯倍率无穿透的吕布复制

★1 银枪 · 立身
★2 会心 · 暴击向
★3 七进七出 · 连击（身份质变）
★4 流血加深 · 招牌加深
★5 龙胆连刺 · 连击强化
★6 单骑救主 · 高潮（暴伤/终伤向）
```

---

## 7. 新角色最小流程

1. 写母题一句 + 解法职责 + 主动词  
2. 定招牌主动（名/形/轴/主状态）  
3. 写满 6 星章（标题必典故化）  
4. 对照禁令与同职能已有卡  
5. 再进代码表；数值用 feel 微调  

**不要求**一次做满破境个性与装特技；星章与招牌齐套即可进池。

---

## 8. 修订规则

- 改「一人几主动」→ 先改 combat 冻结 + 本文 §0  
- 加战斗动词 → 只加本表 §3，并给 1 个公版范例  
- 状态主表扩 id → 走 combat 规格，不在本文私加  
