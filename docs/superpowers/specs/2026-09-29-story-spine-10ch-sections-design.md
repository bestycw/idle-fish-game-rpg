# 十章主线 · 小结分层 · 开局定调

> **状态：** 架构拍板稿（2026-09-29）  
> **解决：** 序章后如何用**基础交互**定下全书走向；**每章多小结、小结多战斗**，避免「点三下就通章」。  
> **关联：** [Spine/Skin](./2026-09-29-player-story-spine-design.md) · [平行五弧反馈](./2026-09-29-parallel-sync-realworld-line.md) · [chapter-progress](./systems/chapter-progress.md)

---

## 1. 原则（和现引擎对齐）

| 锁死（Spine） | 可生成（Skin / 交互） |
|---------------|-------------------------|
| 章序 `ch1…ch10`、小结序、节点序、`kind`、每场 `encounterId` | 章名 / 小结名 / place / blurb / 过场 |
| 解锁 **kind + id**（池、副本、遭遇） | 解锁 toast、平行线文案 |
| 战斗公式、掉落池、role/skillId | 为何在此地再打一场的叙述 |
| 节点 **选项 → flag**（枚举 id） | 选项按钮上的句子 |

**不卖通关权：** 小结之间不硬锁战力；用 **建议战力 + 体力 + 机制** 自然拉长，不靠「剧情锁按钮」。

---

## 2. 三层进度（Spine 真源）

现网是 **章 → 扁平 nodes[]**（每章 often 仅 3 节点）。目标结构：

```text
Chapter（章）          ch1 … ch10
  └ Section（小结）    每章 3～5 个，有独立 id：ch1_s1 …
       └ Node（节点）  story | battle | choice（V1.5+）
            battle → encounterId + 可选 pressureScale / variantTag
```

**玩家存档（概念，实现时 bump SAVE）：**

```ts
// 线性推进，Hub 只展示「当前小结 + 当前节点」
chapterCleared: number;           // 已通最高章 order，不变语义
chapterProgress: {
  chapterOrder: number;         // 正在打的章 1–10
  sectionIndex: number;         // 0-based 小结
  nodeIndex: number;            // 小结内节点
};
// 或等价：globalSpineStep: number  // 全表扁平序号，表驱动反查章/节/点
```

**解锁触发（拉长流程的关键）：**

| 时机 | 解锁 |
|------|------|
| 小结 clear | 小解锁：下一遭遇进池、半页 Hub 提示、可选开一段 **猎装/塔** 叙事入口 |
| 章 clear | 现 `unlocksOnClear`：大批 gacha 圈、副本、八题 |
| 弧 clear（每 2 章） | **平行原世界评定**（5 次）+ 可选 flavor 称号 |

→ 玩家感受：**通章很慢，但每小结都有收获**；中间必须去塔/猎装/升星，而不是连点主线。

---

## 3. 体量目标（策划填表用）

不是「每章 3 战」，而是可配置的 **下限 / 目标 / 上限**：

| 层级 | 目标（V1 内容） | 说明 |
|------|-----------------|------|
| 全书 | **10 章** | 强度档 `CHAPTER_BANDS` 扩 10 行 |
| 每章 | **4 小结**（可 3～5） | Hub 关卡条按 **小结** 分组折叠 |
| 每小结 | **6～10 节点** | story : battle ≈ **1 : 2** |
| 每小结战斗 | **4～6 场** | 同 `encounterId` 可复用，靠 **place/title/pressure/variantTag** 区分 |

粗算：10 × 4 × 8 ≈ **320 节点**，其中 ~200 场战斗 —— 足够「拉长」；实现可 **分批填表**（先 ch1–2 做满，其余占位）。

**单场不要太短：** 遭遇层可挂 `minTurns` / 波次（战斗扩展，另开 combat 小 spec）；Spine 只记「过了 node」。

---

## 4. 开局交互 → 定下十章故事（不增第三主轴）

序章已：现代线、选位面、名册。缺的是 **「这本书讲什么」** 的 flag，**序章末（p10 后）：** 输入 **主角称呼** → **偏好问卷**（侧重/语气/节奏）→ 后台 **Story Gen Skill** 填充剧本皮（Skill 未接时仅 **十章占位槽**）→ 预览后进 Hub。

### 4.1 定调三选一（示例，id 锁死）

| flag id | 玩家看到的话 | 十章 Skin 倾向（不改 encounter） |
|---------|--------------|----------------------------------|
| `thrust_sync` | **先把那边的我拽出来** | 平行线措辞更重；小结名偏「回应 / 同步 / 硬气」 |
| `thrust_break` | **破阵、变强、再说** | 偏修行/KPI 隐喻；战斗前后 blurb 强调破阵 |
| `thrust_roster` | **先凑齐能打的兄弟** | 小结间 story 强调招募、名分；Hub 预告 gacha 圈 |

可选第四项：**写一句** → 存 `narrative.playerPitch`（≤40 字），AI 只润色 overlay，**不改节点表**。

### 4.2 与 AI / Official Pack 的关系

- **开局一次**：根据 `worldPreset + thrust + playerPitch` 生成或加载 **十章 overlay**（章名、小结名、节点 blurb）。  
- **章内**：仅 **choice 节点** 改 flag，后续 blurb 分支（2～3 条），**battle 场次不变**。  
- 官方线：静态 JSON `officialPacks/{preset}.sections.zh.json`，零 API。

