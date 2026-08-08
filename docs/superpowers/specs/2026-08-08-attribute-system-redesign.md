# 属性体系重设计（2026-08-08 拍板）

> **地位：** 替代现有 6 一级 + 6 rating + 4 稀有方案；影响全模板/词缀/套装/战斗公式。  
> **上位约束：** [build-dual-core-design](./2026-07-21-build-dual-core-design.md)；[product §2.0](./product.md) 三层分工。  
> **题材无关：** 所有属性用引擎 id；显示名走 `t(statId)` 词表。

---

## 0. 动机

- 旧 `physAtk` / `spiritAtk` 双攻造成装备"给错人就废"的假选择。
- `versRating`（均衡）双面属性无性格，玩家不爱堆。
- `hasteRating`（急速）在单技能短回合制里几乎无感知。
- `finalDmgRating`（终伤）与暴击/暴伤同质（都是"打更疼"）。
- 稀有属性仅 4 条，缺乏"战报高光时刻"。
- 装备深度不足——需要更丰富的属性地基支撑 T2/T3 效果词缀。

---

## 1. 一级属性（5 条）

角色固有底子，决定"这个角色是什么型"。主要靠等级/突破/星级成长。

| id | 中性名 | 作用 | 说明 |
|----|--------|------|------|
| `atk` | 攻击 | 统一攻击力系数 | 角色 `damageSchool` 标签决定打力/灵 |
| `def` | 防御 | 减力系来伤 | 力系关卡 → 堆 DEF |
| `res` | 抗性 | 减灵系来伤 | 灵系关卡 → 堆 RES |
| `hp` | 生命 | 血量池 | — |
| `spd` | 身法 | 先手顺序（唯一决定） | — |

### 1.1 攻击合并说明

- 旧 `physAtk` + `spiritAtk` → 合并为 `atk`
- 角色模板新增 `damageSchool: 'phys' | 'spirit'` 标签
- 伤害公式：`raw = atk * skill.multiplier`；减伤按 `skill.damageSchool` 取敌方 `def` 或 `res`
- 装备"攻击 +5"人人能用，不再有"灵攻装给物理角色 = 废"

### 1.2 防御保留双条说明

- 关卡设计区分"力系怪多 / 灵系怪多" → 玩家装备选 DEF 还是 RES = 有意义的**装·风格核选法**
- 装备词缀"防御 +5"和"抗性 +5"独立

### 1.3 词表

| id | 中性 | 仙侠 | 武侠 | 魔幻 | 科幻 |
|----|------|------|------|------|------|
| atk | 攻击 | 攻击 | 攻击 | 攻击力 | 火力 |
| def | 防御 | 护体 | 外功防 | 护甲 | 装甲 |
| res | 抗性 | 御灵 | 内功防 | 魔抗 | 能量屏蔽 |
| hp | 生命 | 气血 | 体力 | 生命值 | 耐久 |
| spd | 身法 | 身法 | 轻功 | 速度 | 反应 |

---

## 2. 二级 Rating（6 条）

从装备/星轨获取，决定"这个角色走什么流派"。递减公式：`pct = rating / (rating + K)`。

| # | id | 中性名 | K | 帽 | 作用 | 流派身份 |
|---|-----|--------|---|---|------|---------|
| 1 | `critRating` | 暴击 | 80 | 60% | 暴击概率 | 暴击流 |
| 2 | `critDmgRating` | 暴伤 | 100 | 80% | 暴击额外倍率（基础 1.5×） | 暴击流 |
| 3 | `penRating` | 穿透 | 85 | 45% | 无视敌方 DEF/RES；兼对抗闪避 | 穿透流 |
| 4 | `masteryRating` | 精通 | 90 | 35% | 按职能分化效果（见 §2.1） | 精通流 |
| 5 | `tenacityRating` | 坚韧 | 90 | 40% | 减控时长 + 受疗增强（见 §2.2） | 坚韧流 |
| 6 | `fortuneRating` | 气运 | 100 | 35% | Lucky roll + 掉落品质（见 §2.3） | 气运流 |

### 2.1 精通分化（保留现有设计）

