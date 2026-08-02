# 公版卡池换代设计（去旧占位 · +10）

> **地位：归档（已落地 · 2026-08-02 标档）。** 默认不信；**当前卡池名单认代码** `templates.ts`（**24 卡**）与 [character.md](./systems/character.md)。  
> 本文记录 v9 换代决策（去占位 +10）；后续扩池见 balance-changelog / character。  
> **原则仍有效：** 卡面公版无版权；战斗只认 role / job / skill。

## 1. 目标

1. **删除** Demo 占位卡：`tank_a` / `burst_a` / `aoe_a` / `col_a` / `heal_a` / `ctrl_a`（及专用技能、星盘特例、章节解锁引用）。  
2. **保留** 主角 `hero`（显示名仍「主角」；故事皮后定）。  
3. **新增** 10 张公版卡，**9 职能盖全**；开局可玩编队完整。  
4. 存档 **version bump → v9**；旧 roster/formation 键作废，读档重建默认编队。

## 2. 卡池定调

| 项 | 约定 |
|----|------|
| 来源 | 三国、西游、中国神话、希腊、北欧、英国民间传说等公版形象 |
| 禁止 | 仙剑等有版权 IP；商标化现代演绎名作 id |
| 引擎 id | 拉丁/拼音稳定 id（如 `zhaoyun`）；显示名中文可随皮换 |
| 技能 | 只挂现有钩子：`targetPattern` / `tags` / `applyStatus` / `damageSchool` / 升星 `StarNode` |
| 不做本轮 | 扩到 16–24 全量、立绘资源、多卡池运营、正式图鉴 |

## 3. 人物表（主角 + 10）

### 3.1 总表

| id | 显示名 | 来源 | rarity | role | job | skillId | 默认上阵 | 开局拥有 |
|----|--------|------|--------|------|-----|---------|----------|----------|
| `hero` | 主角 | — | 绝品 | `flex` | `adept` | `skill_hero_strike` | ✓ | ✓ |
| `zhangfei` | 张飞 | 三国 | 珍品 | `tank` | `vanguard` | `skill_zhangfei_roar` | ✓ | ✓ |
| `zhaoyun` | 赵云 | 三国 | 绝品 | `st_burst` | `assassin` | `skill_zhaoyun_longdan` | ✓ | ✓ |
| `wukong` | 孙悟空 | 西游 | 绝品 | `aoe_dps` | `mage` | `skill_wukong_sweep` | ✓ | ✓ |
| `huatuo` | 华佗 | 三国 | 良品 | `st_heal` | `healer` | `skill_huatuo_qingnang` | ✓ | ✓ |
| `houyi` | 后羿 | 神话 | 珍品 | `st_burst` | `ranger` | `skill_houyi_luori` | | 可抽 |
| `heracles` | 赫拉克勒斯 | 希腊 | 良品 | `tank` | `vanguard` | `skill_heracles_hide` | | 可抽 |
| `zhuge` | 诸葛亮 | 三国 | 绝品 | `group_amp` | `support` | `skill_zhuge_qimen` | | 章末解锁后可抽 |
| `baigujing` | 白骨精 | 西游 | 珍品 | `aoe_ctrl` | `warlock` | `skill_baigujing_huagu` | | 章末解锁后可抽 |
| `medusa` | 美杜莎 | 希腊 | 珍品 | `st_ctrl` | `warlock` | `skill_medusa_gaze` | | 章末解锁后可抽 |
| `athena` | 雅典娜 | 希腊 | 珍品 | `aoe_heal` | `healer` | `skill_athena_aegis` | | 章末解锁后可抽 |

> 开局拥有 = `STARTER_OWNED_IDS`；默认上阵 = `DEFAULT_DEPLOYED_IDS`：  
> `hero`, `zhangfei`, `zhaoyun`, `wukong`, `huatuo`。

### 3.2 初始属性（草案 · 可调）

沿用旧池量级，按职能微调：

| id | hp | 力攻 | 灵攻 | 力防 | 灵防 | spd | 暴击 | 暴伤 | 急速 | 均衡 | 精通 | 终伤 | 幸运 |
|----|----|------|------|------|------|-----|------|------|------|------|------|------|------|
| hero | 100 | 15 | 15 | 8 | 8 | 12 | 18 | 10 | 8 | 8 | 12 | 8 | 10 |
| zhangfei | 125 | 10 | 4 | 15 | 10 | 9 | 8 | 8 | 6 | 18 | 20 | 0 | 8 |
| zhaoyun | 72 | 18 | 8 | 5 | 4 | 15 | 28 | 22 | 16 | 4 | 20 | 12 | 6 |
| wukong | 88 | 14 | 12 | 6 | 8 | 13 | 18 | 16 | 12 | 8 | 14 | 12 | 8 |
| huatuo | 78 | 3 | 12 | 6 | 11 | 10 | 5 | 5 | 8 | 10 | 24 | 0 | 14 |
| houyi | 68 | 17 | 7 | 4 | 4 | 14 | 26 | 24 | 14 | 4 | 18 | 14 | 6 |
| heracles | 135 | 9 | 4 | 16 | 12 | 7 | 5 | 5 | 5 | 20 | 22 | 0 | 8 |
| zhuge | 80 | 5 | 14 | 6 | 10 | 11 | 10 | 8 | 10 | 12 | 26 | 4 | 12 |
| baigujing | 82 | 6 | 14 | 5 | 9 | 12 | 12 | 10 | 10 | 8 | 26 | 4 | 10 |
| medusa | 84 | 7 | 14 | 5 | 9 | 11 | 12 | 10 | 10 | 8 | 28 | 4 | 12 |
| athena | 90 | 6 | 12 | 10 | 12 | 10 | 8 | 6 | 8 | 16 | 22 | 2 | 10 |

