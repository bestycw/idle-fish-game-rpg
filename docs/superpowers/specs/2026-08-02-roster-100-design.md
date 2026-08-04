# 公版卡池 100（扩展 + 首发深做 20）

> **地位：** 现行切片（2026-08-02）。  
> **拍板：** 方案 B——代码挂满 100；**20 深做**招牌+★1–6；其余占位技+共用星轨。  
> **稀有度（自定）：** 扩展侧约 绝13 / 珍26 / 良19 / 凡18；核心 24 保持原档。整体绝品偏内容展示，开局池以凡良为主。  
> **权威名单：** 代码 `CORE_TEMPLATES` + `EXPAND_ROSTER`；本文是索引与原则。

## 1. 结构

| 层 | 数量 | 技能 | 星轨 | 解锁 |
|----|------|------|------|------|
| 核心深做 | 20 | 个性招牌 | `STAR_OVERRIDES` 满 6 | 原章节表 |
| 核心暂缓 | 4 | 保留招牌 | **共用**星轨 | 仍进池 |
| 扩展占位 | 76 | 职能占位技（改名） | 共用星轨 | `expand.unlock` 批次 |

合计 **100**。抽卡只抽已解锁非主角。

## 2. 首发深做 20

`hero` 赵云 关羽 张飞 吕布 典韦 悟空 哪吒 杨戬 华佗 诸葛亮 白骨精 妲己 后羿 雅典娜 美杜莎 赫拉克勒斯 雷神 亚瑟 西施  

**暂不深做（仍可玩）：** 贝奥武夫、罗宾汉、嫦娥、孙膑。

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

## 5. 深做质量门槛（20）

对齐 [skill-design-spec](./2026-08-02-skill-design-spec.md)：

- 遮名可辨（技能名 + 星章典故）  
- ★3 / ★6 至少一处玩法质变（连击 / status_unlock / effect_unlock 等）  
- 同职能错开状态（忌全员穿透+流血点残）

后续批量把扩展卡「升格深做」时：先填母题卡再改 `STAR_OVERRIDES`，勿直接抄共用轨标题。

## 6. 自治与数值

按 [autonomous-polish-charter](./2026-08-01-autonomous-polish-charter.md)：`npm test` + `npm run feel`；变更记 [balance-changelog](./balance-changelog.md)。**Agent 不自行 commit。**
