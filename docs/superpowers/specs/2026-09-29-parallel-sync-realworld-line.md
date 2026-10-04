# 平行原世界 · 同步回馈线

> **状态：** 拍板稿（2026-09-30 增四轴 + 弧末推演）· **代码：** `parallelWorldState.ts` · **P1 UI：** 偶数章通关后 `ParallelArcScreen`（表驱动文案 `parallelArcCopy.zh.ts`）  
> **定位：** 玩家手在异世界，**情感锚在原世界**（单条现代工位镜像）。  
> **关联：** [十章小结](./2026-09-29-story-spine-10ch-sections-design.md) · [Story Gen](./story-gen-skill-contract.md)

---

## 1. 拍板结论

| # | 决策 |
|---|------|
| ① | **一条**现代工位平行线；位面只换异世界 Skin |
| ② | **每 2 章一弧**（`arc1…arc5`）→ **弧末平行剧情推演**（可跳过） |
| ③ | **对内四轴数值化，对外文案化**；千人千面靠 **Parallel Brief Skill** + 偏好/称呼 |
| ④ | 不改 encounter、掉落、战力公式 |
| ⑤ | **主线战败**小幅反噬四轴 + 一行 ripple（规略失败感）；猎装本战败不计 |

---

## 2. 平行四轴（0–100）

| 玩家看到的名 | 引擎字段 | 人话 | 异世界什么推高它 |
|--------------|----------|------|------------------|
| **硬气** | `grit` | 敢关屏、敢晚回、敢说不 | 弧末 tier 高、战力 crush、偏好 |
| **班味** | `officeGrind` | 老板/KPI/群聊催命（**越低越好**） | tier 高、名册多 → 班味下降 |
| **后援** | `backup` | 兄弟/投影给的底气 | 已拥有伙伴数、招募偏好 |
| **同频** | `resonance` | 那边能接收到你变强多少 | 章进度 + 战力 + 名册加权 |

显示常量：`PARALLEL_AXIS_META` · `packages/game-core/src/narrative/parallelAxisLabels.zh.ts`

- 存档：`narrative.parallelWorldAxes`  
- **UI 不强调数字**：弧末简报用 █░ 条 + 句子；调试/Skill 可读轴。  
- 奇数章通关：仅刷新 `sync`（轻量）；**偶数章通关 = 弧末**：算 tier → Δ轴 → 人生 beat → 生成/缓存推演。

---

## 3. 异世界 ↔ 平行 映射（弧末一次）

```
tier ← resolveParallelTierForChapterClear（战力 band + 名册）
Δgrit, ΔofficeGrind, Δbackup ← computeParallelAxisDelta(...)
axes ← merge(旧轴, Δ) + resonance（同频）
careerBeat ← resolveCareerBeat(axes)（单调前进）
report ← Skill 或 buildStubParallelArcReport（四块文案）
```

实现：`applyParallelWorldAfterChapterClear` · `packages/game-core/src/narrative/parallelWorldState.ts`

---

## 4. 人生阶段 `ParallelCareerBeat`（离散，非第二 Spine）

| beat | 阈值（轴） | 示例方向（Skill 千人千面） |
|------|------------|---------------------------|
| `endure` | 默认 | 仍加班、只敢「。」 |
| `micro_rebel` | 硬气≥22 | 关免提、晚回消息 |
| `boundary` | 硬气≥38 | 排期、请假、边界话术 |
| `side_hustle` | 硬气≥58 且 后援≥40 | 外包、合伙、副业 |
| `quit_or_boss` | 硬气≥78 且 班味≤35 | 离职 / 单干 / 反制老板（措辞因偏好而异） |

同一 beat，**诙谐/正剧、同步/破阵/名册** 偏好 → Skill 写不同具体情节（替换老板 vs 体制内调岗 vs 静默离职）。

---

## 5. 弧末推演简报（Skin · 玩家向）

UI 由 `composeParallelArcBrief(report, heroName, previousReport?)` 生成（**不展示四轴数字**）：

| 板块 | 引擎输入 | 玩家看到的变化 |
|------|----------|----------------|
| 弧末总评 | tier + careerBeat | 仍被拿捏 / 稍稍还手 / 原身硬气 × 人生阶段 |
| 相较上一弧 | 上一弧 `axes/tier` vs 本弧（arc1 为基线文案） | 生活、家庭边界、同事风向、晋升叙事相对上一弧的句子 |
| 生活与闲暇 | officeGrind + grit + resonance | 家庭电话、娱乐碎片/完整、情绪带回客厅 |
| 工作与前途 | backup + grind + grit + resonance + tier | 同事、领导、业务可见度、晋升/软晋升感 |
| 异界本章 · 落到现实 | arcId + tier + beatTitle | 玩家刚打通的主线如何映射到原世界（避免「弧/回响」策划用语） |
| 下一弧预兆 | arc 表 `nextHint` | 预告 |

存档仍写 `workstation/pressure/syncNote/nextHint` 兼容字段；Web 以 `composeParallelArcBrief` 为准。

缓存：`narrative.parallelArcReports[arcId]` · `skinStatus: pending_skill | ready`

**Parallel Brief Skill 输入（P2）：**  
`heroName`, `preferences`, `arcId`, `tier`, `axes`, `careerBeat`, 本弧主线 overlay 摘要, `userPitch`  
**输出：** 替换四块字符串；**禁止**改 tier/轴/beat 规则。

---

## 6. 弧末三档 `ParallelTier`（与异世界表现）

对 **刚结束的弧**（`chapterCleared === 2,4,…,10`），用 **该弧最后一章** 的 band：

| Tier | 代号 | 条件（同前 spec） |
|------|------|-------------------|
| 1 | 仍被拿捏 | 战力低于 floor 或 名册 < 6 |
| 2 | 稍稍还手 | 中间 |
| 3 | 原身硬气 | crush 或（名册≥12 且 战力≥建议） |

写入：`parallelTierByArc[arcId]`

---

## 7. 体验流程（更新）

```text
序章 → 异世界主线（Spine）
         ↓ 每通 2 章（弧末）
    【原世界推演】四轴更新 + 简报（可跳过）
         ↓
    Hub 角标 / 可选一行速报
```

---

## 8. 存档字段

```ts
parallelWorldAxes?: ParallelWorldAxes;
parallelCareerBeat?: ParallelCareerBeat;
parallelSyncScore?: number;
parallelTierByArc?: Partial<Record<ParallelArcId, ParallelTier>>;
parallelArcReports?: Partial<Record<ParallelArcId, ParallelArcReportSnapshot>>;
parallelReportSeenUpToArc?: number;
```

SAVE_VERSION：首次写入轴/弧报告 → **v18**（与叙事包一致）。

---

## 9. 实施分期

| 阶段 | 内容 |
|------|------|
| **P0** | 四轴 + 弧末 `applyParallelWorldAfterChapterClear` + stub 简报 ✅ |
| **P1** | 战斗结算后偶数章弹 **ParallelArcScreen** + `parallelArcCopy` 表 ✅ |
| **P2** | Parallel Brief Skill 可选润色，读 heroName/preferences（不得改 tier/轴） |

---

## 10. 非目标

- 多条可玩平行线、平行 node 树  
- 轴影响战斗数值  
- 未推章惩罚原世界（guilt trip）
