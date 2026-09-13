# 公版卡池 100（扩展 + 深做 32）

> **地位：** 现行切片（2026-08-02）。  
> **拍板：** 方案 B 已落地 100；**2026-08-26 起被** [中土故事圈卡池](./2026-08-26-zhongtu-roster-circles-design.md) **取代**（~200 / 国外下架）。本文仅作 100 期实现史。  
> **稀有度（2026-08-23）：** 全池 绝37 / 珍25 / 良20 / 凡18。名气对得上的主神/霸主升绝品；开局池仍以凡良垫底。  
> **权威名单：** 代码 `CORE_TEMPLATES` + `EXPAND_ROSTER`；本文是索引与原则。

## 1. 结构

| 层 | 数量 | 技能 | 星轨 | 解锁 |
|----|------|------|------|------|
| 核心深做 | 24 | 个性招牌 | `STAR_OVERRIDES` 满 6 | 原章节表 |
| 扩展升格 | 8 | 个性招牌 | `EXPAND_DEEP_*` 满 6 | 仍进扩展解锁 |
| 扩展占位 | 68 | 职能占位技（改名） | 共用星轨 | `expand.unlock` 批次 |

合计 **100**。抽卡只抽已解锁非主角。

## 2. 核心深做 24

`hero` 赵云 关羽 张飞 吕布 典韦 悟空 哪吒 杨戬 华佗 诸葛亮 白骨精 妲己 后羿 雅典娜 美杜莎 赫拉克勒斯 雷神 亚瑟 西施 **贝奥武夫、罗宾汉、嫦娥、孙膑**（2026-08-26 升格：个性星轨 + ★3/★6 岔路）。

**扩展升格 8（2026-08-23）：** 周瑜、项羽、女娲、哈迪斯、宙斯、奥丁、岳飞、姜子牙。招牌+★1–6 典故星章+★3/★6 岔路；破境只换一句典故肉身。

## 3. 扩展 76

见 `packages/game-core/src/character/roster/expandRoster.ts`（id / 名 / 来源 / 母题 / role / 稀有度 / 技能显示名 / 解锁批次）。

来源混搭：三国、西游·封神、中国神话、希腊罗马、北欧、亚瑟、中国史传。

## 4. 实现落点

| 产物 | 路径 |
|------|------|
| 扩展表 | `roster/expandRoster.ts` |
| 占位技/属性 | `roster/placeholderSkills.ts` / `roleBaselines.ts` |
| 合并 | `templates.ts` / `skills.ts` |
| 章节解锁批次 | `chapter/defs.ts` ← `expandIdsByUnlock` |
| 校验 | `roster/roster.test.ts` + `assertCharacterBundle` |

## 5. 深做质量门槛

对齐 [skill-design-spec](./2026-08-02-skill-design-spec.md)：

- 遮名可辨（技能名 + 星章典故）  
- ★3 / ★6 至少一处玩法质变（连击 / status_unlock / effect_unlock 等）  
- 同职能错开状态（忌全员穿透+流血点残）

后续批量把扩展卡「升格深做」时：先填母题卡再改 `STAR_OVERRIDES`，勿直接抄共用轨标题。

## 6. 自治与数值

按 [autonomous-polish-charter](./2026-08-01-autonomous-polish-charter.md)：`npm test` + `npm run feel`；变更记 [balance-changelog](./balance-changelog.md)。**Agent 不自行 commit。**