| Role | 精通效果 |
|------|---------|
| tank | 受伤 ×(1 - mastery_pct×0.8)；护盾 ×(1 + mastery_pct) |
| st_burst | 技能伤 ×(1 + mastery_pct×0.85)；穿防微增；暴伤 +mastery_pct×0.1 |
| aoe_dps | AOE 技能伤 ×(1 + mastery_pct×0.85) |
| st_ctrl / aoe_ctrl | 状态命中 +mastery_pct；CC 时长 ×(1 + mastery_pct×0.15) |
| group_amp | Buff 强度 ×(1 + mastery_pct)；破甲值微增 |
| st_heal / aoe_heal | 治疗 ×(1 + mastery_pct) |
| flex | 技能伤 ×(1 + m×0.35)；状态命中 +m×0.35；治疗 ×(1 + m×0.25) |

### 2.2 坚韧双效

```
受控时长 = 原始回合 × (1 - tenacity_pct)  // 向下取整，至少 1 回合
受疗加成 = heal_amount × (1 + tenacity_pct × 0.5)
```

### 2.3 气运三域

**域 1：战斗 Lucky Roll**
```
每次伤害：if random() < fortune_pct → roll 两次取高值
```
帽 35%；满帽约 +5-7% 等效 DPS。不影响暴击判定（互不干涉）。

**域 2：掉落品质**
```
每次掉落：if random() < fortune_pct × 0.6 → 词缀品质 roll 两次取高
```
不改掉落表/本级，只改品质 roll。

**域 3：进度微增**
```
修为/经验获取时：if random() < fortune_pct × 0.3 → 本次 ×1.5
```

### 2.4 穿透兼对抗闪避

```
实际敌方防御 = enemy_def_or_res × (1 - pen_pct)
闪避成功率 = max(0, target.dodge - attacker_pen_pct × 0.3)
```

### 2.5 词表

| id | 中性 | 仙侠 | 武侠 | 魔幻 | 科幻 |
|----|------|------|------|------|------|
| critRating | 暴击 | 会心 | 命中要害 | 致命 | 精准打击 |
| critDmgRating | 暴伤 | 会心伤害 | 重击 | 致命伤害 | 过载伤害 |
| penRating | 穿透 | 破法 | 穿心 | 护甲穿刺 | 屏蔽穿透 |
| masteryRating | 精通 | 道行 | 造诣 | 专精 | 算法精通 |
| tenacityRating | 坚韧 | 道心 | 铁骨 | 意志 | 抗干扰 |
| fortuneRating | 气运 | 气运 | 机缘 | 幸运 | 概率偏移 |

---

## 3. 稀有属性（起步 9 条，可扩展）

模板默认 0，仅从装备词缀/星轨/套装获得。注册表模式：`registerRareStat(def)` 新增不改主循环。

| # | id | 中性名 | 类型 | 帽 | 触发/效果 |
|---|-----|--------|------|---|-----------|
| 1 | `dodge` | 闪避 | 防御 | 25% | 完全回避伤害（被穿透对抗） |
| 2 | `block` | 格挡 | 防御 | 30% | 触发后本次伤害 -30% |
| 3 | `critResist` | 抗暴 | 防御 | 25% | 降低被暴击概率 |
| 4 | `lifesteal` | 吸血 | 攻击 | 12% | 造成伤害回血 |
| 5 | `counter` | 反击 | 防御 | 20% | 被近战攻击后反手打回去（50% ATK） |
| 6 | `resilience` | 不屈 | 防御 | 15% | 首次致死时存活（1 血，每场限 1 次） |
| 7 | `echo` | 回响 | 攻击 | 18% | 技能命中后再触发一次（50% 伤害） |
| 8 | `thorns` | 反伤 | 防御 | 15% | 受击时反弹 X% 伤害给攻击者 |
| 9 | `steal` | 偷取 | 攻击 | 12% | 攻击时偷取敌方一个 buff |

### 3.1 扩展规则

- 当前 9 条为**起步池**
- 后续随装备内容（T3 效果词缀）、新套装、新星轨可随时新增
- 新增稀有属性 = 注册一条 `RareStatDef`，不改战斗主循环
- 每条独立定义帽、触发条件、效果逻辑
- 简单概率触发（一个 %）→ 稀有属性；复杂行为（条件+后果）→ T3 效果词缀/星轨被动

### 3.2 词表

