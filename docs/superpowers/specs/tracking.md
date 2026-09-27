# 跟踪：待决 / 决策日志 / 下一刀 / 后置清单

> 日常改状态看本文；玩法规则改对应 `systems/*`。  
> 文档地图：[README.md](./README.md)。  
> **2026-07-20：** 原单体规格已按系统拆分；旧文件仅作入口跳转。

## 11. 待决事项

- [ ] 正式产品名  
- [x] 故事皮**不锁仙侠**；可玩家设定 + AI 框架内生成；官方仅可选默认皮（§2.3 / §9）  
- [ ] 官方默认皮题材选择（中性占位 / 某一气质）  
- [x] 卡池名单：中土故事圈 200（2026-08-26 拍板；刀一已迁）  
- [x] 主角手动粒度：轮到暂停选攻击/技能，仍不点名（M3；**2026-08-02 去掉通用防御**）  
- [ ] 数值初版（成长曲线精调、速度字段展示名等；**体力数字 / 抽卡软保底 8 已有 Demo 值**）  
- [x] Demo 存档：bump 作废旧档（云/账号后置）  
- [ ] 上线存档方案（访客码 vs 账号）  
- [ ] V2 AI 生成落点（仅开局 / 每章 / 更细）最终选择  
- [ ] 真支付渠道选型  
- [x] 装等 × 底子公式、洗练/封存价格、战力线性加权（数字可再调）  
- [x] 各章掉落装等段（六章；后两章挤在 81–92 / 93–100）  
- [ ] 条件伤害帽（建议 35%）  

### 已决（从待决移除）

- [x] Web + React + monorepo（`game-core` / `web`）  
- [x] 项目路径：`Desktop/Ycw/moyu-xiuxian`  
- [x] 战斗：九宫 + 自动索敌/出手；实现节奏 C  

---

## 12. 决策日志（摘要）

