# 计划：传说招牌剧本圣经 · 第一刀

> **状态：进行中（S1–S7 数据已落；待 S8 浏览器 / S9 changelog）。**  
> 规格：[legendary-signature-kit-design](../specs/2026-08-29-legendary-signature-kit-design.md)  
> 进度：[tracking.md](../specs/tracking.md)

## 目标

落地「★0 完整剧本 + 软模式变招 + 里程碑升星文案」：

1. 通用 `softMode` 字段与最小运行时调度  
2. 重写示范四卡：刘备 / 赵云 / 吕布 / 周瑜  
3. 技能页：软模式短句可见；星章主句禁止裸「主属性+x% / 技能倍率+0.xx」

**不做：** 第二技能栏；姿态/蓄力键；新状态主表 id；一次扫全库深做卡；跑 `gen_zhongtu_roster.py`。

## 技术落点（先定字段）

```ts
// packages/game-core/src/shared/types.ts
type SoftModeWhen =
  | { kind: 'target_has_status'; statusId: string }
  | { kind: 'target_under_cc' }
  | { kind: 'self_hp_below'; value: number }
  | { kind: 'target_hp_below'; value: number }
  | { kind: 'first_cast' }
  | { kind: 'target_has_shield' }
  | { kind: 'ally_downed' };

interface SoftModeThen {
  multiplierDelta?: number;
  effectPatches?: SkillEffect[];      // 追加/覆盖同 kind
  statusPatches?: ApplyStatusDef[];
  followUp?: FollowUpDef;
  /** 仅刘备软模式等：本招额外走招魂逻辑 */
  reviveAlly?: { hpRatio: number };
}

interface SoftModeDef {
  when: SoftModeWhen;
  then: SoftModeThen;
  copy: string; // 玩家一句
}

// SkillDef 增加：
softModes?: SoftModeDef[];
```

运行时：出手前 `resolveSoftModes(actor, targets, skill) → SkillDef`（浅拷贝 + 应用 then），禁止按 `templateId` 写死。

**复用优先：** 已是条件乘区的（`self_low_hp` / `vs_cc` / `first_cast` / `vs_shield`）可同时写在 `effects[]` 里保证数值；`softModes[].copy` 负责玩家可读「变招」叙事。结构性质变（追击开关、招魂）必须走 `softModes.then`。

## 任务

| ID | 项 | 文件（主） | 验收 |
|----|----|------------|------|
| S1 | 类型 + `resolveSoftModes` + 测例（触发/不触发） | `types.ts`；新建 `combat/softModeRuntime.ts`；`combat.ts` 出手前接入；`*.test.ts` | **done** |
| S2 | 展示：`softModeLine`；技能页「变招」行；`skillDisplayFor` | `growthHelpers.ts` / `SkillManual.tsx`；赵云已挂示范 softMode | **done** |
| S3 | 星章文案翻译：`summarizeStarEffect` 主句禁裸主属性%/裸倍率；可藏次级 | `starTypes.ts` / `growthHelpers` 排序；相关 test | **done** |
| S4 | 重写 **赵云**（deepKits）：★0 咬合保持；软模式「猎印→斩杀加重」；中间星打磨动词 | `deepKits.ts`；`skillCompose.test.ts` | **done** |
| S5 | 重写 **吕布**（deepKits）：★0 先声+残血；软模式低血加码（可与 effect 对齐）；★3/★6 文案换玩法 | 同上 | **done** |
| S6 | 重写 **周瑜**（expandDeepKits）：★0 火+扰乱咬合；软模式「控中→伤害/延控」；★3 火攻/锁江 换玩法口吻 | `expandDeepKits.ts` | **done** |
| S7 | 重写 **刘备**（legendarySheets）：★0 疗+残血+灌气；软模式 `ally_downed→revive`；中间星打磨 | `legendarySheets.ts` | **done** |
| S8 | 浏览器验收四卡技能页 + 一场战斗软模式触发观感 | web | **部分 done**（刘备/赵云技能页已验；战斗局内观感可再补） |
| S9 | changelog + tracking 下一刀更新 | `balance-changelog.md`；`tracking.md` | **done** |

## 示范卡数值原则（实现时填实）

| 卡 | ★0 零件 | 软模式 | ★3 / ★6 |
|----|---------|--------|---------|
| 赵云 | 穿点 · 流血 · 破盾 | 猎印目标：斩杀/追击加重 | 突阵↔猎印；高潮加厚 |
| 吕布 | 高倍 · 先声 · 残血 | 自身残血：效果包加重 | 连戟↔重斩 |
| 周瑜 | 前排火 · 扰乱 · 先声 | 目标受控：伤害/延控 | 火攻↔锁江 |
| 刘备 | 群疗 · 残血加疗 · 灌气 | 有倒地：招魂倾向 | 济世↔护民 |

系数带仍认 [skill-coeff](../specs/2026-08-03-skill-coeff-and-status-hit-design.md)；本刀以**剧本结构**为主，不借机整体抬伤。

## 建议开工顺序

`S1 → S2 → S3 → S4 → S5 → S6 → S7 → S8 → S9`

赵云先做（现有最完整，软模式样板清晰），刘备软模式若 `ally_downed` 钩子缺，S1 先实现钩子或 S7 降级为「★3 济世承担招魂」并在 changelog 注明。

## 风险

| 风险 | 处理 |
|------|------|
| 软模式与现有 `effects` 双计 | 约定：乘区类只在一处生效；S1 测例锁 |
| 星章翻译丢数值可读性 | 主句招式语，括号/点词保留数字 |
| 四卡同时大改回归面 | 每卡独立测例；浏览器只验四卡 |

## 完工定义

规格 §7 验收清单全部勾掉；`game-core` 相关测例绿；四卡技能页玩家向信息层次符合规格 §5。