| id | 中性 | 仙侠 | 武侠 | 魔幻 | 科幻 |
|----|------|------|------|------|------|
| dodge | 闪避 | 遁形 | 轻身 | 闪避 | 相位偏移 |
| block | 格挡 | 硬挡 | 铁臂 | 格挡 | 力场格挡 |
| critResist | 抗暴 | 稳心 | 铁布衫 | 坚韧护甲 | 冲击缓冲 |
| lifesteal | 吸血 | 采补 | 吸功 | 生命汲取 | 能量回收 |
| counter | 反击 | 反手 | 以牙还牙 | 反击 | 自动反制 |
| resilience | 不屈 | 逆天改命 | 绝处逢生 | 不屈意志 | 应急修复 |
| echo | 回响 | 余波 | 连绵不绝 | 回响 | 信号回波 |
| thorns | 反伤 | 金刚刺 | 硬气功 | 荆棘 | 反制力场 |
| steal | 偷取 | 夺灵 | 巧取 | 偷取 | 数据劫持 |

---

## 4. 特殊来源属性（不进词缀池）

| id | 中性名 | 来源 | 作用 |
|----|--------|------|------|
| `finalDmgBonus` | 终伤 | 破境大节点 / 套装 4 件 / 星轨特定节点 | 伤害链末端乘算 |

---

## 5. 删除清单

| 旧字段 | 处理 |
|--------|------|
| `physAtk` | 合并为 `atk` |
| `spiritAtk` | 合并为 `atk` |
| `physDef` | 改为 `def` |
| `spiritDef` | 改为 `res` |
| `versRating` | 删除（无替代） |
| `hasteRating` | 删除（单技能回合制无意义） |
| `finalDmgRating` | 从 Rating 降级为特殊来源 |

---

## 6. 伤害公式（修订）

```
1. 先手：按 spd 排序
2. Raw = atk × skill.multiplier × position_atk_mod
3. 穿透减防：effective_def = enemy.[def|res] × (1 - pen_pct)
4. After def = max(1, raw - effective_def × 0.5)
5. 暴击：if rng < clamp(crit_pct - target.critResist, 0, 0.95) → ×(1.5 + critDmg_extra)
6. 气运 lucky：if rng < fortune_pct → roll 两次取高
7. 精通加成：× role_mastery_multiplier
8. 终伤：× (1 + finalDmgBonus)
9. 受伤方坚韧：无（坚韧影响控制时长/受疗，不减伤害）
10. 格挡：if rng < target.block → damage × 0.7
11. 闪避：if rng < max(0, target.dodge - attacker_pen_pct×0.3) → damage = 0
12. 护盾吸收 → HP 扣减
13. 吸血回血：attacker heal = damage × lifesteal
14. 反伤：attacker takes damage × target.thorns
15. 反击：if melee && rng < target.counter → target hits back (50% ATK)
```

---

## 7. 装备词缀分层（预留，本文只定属性地基）

| 层 | 内容 | 给什么 |
|----|------|--------|
| T1 | 数字词缀 | 一级属性 + 二级 Rating 数值 |
| T2 | 稀有词缀 | 稀有属性百分比（如反击 4%） |
| T3 | 效果词缀 | 能力池原子 → 条件触发行为（后续设计） |
| T4 | 形态特技 | 改变技能行为，互斥 1（后续扩充） |

---

## 8. 实现步骤

1. `shared/types.ts`：重定义 `UnitTemplate` / `UnitRuntime` / `StatKey` / `CharacterProgress`
2. `combat/ratings.ts`：删 vers/haste/finalDmg，新增 pen/tenacity/fortune
3. `combat/combat.ts`：伤害公式按新流程改写
4. `character/templates.ts`：100 张卡模板批量刷新（physAtk+spiritAtk→atk；physDef→def；spiritDef→res）
5. `character/growth.ts` / `deriveGrowthStats`：成长公式适配新属性
6. `character/starTypes.ts`：StarNodeEffect 适配新属性名
7. `equipment/affixes.ts`：词缀池重建（新属性名 + 新增稀有属性词缀）
8. `equipment/sets.ts`：套装 bonus 适配
9. `web/` UI：面板、战报适配
10. 测试全量修复

---

## 9. 明确不做（本次）

- T3 效果词缀具体内容设计（下次）
- T4 形态特技扩充（下次）
- 套装扩充（下次）
- 新增稀有属性超出 9 条（后续按需注册）
- 能量/qi 系统改造（保持现状）