| 决策 | 结论 |
|------|------|
| 副业目标 | 可复利资产 |
| 时间 | 5–10 h/周 |
| 品类 | 文字养成 RPG，非挂机 |
| 系统骨架 | **§3.2–3.6** 核心 11 系统 + **§3.7** 扩展模块登记（任务/图鉴/商店/邮件/引导等；PVP/公会不做） |
| 人物升级 | 归属**人物/卡池 · 成长子模块**；非独立一级系统 |
| 扩展模块 | 先写进规格占位，**暂不开工**；开工须改 §3.7 状态并拆 plan |
| 战斗 | **九宫布阵 + 自动出手/索敌**（非逐人点目标） |
| 主角 | 可切换自动/手动；队友恒自动；手动仍不点名目标 |
| 战斗实现节奏 | 框架（九宫/自动/手自动）已完成 → **先完善战斗内容至验收** → 再养成/章节 |
| 阶段门禁 | **战斗 §4.11 手感验收已通过（2026-07-21）**；其后 B3→B1→B2→B4、B21 已落地；**当前主线：中土故事圈卡池刀一** |
| 属性扩展 | **力灵攻防四字段 + 生命/身法 + 六副属性 + 稀有（闪避/吸血/抗暴/格挡）+ 幸运**；堆叠即玩法 |
| 抗暴 | **只降低被暴击率**；不降被暴伤 |
| 比例存储 | 概率/比例字段 **两位小数**（0~1）；副属性评级整数 |
| 装备槽 | 代码 **12 槽**（`EQUIP_SLOTS`）；**每角色独立装备栏**；权威 [equipment.md](./systems/equipment.md) |
| 套装 | **属装备系统**；与副本掉落 `setId` 联动；**2/4 已结算**（现网三套验证：破军 / 铁壁 / 济世）；扩套与异常套后置 |
| 可玩性基调 | **九宫布阵 × 刷装构筑**；丰富=双核正交选择；**反四不像**（见 product §2.0 / dual-core §0） |
| 构筑双核 | **人解法 × 装风格**（单机刷宝主可玩性）；抽卡=新人+升星技能质变；总图 [build-dual-core-design](./2026-07-21-build-dual-core-design.md) |
| 力·灵双轴 | **已落地**（2026-07-21）；`physAtk`/`spiritAtk`/`physDef`/`spiritDef` + 技能 `damageSchool`；废止「永久单轴」与「现网单轴过渡」 |
| 先手 / 急速 | **身法定先手**；急速**只加速回能**，不叠先手；形状 `targetPattern` 可注册（含 all/cross） |
| 成长三轨 | **解法**（抽卡+升星技能）/ **底子**（等级·破境·升星属性）/ **风格**（原强度轨·装备）；废止「升星只算底子」 |
| 装备词条 | 底子 / 随机（副属性保底）/ 条件 / 稀有（纯概率）/ T3 一件事 / 孔 / 套；T4 人物石。洗 1 行；封存同破境档、毁源件。权威 [equipment.md](./systems/equipment.md) |
| 抽卡付费 | 卖流畅（人/星），不卖通关权；星尘兜底防单机卡死 |
| 技能模型 | **applyStatus[] + tags** |
| 终伤 | **保留**第六副属性 finalDmgRating |
| 实现冻结 | **§4.14** + **§4.15**（改晚极贵 + **扩展钩子**） |
| 连击 | 规则见 §4.9.1；刀一可只留类型 |
| 效果触发率 | **2026-08-30**：`effects[]` 可配 `chance`（触发≠命中）；治疗/护盾仍必中；示范刘备灌气 25%·56。见 [effect-proc-chance](./2026-08-30-effect-proc-chance-design.md) |
| 扩展原则 | **内容可后加，钩子必须先留**；**尽量不写死配置**；`registerStatus` / `registerTargetPattern` / `registerFocusPolicy` / `registerSkillEffect` / `registerStatusTick`；清单 combat **§4.15.2** |
| 系统完工 | **玩法闭环 + 扩展口**；做透一系统再换下一；禁止先硬编码后大拆（2026-07-29 · [tech §7.2.1](./tech.md)） |
| 人物 C1 | 成长走 GrowthTrack；StarNode 支持 stack；列表筛选+升星 diff+布阵提示；不做觉醒可玩/图鉴/扩池16+（[design](./2026-07-29-character-module-complete-design.md)） |
| 技能内容规范 | **1 招牌主动 + ★1–★6 星章**；链：母题→动词→招牌→星章；遮名可认出；填表见 [skill-design-spec](./2026-08-02-skill-design-spec.md)（2026-08-02） |
| 能力池 | 制作侧原子库 **活跃条均 N**；现网 `ABILITY_ATOMS` 可挂星章（系数随精通长）；§2.2 并入 id 不进表；玩家不养成池；见 [ability-pool-catalog](./2026-08-02-ability-pool-catalog.md) |
| 战中行动 | **普攻 + 技能**；废止通用「防御」行动——承伤归坦克招牌（2026-08-02） |
| 升星消耗 | 同名碎片加码：★1–3×1 / ★4–5×2 / ★6×3；**星尘仅兑碎片**（200/片·日1·助到★4）（2026-08-02） |
| 品级星上限 | **凡★3 / 良★4 / 珍★5 / 绝★6**（2026-08-03 落地） |
| 修为/破境 | 天梯表现行至大罗（只许往后加）× 每境 10 小层 + 破境；修为**仅塔**；见 [xiuwei-cultivation](./2026-08-02-xiuwei-cultivation-design.md) |
| 文档整理 | README 拆**现行/归档**；依赖层级写死；growth-draft/C1/roster/旧单体/旧 plan 标归档；存档现网 **v15**；卡池权威 [中土故事圈](./2026-08-26-zhongtu-roster-circles-design.md)（代码未迁仍 100） |
| 眩晕/异常 | 经典异常骨架 + DR；Boss 抗控分级；显示名随皮 |
| 技能资源 | 全员统一 **qi（能量）**；普攻/行动回，技能消耗；与急速形成「勤度」轴 |
| 伤害类型 | **力·灵双轴已落地**（2026-07-21）；`physAtk`/`spiritAtk`/`physDef`/`spiritDef` + `damageSchool`；旧 atk/def 词缀并入力系 |
| 职能定位 | **九职能**：全能(主角)+坦克/单体爆发/群攻/单控/群控/群增幅/单疗/群疗 |
| 职业 job | **常见 8 个**挂在 role 上（§4.8.2）；显示名随皮；不另开公式 |
| 九宫形状 | **`targetPattern`**（横排/竖列/全体/每排首末列等）；与人物技能绑定；见 §4.1.1 |
| 卡池与故事 | 卡池跨题材；**故事皮不锁仙侠**；战斗认 role + jobId（手感） |
| 属性显示名 | **随故事皮词表变**；引擎 id 固定；缺省中性名（急速/均衡/能量…）；**勿与职能「全能」撞名** |
| 经济 | 剧情开门 / 副本产装 / 抽卡定核 / 布阵过关 / 氪金续航 |
| 付费顺序 | 先抽卡（A），月卡后置 |
| 会话 | 主动玩、不挂机；**10–20 分钟有收获**仅作内部节奏，不进对外 slogan |
| 对外身份 | **布阵刷装 · 摸鱼深构筑**；见 [positioning-revision](./2026-08-07-positioning-revision-design.md) |
| 玩法扩展储备 | E1-E8 机制登记（遭遇词缀/阵位共鸣/Rogue Run/破境挑战/完美触发/周回异变/装备铭刻/宿敌）；题材无关；暂不开工；见 [gameplay-expansion-catalog](./2026-08-07-gameplay-expansion-catalog.md) |
| 属性体系重设计 | 一级5（ATK/DEF/RES/HP/SPD）+ 二级6 Rating（暴击/暴伤/穿透/精通/坚韧/气运）+ 稀有9（可扩展）；删均衡/急速/终伤；攻击合并；防御分力灵；见 [attribute-system-redesign](./2026-08-08-attribute-system-redesign.md) |
| 技术 | Web + React；monorepo；core/adapter/ui 分层 |
| 用户 | 上班能开的摸鱼入口；本体要策略深度 |
| 引擎 vs 皮肤 | 引擎先独立；文字世界观 / AI 外皮是皮肤 |
| AI 剧情 | 第二期；框架内有限掌控 + 默认线；**不抬成第三条养成主轴** |
| 文档约定 | 确认方案必须落盘本文（含关键算法 §4.12）；plan 跟文档走 |
| 关键算法 | 评级/伤害链/控制 DR/几率公平/qi 节奏 → §4.12 |
| Buff/Debuff | §4.13：异常骨架 + DR/Boss 抗控 + 装备放大；审视见 §4.13.0 |
| V1 体量 | 见第 8 节 |
| 装备词缀修订 | **2026-08-16 拍板并入 equipment.md**：装等只抬底子；蓝无 T3；金必 T3；稀有不必出；条件 10 种；T3 一件事；气轴 2 攒第 3 放；战力=面板线性加权。**生成器 / 洗练 / 封存 / 战力已落地（B21）** |
| 章节强度档 | **2026-08-24**：敌人跟正在打的章走；战力只展示建议，不锁进门、不拿来刷怪；塔 instant 不跟档 |