### 4.3 基础交互清单（产品）

1. **定调三选一**（必选，可默认 `thrust_break`）  
2. **ch1_s1 第一个 story**：确认位面名 + 名册一句（只读）  
3. **每小结开头**（可选）：1 句「本小结目标」story（短）  
4. **choice 节点**（每章 0～2 个）：2～3 按钮 → flag  
5. **弧末**（ch2/ch4/…）：平行评定 + 「下弧预告」  

不做：开放世界地图、自由对话、改 battle 次数的「跳过战斗」付费。

---

## 5. 小结怎么写，才显得「长」而不是「重复」

每个小结固定 **四段式**（策划模板，Skin 填词）：

| 段 | 节点类型 | 作用 |
|----|----------|------|
| **入** | story | 为何来这、和谁有关、本小结要干什么 |
| **缠** | battle ×2 | 同机制不同 **place**（练手） |
| **变** | story 或 choice | 小反转 / 分支 flag |
| **战** | battle ×2～4 | 压力略升或换 encounter |
| **收** | story | 小结收束 + 钩子进下一小结 |

**复用遭遇：**  
`encounterId: 'wall'` + `variantTag: 'ch1_s2_warmup' | 'ch1_s2_gate'` → 仅 overlay 与可选 `pressureScale: 0.95 | 1.05`（数字在 bands 上微调，不改底稿）。

**间奏（拉长循环）：**  
小结 clear 后 Hub 主推 **「建议先去塔/猎装」** 一行（读建议战力），story 包装成「裂隙要稳定锚点」——玩法上仍是现有副本，不是新系统。

---

## 6. 十章 · 五弧（与平行反馈对齐）

| 弧 | 章 | 弧内小结主题（仙侠示例） | 弧末平行反馈 |
|----|-----|--------------------------|--------------|
| arc1 | ch1–2 | 入门驿道 → 乱阵林 | tier × 原世界 |
| arc2 | ch3–4 | 远矢 → 磨合关 | 同上 |
| arc3 | ch5–6 | 劫火 → 镇守门 | 同上 |
| arc4 | ch7–8 | 资源/星尘叙事化 | 同上 |
| arc5 | ch9–10 | 深门 → 阶段终局 | 双线结算 |

每弧 **8 小结**（4+4）× 每小结 ~8 节点 ≈ **64 节点/弧** —— 内容生产按弧交付。

---

## 7. 数据表长什么样（给程序）

```ts
interface ChapterDef {
  id: string;
  order: number;
  name: string;
  blurb: string;
  sections: SectionDef[];      // NEW：替代或包裹原 nodes
  unlocksOnClear: ContentUnlock[];
}

interface SectionDef {
  id: string;                 // ch1_s1
  title: string;
  place: string;
  blurb: string;
  nodes: ChapterNodeDef[];
  unlocksOnClear?: ContentUnlock[];  // 小结级解锁
}

interface ChapterNodeDef {
  id: string;
  kind: 'story' | 'battle' | 'choice';
  title: string;
  place: string;
  blurb: string;
  encounterId?: string;
  pressureScale?: number;       // 可选，默认 1
  variantTag?: string;          // overlay 键
  choices?: { id: string; label: string; setFlag: string }[];
}
```

**Overlay 解析：**

`resolveNodeCopy(chapterId, sectionId, nodeId, flags)` → 显示 title/place/blurb。

---

## 8. Hub / UI（体验上「很长」）

- **关卡条**：章 → 展开小结 → 节点（已过 / 此地 / 未到）。  
- **当前小结进度**：「第 2 小结 · 3/8」。  
- **不展示** 全书 320 格吓退玩家；只展示 **本章 + 本小结**。  
- 战斗返回主线：**回到同一 nodeIndex**，不丢进度。

---

## 9. 实施分期（避免一口 320 节点）

| 阶段 | 程序 | 内容 |
|------|------|------|
| **P0** | 本文 + `sections[]` 类型；ch1 **1 章 2 小结** 填满作样板 | 定调交互 + 16～20 节点 |
| **P1** | 存档 `sectionIndex`；小结 unlock；Hub 分组 | ch1–2 满配；弧 1 平行反馈 |
| **P2** | choice 节点 + flags；overlay 读表 | ch3–6 + 官方 pack |
| **P3** | ch7–10 + bands；AI 生成 overlay 校验器 | 全书 320 节点分批 |

**过渡方案（不改代码也能先试）：**  
把「小结」拆成 **连续 story 节点当分隔标题**，战斗节点插满 `defs.ts` 扁平 `nodes[]` —— 先验证「长度体感」，再 refactor 成 `sections[]`。

---

## 10. 非目标

- 每小节独立地图、走格子  
- 因剧情改 encounter 底稿或卡池 id  
- 十章每章不同 unlock 树（仅 **时机** 分散到小结/章/弧）

---

## 11. 待你拍板的一项

**定调三选一放在：序章末（进 Hub 前）还是 ch1 第一个节点？**

- **推荐：ch1_s1 第一个 choice 节点** —— 序章已够长；进主线后再选 thrust，和「第一次破阵」动机贴更紧。  
- 若希望 **Hub 第一眼就个性化**，可序章末选 thrust，ch1 只确认。

确认后可开工 **P0：Section 类型 + ch1 双小结样板表**。
