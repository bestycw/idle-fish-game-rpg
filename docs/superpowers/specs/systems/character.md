# 人物 / 卡池系统（产品语：伙伴）

> 权威文档。归属系统骨架 §3.3 #3。  
> **战斗**只消费本系统输出的「上阵单位」；**抽卡**写入持有并供给升星材料；**升级/破境/升星**为本系统成长子模块。  
> **UI 定调：** 底栏称**伙伴**；列表展示**全池**（未获得灰显，点提示去召唤）；已有可进养成详情。  
> **新卡技能/星章怎么写：** [skill-design-spec](../2026-08-02-skill-design-spec.md)。架构管道见 [character-foundation](../2026-08-02-character-foundation-design.md)。

## 边界

| 本系统负责 | 不负责 |
|------------|--------|
| 卡模板（role / job / skillId / rarity） | 伤害公式（→ [combat](./combat.md)） |
| 持有哪些卡、出战编入布阵 | 装备词缀（→ [equipment](./equipment.md)） |
| 成长：升级 / 破境 / 升星（**C1 已做透**：GrowthTrack 注册表 + stack 星盘 + 列表筛选/升星 diff/布阵提示） | 抽卡概率与保底（→ [gacha](./gacha.md)） |
| 出战上限规则（与布阵共用） | 图鉴收集展示（扩展 #13；入口灰锁在伙伴页） |

## 双核 / 三轨中的位置

见 [systems-overview.md §3.4](../systems-overview.md) 与 [build-dual-core-design](../2026-07-21-build-dual-core-design.md)：

- **解法核（人）：** 职能 + 技能；抽卡得人；**升星关键技能/被动**  
- **底子：** 等级 / 破境 / 升星属性部分  
- **风格核（装）：** 装备系统  

**抽卡意义：** 新卡补职能缺口；重复卡驱动升星 → 招牌技能更强（不只数值更高）。

## 职能 role

#### 4.8.1 职能定位（已确定 · 替代门派定位）

> 定位是**战斗职能**，不是「剑修/药修」门派名。  
> 卡面可以是关羽、孙悟空或原创；**role 只决定精通与技能职责**。

| role id | 定位 | 战场职责 | 精通效果（摘要） |
|---------|------|----------|------------------|
| `flex` | **全能** | 主角默认；少数卡可挂（哪吒/木兰/魏延等）；补位、样样一小点 | 技能伤小幅 + 状态命中小幅 + 治疗小幅（都不精） |
| `tank` | **坦克** | 承伤、护盾、前排 | 再减伤 + 护盾量 ↑ |
| `st_burst` | **单体爆发** | 点杀高威胁 | 单体技能伤 ↑ + 微量暴伤/穿透 |
| `aoe_dps` | **群体攻击** | 清杂、打排 | 群体技能伤 ↑ |
| `st_ctrl` | **单体控制** | 点控（眩晕/沉默/禁疗等） | 状态命中 ↑ + 单体控时长微增 |
| `aoe_ctrl` | **群体控制** | 群控、混乱、群体迟缓等 | 状态命中 ↑ + 群体状态覆盖 |
| `group_amp` | **群体增幅** | 增益队友；可附带破甲等削弱 | Buff 效果 ↑；破甲类 value 微增 |
| `st_heal` | **单体治疗** | 抬残血 | 单体治疗量 ↑ |
| `aoe_heal` | **群体治疗** | 群体抬血/群体小盾 | 群体治疗量 ↑ |

**编排建议（九宫）：**

| 需求 | 优先职能 |
|------|----------|
| 盾墙关 | 坦克 + 群体增幅（破甲）+ 单体爆发 |
| 多杂兵 | 群体攻击 + 群体控制 |
| 敌治疗强 | 单体控制（禁疗/沉默） |
| 高压输出 | 坦克 + 单体/群体治疗 |
| 以弱胜强 | 群体控制（混乱）+ 增幅 |

**V1 出战最多 5 人，不必盖全 9 职能**；池子里逐步凑齐，靠换阵补位。抽卡/升星意义见上文「双核 / 三轨」。

## 职业 job

> **关系 A：** 卡 = `role`（战场干什么）+ `job`（什么手感）。  
> `role` 管精通与破阵；`job` 管招牌索敌/技能 tags 偏好与一句特色。  
> **显示名随故事皮**（[skin.md](./skin.md) `jobLabels`）；缺省 UI 用下表**中性常见名**。  
> V1 **只保留常见职业**，不扩冷门专精。

| jobId | 中性默认名 | 主绑 role | 可兼 role | 招牌特色（引擎侧） |
|-------|------------|-----------|-----------|-------------------|
| `vanguard` | **盾卫** | `tank` | — | 前排；招牌 `guard`/护盾承伤（无通用防御行动） |
| `assassin` | **刺客** | `st_burst` | — | **穿透**切中后排；常挂流血 |
| `ranger` | **射手** | `st_burst` | — | 远程点杀；穿透 + **残血加权**；暴击向 |
| `mage` | **法师** | `aoe_dps` | — | 形状攻（常 `row_*` / `all`）；偏清排/清杂 |
| `warlock` | **术士** | `st_ctrl` | `aoe_ctrl` | 异常专家；沉默/禁疗/混乱/迟缓 |
| `support` | **辅助** | `group_amp` | — | Buff/破甲增幅；自身输出偏低 |
| `healer` | **治疗** | `st_heal` | `aoe_heal` | 抬血；单体或群体由技能决定 |
| `adept` | **行者** | `flex` | — | 主角与少数 `flex` 卡；无极端招牌 |