---

## 13. 当前下一刀（跟踪用）

| 状态 | 项 |
|------|----|
| 已完成 | 战斗；双轴；B3；B1；B2；B4；人物 C1；公版换代 v9；**100 卡挂池（32 深做）+ 存档 v15**；**B21 装备生成器**；**六章强度档 + 建议战力**；**中土故事圈刀一（200 / v16）** |
| 已完成（文档） | combat；dungeon；gacha；stamina；chapter；C1；roster；**skill-design-spec**；**文档现行/归档整理（2026-08-02）** |
| 已完成（UI） | 伙伴名录印格；布阵；冒险战斗向；召唤结果框色；人物四页签；装备上6/中属性/下6 |
| **当前主线** | **Loop 总路线** → [moyu-xiuxian-loop-master-plan.md](./moyu-xiuxian-loop-master-plan.md)；断点 → [progress](./moyu-xiuxian-progress-2026-09-24.md)；**可选 W14 扫尾 / feel 已录** |
| **暂缓** | 传说招牌圣经重开；54 绝品深做星；胚子打造；套装 2/4 大改；任务/商店/PVP |
| **后置** | 效果触发率深化；副本绑套装身份；真支付/云存档 |
| **文档约定** | 入口 [README](./README.md)；进度认本文；细则认 `systems/*`；归档默认不信；**每系统必带扩展口**（[tech §7.2.1](./tech.md)） |
| 实现 plan | [传说招牌第一刀](../plans/2026-08-29-legendary-signature-kit.md)；特技池后置；手感 `npm run feel` |
| 冻结总表 | combat；equipment（含套装 2/4 数值）；dungeon；gacha；stamina |
| 里程碑索引 | `docs/superpowers/plans/2026-07-19-vertical-slice.md` |
| 门禁之后 | §14 |
| **loop 进度** | [moyu-xiuxian-progress-2026-09-24.md](./moyu-xiuxian-progress-2026-09-24.md) |
| **loop 总计划** | [moyu-xiuxian-loop-master-plan.md](./moyu-xiuxian-loop-master-plan.md) |