`preferredSlot` 建议：张飞/赫拉克勒斯前排；赵云/后羿/美杜莎后排；孙悟空/白骨精中前；华佗/诸葛/雅典娜中后。

## 4. 技能表（草案）

| skillId | 名 | school | pattern | tags | applyStatus | 倍率 | 耗 | 备注 |
|---------|----|--------|---------|------|-------------|------|-----|------|
| `skill_zhangfei_roar` | 咆哮 | phys | single | damage | stun | 0.85 | 45 | 坦开场控 |
| `skill_zhaoyun_longdan` | 龙胆 | phys | single | pierce, damage | bleed | 2.05 | 55 | 点杀 |
| `skill_wukong_sweep` | 金箍扫 | phys | row_front | aoe, damage | — | 1.2 | 55 | 清排 |
| `skill_huatuo_qingnang` | 青囊 | spirit | single | heal, cleanse | — | 1.4 | 45 | **单疗** |
| `skill_houyi_luori` | 落日 | phys | single | pierce, damage | — | 2.0 | 55 | `focusPolicy` 残血加权 |
| `skill_heracles_hide` | 狮皮 | phys | single | guard | shield | 1.25 | 45 | 厚盾 |
| `skill_zhuge_qimen` | 奇门 | spirit | single | damage | shred | 0.55 | 50 | **群增幅**（破甲） |
| `skill_baigujing_huagu` | 化骨 | spirit | row_front | aoe, damage | havoc | 0.7 | 50 | **群控** |
| `skill_medusa_gaze` | 石化 | spirit | single | damage | stun | 0.55 | 50 | 单控 |
| `skill_athena_aegis` | 神恩 | spirit | all | heal, aoe | — | 0.8 | 50 | **群疗** |

> 实现时：若某 `targetPattern` / status 不存在，**只加注册表项或改用已有等价**，禁止改战斗主循环。  
> 旧技能 id（`skill_tank_guard` 等）随旧卡删除；敌方 mob 技能若引用则保留 mob 专用。

## 5. 升星特例

| 卡 | 星 | 模式 | 效果意向 |
|----|-----|------|----------|
| `zhaoyun` | ★3 | override | 「七进七出」· followUp 加强（替共用连击文案） |
| `wukong` | ★3 | stack | 「筋斗」· 在共用连击上叠主属性或闪避 |
| 其余 | — | 走共用星盘 | |

旧 `burst_a` / `tank_a` / `heal_a` override **删除**。

## 6. 章节 / 抽卡解锁

### 6.1 `START_UNLOCKS`（gacha_unit）

开局可抽：`zhangfei`, `zhaoyun`, `wukong`, `huatuo`, `houyi`, `heracles`  
（已拥有的仍可进池出碎片。）

### 6.2 章末解锁（示例挂载）

| 章 | unlocksOnClear（gacha_unit） |
|----|------------------------------|
| ch2 | `baigujing` |
| ch3 | `medusa` |
| ch4 | `zhuge` |
| ch5 | `athena` |

可按手感微调章号；原则：**锁内容池，不硬锁通关**。

## 7. 存档迁移（v9）

| 项 | 行为 |
|----|------|
| `PlayerState.version` | `8` → `9` |
| roster / formation | 含旧 templateId 时丢弃无效键；补齐新模板默认 progress；formation 重置为 `DEFAULT_DEPLOYED_IDS` |
| 货币 / 章节进度 / 塔层 | 保留 |
| UI | 无硬编码旧卡名则只跟模板表 |

## 8. 实现切片

1. 新技能写入 `skills.ts`；删旧友方占位技能（保留敌方技能）。  
2. 重写 `templates.ts`；更新 `STARTER_OWNED_IDS` / `DEFAULT_DEPLOYED_IDS` / `STAR_OVERRIDES`。  
3. `chapter/defs.ts` 解锁表；`save` version 9 + `ensureRoster` / 读档迁移。  
4. 修正所有测试中的旧 id（combat / gacha / chapter / growth）。  
5. 文档：`character.md` 人物表替换；`tracking` B11 本批进度；本设计标已实现。

## 9. 验收

- 9 职能在模板中均有至少一张卡  
- 开局上阵 5、伙伴列表 11（含主角）、抽卡池无旧 id  
- 旧存档读入不崩，编队回到默认五人  
- `tsc` + 相关单测通过  

## 10. 修订记录

| 日期 | 内容 |
|------|------|
| 2026-08-01 | 拍板：去旧 6 卡；主角+10 公版；v9；开局张飞/赵云/悟空/华佗 |
| 2026-08-01 | **已实现**；为盖全 9 职能：华佗=`st_heal`、雅典娜=`aoe_heal`（神恩群疗） |