**规则：**

1. 一张卡必须有且仅有一个 `jobId`；`job` 的主绑/可兼必须覆盖该卡的 `role`。  
2. 同一 `role` 可有多个 job（如单体爆发：刺客 / 射手）——差在手感，不差在精通表。  
3. **不加**职业专属资源条、物法双防、职业克制三角。  
4. 新职业 = 新 `jobId` + 词表项；禁止用题材专名当 id（如不要 `jianxiu`）。

**公版池映射：** hero→行者；张飞→盾卫；赵云→刺客；孙悟空→法师；后羿→射手；华佗→治疗；诸葛亮→辅助；白骨精→术士。西方神谱已下架，见 [中土故事圈](../2026-08-26-zhongtu-roster-circles-design.md)。

## 初期人物表

### 4.10 卡池人物表（中土故事圈 · 200）

> **出战上限 5** = 主角 + 最多 4 张卡。  
> 默认上阵：主角 / 张飞 / 赵云 / 孙悟空 / 华佗。  
> **名单权威：** 代码 `UNIT_TEMPLATES`；规则 [中土故事圈](../2026-08-26-zhongtu-roster-circles-design.md)（200 人、16 圈、绝 81 / 珍 45 / 良 44 含主角）。  
> **100 期实现史：** [roster-100](../2026-08-02-roster-100-design.md)。  
> **新卡技能/星章写法：** [skill-design-spec](../2026-08-02-skill-design-spec.md)；**人物卡品级另约束技能厚度**（见中土故事圈 spec §1）。  
> 存档 **v16**。

**开局五人（摘要）：**

| id | 名 | role | skill 要点 |
|----|-----|------|------------|
| hero | 主角 | `flex` | purge |
| zhangfei | 张飞 | `tank` | stun |
| zhaoyun | 赵云 | `st_burst` | pierce+bleed |
| wukong | 孙悟空 | `aoe_dps` | row_front |
| huatuo | 华佗 | `st_heal` | heal+cleanse |

**解锁：** 按圈批次，见中土故事圈 spec §6 与 `expandIdsByUnlock`。

> **9 职能已盖全。** 新卡走 skill-design-spec 填表 → 改模板/技能/星轨，禁止改战斗主循环。

**敌方异常 / 遭遇：** 见 [dungeon.md](./dungeon.md) 与 [combat.md](./combat.md)。

## 稀有度（卡框色）

> 定调：稀有度定框色与角标；**人物卡另外约束招牌/星章厚度**（凡 1 动词 … 绝 2～3 效果，见 [中土故事圈 §1](../2026-08-26-zhongtu-roster-circles-design.md)）。不改伤害公式。装备稀有度仍只定框与生成层。

| rarity | 中性名 | UI 框色倾向 | 示例卡 |
|--------|--------|-------------|--------|
| `common` | 凡品 | 中性边 | 扩展占位（孟获/沙僧等） |
| `rare` | 良品 | 青蓝 | 徐庶 / 魏延 |
| `epic` | 珍品 | 品红 | 马超 / 八戒 |
| `legendary` | 绝品 | 琥珀金 | 主角 / 赵云 / 悟空 / 女娲 / 聂隐娘 |

**接线面：** 伙伴列表卡、详情头图、布阵位/可选池、召唤结果卡。未获得：虚线 + 同色相弱化。

---



## 成长子模块（本阶段完成 · C1）

> **权威在本文 + 代码。** C1 实现史（归档）：[character-module-complete](../2026-07-29-character-module-complete-design.md)。  
> **下一层管道：** [character-foundation](../2026-08-02-character-foundation-design.md)；**技能/星章内容：** [skill-design-spec](../2026-08-02-skill-design-spec.md)。  
> 面板骨架 → [character-panel-wow-layout](../2026-07-20-character-panel-wow-layout.md)；爬塔 → [dungeon.md](./dungeon.md)。

| 项 | 状态 |
|----|------|
| GrowthTrack 注册表 | ✅ level / breakthrough / star；awaken/bond 预留 disabled |
| BreakthroughDisplay | ✅ 与消耗/cap 分表 |
| StarNode stack | ✅；特例赵云★3 / 孙悟空★3 |
| 正式图鉴 / 觉醒可玩 | 后置；名单迁完约 200（16 圈） |
| composeSkill 地基 | ✅ F1–F5；见 [foundation](../2026-08-02-character-foundation-design.md) |

| 指针 | |
|------|--|
| 三轴 | GrowthTrack → `growthTracks.ts` |
| 升星 | 数据轨 ★1–★6；**可玩上限按品级** 凡★3 / 良★4 / 珍★5 / 绝★6（`maxStarForRarity`）；消耗见 [gacha §3.1](./gacha.md) |
| 破境 | 每境 10 小节点（修为）满后破境；抬 cap + 被动（`breakthroughPerks`）；修为仅塔 · [xiuwei-cultivation](../2026-08-02-xiuwei-cultivation-design.md) |
| 修为来源 | 修炼塔薄壳 → dungeon |
| 构筑总图 | [build-dual-core-design](../2026-07-21-build-dual-core-design.md) |

## 与布阵

- 出战上限 `MAX_PARTY_SIZE = 5`（见人物表与代码）  
- 池内卡 > 5 时可换上；主角默认不可下阵  