### 13.0 Loop 总路线（权威顺序）

> 阶段表与 W1–W12 见 **[loop-master-plan](./moyu-xiuxian-loop-master-plan.md)**。本节只保留历史 §13.1–§13.4 明细。

**当前指针：** **W10 · E1 遭遇词缀 MVP**（见 loop-master-plan §4）。

### 13.13 dev-loop · 聊斋 expand（**W9 · 2026-09-27 已验收**）

| ids | `zhangdaoling`, `niexiaoqian`, `yanchixia`, `huapi` |
| 判据 | 184 tests pass |

### 13.12 dev-loop · 宝莲+降妖 expand（**W8 · 2026-09-27 已验收**）

| ids | `chenxiang`, `sanshengmu`, `zhongkui`, `xuxun`, `jigong` |

### 13.11 dev-loop · 瓦岗 expand（**W7 · 2026-09-27 已验收**）

| ids | `qinqiong`, `lishimin`, `yuchigong`, `luocheng` |

### 13.10 dev-loop · 梁山 expand（**W6 · 2026-09-27 已验收**）

| ids | `linchong`, `wusong`, `luzhishen`, `songjiang` |
| 判据 | master-plan §1 配方 + `npm test` 181 pass |

### 13.9 dev-loop · 忠烈 expand（**W5 · 2026-09-27 已验收**）

| ids | `muguiying`, `yangye`, `mulan`, `shetaijun` |
| 判据 | master-plan §1 配方 + `npm test` 180 pass |

### 13.8 dev-loop · 兵家 expand（**W4 · 2026-09-27 已验收**）

| ids | `guiguzi`, `sunwu`, `gongshuban`, `pangjuan` |
| 判据 | master-plan §1 配方 + `npm test` 179 pass |

### 13.7 dev-loop · 楚汉 expand（**W3 · 2026-09-27 已验收**）

| ids | `liubang`, `hanxin`, `zhangliang`, `yuji` |
| 判据 | master-plan §1 配方 + `npm test` 178 pass |

### 13.6 dev-loop · 江南 expand（**W2 · 2026-09-27 已验收**）

