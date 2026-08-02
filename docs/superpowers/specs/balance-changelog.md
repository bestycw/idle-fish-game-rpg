# 数值 / 内容变更记录（Balance Changelog）

> Agent 与人工调参**必须**在此追加条目。新条目置顶。  
> 不替代 `systems/*`；大定调仍写规格分册。

## 格式

```
### YYYY-MM-DD · 短标题
- **动机：** …
- **改动：** 文件/配置要点
- **基线：** 手感脚本摘要（若有）
- **未 commit：** 是（默认）
```

---

### 2026-08-02 · 修为境界盘（小节点 + 破境）

- **动机：** 底子轨应对齐「小步属性 / 大步破境」；修为勿多口产。  
- **改动：**  
  - 每境 4 小节点（修为）→ 满后破境（更贵）；破境不要求等级满 cap  
  - 修为**仅修炼塔**；猎装/镜渊修为归零；开局修为 36；塔曲线 `10+层×3`  
  - GrowthTrack 新增「修炼」  
- **基线：** cultivate → breakthrough 单测。  
- **未 commit：** 否

### 2026-08-02 · 星尘改为兑碎片（护抽卡）

- **动机：** 抽卡是付费核；星尘直接升星 / 一月纯尘满星过快。  
- **改动：**  
  - 升星**只吃碎片**；`200 尘→1 同名碎片`，日限 1，**最多助到 ★4**  
  - 秘境 8–12；塔里程碑 18；摸鱼补给 +6 尘；开局尘 20  
  - 伙伴页「星尘兑碎片」按钮  
- **基线：** growth 兑换单测；禁 ★4 后再兑。  
- **未 commit：** 否

### 2026-08-02 · 升星碎片加码（非 1:1）

- **动机：** 对齐「新的开始」人核；满星不应只需 6 张重复。  
- **改动：** `starShardCost`：★1–3=1、★4–5=2、★6=3（满星 10 碎片）；星尘兜底按档×`(10+星×6)`；预览/UI costLine 显示 `碎片 have/need`。  
- **基线：** growth 单测覆盖 ★6=3 片。  
- **未 commit：** 否

### 2026-08-02 · 废止通用「防御」行动

- **动机：** 防御是坦克职责，不该全员三键；稀释招牌与布阵。  
- **改动：** `ActionKind` 仅 `attack`/`skill`；AI/主角手动去掉防御；删除 `defending` 姿态减伤；坦克靠 `guard`/护盾技能。  
- **基线：** 单测回归。  
- **未 commit：** 否

### 2026-08-02 · 技能合成地基 F1–F5 + 赵云样板

- **动机：** 升星难质变、装改招无管道；先做 compose 再填 24 卡身份。  
- **改动：**  
  - `skillCompose.ts`：`listSkillModifiers` / `composeSkill` / `skillDiffLines`；`skillWithGrowth` 薄封装  
  - `starTypes`：`status_unlock` / `effect_unlock`；赵云 ★6「单骑救主」追加 shred  
  - `assertCharacterBundle` 全卡校验；装备 `morphId` + 示范「血刃」进 compose  
  - UI 技能页：养成 diff / 下一星 diff / 装形态 / 多状态与 effects  
- **基线：** 单测覆盖 compose / bundle / morph；手感未改遭遇表  
- **未 commit：** 否

### 2026-08-01 · UI 露出成长轨 + 卡池满 24 + 手感微调

- **动机：** 升星/破境被动玩家看不见就难促抽；速攻偏虐；卡池目标 24。  
- **改动：**  
  - `listStarTrackRows` / `listBreakthroughPerkRows`；技能页展示全 ★1–6 与破境被动  
  - `skillDisplayFor.growthModLine`；星级 UI 按 `MAX_STAR=6`  
  - +3：西施（沉睡）、孙膑（破甲+迟滞）、贝奥武夫（震慑坦）→ **24 卡**  
  - 速攻影刃略削（开局队 ~90%）；镜渊三遭遇加压（高压本定位）  