| ids | `baisuzhen`, `xiaoqing`, `fahai`, `zhinu` |
| 判据 | master-plan §1 配方 + `npm test` 177 pass |

### 13.1 dev-loop · 周循环主线计划

> 阶段按「判据可独立成立」排序；每轮只做一个子阶段（dev-loop §1.4）。Cursor 心跳可用 `/loop 10m` + 下方 prompt，**须先完成 P0 再开 cron**。

**Loop prompt（统一 · 复制到 `/loop 10m` 后）：** 见 [loop-master-plan §6](./moyu-xiuxian-loop-master-plan.md#6-统一-loop-promptcursor-loop-10m)。

#### 每轮固定门禁（伤害 / 技能流）

| 命令 | 作用 |
|------|------|
| `npm test` | 全量 + **combatFlowSmoke**：八题×5 种子 + spotlight 卡 wall/oil 各 3 种子 |
| `npm run test:combat-flow` | 仅战斗流冒烟 |
| `npm run feel -- --seeds 15` | 可选：看胜率/战报 |

本批验收卡：`packages/game-core/src/combat/combatFlowSpotlight.ts`（新 expand 批次追加 id）。

#### 阶段

| 阶段 | 内容 | 判据 |
|------|------|------|
| **P0** | loop 三件套 + WIP 叙事收口（文档指针；未提交改动按下面「P0-WIP 清单」拆 commit 或单批提交） | 存在 §13.1 + progress 文件；`git status` 与 progress「下一件」一致 |
| **P1** | 战败/结果提示对齐「去哪刷什么」：`buildDefeatHint` + 必要时 Hub/Result 副文案；八题与 T3 口语一致 | `encounterRecipes.test.ts` 全绿；战败 hint 含镜渊/猎装指向（见测试正则）；`npm test` game-core 全绿 · **2026-09-24 hint+Hub 主路径已做** |
| **P2** | **测试门禁**：`character growth` 3 红修绿（星轨/破境文案与深做卡一致） | `npm test` **0 fail**（当前基线 167 tests）· **2026-09-24 已绿** |
| **P3** | 封神刀二一批：申公豹 / 敖丙 / 太乙（roster + 星轨 + 技能 compose 测） | 新 id 挂池；`roster.test.ts` / `skillCompose.test.ts` 增例绿；不碰套装 2/4 · **2026-09-24 expand+测例** |
| **P4** | B17 对手克制提示（战前轻提示，复用 encounter 元数据） | 战前 UI 或 Hub 一条可读提示；不硬锁进门 · **2026-09-24 `prepHint`+战斗页** |

### 13.2 dev-loop · 上古 expand（**已完成 2026-09-25**）

> **Loop 真源**：本节 + [moyu-xiuxian-progress-2026-09-24.md](./moyu-xiuxian-progress-2026-09-24.md)。Cursor 发：`/loop 10m` + 下方 **§13.2 prompt**。

**§13.2 Loop prompt：**

> 按 `docs/superpowers/specs/tracking.md` §13.2 推进上古 expand。先读 `docs/superpowers/specs/moyu-xiuxian-progress-2026-09-24.md`。自行决策；仅 §13.1「需要人定的决定」可问用户。每轮 dev-loop §2 开场、§4 收尾；一轮一个子阶段；有进展则 1 commit。

| 子阶段 | 内容 | 判据 |
|--------|------|------|
| **P5a** | 黄帝/蚩尤/西王母/伏羲/大禹：`roster.test` 专测（招牌名、钩子 copy、★3 岔路、无招魂） | 五人测例绿；`npm test` 全绿 |
| **P5b** | `zhongtuRoster` 五人 `motif/skillName` 去「诀」占位（若仍有） | 五人 `getSkill().name` 无裸「诀」 · **2026-09-24 loop 第 2 轮** |
| **P5c** | `skillCompose.test` 黄帝/大禹 compose 测例 | 新增测例绿 · **2026-09-25 loop 第 3 轮** |

**P5a–P5c 均已落地**；下一 loop 见 **§13.3**。

### 13.3 dev-loop · 吴越 expand（**已完成 2026-09-25**）

| 子阶段 | 内容 | 判据 |
|--------|------|------|
| **P6a** | 聂隐娘/荆轲/干将/莫邪/李白/伍子胥：`roster.test` 专测 | 六人测例绿 · **loop 完成** |
| **P6b** | 名册 skillName 与 motif 对齐 + `combatFlowSpotlight` 六 id | 无裸「诀」；combatFlowSmoke 绿 |

**§13.3 Loop prompt：** 同 §13.1 模板，将计划节改为 **§13.3 / 吴越**；新六人进队后更新 `combatFlowSpotlight.ts`。

### 13.4 dev-loop · 群雄 expand（**已完成 2026-09-25**）

| 子阶段 | 内容 | 判据 |
|--------|------|------|
| **P7** | 曹操/司马懿/郭嘉：roster 测例 + skillName + spotlight | 175 tests 绿 · **已完成** |

### 13.5 dev-loop · 八仙+东海 expand（**W1 · 2026-09-25 已验收**）

| ids | `lvdongbin`, `hanzhongli`, `tieguaili`, `aoguang` |
| 判据 | master-plan §1 配方 + `npm test` 绿 |

（§13.6–§13.13 批次表见 [loop-master-plan §3](./moyu-xiuxian-loop-master-plan.md#3-expand-清尾w1w9-按圈-batch)。）

**P0-WIP 清单（历史 · 已提交）：**

1. 副本+遭遇+掉落+审计测试（`dungeon/*`、`encounters`、`lootTables`、`generate`、`encounterRecipes.test`、`dungeon.test`）
2. 战斗+装备 T3/裂甲+`gearIdentity.test`（`combat/*`、`equipment/*`）
3. 传说 expand 钩子/星 + growth 相关（若仍保留）+ Hub 副标题 + 文档

#### 需要人定的决定（仅此停问）

| 项 | 说明 | loop 默认 |
|----|------|-----------|
| 条件伤害帽 35% | tracking §11 待决 | **不动数值**，除非用户拍板 |
| 正式产品名 / 上线存档 / 真支付 | §11 | **不实现** |
| WIP 是否一次性 commit | 用户是否要求 git commit | **不 commit**，除非用户明确说 |

#### V1 缺口优先级（2026-09-25 拍板 · 真源 [loop-master-plan §3.1](./moyu-xiuxian-loop-master-plan.md#31-用户拍板2026-09-25--loop-遵从此序)）

| 已拍板 | 结论 |
|--------|------|
| W9 后加厚 | E1 → E2 → Hub 抛光 → feel → bundle 扫尾 |
| 200 池 | 广收集；构筑核心 = 传说 expand + 深做卡 |
| 塔 | V1 薄壳，不加深塔战斗 |

---

## 14. 后续待做清单（战斗验收已过 · 按序开工）

> 战斗 §4.11 已通过（2026-07-21）。下列按 tracking §13 主线顺序拆 plan，避免并行铺满。

### 14.1 养成与进度（原 M4）

| 序号 | 项 | 说明 | 状态 |
|------|----|------|------|
| B1 | 抽卡/招募 | 常驻池+软保底+券；新人解锁；重复→碎片升星 | **已落地** |
| B2 | 体力 | 自然恢复；**摸鱼补给**每日一次 | 已落地 |
| B3 | 副本结构化 | 猎装 + 塔 + **星尘秘境**；setId 倾向；无 2/4 | **已落地** |
| B4 | 短章节门锁 | 6 章表 + 解锁查询 + Hub 推进；锁内容池不硬锁通关；**章档敌人跟档 + 建议战力（不锁进门）** | **已落地** |
| B5 | 成长/突破/升星 | GrowthTrack + stack 星盘 + 伙伴体验做透 | **C1 已落地** |

### 14.2 商业与分发

| 序号 | 项 | 说明 | 状态 |
|------|----|------|------|
| B6 | 真支付（抽卡） | Web 渠道另议；支付走 adapter | 已记录 |
| B7 | 月卡/体力续航 | 付费买流畅，不锁通关 | 已记录 |
| B8 | 多端壳 | 小游戏 / Steam / iOS；复用 game-core | 已记录 |

### 14.3 内容与叙事（后置）

| 序号 | 项 | 说明 | 状态 |
|------|----|------|------|
| B9 | 官方短主线文案 | 替换占位皮 | 已记录 |
| B10 | AI 有限剧情 | 框架内选项 + 默认线；见 §9 | 已记录 |
| B11 | 卡池扩至 16–24→100→中土 200 | 刀一 200；刀二深做 5；expand 圈批：封神/上古/吴越/群雄（见 §13.2–§13.4） | **下一批：design §5 圈序（八仙/梁山等）按需开 §13.x** |

### 14.4 工程与体验（可穿插）

| 序号 | 项 | 说明 | 状态 |
|------|----|------|------|
| B12 | 云存档/账号 | 本地之后 | 已记录 |
| B13 | 概率公示位 | 真上线抽卡前 | 已记录 |
| B14 | 战斗表现增强 | 战报分层、关键击高亮等（非必做） | 已记录 |
| B15 | 堆叠阈值质变 | 如暴击≥40% 附带薄破甲；急速≥30% 每第 3 动强化 | 已记录 |
| B16 | 套装内容扩充 | 2/4 已结算（破军 / 铁壁 / 济世）；扩套 / 异常套 / 6 件后置 | 已记录（扩内容） |
| B21 | 装备词缀第一包 | 换生成器 + 条件乘区 + 新 T3 + 洗 1 行 + 封存同档 + 战力；见 [equipment.md](./systems/equipment.md) | **已落地** |
| B17 | 对手克制提示 | 战前/战败提示堆装方向（破甲/力灵不对路等） | 已记录 |
| B18 | 力·灵双轴 | 引擎+面板+技能 school+词缀池 **已落地**；副本按力/灵分流后置加深 | **已落地** |
| B18b | 元素/五灵克制 | 双轴之后按需；不与双轴绑死 | 已记录（更后） |
| B19 | 暴击伪随机（PRD） | 短局连黑难受时再开；见 §4.12.5 | 已记录 |
| B20 | 力耐敏智转化层 | 转化 → 双轴结果层；双轴之后 | 已记录（更后） |

### 14.5 玩法扩展机制（储备 · 题材无关）

> 详细规格见 [gameplay-expansion-catalog](./2026-08-07-gameplay-expansion-catalog.md)。全部过自检句；引擎 id + 词表，不绑题材。

| 序号 | 项 | 说明 | 状态 |
|------|----|------|------|
| E1 | 遭遇词缀 | 每场随机 1-2 条规则修饰；逼换搭配 | 已登记·一期 |
| E2 | 阵位共鸣 | 九宫站法触发 team buff；凸显布阵价值 | 已登记·一期 |
| E3 | Rogue Run | 多节点路线副本；临时 buff + Boss；10-20 分钟完整弧 | 已登记·二期 |
| E4 | 破境挑战 | Solo 定制关；按职能出题 | 已登记·二期 |
| E5 | 完美触发 | 满足条件通关 → 下场临时超模 | 已登记·三期 |
| E6 | 周回异变 | 每周全局 1-2 条规则变体 | 已登记·随时 |
| E7 | 装备铭刻 | 条件触发效果；Boss 掉落源 | 已登记·三期 |
| E8 | 宿敌记忆 | 敌人记住你；败多变强/胜多获克制 | 已登记·后置 |

---

*本文档为唯一产品指导；确认即更新，开发跟文档走。*