- **基线：** 开局队三遭遇 **97%**（raiders 90%）；镜渊池仍可过但回合拉长（boss≈9.4t、spirit≈7.0t、有倒人）  
- **未 commit：** 否

### 2026-08-01 · 成长深化 + 副本扩展 + 卡池 +10

- **动机：** 升星/破境同质化难促抽；副本薄；卡池向 16–24 推进。  
- **改动：**  
  - 升星 ★1–★6：`starTypes` 扩 effect（rating/skill_mult/qi_cost/status_boost）；`starTracks` 21 卡个性轨；`skillWithGrowth` 应用技能修正  
  - 破境：`breakthroughPerks` 全局 + 个性被动；preview/成功文案带被动名  
  - 副本：遭遇 +灵防墙/乱心/守卫首领；新本 `abyss_mirror`（章2解锁）；塔每5层星尘里程碑；`DungeonDef.staminaCost`  
  - 卡池 +10：关羽/吕布/典韦/哪吒/妲己/杨戬/嫦娥/雷神/罗宾汉/亚瑟；存档 **v10**  
  - 设计：[2026-08-01-growth-dungeon-expand-design](./2026-08-01-growth-dungeon-expand-design.md)  
- **基线：** 单测 57 绿；开局手感脚本仍可跑（裸装）  
- **未 commit：** 否

### 2026-08-01 · 套装 2/4 数值结算（破军/铁壁/济世）

- **动机：** 双核「装·风格」需要可感知套装差；猎装已掉 `setId` 但未结算。  
- **改动：**  
  - 新增 `equipment/sets.ts`：破军（攻）/ 铁壁（防）/ 济世（续）；2/4 件加属性  
  - `sumEquipmentBonuses` 汇总时应用；`set_demo_1/2` → 破军/铁壁 别名  
  - 猎装掉落权重改为三套；`equipment.test.ts`  
  - Web 行囊/结算露出套装中文名与 2/4 进度  
- **基线：** 不改变裸装开局手感（套装依赖刷装）  
- **未 commit：** 否

### 2026-08-01 · 第一轮加压 + 技能辨识 + 词条倾向

- **动机：** 手感基线开局队 100% 秒过、弓手战 ~3 回合，策略感不足；装备风格稀有档词条不全、无槽位倾向。  
- **改动：**  
  - `encounters.ts`：三套路整体加血加攻；盾墙更肉、弓手更疼、速攻略压后微调影刃  
  - `skills.ts`：悟空金箍扫挂破甲；敌方重击破甲 / 穿杨流血；后羿落日流血；诸葛破甲更深；赫拉克勒斯狮皮护盾加厚  
  - `affixes.ts`：补抗暴/格挡/吸血·闪避中档；新增 `SLOT_AFFIX_BIAS`  
  - `equipment.ts`：按槽位权重抽词缀  
  - `combat.ts`：`buildDefeatHint` 已知遭遇 id 优先（避免速攻战败误提示「后排被点爆」）  
- **基线（`npm run feel -- --seeds 20`，开局队）：**  
  - **前：** TOTAL 100%（60/60）；wall 5.0t / archers 2.9t / raiders 5.8t；几乎无倒人  
  - **后：** TOTAL **90%**（54/60）；wall 100%·6.9t；archers 100%·4.5t；**raiders 70%·胜 8.2t / 败 12.3t**；战败提示已按遭遇修正  
- **未 commit：** 否

### 2026-08-01 · 建立自治循环与手感基线工具

- **动机：** 按产品双核定调持续完善战斗/角色/装备；用日志闭环自测；Agent 不自行 commit。  
- **改动：**  
  - 新增约定 [autonomous-polish-charter](./2026-08-01-autonomous-polish-charter.md)  
  - 新增本文  
  - 新增 `packages/game-core` 手感脚本 `src/tools/combatFeel.ts`（`npm run feel`）  
  - tracking / README 挂上自治主线  
- **基线：** 开局队 × wall/archers/raiders × 20 seed → **TOTAL winRate=100% (60/60)**；archers avgTurns≈2.9（过快）  
- **未 commit：** 否
